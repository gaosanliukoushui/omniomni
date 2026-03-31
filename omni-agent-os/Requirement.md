## 项目概述
构建一个基于 微服务架构 的 RAG (Retrieval-Augmented Generation) 知识库系统，实现用户上传私有文档并进行 AI 问答。

## 核心功能
多模块解耦：Java 负责业务流与事务，Python 负责计算密集型 AI 任务。

文档异步处理：利用 RabbitMQ 实现削峰填谷，防止大文件解析阻塞系统。

实时状态机：通过 0->1->2->3 状态流转，为前端提供精确的处理进度反馈。

向量化检索：基于 LangChain 框架实现 PDF 解析、文本切片与向量索引。

1. 产品愿景
构建一个工业级的 RAG + Agent 协作平台，解决 AI 应用在处理海量文档时的“黑盒”问题，提供全链路状态可见、高可用的分布式 AI 能力。

2. 核心功能设计 (MVP+ 增强版)
模块,功能详述,技术/UI 亮点
多租户知识库 (RAG),支持 PDF/Markdown 上传；多版本 Hash 秒传。,状态机追踪：UI 显示 [上传->解析->向量化->就绪] 进度条。
RAG 溯源引擎,对话回复支持点击“引用来源”，弹出原文片段。,玻璃拟态卡片：悬停高亮原文，增强 AI 回答的可信度。
可插拔 Agent Tools,支持注册自定义 API 工具（如：搜索、数据库执行）。,JSON Schema 预览：可视化配置工具入参。
分布式自愈 (Resilience),基于 Sentinel 的模型熔断，模型故障自动主备切换。,实时流量图：Dashboard 展示各模型节点的 QPS 和延迟。

3. 技术路线对齐
前端：Next.js 14 (App Router) + Tailwind CSS + Shadcn UI + Lucide Icons。

后端 (Java)：Spring Boot 3 + Spring Cloud Alibaba (Nacos) + RabbitMQ (Topic Exchange)。

AI 引擎 (Python)：FastAPI + LangChain + ChromaDB (持久化向量库)。

通信协议：RESTful + SSE (Server-Sent Events) 用于 AI 流式对话。