import os


def _get_int(name: str, default: int) -> int:
    v = os.getenv(name)
    return default if v is None or v == "" else int(v)


def _get_float(name: str, default: float) -> float:
    v = os.getenv(name)
    return default if v is None or v == "" else float(v)

class Config:
    # Java 端回调地址
    STATUS_ENDPOINT = os.getenv(
        "STATUS_ENDPOINT",
        "http://localhost:8082/api/knowledge/doc/status",
    )

    # RabbitMQ 配置
    MQ_HOST = os.getenv("MQ_HOST", "localhost")
    MQ_QUEUE = os.getenv("MQ_QUEUE", "doc.process.queue")
    MQ_EXCHANGE = os.getenv("MQ_EXCHANGE", "doc.process.exchange")
    MQ_ROUTING_KEY = os.getenv("MQ_ROUTING_KEY", "doc.process.base")
    MQ_PORT = _get_int("MQ_PORT", 5672)
    MQ_USERNAME = os.getenv("MQ_USERNAME", "")
    MQ_PASSWORD = os.getenv("MQ_PASSWORD", "")

    # 大模型配置（预留）
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "your-key-here")

    # File
    UPLOAD_DIR = os.getenv("UPLOAD_DIR", "uploads")

    # LangChain chunking
    CHUNK_SIZE = _get_int("CHUNK_SIZE", 1000)
    CHUNK_OVERLAP = _get_int("CHUNK_OVERLAP", 150)

    # Vectorization simulation
    VECTORIZE_SIMULATE_DELAY_SECONDS = _get_float("VECTORIZE_SIMULATE_DELAY_SECONDS", 0.5)

    # HTTP
    HTTP_TIMEOUT_SECONDS = _get_int("HTTP_TIMEOUT_SECONDS", 30)

    # Pika
    PREFETCH_COUNT = _get_int("PREFETCH_COUNT", 1)


# ---------------------------
# 兼容旧代码的模块级别名
# ---------------------------

# RabbitMQ
DOC_PROCESS_EXCHANGE = Config.MQ_EXCHANGE
DOC_PROCESS_QUEUE = Config.MQ_QUEUE
DOC_PROCESS_ROUTING_KEY = Config.MQ_ROUTING_KEY

RABBIT_HOST = Config.MQ_HOST
RABBIT_PORT = Config.MQ_PORT
RABBIT_USERNAME = Config.MQ_USERNAME
RABBIT_PASSWORD = Config.MQ_PASSWORD

STATUS_ENDPOINT = Config.STATUS_ENDPOINT

UPLOAD_DIR = Config.UPLOAD_DIR
CHUNK_SIZE = Config.CHUNK_SIZE
CHUNK_OVERLAP = Config.CHUNK_OVERLAP
VECTORIZE_SIMULATE_DELAY_SECONDS = Config.VECTORIZE_SIMULATE_DELAY_SECONDS
HTTP_TIMEOUT_SECONDS = Config.HTTP_TIMEOUT_SECONDS
PREFETCH_COUNT = Config.PREFETCH_COUNT

