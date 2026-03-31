import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type {
  PageId,
  Message,
  KnowledgeItem,
  PipelineItem,
  SystemMetrics,
  LLMConfig,
  TelemetryData,
} from '@/types';
import { DEFAULT_LLM_CONFIG } from '@/constants';

// ==================== 应用全局状态 ====================
interface AppState {
  currentPage: PageId;
  isLoading: boolean;
  error: string | null;
  setCurrentPage: (page: PageId) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

export const useAppStore = create<AppState>()((set) => ({
  currentPage: 'console',
  isLoading: false,
  error: null,
  setCurrentPage: (page) => set({ currentPage: page }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),
}));

// ==================== 对话状态 ====================
interface ChatState {
  messages: Message[];
  isStreaming: boolean;
  inputValue: string;
  tokenCost: number;
  addMessage: (message: Message) => void;
  setMessages: (messages: Message[]) => void;
  setStreaming: (streaming: boolean) => void;
  setInputValue: (value: string) => void;
  addTokenCost: (cost: number) => void;
  clearMessages: () => void;
}

export const useChatStore = create<ChatState>()((set) => ({
  messages: [],
  isStreaming: false,
  inputValue: '',
  tokenCost: 0,
  addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),
  setMessages: (messages) => set({ messages }),
  setStreaming: (streaming) => set({ isStreaming: streaming }),
  setInputValue: (value) => set({ inputValue: value }),
  addTokenCost: (cost) => set((state) => ({ tokenCost: state.tokenCost + cost })),
  clearMessages: () => set({ messages: [], tokenCost: 0 }),
}));

// ==================== 知识库状态 ====================
interface KnowledgeState {
  items: KnowledgeItem[];
  isLoading: boolean;
  uploadProgress: number;
  setItems: (items: KnowledgeItem[]) => void;
  addItem: (item: KnowledgeItem) => void;
  updateItem: (id: string, updates: Partial<KnowledgeItem>) => void;
  removeItem: (id: string) => void;
  setLoading: (loading: boolean) => void;
  setUploadProgress: (progress: number) => void;
}

export const useKnowledgeStore = create<KnowledgeState>()((set) => ({
  items: [],
  isLoading: false,
  uploadProgress: 0,
  setItems: (items) => set({ items }),
  addItem: (item) => set((state) => ({ items: [...state.items, item] })),
  updateItem: (id, updates) =>
    set((state) => ({
      items: state.items.map((item) => (item.id === id ? { ...item, ...updates } : item)),
    })),
  removeItem: (id) => set((state) => ({ items: state.items.filter((item) => item.id !== id) })),
  setLoading: (loading) => set({ isLoading: loading }),
  setUploadProgress: (progress) => set({ uploadProgress: progress }),
}));

// ==================== 管道状态 ====================
interface PipelineState {
  items: PipelineItem[];
  isLoading: boolean;
  setItems: (items: PipelineItem[]) => void;
  updateItem: (id: string, updates: Partial<PipelineItem>) => void;
  addItem: (item: PipelineItem) => void;
  removeItem: (id: string) => void;
  setLoading: (loading: boolean) => void;
}

export const usePipelineStore = create<PipelineState>()((set) => ({
  items: [],
  isLoading: false,
  setItems: (items) => set({ items }),
  updateItem: (id, updates) =>
    set((state) => ({
      items: state.items.map((item) => (item.id === id ? { ...item, ...updates } : item)),
    })),
  addItem: (item) => set((state) => ({ items: [...state.items, item] })),
  removeItem: (id) => set((state) => ({ items: state.items.filter((item) => item.id !== id) })),
  setLoading: (loading) => set({ isLoading: loading }),
}));

// ==================== 系统状态 ====================
interface SystemState {
  metrics: SystemMetrics | null;
  telemetry: TelemetryData | null;
  isConnected: boolean;
  setMetrics: (metrics: SystemMetrics) => void;
  setTelemetry: (telemetry: TelemetryData) => void;
  setConnected: (connected: boolean) => void;
}

export const useSystemStore = create<SystemState>()((set) => ({
  metrics: null,
  telemetry: null,
  isConnected: true,
  setMetrics: (metrics) => set({ metrics }),
  setTelemetry: (telemetry) => set({ telemetry }),
  setConnected: (connected) => set({ isConnected: connected }),
}));

// ==================== 配置状态 ====================
interface ConfigState {
  llmConfig: LLMConfig;
  systemPrompt: string;
  isDirty: boolean;
  setLlmConfig: (config: Partial<LLMConfig>) => void;
  setSystemPrompt: (prompt: string) => void;
  setDirty: (dirty: boolean) => void;
  reset: () => void;
}

export const useConfigStore = create<ConfigState>()((set) => ({
  llmConfig: DEFAULT_LLM_CONFIG,
  systemPrompt: '',
  isDirty: false,
  setLlmConfig: (config) =>
    set((state) => ({
      llmConfig: { ...state.llmConfig, ...config },
      isDirty: true,
    })),
  setSystemPrompt: (prompt) => set({ systemPrompt: prompt, isDirty: true }),
  setDirty: (dirty) => set({ isDirty: dirty }),
  reset: () => set({ llmConfig: DEFAULT_LLM_CONFIG, isDirty: false }),
}));
