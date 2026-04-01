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
        self.embeddings = HuggingFaceEmbeddings(model_name=Config.EMBEDDING_MODEL_NAME)
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

    async def answer_stream(
        self,
        query: str,
        kb_id: Optional[str] = None,
        top_k: int = 3,
    ) -> AsyncGenerator[str, None]:
        """
        RAG answer with streaming. Yields token-by-token SSE data.
        Each yielded string is a JSON-serialized SSE message.
        """
        docs = self._search(query, top_k, kb_id)

        if not docs:
            yield "data: {\"answer\":\"知识库中暂无相关记录\",\"sources\":[]}\n\n"
            return

        context = "\n---\n".join([d.page_content for d in docs])
        sources = [d.metadata.get("source", "未知") for d in docs]

        callback = _TokenStreamingCallback()
        chain = self._prompt_template | self.llm

        await chain.ainvoke(
            {"context": context, "question": query},
            {"callbacks": [callback]},
        )

        # Stream accumulated tokens
        full_answer = "".join(callback.tokens)
        import json
        yield f"data: {json.dumps({'answer': full_answer, 'sources': sources}, ensure_ascii=False)}\n\n"
        yield "data: [DONE]\n\n"

    def answer(self, query: str, kb_id: Optional[str] = None, top_k: int = 3) -> dict:
        docs = self._search(query, top_k, kb_id)

        if not docs:
            return {
                "answer": "知识库中暂无相关记录",
                "sources": [],
            }

        context = "\n---\n".join([d.page_content for d in docs])
        chain = self._prompt_template | self.llm
        response = chain.invoke({"context": context, "question": query})

        return {
            "answer": response.content,
            "sources": [
                d.metadata.get("source", "未知") for d in docs
            ],
        }
