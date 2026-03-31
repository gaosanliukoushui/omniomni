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
│                                       │   :5000     │                         │
│                                       └─────────────┘                         │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 技术栈

### Frontend
- **React 18** + **TypeScript** - UI 框架
- **Tailwind CSS 3** - 样式框架
- **Zustand** - 状态管理
- **Framer Motion** - 动画效果
- **Vite** - 构建工具

### Backend (Java)
- **Spring Boot 3** - 核心框架
- **Spring Cloud Gateway** - API 网关
- **Spring Security** - 安全认证
- **RabbitMQ** - 消息队列
- **MyBatis-Plus** - ORM 框架

### AI Engine (Python)
- **FastAPI** - 高性能异步框架
- **LangChain** - LLM 应用开发框架
- **ChromaDB** - 向量数据库

## 项目结构

```
omni-agent-os/
├── frontend/                      # 前端控制面板
│   ├── src/
│   │   ├── components/            # React 组件
│   │   │   ├── Layout/             # 布局组件
│   │   │   ├── Console/           # 终端对话
│   │   │   ├── Ingestion/         # 数据摄取
│   │   │   ├── StateTracker/      # 状态追踪
│   │   │   └── Config/            # 配置管理
│   │   ├── services/              # API 服务层
│   │   ├── stores/                # Zustand 状态管理
│   │   ├── types/                 # TypeScript 类型
│   │   └── constants/             # 常量定义
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
│   └── src/main/java/com/omni/agent/os/auth/
│       └── config/                 # 安全配置
│
├── omni-gateway/                  # API 网关 (Java)
│   └── src/main/java/com/omni/agent/os/gateway/
│
├── omni-common/                   # 公共模块 (Java)
│   └── src/main/java/com/omni/agent/os/common/
│       ├── api/                   # 统一响应封装
│       ├── enums/                 # 枚举定义
│       └── exception/             # 异常处理
│
└── omni-ai-service/               # AI 服务 (Python)
    ├── services/                  # AI 业务逻辑
    └── mq/                        # 消息消费
```

## 核心功能

### 1. 多租户知识库 (RAG)

| 功能 | 描述 |
|------|------|
| 文档上传 | 支持 PDF、Markdown、TXT、JSON、CSV 等格式 |
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
     │ PARSING │ (1)
     └────┬────┘
          │
          ▼
   ┌─────────────┐
   │ VECTORIZING │ (2)
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

### 3. RAG 溯源引擎

- 对话回复支持点击"引用来源"，弹出原文片段
- 玻璃拟态卡片设计，悬停高亮原文
- 展示相似度评分和 Chunk ID

### 4. 可插拔 Agent Tools

- 支持注册自定义 API 工具（如：搜索、数据库执行）
- JSON Schema 预览，可视化配置工具入参

### 5. 分布式自愈 (Resilience)

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

### 1. 启动后端服务

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

### 2. 启动 AI 服务

```bash
cd omni-ai-service
pip install -r requirements.txt
python main.py
```

### 3. 启动前端

```bash
cd frontend
npm install
npm run dev
```

前端访问地址: http://localhost:3000

## 前端模块说明

### 终端 (Console)
RAG 对话界面，支持：
- 知识库文档索引
- 实时 AI 对话
- 引用来源展示
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

### AI 服务配置 (omni-ai-service)

```python
# omni-ai-service/config.py
OPENAI_API_KEY = "your-api-key"
VECTOR_STORE_PATH = "./vector_store"
EMBEDDING_MODEL = "text-embedding-ada-002"
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

### v1.0.0 (2026-03-31)

- 完成前端重构，修复原有代码错误
- 完善交互功能和状态管理
- 建立标准化的项目结构
- 添加 API 服务层和类型定义

### v0.1.0 (2026-03-XX)

- 项目初始化
- 基础架构搭建
