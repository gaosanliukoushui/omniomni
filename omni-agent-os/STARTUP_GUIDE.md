# Omni-Agent-OS 启动指南

本文档说明如何启动 Omni-Agent-OS 的所有服务。

---

## 环境要求

| 组件 | 版本 | 说明 |
|------|------|------|
| JDK | 17+ | Java 后端必需 |
| Maven | 3.8+ | Java 构建工具 |
| Node.js | 18+ | 前端开发环境 |
| Python | 3.10+ | AI 服务运行环境 |
| Docker | 最新版 | 用于启动 MySQL、RabbitMQ 等基础设施 |

---

## 第一步：启动基础设施（Docker）

项目使用 Docker Compose 管理 MySQL、Redis 和 RabbitMQ。

```bash
cd omni-agent-os/deploy
docker compose up -d
```

启动后确认服务状态：

```bash
docker ps
```

预期容器：
- `mysql-v8` — MySQL 8.0，端口 **3307**
- `redis-v7` — Redis，端口 **6379**
- `rabbitmq-v3` — RabbitMQ，端口 **5672**，管理界面 **15672**
- `nacos-standalone` — Nacos（可选），端口 **8848**

首次启动 MySQL 后，需要初始化数据库：

```sql
CREATE DATABASE IF NOT EXISTS omni_agent_db DEFAULT CHARSET utf8mb4;

USE omni_agent_db;

CREATE TABLE IF NOT EXISTS kb_document (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL COMMENT '文档名称',
    file_path VARCHAR(500) COMMENT '文件存储路径',
    file_hash VARCHAR(64) COMMENT '文件唯一标识',
    status INT DEFAULT 0 COMMENT '0:上传 1:解析 2:向量化 3:就绪 4:失败',
    chunks INT DEFAULT 0 COMMENT '切片数量',
    tokens VARCHAR(50) COMMENT 'token数',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);
```

---

## 第二步：启动 Java 后端（知识库服务）

知识库服务（omni-knowledge）是核心后端，提供知识管理、文档上传等 API。

```bash
cd omni-agent-os/omni-knowledge

# 如果未编译过，先构建
mvn clean compile

# 启动服务
mvn spring-boot:run
```

启动成功后会监听端口 **8082**。

> **注意**：omni-auth（8081）和 omni-gateway（8080）目前是可选的，前端已直接配置连接 8082 和 8003，不依赖这两个服务。

---

## 第三步：启动 AI 服务（Python）

AI 服务提供文档向量化和大模型对话能力。

```bash
cd omni-agent-os/omni-ai-service

# 创建虚拟环境（首次）
python -m venv venv

# 激活虚拟环境
venv\Scripts\activate

# 安装依赖
pip install -r requirements.txt

# 启动服务
python main.py
```

启动成功后会监听端口 **8003**。

### 环境配置（可选）

在 `omni-ai-service/.env` 中可以覆盖默认配置：

```env
# LLM 配置（目前使用 DeepSeek）
OPENAI_API_KEY=your-api-key
OPENAI_API_BASE=https://api.deepseek.com
LLM_MODEL_NAME=deepseek-chat

# RabbitMQ 配置
MQ_HOST=localhost
MQ_PORT=5672
MQ_USERNAME=guest
MQ_PASSWORD=guest

# 向量化模型
EMBEDDING_MODEL_NAME=all-MiniLM-L6-v2
```

---

## 第四步：启动前端

```bash
cd omni-agent-os/frontend

# 安装依赖（首次）
npm install

# 启动开发服务器
npm run dev
```

启动成功后在浏览器打开 **http://localhost:3000**

---

## 快速启动脚本

在项目根目录已准备好脚本，一键启动所有服务：

```powershell
.\start-dev.ps1
```

脚本会自动：
1. 检查环境依赖
2. 启动 Docker 容器（MySQL、RabbitMQ）
3. 编译 Java 项目
4. 依次启动 omni-knowledge、omni-ai-service、前端

---

## 服务端口汇总

| 服务 | 端口 | 说明 |
|------|------|------|
| Frontend | 3000 | 前端控制面板 |
| omni-knowledge | 8082 | 核心 Java 后端 |
| omni-ai-service | 8003 | AI 服务（FastAPI） |
| omni-auth | 8081 | 认证服务（可选） |
| omni-gateway | 8080 | API 网关（可选） |
| MySQL | 3307 | 数据库 |
| RabbitMQ | 5672 | 消息队列 |
| RabbitMQ Admin | 15672 | MQ 管理界面（guest/guest） |

---

## 常见问题

**Q: 提示 "CORS policy" 跨域错误？**

确保 `omni-ai-service/main.py` 中已配置 CORS 中间件（已在代码中添加）。重启 AI 服务后即可。

**Q: Maven 编译报错 "release version not supported"？**

JDK 版本低于 17。检查并确保 JAVA_HOME 指向 JDK 17+。

**Q: RabbitMQ 连接失败？**

确认 Docker 容器已启动，端口 5672 未被占用。

**Q: 前端无法连接后端？**

检查 `omni-knowledge` 是否正常运行在 8082 端口，MySQL 数据库是否已初始化。

---

如遇其他问题，请告诉我具体的错误信息。
