# Omni-Agent-OS

工业级 RAG + Agent 协作平台，解决 AI 应用在处理海量文档时的"黑盒"问题，提供全链路状态可见、高可用的分布式 AI 能力。

## 愿景

构建一个工业级的 RAG + Agent 协作平台，支持私有文档上传与 AI 问答，实现多模块解耦、实时状态追踪、分布式自愈的智能知识库系统。

## 架构概览

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              Omni-Agent-OS                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐  │
│  │   Frontend  │───▶│   Gateway    │───▶│   Auth      │    │   Knowledge │  │
│  │   (React)   │    │   (Java)     │    │   (Java)    │    │   (Java)    │  │
│  │   :3000     │    │   :8080      │    │   :8081     │    │   :8082     │  │
│  └─────────────┘    └──────┬───────┘    └─────────────┘    └──────┬───────┘  │
│                            │                                       │          │
│                            │          ┌─────────────┐              │          │
│                            └─────────▶│   RabbitMQ  │◀─────────────┘          │
│                                       │   (Broker)  │                        │
│                                       └──────┬──────┘                        │
│                                              │                                 │
│                                       ┌──────▼──────┐                         │
│                                       │ AI Service  │                         │
│                                       │  (Python)   │                         │
│                                       │   :8003     │                         │
│                                       │  FastAPI    │                         │
│                                       │  + LangChain│                         │
│                                       │  + ChromaDB │                         │
│                                       └─────────────┘                         │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 数据流（PDF → 向量 → 对话）

```
用户上传 PDF
    ↓
omni-knowledge (Java) 接收文件，持久化到磁盘
    ↓ 发送 MQ 消息 {fileId, filePath}
omni-ai-service (Python) 消费消息
    ↓
PyPDFLoader 解析 PDF → RecursiveCharacterTextSplitter 分块
    ↓
HuggingFaceEmbeddings 生成向量 → 持久化到 Chroma（./vector_db）
    ↓ 回调 HTTP 状态
omni-knowledge 更新文档状态为 READY
    ↓
用户在前端 Console 输入问题
    ↓ HTTP POST /api/ai/chat/stream
omni-ai-service Chroma 相似度检索 → DeepSeek LLM 生成回答
    ↓ SSE 流式推送
前端逐字渲染回答 + 右侧展示溯源卡片
```

## 技术栈

### Frontend
- **React 18** + **TypeScript** - UI 框架
- **Tailwind CSS 3** - 样式框架
- **Zustand** - 状态管理
- **Framer Motion** - 动画效果
- **Vite** - 构建工具
- **lucide-react** - 图标库

### Backend (Java)
- **Spring Boot 3** - 核心框架
- **Spring Cloud Gateway** - API 网关
- **Spring Security** - 安全认证
- **RabbitMQ** - 消息队列
- **MyBatis-Plus** - ORM 框架

### AI Engine (Python)
- **FastAPI** - 高性能异步框架
- **LangChain** - LLM 应用开发框架
- **ChromaDB** - 向量数据库（持久化到 `./vector_db`）
- **LangChain + HuggingFace** - Embedding 模型（`all-MiniLM-L6-v2`）
- **LangChain + OpenAI SDK** - LLM 调用（DeepSeek / OpenAI 兼容）

## 项目结构

```
omni-agent-os/
├── frontend/                      # 前端控制面板
│   ├── src/
│   │   ├── components/            # React 组件
│   │   │   ├── Layout/            # 布局组件
│   │   │   ├── Console/           # 终端对话（支持流式 AI 回复 + 溯源卡片）
│   │   │   ├── Ingestion/         # 数据摄取
│   │   │   ├── StateTracker/      # 状态追踪
│   │   │   └── Config/            # 配置管理
│   │   ├── services/              # API 服务层（axios）
│   │   ├── stores/                # Zustand 状态管理
│   │   ├── types/                 # TypeScript 类型
│   │   └── constants/             # 常量定义（API_BASE_URL）
│   ├── .env                       # 环境变量（VITE_OMNI_AI_SERVICE_URL）
│   └── package.json
│
├── omni-knowledge/                # 知识库服务 (Java)
│   └── src/main/java/com/omni/agent/os/knowledge/
│       ├── web/                    # REST API 控制器
│       ├── service/                # 业务逻辑层
│       ├── entity/                 # 数据实体
│       ├── mapper/                 # 数据访问层
│       └── mq/                      # 消息队列处理
│
├── omni-auth/                     # 认证服务 (Java)
│
├── omni-gateway/                  # API 网关 (Java)
│
├── omni-common/                   # 公共模块 (Java)
│
└── omni-ai-service/               # AI 服务 (Python)
    ├── main.py                     # FastAPI 入口，含 /api/ai/chat 和 /api/ai/chat/stream
    ├── config.py                   # 全量配置（LLM / Chroma / RabbitMQ）
    └── services/
        ├── processor.py            # PDF 解析 + Chroma 向量持久化
        ├── query_service.py        # RAG 检索 + LLM 生成（含流式）
        └── callback.py             # 状态回调 Java 端
```

## 核心功能

### 1. 多租户知识库 (RAG)

| 功能 | 描述 |
|------|------|
| 文档上传 | 支持 PDF、Markdown、TXT、JSON、CSV 等格式 |
| 智能分块 | RecursiveCharacterTextSplitter，chunk_size=500, overlap=50 |
| 向量持久化 | ChromaDB 持久化到 `./vector_db`，重启不丢数据 |
| 多版本管理 | 基于 Hash 实现秒传和版本控制 |
| 状态追踪 | UI 显示 [上传→解析→向量化→就绪] 进度条 |

### 2. 文档处理状态机

```
     ┌─────────┐
     │ UPLOADED │ (0)
     └────┬────┘
          │
          ▼
     ┌─────────┐
     │ PARSING │ (1) ← PyPDFLoader 解析 PDF
     └────┬────┘
          │
          ▼
   ┌─────────────┐
   │ VECTORIZING │ (2) ← 生成向量 + 持久化 Chroma
   └──────┬──────┘
          │
          ▼
     ┌─────────┐
     │  READY  │ (3) ◀── 文档可被检索
     └─────────┘
          │
          ▼ (可选)
     ┌─────────┐
     │ FAILED  │ (4)
     └─────────┘
```

### 3. 流式 RAG 对话

- **流式输出**：AI 回答逐字渲染，打字机体验
- **SSE 协议**：后端 `/api/ai/chat/stream`，前端原生 `fetch` + `ReadableStream` 消费
- **分知识库提问**：可选 `kbId` 参数，只在指定文档范围内检索
- **溯源卡片**：回答完成后右侧显示引用来源（文档名、Chunk ID）

### 4. RAG 溯源引擎

- 对话回复支持点击"引用来源"，弹出原文片段
- 玻璃拟态卡片设计，悬停高亮原文
- 展示相似度评分和 Chunk ID

### 5. 可插拔 Agent Tools

- 支持注册自定义 API 工具（如：搜索、数据库执行）
- JSON Schema 预览，可视化配置工具入参

### 6. 分布式自愈 (Resilience)

- 基于 Sentinel 的模型熔断
- 模型故障自动主备切换
- 实时流量图展示各模型节点的 QPS 和延迟

## 快速开始

### 环境要求

- JDK 17+
- Node.js 18+
- Python 3.10+
- RabbitMQ 3.x
- MySQL 8.0+
- Maven 3.8+

### 1. 安装 Python 依赖

```bash
cd omni-ai-service
pip install -r requirements.txt
```

`requirements.txt` 主要依赖：

```
fastapi
uvicorn
pydantic
langchain
langchain-community
langchain-huggingface
langchain-openai
chromadb
sentence-transformers
pika
httpx
```

### 2. 配置环境变量

```bash
# omni-ai-service/.env（可选，有默认值）
OPENAI_API_KEY=your-deepseek-api-key
OPENAI_API_BASE=https://api.deepseek.com
LLM_MODEL_NAME=deepseek-chat
VECTOR_DB_DIR=./vector_db
EMBEDDING_MODEL_NAME=all-MiniLM-L6-v2
```

### 3. 启动 AI 服务

```bash
cd omni-ai-service
python main.py
# 服务运行在 http://localhost:8003
```

### 4. 启动前端

```bash
cd frontend
npm install
npm run dev
```

前端访问地址: http://localhost:3000

> 前端 `.env` 文件中配置 `VITE_OMNI_AI_SERVICE_URL=http://localhost:8003`

### 5. 启动后端服务（可选，完整链路需要）

```bash
# 启动网关
cd omni-gateway
mvn spring-boot:run

# 启动认证服务
cd omni-auth
mvn spring-boot:run

# 启动知识库服务
cd omni-knowledge
mvn spring-boot:run
```

## 前端模块说明

### 终端 (Console)

RAG 对话界面，支持：

- 知识库文档索引（左侧边栏）
- 实时 AI 对话（流式输出）
- 引用来源展示（右侧溯源卡片）
- 对话历史管理

### 数据摄取 (Ingestion)

文件上传和处理管道监控：

- 拖拽文件上传
- 上传进度显示
- 处理状态追踪
- 实时日志输出

### 神经链路 (StateTracker)

系统状态可视化：

- 流水线节点可视化
- Payload 检查器
- 实时遥测数据
- 节点状态监控

### 配置 (Config)

系统参数管理：

- LLM 模型选择
- Temperature / Max Tokens 配置
- Top-K / 相似度阈值配置
- RAG 重排序开关
- System Prompt 编辑

## API 接口

### AI 服务接口（omni-ai-service，:8003）

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/health` | 健康检查 |
| POST | `/api/ai/chat` | 普通对话（非流式） |
| POST | `/api/ai/chat/stream` | 流式对话（SSE） |

**POST /api/ai/chat**

```json
// Request
{ "query": "产品手册第5章讲了什么？", "kbId": "doc_123" }
// kbId 为可选，不传则全库检索

// Response
{
  "code": 200,
  "data": {
    "answer": "第5章主要介绍了...",
    "sources": ["产品手册.pdf", "规格说明.md"]
  }
}
```

**POST /api/ai/chat/stream（SSE）**

```json
// Request
{ "query": "产品手册第5章讲了什么？", "kbId": "doc_123" }

// Response（text/event-stream）
data: {"answer": "第", "sources": ["产品手册.pdf"]}
data: {"answer": "第5", "sources": ["产品手册.pdf"]}
data: {"answer": "第5章", "sources": ["产品手册.pdf"]}
...
data: {"answer": "第5章主要介绍了...（完整回答）", "sources": ["产品手册.pdf"]}
data: [DONE]
```

### 知识库接口

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | /api/knowledge | 获取文档列表 |
| POST | /api/knowledge/upload | 上传文档 |
| DELETE | /api/knowledge/{id} | 删除文档 |
| GET | /api/knowledge/stats | 获取统计信息 |

### 对话接口

| 方法 | 路径 | 描述 |
|------|------|------|
| POST | /api/chat | 发送消息 |
| POST | /api/chat/stream | 流式对话 |
| GET | /api/chat/history | 获取历史记录 |

### 配置接口

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | /api/config/llm | 获取 LLM 配置 |
| POST | /api/config/llm | 保存 LLM 配置 |
| GET | /api/config/system-prompt | 获取系统提示词 |
| POST | /api/config/system-prompt | 保存系统提示词 |

## 配置说明

### AI 服务配置 (omni-ai-service/config.py)

| 配置项 | 环境变量 | 默认值 | 说明 |
|--------|----------|--------|------|
| `OPENAI_API_KEY` | `OPENAI_API_KEY` | `your-key-here` | DeepSeek / OpenAI API Key |
| `OPENAI_API_BASE` | `OPENAI_API_BASE` | `https://api.deepseek.com` | API 地址 |
| `LLM_MODEL_NAME` | `LLM_MODEL_NAME` | `deepseek-chat` | LLM 模型名 |
| `VECTOR_DB_DIR` | `VECTOR_DB_DIR` | `vector_db` | Chroma 持久化目录 |
| `EMBEDDING_MODEL_NAME` | `EMBEDDING_MODEL_NAME` | `all-MiniLM-L6-v2` | Embedding 模型 |

### RabbitMQ 配置

| 配置项 | 环境变量 | 默认值 |
|--------|----------|--------|
| `MQ_HOST` | `MQ_HOST` | `localhost` |
| `MQ_PORT` | `MQ_PORT` | `5672` |
| `MQ_USERNAME` | `MQ_USERNAME` | (空) |
| `MQ_PASSWORD` | `MQ_PASSWORD` | (空) |

### 数据库配置 (omni-knowledge)

```yaml
# omni-knowledge/src/main/resources/application.yml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/omni_knowledge
    username: root
    password: your_password
  rabbitmq:
    host: localhost
    port: 5672
    username: guest
    password: guest
```

## 开发指南

### 代码规范

- **Java**: 遵循 Google Java Style Guide
- **TypeScript**: 遵循 ESLint + Prettier 配置
- **Python**: 遵循 PEP 8 规范

### 提交规范

使用 Conventional Commits 格式：

```
<type>(<scope>): <subject>

feat(knowledge): add document upload feature
fix(frontend): resolve console scroll issue
docs(readme): update installation guide
```

### 测试

```bash
# Java 测试
cd omni-knowledge
mvn test

# 前端测试
cd frontend
npm run test
```

## 许可证

本项目仅供学习交流使用。

## 更新日志

### v1.1.0 (2026-04-01)

- **AI 服务重构**：新增 `QueryService`，支持 RAG 检索 + LLM 生成
- **持久化向量库**：processor.py 将 PDF 分块向量持久化到 Chroma（`./vector_db`），重启不丢数据
- **流式对话**：`/api/ai/chat/stream` SSE 端点，前端逐字渲染 AI 回答
- **分知识库检索**：`/api/ai/chat` 及流式接口支持 `kbId` 参数，限定在指定文档范围内检索
- **溯源卡片**：前端 Console 右侧展示引用来源文档名

### v1.0.0 (2026-03-31)

- 完成前端重构，修复原有代码错误
- 完善交互功能和状态管理
- 建立标准化的项目结构
- 添加 API 服务层和类型定义

### v0.1.0 (2026-03-XX)

- 项目初始化
- 基础架构搭建
