import { useState, useCallback, useEffect } from 'react';
import {
  Save,
  Terminal,
  Code as CodeIcon,
  Cpu,
  Database,
  Info,
  SortAsc,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  X,
  Clock,
  ChevronRight,
  History,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useConfigStore } from '@/stores';
import { configApi } from '@/services/api';
import { LLM_MODELS } from '@/constants';
import type { LLMConfigResponse } from '@/types';

const DEFAULT_SYSTEM_PROMPT = `# CORE IDENTITY DEFINITION
ROLE: You are an expert-level technical analyst operating within the Omni-Agent-OS RAG terminal.
OBJECTIVE: Synthesize retrieved knowledge into precise, zero-fluff, technically accurate responses.

# BEHAVIORAL CONSTRAINTS
- Rely exclusively on the provided context. Do not hallucinate external facts.
- If context is insufficient, abort generation and output: ERR_INSUFFICIENT_DATA.
- Format all structured data as valid JSON or markdown tables.
- Always append citations using the exact {doc_id} reference.

# PIPELINE INJECTION POINTS
<!-- DYNAMIC CONTEXT BLOCK -->
<context>
{retrieved_chunks_formatted}
</context>

<!-- USER INTENT -->
<query>
{sanitized_user_input}
</query>

# EXECUTE
BEGIN_GENERATION:`;

export default function Config() {
  const { llmConfig, systemPrompt, setLlmConfig, setSystemPrompt, setDirty, reset } =
    useConfigStore();
  const [localPrompt, setLocalPrompt] = useState(systemPrompt || DEFAULT_SYSTEM_PROMPT);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [hasChanges, setHasChanges] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [historyList, setHistoryList] = useState<Array<{ version: string; timestamp: string; content: string }>>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // 初始化时从后端加载配置
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const [llmConfigData, systemPromptData] = await Promise.all([
          configApi.getLLM(),
          configApi.getSystemPrompt(),
        ]);
        // 兼容后端返回的 Map 类型
        if (llmConfigData) {
          const config = llmConfigData as LLMConfigResponse;
          setLlmConfig({
            model: (config as Record<string, unknown>).model as string || 'qwen-plus',
            temperature: (config as Record<string, unknown>).temperature as number || 0.85,
            maxTokens: (config as Record<string, unknown>).maxTokens as number || 2048,
            topK: (config as Record<string, unknown>).topK as number || 12,
            similarityThreshold: (config as Record<string, unknown>).similarityThreshold as number || 0.78,
            reranking: (config as Record<string, unknown>).reranking as boolean || true,
          });
        }
        if (systemPromptData?.content) {
          setSystemPrompt(systemPromptData.content);
          setLocalPrompt(systemPromptData.content);
        }
      } catch (error) {
        console.error('Failed to load config:', error);
      }
    };
    loadConfig();
  }, [setLlmConfig, setSystemPrompt]);

  useEffect(() => {
    if (!systemPrompt) {
      setLocalPrompt(DEFAULT_SYSTEM_PROMPT);
    }
  }, [systemPrompt]);

  const handlePromptChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const value = e.target.value;
      setLocalPrompt(value);
      setSystemPrompt(value);
      setHasChanges(value !== DEFAULT_SYSTEM_PROMPT);
    },
    [setSystemPrompt]
  );

  const handleModelChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      setLlmConfig({ model: e.target.value });
      setHasChanges(true);
    },
    [setLlmConfig]
  );

  const handleTemperatureChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = parseFloat(e.target.value) / 100;
      setLlmConfig({ temperature: value });
      setHasChanges(true);
    },
    [setLlmConfig]
  );

  const handleMaxTokensChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = parseInt(e.target.value) * 40.96;
      setLlmConfig({ maxTokens: Math.round(value) });
      setHasChanges(true);
    },
    [setLlmConfig]
  );

  const handleTopKChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = Math.round((parseInt(e.target.value) / 100) * 20);
      setLlmConfig({ topK: Math.max(1, value) });
      setHasChanges(true);
    },
    [setLlmConfig]
  );

  const handleThresholdChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = parseFloat(e.target.value) / 100;
      setLlmConfig({ similarityThreshold: value });
      setHasChanges(true);
    },
    [setLlmConfig]
  );

  const handleRerankingToggle = useCallback(() => {
    setLlmConfig({ reranking: !llmConfig.reranking });
    setHasChanges(true);
  }, [llmConfig.reranking, setLlmConfig]);

  const handleSave = useCallback(async () => {
    setSaveStatus('saving');
    try {
      // 真实 API 调用
      await Promise.all([
        configApi.saveLLM(llmConfig as unknown as Record<string, unknown>),
        configApi.saveSystemPrompt(systemPrompt),
      ]);
      setSaveStatus('saved');
      setDirty(false);
      setHasChanges(false);
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      console.error('Failed to save config:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  }, [llmConfig, systemPrompt, setDirty]);

  const handleReset = useCallback(() => {
    if (confirm('确定要重置所有配置吗？')) {
      reset();
      setLocalPrompt(DEFAULT_SYSTEM_PROMPT);
      setHasChanges(false);
    }
  }, [reset]);

  const handleShowHistory = useCallback(async () => {
    setShowHistory(true);
    setIsLoadingHistory(true);
    try {
      const historyData = await configApi.getSystemPromptHistory();
      setHistoryList(historyData);
    } catch (error) {
      console.error('Failed to load history:', error);
      setHistoryList([]);
    } finally {
      setIsLoadingHistory(false);
    }
  }, []);

  const handleRestoreVersion = useCallback((content: string) => {
    setLocalPrompt(content);
    setSystemPrompt(content);
    setHasChanges(true);
    setShowHistory(false);
  }, [setSystemPrompt]);

  return (
    <div className="h-full flex flex-col p-8 gap-6 overflow-y-auto">
      {/* Header */}
      <div className="glass-panel rounded-lg flex flex-wrap justify-between items-center gap-3 p-4 border-b-2 border-b-primary/50 shrink-0">
        <div className="flex items-center gap-3">
          <Cpu size={32} className="text-primary glow-primary" />
          <h2 className="text-white tracking-widest text-2xl font-bold font-headline uppercase glow-text-primary">
            智能体配置
          </h2>
        </div>
        <div className="flex items-center gap-3">
          {saveStatus === 'saved' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-2 text-secondary"
            >
              <CheckCircle2 size={16} />
              <span className="font-mono text-xs">配置已保存</span>
            </motion.div>
          )}
          {saveStatus === 'error' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-2 text-error"
            >
              <AlertCircle size={16} />
              <span className="font-mono text-xs">保存失败</span>
            </motion.div>
          )}
          <button
            onClick={handleReset}
            className="flex items-center justify-center rounded h-10 px-4 bg-slate-800 border border-slate-600 text-slate-400 hover:bg-slate-700 hover:text-white transition-all text-sm font-bold tracking-[0.1em] uppercase font-headline"
          >
            <RotateCcw size={16} className="mr-2" />
            重置
          </button>
          <button
            onClick={handleSave}
            disabled={!hasChanges || saveStatus === 'saving'}
            className="flex items-center justify-center rounded h-10 px-6 bg-primary/10 border border-primary text-primary hover:bg-primary hover:text-black hover:shadow-[0_0_15px_rgba(6,228,249,0.6)] transition-all text-sm font-bold tracking-[0.1em] uppercase font-headline disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-primary/10 disabled:hover:text-primary disabled:hover:shadow-none"
          >
            <Save size={18} className="mr-2" />
            {saveStatus === 'saving' ? '保存中...' : '保存配置'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* System Prompt */}
        <div className="col-span-1 lg:col-span-8 flex flex-col gap-4">
          <h3 className="text-primary text-sm font-bold tracking-[0.1em] px-2 font-headline flex items-center gap-2 uppercase">
            <Terminal size={16} /> 系统提示词
          </h3>
          <div className="glass-panel rounded-lg flex flex-col min-h-[500px] overflow-hidden border-t-2 border-t-primary/50 relative">
            <div className="flex items-center justify-between px-4 py-3 border-b border-primary/20 bg-black/40 shrink-0">
              <div className="flex items-center gap-3">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50" />
                  <div className="w-2.5 h-2.5 rounded-full bg-secondary/50" />
                </div>
                <div className="h-4 w-[1px] bg-slate-700" />
                <span className="font-mono text-[11px] text-primary/70 tracking-wider">
                  root/config/core_persona.sys
                </span>
              </div>
              <div className="flex items-center gap-2 text-slate-500">
                <span title="历史版本">
                  <History
                    size={16}
                    className="hover:text-primary cursor-pointer"
                    onClick={handleShowHistory}
                  />
                </span>
                <span title="格式化">
                  <CodeIcon
                    size={16}
                    className="hover:text-primary cursor-pointer"
                    onClick={() => {
                      const textarea = document.querySelector('textarea');
                      if (textarea) {
                        const lines = textarea.value.split('\n');
                        const formatted = lines.map((line) => line.trimEnd()).join('\n');
                        textarea.value = formatted;
                        handlePromptChange({ target: textarea } as React.ChangeEvent<HTMLTextAreaElement>);
                      }
                    }}
                  />
                </span>
              </div>
            </div>
            <textarea
              value={localPrompt}
              onChange={handlePromptChange}
              className="flex-1 p-6 font-mono text-[13px] leading-relaxed text-slate-300 bg-black/50 outline-none resize-none"
              spellCheck={false}
              placeholder="输入系统提示词..."
            />
          </div>
        </div>

        {/* Parameters */}
        <div className="col-span-1 lg:col-span-4 flex flex-col gap-6">
          {/* LLM Parameters */}
          <div className="flex flex-col gap-4">
          <h3 className="text-primary text-sm font-bold tracking-[0.1em] px-2 font-headline flex items-center gap-2 uppercase">
            <Cpu size={16} /> 大语言模型参数
          </h3>
            <div className="glass-panel rounded-lg p-5 flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <label className="text-[11px] font-mono text-slate-500 uppercase tracking-widest">
                  当前模型引擎
                </label>
                <select
                  value={llmConfig.model}
                  onChange={handleModelChange}
                  className="w-full bg-black border border-primary/30 text-white text-sm font-mono rounded px-3 py-2.5 focus:outline-none focus:border-primary cursor-pointer"
                >
                  {LLM_MODELS.map((model) => (
                    <option key={model.value} value={model.value}>
                      {model.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-3">
                <div className="flex justify-between items-center">
                  <label className="text-[11px] font-mono text-slate-500 uppercase tracking-widest flex items-center gap-1">
                    Temperature <Info size={12} />
                  </label>
                  <span className="text-purple font-mono text-xs font-bold bg-purple/10 px-2 py-0.5 rounded border border-purple/30">
                    {llmConfig.temperature.toFixed(2)}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={llmConfig.temperature * 100}
                  onChange={handleTemperatureChange}
                  className="w-full accent-purple h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-[10px] font-mono text-slate-600">
                  <span>确定性</span>
                  <span>创造性</span>
                </div>
              </div>

              <div className="flex flex-col gap-3 pt-2 border-t border-white/5">
                <div className="flex justify-between items-center">
                  <label className="text-[11px] font-mono text-slate-500 uppercase tracking-widest">
                    最大输出Token数
                  </label>
                  <span className="text-primary font-mono text-xs font-bold bg-primary/10 px-2 py-0.5 rounded border border-primary/30">
                    {llmConfig.maxTokens}
                  </span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={(llmConfig.maxTokens / 4096) * 100}
                  onChange={handleMaxTokensChange}
                  className="w-full accent-primary h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Vector Retrieval */}
          <div className="flex flex-col gap-4">
          <h3 className="text-primary text-sm font-bold tracking-[0.1em] px-2 font-headline flex items-center gap-2 uppercase">
            <Database size={16} /> 向量检索
          </h3>
            <div className="glass-panel rounded-lg p-5 flex flex-col gap-5">
              <div className="flex flex-col gap-3">
                <div className="flex justify-between items-center">
                  <label className="text-[11px] font-mono text-slate-500 uppercase tracking-widest">
                    Top-K 检索数
                  </label>
                  <span className="text-primary font-mono text-xs font-bold bg-primary/10 px-2 py-0.5 rounded border border-primary/30">
                    {llmConfig.topK}
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={(llmConfig.topK / 20) * 100}
                  onChange={handleTopKChange}
                  className="w-full accent-primary h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              <div className="flex flex-col gap-3 pt-2 border-t border-white/5">
                <div className="flex justify-between items-center">
                  <label className="text-[11px] font-mono text-slate-500 uppercase tracking-widest">
                    相似度阈值
                  </label>
                  <span className="text-secondary font-mono text-xs font-bold bg-secondary/10 px-2 py-0.5 rounded border border-secondary/30">
                    {llmConfig.similarityThreshold.toFixed(2)}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={llmConfig.similarityThreshold * 100}
                  onChange={handleThresholdChange}
                  className="w-full accent-secondary h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              <div
                className="flex justify-between items-center pt-3 border-t border-white/5 cursor-pointer"
                onClick={handleRerankingToggle}
              >
                <label className="text-[11px] font-mono text-slate-500 uppercase tracking-widest flex items-center gap-2 cursor-pointer">
                  <SortAsc size={14} className="text-primary" /> 启用重排序
                </label>
                <div
                  className={`w-10 h-5 rounded-full relative transition-all ${
                    llmConfig.reranking
                      ? 'bg-primary shadow-[0_0_8px_#00E5FF]'
                      : 'bg-primary/20 border border-primary/50'
                  }`}
                >
                  <div
                    className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${
                      llmConfig.reranking ? 'right-1' : 'left-1'
                    }`}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* History Modal */}
      <AnimatePresence>
        {showHistory && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
            onClick={() => setShowHistory(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-panel rounded-lg w-[700px] max-h-[80vh] overflow-hidden border border-primary/30"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-primary/20 bg-black/40">
                <div className="flex items-center gap-3">
                  <Clock size={18} className="text-primary" />
                  <h3 className="text-white font-bold font-headline uppercase tracking-wider">
                    配置历史
                  </h3>
                </div>
                <button
                  onClick={() => setShowHistory(false)}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="p-4 max-h-[60vh] overflow-y-auto">
                {isLoadingHistory ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
                  </div>
                ) : historyList.length > 0 ? (
                  <div className="space-y-3">
                    {historyList.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-md border border-primary/20 bg-black/40 hover:bg-primary/5 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-primary font-mono text-xs">
                            {item.version}
                          </span>
                          <span className="text-slate-500 font-mono text-[10px]">
                            {item.timestamp}
                          </span>
                        </div>
                        <p className="text-slate-400 text-xs font-mono line-clamp-2 mb-3">
                          {item.content.substring(0, 150)}...
                        </p>
                        <button
                          onClick={() => handleRestoreVersion(item.content)}
                          className="flex items-center gap-1.5 text-primary hover:text-secondary text-xs font-mono transition-colors"
                        >
                          <ChevronRight size={12} />
                          恢复此版本
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-slate-500 py-8 font-mono text-sm">
                    暂无历史记录
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
