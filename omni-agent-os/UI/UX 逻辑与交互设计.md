1. 核心布局架构
侧边栏 (Modern Sidebar)：

顶部项目标识，中部功能切换（Chat / Knowledge / Tools / Monitoring）。

集成 Token 消耗监控小部件，实时显示当前会话的费用。

主工作区 (Glassmorphism Canvas)：

Chat 模式：采用消息流设计，AI 回复时带有细微的打字机动画。

Knowledge 模式：文档列表页，每行记录右侧带有一个胶囊状的状态标签（Status 0-4 自动变色）。

2. 关键交互 UI 元素
RAG 溯源气泡：
在 AI 回复的文字中插入 [1]、[2] 样式的上标，鼠标悬停时展示浮窗，包含：来源文档名、匹配得分、原文片段。

任务流水线进度条：
这是一个带有动态光效的 Step 组件。

Status 0-1: 蓝色呼吸灯效果。

Status 2: 橙色旋转进度。

Status 3: 绿色静态勾选。

Status 4: 红色警告，点击查看错误日志。