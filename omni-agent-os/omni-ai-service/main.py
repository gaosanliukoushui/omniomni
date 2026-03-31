import os
import threading

import uvicorn
from fastapi import FastAPI

from mq.consumer import start_consumer

app = FastAPI(title="omni-ai-service", version="1.0.0")

_consumer_started = False
_lock = threading.Lock()


@app.get("/health")
def health():
    return {"status": "ok"}


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

