import os
import traceback
import httpx
from typing import Any, Dict, List, Optional

from langchain_community.document_loaders import PyPDFLoader, TextLoader
from langchain_community.vectorstores import Chroma
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.documents import Document

from config import UPLOAD_DIR, VECTOR_DB_DIR, EMBEDDING_MODEL_NAME, JAVA_API_BASE
from services.callback import update_status


def _safe_get(payload: Dict[str, Any], *keys: str) -> Optional[Any]:
    for k in keys:
        if k in payload:
            return payload[k]
    return None


def _resolve_file_path(file_path: str) -> str:
    # 1) directly exists
    if os.path.exists(file_path):
        return file_path
    # 2) try join with upload dir using basename
    candidate = os.path.join(UPLOAD_DIR, os.path.basename(file_path))
    if os.path.exists(candidate):
        return candidate
    # 3) try relative to current working directory
    candidate = os.path.join(os.getcwd(), file_path)
    if os.path.exists(candidate):
        return candidate
    raise FileNotFoundError(f"Uploaded file not found: {file_path}")


def _extract_page_number(chunk: Any) -> int:
    metadata = getattr(chunk, "metadata", {}) or {}

    if "page_number" in metadata and isinstance(metadata["page_number"], int):
        return metadata["page_number"]

    if "page" in metadata and isinstance(metadata["page"], int):
        return metadata["page"] + 1

    return -1


def _get_or_create_vector_db() -> Chroma:
    embeddings = HuggingFaceEmbeddings(model_name=EMBEDDING_MODEL_NAME)
    return Chroma(persist_directory=VECTOR_DB_DIR, embedding_function=embeddings)


def _report_chunks(doc_id: Any, chunks: int) -> None:
    """Report chunk count back to Java backend."""
    try:
        with httpx.Client(timeout=10) as client:
            client.post(
                f"{JAVA_API_BASE}/api/knowledge/doc/chunks",
                json={"docId": str(doc_id), "chunks": chunks},
            )
    except Exception as e:
        print(f"Failed to report chunks: {e}")


def _vectorize_and_persist(
    doc_id: Any,
    chunks: List[Any],
    vector_db: Chroma,
) -> None:
    texts = []
    metadatas = []
    ids = []

    for idx, chunk in enumerate(chunks):
        page_number = _extract_page_number(chunk)
        text = getattr(chunk, "page_content", "")
        chunk_id = f"{doc_id}_chunk_{idx}"
        texts.append(text)
        metadatas.append({
            "doc_id": str(doc_id),
            "page_number": page_number,
            "source": getattr(chunk, "metadata", {}).get("source", ""),
        })
        ids.append(chunk_id)

    vector_db.add_texts(texts=texts, metadatas=metadatas, ids=ids)
    vector_db.persist()

    _report_chunks(doc_id, len(chunks))


def _report_error(doc_id: Any, error: Exception) -> None:
    err = f"{type(error).__name__}: {error}\n{traceback.format_exc()}"
    if doc_id is not None:
        try:
            update_status(doc_id, 4, err)
        except Exception:
            pass


def _get_file_extension(file_path: str) -> str:
    return os.path.splitext(file_path)[1].lower().lstrip(".")


def _load_document(abs_path: str) -> List[Document]:
    ext = _get_file_extension(abs_path)

    if ext == "pdf":
        try:
            loader = PyPDFLoader(abs_path)
            return loader.load()
        except Exception as e:
            raise ValueError(f"PDF load failed: {e}")

    elif ext in ("txt", "md", "text"):
        loader = TextLoader(abs_path, encoding="utf-8")
        return loader.load()

    else:
        raise ValueError(f"Unsupported file type: {ext}")


def process_payload(payload: Dict[str, Any]) -> None:
    doc_id = _safe_get(payload, "fileId", "docId", "id")
    file_path = _safe_get(payload, "filePath", "file_path")
    _user_id = _safe_get(payload, "userId", "user_id")

    if doc_id is None:
        raise ValueError("Missing docId/fileId in message payload")
    if file_path is None:
        raise ValueError("Missing filePath in message payload")

    try:
        # 1: parsing start callback
        update_status(doc_id, 1)

        # Resolve and load file
        abs_path = _resolve_file_path(str(file_path))

        # Check file exists and has content
        if not os.path.exists(abs_path):
            raise FileNotFoundError(f"File not found: {abs_path}")

        file_size = os.path.getsize(abs_path)
        if file_size == 0:
            raise ValueError("File is empty")

        documents = _load_document(abs_path)

        # Check if any content was extracted
        total_content = " ".join(getattr(doc, "page_content", "") for doc in documents)
        if not total_content.strip():
            raise ValueError("No content could be extracted from the file")

        # Chunking
        splitter = RecursiveCharacterTextSplitter(
            chunk_size=500,
            chunk_overlap=50,
        )
        chunks = splitter.split_documents(documents)

        # Ensure each chunk has page_number in metadata
        for chunk in chunks:
            if not hasattr(chunk, "metadata") or chunk.metadata is None:
                chunk.metadata = {}
            chunk.metadata["page_number"] = _extract_page_number(chunk)

        # 2: vectorizing callback
        update_status(doc_id, 2)

        # Embed, persist to Chroma
        vector_db = _get_or_create_vector_db()
        _vectorize_and_persist(doc_id, chunks, vector_db)

        # 3: all succeeded
        update_status(doc_id, 3)

    except Exception as e:
        _report_error(doc_id, e)
        raise
