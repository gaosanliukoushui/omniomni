import axios, { type AxiosInstance } from 'axios';
import type {
  ApiResponse,
  KnowledgeItem,
  KnowledgeStats,
  PipelineItem,
  SystemMetrics,
  SystemPrompt,
  TelemetryData,
  Citation,
} from '@/types';
import { API_BASE_URL, JAVA_API_BASE_URL } from '@/constants';

// ==================== AI Service API Client (Python, :8003) ====================
const aiApiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ==================== Java Backend API Client (:8082) ====================
const javaApiClient: AxiosInstance = axios.create({
  baseURL: JAVA_API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 错误拦截器
[aiApiClient, javaApiClient].forEach((client) => {
  client.interceptors.response.use(
    (response) => response,
    (error) => {
      console.error('API Error:', error);
      return Promise.reject(error);
    }
  );
});

// ==================== 知识库 API (Java) ====================
export const knowledgeApi = {
  list: async (): Promise<KnowledgeItem[]> => {
    const res = await javaApiClient.get<ApiResponse<KnowledgeItem[]>>('/api/knowledge');
    return res.data.data || [];
  },

  upload: async (file: File, kbId?: number, onProgress?: (percent: number) => void): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    if (kbId) {
      formData.append('kbId', String(kbId));
    }

    const res = await javaApiClient.post<ApiResponse<string>>('/api/knowledge/upload', formData, {
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
    await javaApiClient.delete(`/api/knowledge/${id}`);
  },

  getStats: async (): Promise<KnowledgeStats> => {
    const res = await javaApiClient.get<ApiResponse<KnowledgeStats>>('/api/knowledge/stats');
    return res.data.data;
  },
};

// ==================== 文档处理管道 API (Java) ====================
export const pipelineApi = {
  list: async (): Promise<PipelineItem[]> => {
    const res = await javaApiClient.get<ApiResponse<PipelineItem[]>>('/api/pipeline');
    return res.data.data || [];
  },

  getStatus: async (id: string): Promise<PipelineItem> => {
    const res = await javaApiClient.get<ApiResponse<PipelineItem>>(`/api/pipeline/${id}`);
    return res.data.data;
  },

  retry: async (id: string): Promise<PipelineItem> => {
    const res = await javaApiClient.post<ApiResponse<PipelineItem>>(`/api/pipeline/${id}/retry`);
    return res.data.data;
  },

  delete: async (id: string): Promise<void> => {
    await javaApiClient.delete(`/api/pipeline/${id}`);
  },
};

// ==================== 对话 API (Python AI Service) ====================
export const chatApi = {
  send: async (query: string, kbId?: string): Promise<{ answer: string; sources: string[] }> => {
    const res = await aiApiClient.post<ApiResponse<{ answer: string; sources: string[] }>>('/api/ai/chat', {
      query,
      kbId,
    });
    return res.data.data;
  },

  streamSend: (query: string, kbId?: string): Promise<Response> => {
    return fetch(`${API_BASE_URL}/api/ai/chat/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, kbId }),
    });
  },
};

// ==================== 系统状态 API (Java) ====================
export const systemApi = {
  metrics: async (): Promise<SystemMetrics> => {
    const res = await javaApiClient.get<ApiResponse<SystemMetrics>>('/api/system/metrics');
    return res.data.data;
  },

  telemetry: async (): Promise<TelemetryData> => {
    const res = await javaApiClient.get<ApiResponse<TelemetryData>>('/api/system/telemetry');
    return res.data.data;
  },

  health: async (): Promise<boolean> => {
    try {
      const res = await javaApiClient.get<ApiResponse<{ status: string }>>('/api/system/health');
      return res.data.data?.status === 'UP';
    } catch {
      return false;
    }
  },
};

// ==================== 配置 API (Java) ====================
export const configApi = {
  getLLM: async (): Promise<Record<string, unknown>> => {
    const res = await javaApiClient.get<ApiResponse<Record<string, unknown>>>('/api/config/llm');
    return res.data.data;
  },

  saveLLM: async (config: Record<string, unknown>): Promise<void> => {
    await javaApiClient.post('/api/config/llm', config);
  },

  getSystemPrompt: async (): Promise<SystemPrompt> => {
    const res = await javaApiClient.get<ApiResponse<{ content: string }>>('/api/config/system-prompt');
    return res.data.data;
  },

  saveSystemPrompt: async (prompt: string): Promise<void> => {
    await javaApiClient.post('/api/config/system-prompt', { content: prompt });
  },

  getSystemPromptHistory: async (): Promise<Array<{ version: string; timestamp: string; content: string }>> => {
    const res = await javaApiClient.get<ApiResponse<Array<{ version: string; timestamp: string; content: string }>>>('/api/config/system-prompt/history');
    return res.data.data || [];
  },
};

// ==================== 对话历史 API (Java) ====================
export interface ChatSession {
  id: string;
  title: string;
  userId?: string;
  kbId?: number;
  messageCount: number;
  createTime?: string;
  updateTime?: string;
}

export interface ChatMessage {
  id: string;
  sessionId: number;
  role: 'user' | 'agent';
  content: string;
  timestamp: string;
  tokens?: number;
  citations?: Citation[];
}

export const chatHistoryApi = {
  // 会话管理
  createSession: async (title?: string, userId?: string, kbId?: number): Promise<ChatSession> => {
    const res = await javaApiClient.post<ApiResponse<ChatSession>>('/api/chat/sessions', {}, {
      params: { title, userId, kbId },
    });
    return res.data.data;
  },

  getSessionList: async (userId?: string, kbId?: number): Promise<ChatSession[]> => {
    const res = await javaApiClient.get<ApiResponse<ChatSession[]>>('/api/chat/sessions', {
      params: { userId, kbId },
    });
    return res.data.data || [];
  },

  getSession: async (id: string): Promise<ChatSession> => {
    const res = await javaApiClient.get<ApiResponse<ChatSession>>(`/api/chat/sessions/${id}`);
    return res.data.data;
  },

  updateSession: async (id: string, title: string): Promise<void> => {
    await javaApiClient.put(`/api/chat/sessions/${id}`, { title });
  },

  deleteSession: async (id: string): Promise<void> => {
    await javaApiClient.delete(`/api/chat/sessions/${id}`);
  },

  searchSessions: async (keyword: string, userId?: string): Promise<ChatSession[]> => {
    const res = await javaApiClient.get<ApiResponse<ChatSession[]>>('/api/chat/sessions/search', {
      params: { keyword, userId },
    });
    return res.data.data || [];
  },

  // 消息管理
  getMessages: async (sessionId: string): Promise<ChatMessage[]> => {
    const res = await javaApiClient.get<ApiResponse<ChatMessage[]>>(`/api/chat/sessions/${sessionId}/messages`);
    return res.data.data || [];
  },

  saveMessage: async (sessionId: string, message: Omit<ChatMessage, 'id' | 'sessionId'>): Promise<ChatMessage> => {
    const res = await javaApiClient.post<ApiResponse<ChatMessage>>(`/api/chat/sessions/${sessionId}/messages`, message);
    return res.data.data;
  },

  deleteMessage: async (id: string): Promise<void> => {
    await javaApiClient.delete(`/api/chat/messages/${id}`);
  },

  saveMessages: async (sessionId: string, messages: Omit<ChatMessage, 'id' | 'sessionId'>[]): Promise<void> => {
    await javaApiClient.post(`/api/chat/sessions/${sessionId}/messages/batch`, messages);
  },
};

export default { knowledgeApi, pipelineApi, chatApi, systemApi, configApi, chatHistoryApi };
