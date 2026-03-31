# Omni-Agent-OS 开发路线图

## Phase 4: 检索与生成 (Retrieval & Generation)
- [ ] **向量库持久化**: 修改 `omni-ai-service`，将 Embedding 存入本地 ChromaDB 文件夹，防止重启丢失。
- [ ] **多路召回**: 实现语义检索 (Vector) + 关键词检索 (BM25) 的混合搜索。
- [ ] **LLM 适配**: 接入大模型接口，支持流式输出 (SSE)。

## Phase 5: 前端枢纽 (Frontend Implementation)
- [ ] **工程初始化**: 使用 `npx create-next-app@latest` 构建前端，引入 Tailwind 和 Shadcn UI。
- [ ] **状态感知组件**: 编写 `DocumentStatus` 组件，通过轮询 Java 接口实时更新文档状态。
- [ ] **流式对话框**: 实现类似 ChatGPT 的 Markdown 渲染对话流。

## Phase 6: 系统韧性与监控 (Observability)
- [ ] **Sentinel 集成**: Java 网关接入 Sentinel，配置 AI 接口的限流规则。
- [ ] **链路追踪**: 确保从前端提问到 Python 检索再到模型返回的 RequestId 统一。