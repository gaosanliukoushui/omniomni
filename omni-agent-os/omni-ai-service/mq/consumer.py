# Author: Gemini
# OS support: Web/Node
# Description: RabbitMQ consumer to process document messages
import json
import sys
import traceback
from concurrent.futures import ThreadPoolExecutor
from functools import partial
from typing import Any, Dict, Optional

import pika

from config import (
    DOC_PROCESS_EXCHANGE,
    DOC_PROCESS_QUEUE,
    DOC_PROCESS_ROUTING_KEY,
    PREFETCH_COUNT,
    RABBIT_HOST,
    RABBIT_PASSWORD,
    RABBIT_PORT,
    RABBIT_USERNAME,
)
from services.processor import process_payload


def _safe_get(payload: Dict[str, Any], *keys: str) -> Optional[Any]:
    for k in keys:
        if k in payload:
            return payload[k]
    return None


def _build_credentials() -> Optional[pika.credentials.PlainCredentials]:
    if not RABBIT_USERNAME and not RABBIT_PASSWORD:
        return None
    if not RABBIT_USERNAME or not RABBIT_PASSWORD:
        raise ValueError("RABBIT_USERNAME and RABBIT_PASSWORD must both be set when using credentials")
    return pika.PlainCredentials(RABBIT_USERNAME, RABBIT_PASSWORD)


def start_consumer() -> None:
    credentials = _build_credentials()

    connection_kwargs: Dict[str, Any] = {
        "host": RABBIT_HOST,
        "port": RABBIT_PORT,
        "heartbeat": 60,
        "blocked_connection_timeout": 60,
    }
    if credentials is not None:
        connection_kwargs["credentials"] = credentials

    params = pika.ConnectionParameters(**connection_kwargs)

    connection = pika.BlockingConnection(params)
    channel = connection.channel()

    channel.exchange_declare(
        exchange=DOC_PROCESS_EXCHANGE,
        exchange_type="topic",
        durable=True,
    )
    channel.queue_declare(queue=DOC_PROCESS_QUEUE, durable=True)
    channel.queue_bind(
        queue=DOC_PROCESS_QUEUE,
        exchange=DOC_PROCESS_EXCHANGE,
        routing_key=DOC_PROCESS_ROUTING_KEY,
    )

    channel.basic_qos(prefetch_count=PREFETCH_COUNT)

    executor = ThreadPoolExecutor(max_workers=max(1, PREFETCH_COUNT))

    print(f"[INFO] Waiting for messages in queue={DOC_PROCESS_QUEUE} ...")

    def _ack_message(delivery_tag: int) -> None:
        channel.basic_ack(delivery_tag=delivery_tag)

    def _nack_message(delivery_tag: int) -> None:
        channel.basic_nack(delivery_tag=delivery_tag, requeue=False)

    def _process_async(payload: Dict[str, Any], doc_id: Any, delivery_tag: int) -> None:
        try:
            print(f"[INFO] Start processing docId={doc_id}")
            process_payload(payload)
            print(f"[INFO] Processing succeeded docId={doc_id}")
            connection.add_callback_threadsafe(partial(_ack_message, delivery_tag))
        except Exception as e:
            err = f"{type(e).__name__}: {e}\n{traceback.format_exc()}"
            print(
                f"[ERROR] Processing failed docId={doc_id}\n{err}",
                file=sys.stderr,
            )
            connection.add_callback_threadsafe(partial(_nack_message, delivery_tag))

    def on_message(_channel, method, properties, body: bytes) -> None:
        delivery_tag = method.delivery_tag
        doc_id = None

        try:
            payload = json.loads(body.decode("utf-8"))
            doc_id = _safe_get(payload, "fileId", "docId", "id")
            file_path = _safe_get(payload, "filePath", "file_path")

            if doc_id is None:
                raise ValueError("Missing docId/fileId in message payload")
            if file_path is None:
                raise ValueError("Missing filePath in message payload")

            executor.submit(_process_async, payload, doc_id, delivery_tag)
        except Exception as e:
            err = f"{type(e).__name__}: {e}\n{traceback.format_exc()}"
            print(
                f"[ERROR] Failed to parse/dispatch message docId={doc_id}\n{err}",
                file=sys.stderr,
            )
            _nack_message(delivery_tag)

    channel.basic_consume(queue=DOC_PROCESS_QUEUE, on_message_callback=on_message)

    try:
        channel.start_consuming()
    finally:
        executor.shutdown(wait=False)
# --- End of consumer.py ---
