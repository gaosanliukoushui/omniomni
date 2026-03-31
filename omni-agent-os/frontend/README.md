# Omni-Agent-OS Frontend

Omni-Agent-OS 的前端控制面板，基于 React + TypeScript + Tailwind CSS 构建。

## 技术栈

- **React 18** - UI 框架
- **TypeScript** - 类型安全
- **Tailwind CSS 3** - 样式框架
- **Zustand** - 状态管理
- **Framer Motion** - 动画效果
- **Axios** - HTTP 客户端
- **Lucide React** - 图标库
- **Vite** - 构建工具

## 快速开始

```bash
# 安装依赖
npm install

# 开发模式
npm run dev

# 类型检查
npm run type-check

# 代码检查
npm run lint

# 构建生产版本
npm run build
```

## 项目结构

```
frontend/
├── public/           # 静态资源
├── src/
│   ├── components/   # React 组件
│   │   ├── Layout/    # 布局组件
│   │   ├── Console/   # 终端对话组件
│   │   ├── Ingestion/ # 数据摄取组件
│   │   ├── StateTracker/ # 状态追踪组件
│   │   └── Config/    # 配置组件
│   ├── constants/     # 常量定义
│   ├── hooks/         # 自定义 Hooks
│   ├── services/      # API 服务层
│   ├── stores/        # Zustand 状态管理
│   ├── types/         # TypeScript 类型定义
│   ├── lib/           # 工具函数
│   ├── App.tsx        # 根组件
│   ├── main.tsx       # 入口文件
│   └── index.css      # 全局样式
├── index.html
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```

## 功能模块

1. **终端 (Console)** - RAG 对话界面，支持知识库检索和实时对话
2. **数据摄取 (Ingestion)** - 文件上传和处理管道监控
3. **神经链路 (StateTracker)** - 系统状态可视化和负载检查
4. **配置 (Config)** - LLM 参数和系统提示词配置

## 环境变量

复制 `.env.example` 为 `.env` 并配置:

```
VITE_API_BASE_URL=http://localhost:8080
```
