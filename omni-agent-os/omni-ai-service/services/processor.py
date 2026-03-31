import os
import traceback
from typing import Any, Dict, List, Optional

from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from sentence_transformers import SentenceTransformer

from config import UPLOAD_DIR
from services.callback import update_status

EMBEDDING_MODEL_NAME = "all-MiniLM-L6-v2"


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


def _vectorize_with_page_number(chunks: List[Any]) -> List[Dict[str, Any]]:
    model = SentenceTransformer(EMBEDDING_MODEL_NAME)
    vectors: List[Dict[str, Any]] = []

    for chunk in chunks:
        page_number = _extract_page_number(chunk)
        text = getattr(chunk, "page_content", "")
        embedding = model.encode(text)

        vectors.append(
            {
                "page_number": page_number,
                "embedding": embedding,
                "text": text,
            }
        )

    return vectors


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

        # Embedding simulation with sentence-transformers model
        _ = _vectorize_with_page_number(chunks)

        # 3: all succeeded
        update_status(doc_id, 3)

    except Exception as e:
        _report_error(doc_id, e)
        raise
