from typing import AsyncGenerator, List, Optional

from langchain_community.vectorstores import Chroma
from langchain_core.documents import Document
from langchain_core.callbacks import AsyncCallbackHandler
from langchain_core.outputs import LLMResult
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate

from config import Config


class _TokenStreamingCallback(AsyncCallbackHandler):
    """Collects streamed tokens into a list for SSE output."""

    def __init__(self) -> None:
        super().__init__()
        self.tokens: List[str] = []

    async def on_llm_new_token(self, token: str, **_kwargs: object) -> None:
        self.tokens.append(token)

    async def on_llm_end(self, _response: LLMResult, **_kwargs: object) -> None:
        pass

    async def on_llm_error(self, _error: Exception, **_kwargs: object) -> None:
        pass


class QueryService:
    def __init__(self) -> None:
        model_name = Config.EMBEDDING_MODEL_NAME
        model_path = Config.EMBEDDING_MODEL_PATH

        model_kwargs = {"device": "cpu"}
        encode_kwargs = {"normalize_embeddings": True}

        if model_path:
            self.embeddings = HuggingFaceEmbeddings(
                model_name=model_path,
                model_kwargs=model_kwargs,
                encode_kwargs=encode_kwargs,
            )
        else:
            self.embeddings = HuggingFaceEmbeddings(
                model_name=model_name,
                model_kwargs=model_kwargs,
                encode_kwargs=encode_kwargs,
            )
        self.vector_db = Chroma(
            persist_directory=Config.VECTOR_DB_DIR,
            embedding_function=self.embeddings,
        )
        self.llm = ChatOpenAI(
            model_name=Config.LLM_MODEL_NAME,
            openai_api_key=Config.OPENAI_API_KEY,
            openai_api_base=Config.OPENAI_API_BASE,
        )
        self._prompt_template = ChatPromptTemplate.from_template(
            "你是一个专业的智能助手。请基于以下提供的背景知识回答问题。\n"
            "如果背景知识中没有相关信息，请直接回答\"知识库中暂无相关记录\"，不要胡编乱造。\n\n"
            "背景知识:\n"
            "{context}\n\n"
            "问题:\n"
            "{question}"
        )

    def _search(self, query: str, top_k: int, kb_id: Optional[str]) -> List[Document]:
        """Execute similarity search, optionally scoped to a single knowledge base."""
        if kb_id:
            docs = self.vector_db.similarity_search(
                query,
                k=top_k,
                filter={"doc_id": kb_id},
            )
        else:
            docs = self.vector_db.similarity_search(query, k=top_k)
        return docs

    def _search_with_scores(self, query: str, top_k: int, kb_id: Optional[str]) -> List[tuple]:
        """Execute similarity search with scores, optionally scoped to a single knowledge base."""
        if kb_id:
            results = self.vector_db.similarity_search_with_score(
                query,
                k=top_k,
                filter={"doc_id": kb_id},
            )
        else:
            results = self.vector_db.similarity_search_with_score(query, k=top_k)
        return results

    async def answer_stream(
        self,
        query: str,
        kb_id: Optional[str] = None,
        top_k: int = 3,
    ) -> AsyncGenerator[str, None]:
        """
        RAG answer with true streaming. Yields token-by-token SSE data.
        Each yielded string is a JSON-serialized SSE message.
        """
        import json

        results = self._search_with_scores(query, top_k, kb_id)

        if not results:
            yield f"data: {json.dumps({'answer': '知识库中暂无相关记录', 'sources': []}, ensure_ascii=False)}\n\n"
            yield "data: [DONE]\n\n"
            return

        # 构建完整 citation 对象
        citations = []
        for doc, score in results:
            # score 是 L2 距离，范围 [0, 2]，转换为相似度 [1, 0]
            similarity = max(0.0, 1.0 - score / 2.0)
            citation = {
                "docId": doc.metadata.get("doc_id", "未知"),
                "docName": doc.metadata.get("source", "未知"),
                "chunkId": doc.metadata.get("chunk_id", ""),
                "score": round(similarity, 4),
                "preview": doc.page_content[:200] + "..." if len(doc.page_content) > 200 else doc.page_content,
                "pageNumber": doc.metadata.get("page_number", -1),
            }
            citations.append(citation)

        context = "\n---\n".join([d.page_content for d, _ in results])
        sources = [c["docName"] for c in citations]

        chain = self._prompt_template | self.llm

        # 真正的流式生成
        full_answer = ""
        async for chunk in chain.astream({"context": context, "question": query}):
            if isinstance(chunk, str):
                token = chunk
            elif hasattr(chunk, 'content') and isinstance(chunk.content, str):
                token = chunk.content
            else:
                token = ''
            full_answer += token
            yield f"data: {json.dumps({'answer': full_answer, 'sources': sources, 'citations': citations}, ensure_ascii=False)}\n\n"

        yield "data: [DONE]\n\n"

    def answer(self, query: str, kb_id: Optional[str] = None, top_k: int = 3) -> dict:
        results = self._search_with_scores(query, top_k, kb_id)

        if not results:
            return {
                "answer": "知识库中暂无相关记录",
                "sources": [],
                "citations": [],
            }

        # 构建完整 citation 对象
        citations = []
        for doc, score in results:
            # score 是 L2 距离，范围 [0, 2]，转换为相似度 [1, 0]
            similarity = max(0.0, 1.0 - score / 2.0)
            citation = {
                "docId": doc.metadata.get("doc_id", "未知"),
                "docName": doc.metadata.get("source", "未知"),
                "chunkId": doc.metadata.get("chunk_id", ""),
                "score": round(similarity, 4),
                "preview": doc.page_content[:200] + "..." if len(doc.page_content) > 200 else doc.page_content,
                "pageNumber": doc.metadata.get("page_number", -1),
            }
            citations.append(citation)

        context = "\n---\n".join([d.page_content for d, _ in results])
        chain = self._prompt_template | self.llm
        response = chain.invoke({"context": context, "question": query})

        return {
            "answer": response.content,
            "sources": [c["docName"] for c in citations],
            "citations": citations,
        }
