import os
import traceback
from typing import Any, Dict, List, Optional

from langchain_community.document_loaders import PyPDFLoader
from langchain_community.vectorstores import Chroma
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter
from sentence_transformers import SentenceTransformer

from config import UPLOAD_DIR, VECTOR_DB_DIR, EMBEDDING_MODEL_NAME
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
        # PyPDFLoader page is usually 0-based; convert to 1-based.
        return metadata["page"] + 1

    return -1


def _get_or_create_vector_db() -> Chroma:
    embeddings = HuggingFaceEmbeddings(model_name=EMBEDDING_MODEL_NAME)
    return Chroma(persist_directory=VECTOR_DB_DIR, embedding_function=embeddings)


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


def _report_error(doc_id: Any, error: Exception) -> None:
    err = f"{type(error).__name__}: {error}\n{traceback.format_exc()}"
    if doc_id is not None:
        try:
            update_status(doc_id, 4, err)
        except Exception:
            # Avoid swallowing original processing failure due to callback failure.
            pass


def process_payload(payload: Dict[str, Any]) -> None:
    doc_id = _safe_get(payload, "fileId", "docId", "id")
    file_path = _safe_get(payload, "filePath", "file_path")
    _user_id = _safe_get(payload, "userId", "user_id")  # reserved for future use

    if doc_id is None:
        raise ValueError("Missing docId/fileId in message payload")
    if file_path is None:
        raise ValueError("Missing filePath in message payload")

    try:
        # 1: parsing start callback
        update_status(doc_id, 1)

        # Loader
        abs_path = _resolve_file_path(str(file_path))
        loader = PyPDFLoader(abs_path)
        documents = loader.load()

        # Chunking (fixed by requirement)
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
