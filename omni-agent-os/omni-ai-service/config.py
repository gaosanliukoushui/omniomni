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
    JAVA_API_BASE = os.getenv(
        "JAVA_API_BASE",
        "http://localhost:8082",
    )

    # RabbitMQ 配置
    MQ_HOST = os.getenv("MQ_HOST", "localhost")
    MQ_PORT = _get_int("MQ_PORT", 5672)
    MQ_USERNAME = os.getenv("MQ_USERNAME", "")
    MQ_PASSWORD = os.getenv("MQ_PASSWORD", "")
    MQ_EXCHANGE = os.getenv("MQ_EXCHANGE", "doc.process.exchange")
    MQ_QUEUE = os.getenv("MQ_QUEUE", "doc.process.queue")
    MQ_ROUTING_KEY = os.getenv("MQ_ROUTING_KEY", "doc.process.base")
    # Dead Letter Queue 配置
    MQ_DLQ_EXCHANGE = os.getenv("MQ_DLQ_EXCHANGE", "doc.process.dlx")
    MQ_DLQ_QUEUE = os.getenv("MQ_DLQ_QUEUE", "doc.process.dlq")
    MQ_DLQ_ROUTING_KEY = os.getenv("MQ_DLQ_ROUTING_KEY", "doc.process.failed")

    # 大模型配置
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "sk-1711d0df235a4140b7780ff3fcd8b544")
    OPENAI_API_BASE = os.getenv("OPENAI_API_BASE", "https://api.deepseek.com")
    LLM_MODEL_NAME = os.getenv("LLM_MODEL_NAME", "deepseek-chat")

    # Vector DB
    VECTOR_DB_DIR = os.getenv("VECTOR_DB_DIR", "vector_db")

    # Embedding 配置
    # 环境变量: HF_HUB_OFFLINE=1 离线模式，避免网络问题
    EMBEDDING_MODEL_NAME = os.getenv("EMBEDDING_MODEL_NAME", "all-MiniLM-L6-v2")
    # 本地模型路径（如果设置则优先使用本地路径）
    EMBEDDING_MODEL_PATH = os.getenv("EMBEDDING_MODEL_PATH", "")

    # File
    UPLOAD_DIR = os.getenv("UPLOAD_DIR", os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads"))

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

# Dead Letter Queue
DOC_DLX_EXCHANGE = Config.MQ_DLQ_EXCHANGE
DOC_DLQ_QUEUE = Config.MQ_DLQ_QUEUE
DOC_DLQ_ROUTING_KEY = Config.MQ_DLQ_ROUTING_KEY

STATUS_ENDPOINT = Config.STATUS_ENDPOINT
JAVA_API_BASE = Config.JAVA_API_BASE

UPLOAD_DIR = Config.UPLOAD_DIR
CHUNK_SIZE = Config.CHUNK_SIZE
CHUNK_OVERLAP = Config.CHUNK_OVERLAP
VECTORIZE_SIMULATE_DELAY_SECONDS = Config.VECTORIZE_SIMULATE_DELAY_SECONDS
HTTP_TIMEOUT_SECONDS = Config.HTTP_TIMEOUT_SECONDS
PREFETCH_COUNT = Config.PREFETCH_COUNT

# Vector DB
VECTOR_DB_DIR = Config.VECTOR_DB_DIR
EMBEDDING_MODEL_NAME = Config.EMBEDDING_MODEL_NAME

