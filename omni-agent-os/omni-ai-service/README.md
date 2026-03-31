# omni-ai-service

RabbitMQ 异步消费者：监听 `doc.process.queue`，接收 `doc.process.exchange` 的文档处理消息，
并通过 HTTP 回调 `omni-knowledge` 更新 `kb_document.status`：

- 1: PARSING
- 2: VECTORIZING（模拟向量化）
- 3: READY
- 4: FAILED（回传错误信息）

## 运行

1. 安装依赖
```bash
pip install -r requirements.txt
```

2. 设置环境变量（可选，默认值已写好）
```bash
export RABBIT_HOST=localhost
export DOC_PROCESS_QUEUE=doc.process.queue
export DOC_PROCESS_EXCHANGE=doc.process.exchange
export KNOWLEDGE_BASE_URL=http://localhost:8082/api/knowledge
export UPLOAD_DIR=uploads
```

3. 启动
```bash
python main.py
```

## 消息格式（来自 omni-knowledge）

期望 JSON 字段：
- `fileId`：`kb_document.id`
- `filePath`：文档本地路径（默认相对 `UPLOAD_DIR`）
- `userId`：用户 ID（当前逻辑不强依赖）

