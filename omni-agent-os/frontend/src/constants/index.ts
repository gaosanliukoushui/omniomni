export const NAV_ITEMS = [
  { id: 'console', label: '终端', labelEn: 'Terminal', icon: 'terminal' },
  { id: 'ingestion', label: '数据流', labelEn: 'Data Stream', icon: 'database' },
  { id: 'tracker', label: '神经链路', labelEn: 'Neural Link', icon: 'activity' },
  { id: 'config', label: '设置', labelEn: 'Settings', icon: 'settings' },
] as const;

export const HEADER_NAV = [
  { id: 'console', label: '终端' },
  { id: 'ingestion', label: '数据摄入' },
  { id: 'tracker', label: '状态追踪' },
  { id: 'config', label: '配置' },
] as const;

export const API_BASE_URL = import.meta.env.VITE_OMNI_AI_SERVICE_URL || 'http://localhost:8003';
export const JAVA_API_BASE_URL = import.meta.env.VITE_JAVA_API_URL || 'http://localhost:8082';

export const LLM_MODELS = [
  { value: 'qwen-plus', label: '通义千问 Plus [128k ctx]', provider: 'Alibaba' },
  { value: 'qwen-max', label: '通义千问 Max [128k ctx]', provider: 'Alibaba' },
  { value: 'deepseek-chat', label: 'DeepSeek Chat [128k ctx]', provider: 'DeepSeek' },
  { value: 'deepseek-coder', label: 'DeepSeek Coder [32k ctx]', provider: 'DeepSeek' },
] as const;

export const FILE_TYPES = ['PDF', 'MD', 'TXT', 'JSON', 'CSV', 'XLSX'] as const;

export const MAX_FILE_SIZE = 512 * 1024 * 1024; // 512MB

export const DEFAULT_LLM_CONFIG = {
  model: 'claude-3-opus',
  temperature: 0.85,
  maxTokens: 2048,
  topK: 12,
  similarityThreshold: 0.78,
  reranking: true,
} as const;
