# Omni-Agent-OS 项目说明

## 项目是什么

Omni-Agent-OS 是一个**工业级 RAG + Agent 协作平台**，用于解决 AI 应用在处理海量文档时的"黑盒"问题，提供全链路状态可见、高可用的分布式 AI 能力。

## 项目目的

构建一个智能知识库系统，实现：
- 私有文档上传与 AI 问答
- 多模块解耦、实时状态追踪
- 分布式自愈的智能知识库

## 技术架构

```
┌─────────────────────────────────────────────────────────────────────┐
│                              Omni-Agent-OS                          │
├─────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐              │
│  │   Frontend  │───▶│   Gateway   │───▶│   Auth      │              │
│  │   (React)   │    │   (Java)   │    │   (Java)   │              │
│  │   :3000     │    │   :8080     │    │   :8081     │              │
│  └─────────────┘    └──────┬──────┘    └─────────────┘              │
│                             │                                       │
│                             │    ┌─────────────┐                     │
│                             └───▶│   RabbitMQ  │                     │
│                                  │   (Broker)  │                     │
│                                  └──────┬──────┘                     │
│                                         │                            │
│                                  ┌──────▼──────┐                     │
│                                  │ AI Service │                     │
│                                  │  (Python)  │                     │
│                                  │   :8003     │                     │
│                                  │  FastAPI    │                     │
│                                  │  + LangChain│                     │
│                                  │  + ChromaDB │                     │
│                                  └─────────────┘                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 技术栈

**前端 (React)**
- React 18 + TypeScript
- Tailwind CSS 3
- Zustand 状态管理
- Framer Motion 动画

**后端 (Java)**
- Spring Boot 3
- Spring Cloud Gateway
- RabbitMQ 消息队列
- MyBatis-Plus

**AI 服务 (Python)**
- FastAPI
- LangChain
- ChromaDB 向量数据库
- HuggingFace Embeddings

## 功能特性

### 1. 文档知识库
- 支持 PDF、Markdown、TXT、JSON、CSV 等格式上传
- 智能分块 (chunk_size=500, overlap=50)
- 向量持久化到 Chroma，重启不丢数据
- 多版本管理，基于 Hash 实现秒传

### 2. 文档处理状态机
```
上传(UPLOADED) → 解析(PARSING) → 向量化(VECTORIZING) → 就绪(READY)
```

### 3. 流式 RAG 对话
- AI 回答逐字渲染（打字机效果）
- SSE 流式推送
- 分知识库检索
- 溯源卡片展示引用来源

### 4. RAG 溯源引擎
- 点击查看引用来源原文
- 展示相似度评分和 Chunk ID
- 支持多文档关联

### 5. 可插拔 Agent Tools
- 支持注册自定义 API 工具
- JSON Schema 可视化配置

### 6. 分布式自愈
- 基于 Sentinel 的模型熔断
- 模型故障自动主备切换
- 实时流量图展示 QPS 和延迟

## 前端模块

| 模块 | 功能 |
|------|------|
| Console | RAG 对话界面，支持流式 AI 回复 + 溯源卡片 |
| Ingestion | 文件上传和处理管道监控 |
| StateTracker | 流水线节点可视化、实时遥测 |
| Config | LLM 模型选择、参数配置、System Prompt 编辑 |
| Layout | 系统布局、导航、状态栏 |

## 数据流

```
用户上传 PDF
    ↓
omni-knowledge (Java) 接收文件，持久化到磁盘
    ↓ 发送 MQ 消息
omni-ai-service (Python) 消费消息
    ↓
PyPDFLoader 解析 → 分块
    ↓
生成向量 → 持久化到 Chroma
    ↓
用户在前端输入问题
    ↓
omni-ai-service Chroma 检索 → DeepSeek LLM 生成回答
    ↓ SSE 流式推送
前端逐字渲染回答 + 右侧展示溯源卡片
```

## 最终效果

打造一个类似企业级 AI 助手的控制台：
- 左侧：知识库文档管理
- 中间：智能对话终端（流式输出、实时溯源）
- 右侧：引用来源详情
- 顶部：系统状态监控
- 可配置：LLM 参数、System Prompt、RAG 参数等

用户可以上传私有文档，基于这些文档进行 AI 问答，并能看到每个回答的来源，确保 AI 回答的可信度和可追溯性。
