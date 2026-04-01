export const NAV_ITEMS = [
  { id: 'console', label: '终端', labelEn: 'Terminal', icon: 'terminal' },
  { id: 'ingestion', label: '数据流', labelEn: 'Data Stream', icon: 'database' },
  { id: 'tracker', label: '神经链路', labelEn: 'Neural Link', icon: 'activity' },
  { id: 'config', label: '设置', labelEn: 'Settings', icon: 'settings' },
] as const;

export const HEADER_NAV = [
  { id: 'console', label: 'Console' },
  { id: 'ingestion', label: 'Ingestion' },
  { id: 'tracker', label: 'Holo-State' },
  { id: 'config', label: 'Config' },
] as const;

export const API_BASE_URL = import.meta.env.VITE_OMNI_AI_SERVICE_URL || 'http://localhost:8003';

export const LLM_MODELS = [
  { value: 'claude-3-opus', label: 'Claude 3 Opus [200k ctx]', provider: 'Anthropic' },
  { value: 'gpt-4-turbo', label: 'GPT-4 Turbo [128k ctx]', provider: 'OpenAI' },
  { value: 'mixtral-8x7b', label: 'Mixtral 8x7B [32k ctx]', provider: 'Mistral' },
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
