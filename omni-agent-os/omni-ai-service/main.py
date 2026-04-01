import os
import threading
from typing import Optional

import uvicorn
from fastapi import FastAPI
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from mq.consumer import start_consumer
from services.query_service import QueryService

app = FastAPI(title="omni-ai-service", version="1.0.0")

_consumer_started = False
_lock = threading.Lock()

_query_service = QueryService()


class ChatRequest(BaseModel):
    query: str
    kbId: Optional[str] = None


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/api/ai/chat/stream")
async def chat_stream(request: ChatRequest):
    """
    Streaming endpoint: SSE, each chunk is a JSON-serialized token.
    """
    return StreamingResponse(
        _query_service.answer_stream(query=request.query, kb_id=request.kbId),
        media_type="text/event-stream",
    )


@app.post("/api/ai/chat")
async def chat(request: ChatRequest):
    try:
        result = _query_service.answer(query=request.query, kb_id=request.kbId)
        return {"code": 200, "data": result}
    except Exception as e:
        return {"code": 500, "message": str(e)}


@app.on_event("startup")
def startup_event():
    global _consumer_started
    with _lock:
        if _consumer_started:
            return
        _consumer_started = True
        t = threading.Thread(target=start_consumer, daemon=True)
        t.start()


if __name__ == "__main__":
    port = int(os.getenv("PORT", "8003"))
    uvicorn.run(app, host="0.0.0.0", port=port)

