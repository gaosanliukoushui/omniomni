import axios, { type AxiosInstance } from 'axios';
import type {
  ApiResponse,
  KnowledgeItem,
  KnowledgeStats,
  PipelineItem,
  SystemMetrics,
  LLMConfig,
  SystemPrompt,
  Message,
  TelemetryData,
} from '@/types';
import { API_BASE_URL } from '@/constants';

const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

// ==================== 知识库 API ====================
export const knowledgeApi = {
  list: async (): Promise<KnowledgeItem[]> => {
    const res = await apiClient.get<ApiResponse<KnowledgeItem[]>>('/knowledge');
    return res.data.data;
  },

  upload: async (file: File, onProgress?: (percent: number) => void): Promise<KnowledgeItem> => {
    const formData = new FormData();
    formData.append('file', file);

    const res = await apiClient.post<ApiResponse<KnowledgeItem>>('/knowledge/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total && onProgress) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percent);
        }
      },
    });
    return res.data.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/knowledge/${id}`);
  },

  getStats: async (): Promise<KnowledgeStats> => {
    const res = await apiClient.get<ApiResponse<KnowledgeStats>>('/knowledge/stats');
    return res.data.data;
  },
};

// ==================== 文档处理管道 API ====================
export const pipelineApi = {
  list: async (): Promise<PipelineItem[]> => {
    const res = await apiClient.get<ApiResponse<PipelineItem[]>>('/pipeline');
    return res.data.data;
  },

  getStatus: async (id: string): Promise<PipelineItem> => {
    const res = await apiClient.get<ApiResponse<PipelineItem>>(`/pipeline/${id}`);
    return res.data.data;
  },

  retry: async (id: string): Promise<PipelineItem> => {
    const res = await apiClient.post<ApiResponse<PipelineItem>>(`/pipeline/${id}/retry`);
    return res.data.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/pipeline/${id}`);
  },
};

// ==================== 对话 API ====================
export const chatApi = {
  send: async (message: string, context?: string[]): Promise<Message> => {
    const res = await apiClient.post<ApiResponse<Message>>('/chat', { message, context });
    return res.data.data;
  },

  stream: (message: string, onChunk: (text: string) => void, onEnd: () => void) => {
    return apiClient.post(
      '/chat/stream',
      { message },
      { responseType: 'stream' }
    );
  },

  history: async (limit = 50): Promise<Message[]> => {
    const res = await apiClient.get<ApiResponse<Message[]>>('/chat/history', { params: { limit } });
    return res.data.data;
  },

  clear: async (): Promise<void> => {
    await apiClient.post('/chat/clear');
  },
};

// ==================== 系统状态 API ====================
export const systemApi = {
  metrics: async (): Promise<SystemMetrics> => {
    const res = await apiClient.get<ApiResponse<SystemMetrics>>('/system/metrics');
    return res.data.data;
  },

  telemetry: async (): Promise<TelemetryData> => {
    const res = await apiClient.get<ApiResponse<TelemetryData>>('/system/telemetry');
    return res.data.data;
  },

  health: async (): Promise<boolean> => {
    try {
      const res = await apiClient.get<ApiResponse<{ status: string }>>('/system/health');
      return res.data.data.status === 'ok';
    } catch {
      return false;
    }
  },
};

// ==================== 配置 API ====================
export const configApi = {
  getLLM: async (): Promise<LLMConfig> => {
    const res = await apiClient.get<ApiResponse<LLMConfig>>('/config/llm');
    return res.data.data;
  },

  saveLLM: async (config: LLMConfig): Promise<void> => {
    await apiClient.post('/config/llm', config);
  },

  getSystemPrompt: async (): Promise<SystemPrompt> => {
    const res = await apiClient.get<ApiResponse<SystemPrompt>>('/config/system-prompt');
    return res.data.data;
  },

  saveSystemPrompt: async (prompt: string): Promise<void> => {
    await apiClient.post('/config/system-prompt', { content: prompt });
  },
};

export default apiClient;
