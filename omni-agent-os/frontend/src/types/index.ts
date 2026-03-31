// ==================== 页面 & 导航 ====================
export type PageId = 'console' | 'ingestion' | 'tracker' | 'config';

export interface NavItem {
  id: PageId;
  label: string;
  labelEn: string;
  icon: string;
}

// ==================== 消息 & 对话 ====================
export interface Message {
  id: string;
  role: 'agent' | 'user';
  content: string;
  timestamp: string;
  tokens?: number;
  citations?: Citation[];
}

export interface Citation {
  docId: string;
  docName: string;
  chunkId: string;
  score: number;
  preview: string;
}

// ==================== 知识库 ====================
export interface KnowledgeItem {
  id: string;
  name: string;
  chunks: number;
  simIdx: number;
  status: 'active' | 'processing' | 'pending' | 'error';
  uploadedAt?: string;
  size?: number;
}

export interface KnowledgeStats {
  totalDocs: number;
  totalChunks: number;
  totalTokens: string;
  avgSimilarity: number;
}

// ==================== 数据摄取管道 ====================
export type PipelineStatus = 'synced' | 'vectorizing' | 'queued' | 'error' | 'uploading';

export interface PipelineItem {
  id: string;
  name: string;
  chunks: string;
  tokens: string;
  vectors: string;
  status: PipelineStatus;
  progress: number;
  errorMessage?: string;
  uploadedAt?: string;
}

// ==================== 系统状态 ====================
export interface SystemMetrics {
  cpu: number;
  memory: number;
  memoryTotal: number;
  disk: number;
  latency: number;
  uptime: string;
  ip: string;
  activeConnections: number;
}

export interface TelemetryData {
  latency: number;
  generationRate: string;
  vectorDim: number;
  activeNodes: number;
  totalNodes: number;
}

// ==================== 配置 ====================
export interface LLMConfig {
  model: string;
  temperature: number;
  maxTokens: number;
  topK: number;
  similarityThreshold: number;
  reranking: boolean;
}

export interface SystemPrompt {
  content: string;
  version: string;
  updatedAt: string;
}

// ==================== API 响应 ====================
export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

// ==================== 流水线节点 ====================
export interface PipelineNode {
  id: string;
  label: string;
  icon: string;
  color: 'primary' | 'secondary' | 'purple';
  isLarge?: boolean;
  status?: 'active' | 'idle' | 'error';
  x: number;
  y: number;
}

// ==================== Payload 检查器 ====================
export interface PayloadData {
  queryId: string;
  timestamp: number;
  action: string;
  parameters: Record<string, unknown>;
  results: Array<{
    chunkId: string;
    score: number;
    preview: string;
  }>;
}
