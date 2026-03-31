🚀 Omni-Agent-OS 后续开发路线图 (Phase 2 & 3)

📌 当前进度回顾
[x] 基础设施: Docker (Nacos, MySQL, MQ) 部署完成。

[x] 微服务骨架: Java 多模块 + Python FastAPI 环境搭建。

[x] 数据流转: 文件上传 -> 绝对路径存储 -> MQ 异步通知 -> Python 解析向量化 -> 状态回传 (Status 3)。
🛠️ 第二阶段：核心对话与 RAG 检索 (核心逻辑)
目标：让 AI 能够基于已上传的文档进行回答。

1. 向量数据库持久化 (Python)
目前我们的向量数据可能只在内存中，重启即失。

任务: 集成 ChromaDB 或 FAISS 作为本地向量数据库。

关键点: 在 processor.py 中，将生成的 Embedding 存储到磁盘目录 ./vector_db。

2. 检索增强生成 (Retrieval Logic)
任务: 编写 query_service.py。

流程:

接收用户提问 (Query)。

将 Query 向量化。

从向量库检索最相关的 Top-K 个文本片段 (Chunks)。

Prompt 拼接: 请基于以下背景知识回答问题：{context} \n 问题：{query}。

3. 大模型接入
任务: 接入 DeepSeek (性价比最高) 或 OpenAI。

亮点: 使用 LangChain 的 ChatOpenAI 接口实现流式输出 (Streaming)。

🎨 第三阶段：全栈可视化 (前端开发)
目标：告别 Postman，提供像 ChatGPT 一样的用户体验。

1. 文档管理台
功能: 展示 kb_document 表数据。

交互:

上传文件按钮。

状态进度条（基于 Status 0-4 实时变色）。

2. 沉浸式聊天窗口
功能:

左侧显示知识库列表，右侧聊天。

Markdown 渲染: AI 回答的代码块、表格要好看。

溯源显示: 在回答下方标出：“参考了文档《XXX》第 5 页”。

🏗️ 核心逻辑架构图 (后续补充)
模块,动作,预期结果
Java Gateway,接口鉴权 + 路由转发,保证只有登录用户能提问
Python Service,相似度计算 (Vector Search),找到最懂问题的那个“文档片段”
LLM (AI),文本总结与推理,生成自然、准确的回答