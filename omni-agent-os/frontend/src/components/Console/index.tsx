import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Search,
  Filter,
  Send,
  Paperclip,
  History,
  Database,
  Loader2,
  X,
  FileText,
  Copy,
  Plus,
  Trash2,
  MessageSquare,
  Save,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useChatStore, useChatHistoryStore } from '@/stores';
import { chatApi, knowledgeApi, chatHistoryApi } from '@/services/api';
import type { Message, KnowledgeItem, Citation } from '@/types';

const INITIAL_MESSAGES: Message[] = [
  {
    id: '1',
    role: 'agent',
    content:
      '终端已初始化。知识库已验证（3个活跃源）。请问今天有什么可以帮助您的？',
    timestamp: '14:02:11',
  },
];

export default function Console() {
  const {
    messages,
    isStreaming,
    inputValue,
    tokenCost,
    currentSessionId,
    setInputValue,
    addMessage,
    setStreaming,
    clearMessages,
    setCurrentSessionId,
  } = useChatStore();
  const {
    sessions,
    isLoading: isLoadingHistory,
    setSessions,
    addSession,
    updateSession,
    removeSession,
    setLoading: setLoadingHistory,
  } = useChatHistoryStore();
  const [selectedDoc, setSelectedDoc] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [knowledgeItems, setKnowledgeItems] = useState<KnowledgeItem[]>([]);
  const [selectedCitation, setSelectedCitation] = useState<Citation | null>(null);
  const [activeMessageId, setActiveMessageId] = useState<string | null>(null);
  const [citationFilter, setCitationFilter] = useState<string | null>(null);
  const [showSessionHistory, setShowSessionHistory] = useState(false);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [newSessionTitle, setNewSessionTitle] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 初始化消息（防止 StrictMode 重复执行）
  useEffect(() => {
    if (messages.length === 0) {
      clearMessages();
      INITIAL_MESSAGES.forEach((msg) => addMessage(msg));
    }
  }, []);

  // 加载会话历史列表
  useEffect(() => {
    const loadSessions = async () => {
      setLoadingHistory(true);
      try {
        const sessionList = await chatHistoryApi.getSessionList();
        setSessions(sessionList.map(s => ({
          id: String(s.id),
          title: s.title,
          messageCount: s.messageCount,
          createTime: s.createTime,
          updateTime: s.updateTime,
        })));
      } catch (error) {
        console.error('Failed to load sessions:', error);
      } finally {
        setLoadingHistory(false);
      }
    };
    loadSessions();
  }, [setSessions, setLoadingHistory]);

  // 创建新会话
  const handleCreateSession = useCallback(async () => {
    const title = newSessionTitle.trim() || `对话 ${new Date().toLocaleString('zh-CN')}`;
    try {
      const session = await chatHistoryApi.createSession(title);
      addSession({
        id: String(session.id),
        title: session.title,
        messageCount: 0,
        createTime: session.createTime,
        updateTime: session.updateTime,
      });
      // 切换到新会话
      setCurrentSessionId(String(session.id));
      clearMessages();
      INITIAL_MESSAGES.forEach((msg) => addMessage(msg));
      setShowSessionModal(false);
      setNewSessionTitle('');
    } catch (error) {
      console.error('Failed to create session:', error);
    }
  }, [newSessionTitle, addSession, setCurrentSessionId, clearMessages, addMessage]);

  // 加载会话消息
  const handleLoadSession = useCallback(async (sessionId: string) => {
    setLoadingHistory(true);
    try {
      const sessionMessages = await chatHistoryApi.getMessages(sessionId);
      setCurrentSessionId(sessionId);
      clearMessages();
      if (sessionMessages.length === 0) {
        INITIAL_MESSAGES.forEach((msg) => addMessage(msg));
      } else {
        sessionMessages.forEach((msg) => {
          addMessage({
            id: msg.id,
            role: msg.role as 'user' | 'agent',
            content: msg.content,
            timestamp: msg.timestamp,
            tokens: msg.tokens,
            citations: msg.citations,
          });
        });
      }
      setShowSessionHistory(false);
    } catch (error) {
      console.error('Failed to load session messages:', error);
      // 加载失败时仍显示初始消息
      clearMessages();
      INITIAL_MESSAGES.forEach((msg) => addMessage(msg));
    } finally {
      setLoadingHistory(false);
    }
  }, [setCurrentSessionId, clearMessages, addMessage, setLoadingHistory]);

  // 保存当前会话
  const handleSaveSession = useCallback(async () => {
    if (currentSessionId && messages.length > 1) {
      try {
        const messagesToSave = messages.slice(1).map((msg) => ({
          role: msg.role,
          content: msg.content,
          timestamp: msg.timestamp,
          tokens: msg.tokens,
          citations: msg.citations,
        }));
        await chatHistoryApi.saveMessages(currentSessionId, messagesToSave as any);
        // 更新会话列表中的消息数
        updateSession(currentSessionId, { messageCount: messagesToSave.length });
      } catch (error) {
        console.error('Failed to save session:', error);
      }
    }
  }, [currentSessionId, messages, updateSession]);

  // 删除会话
  const handleDeleteSession = useCallback(async (sessionId: string) => {
    if (confirm('确定要删除此会话吗？')) {
      try {
        await chatHistoryApi.deleteSession(sessionId);
        removeSession(sessionId);
        // 如果删除的是当前会话，切换到新会话
        if (currentSessionId === sessionId) {
          clearMessages();
          INITIAL_MESSAGES.forEach((msg) => addMessage(msg));
          setCurrentSessionId(null);
        }
      } catch (error) {
        console.error('Failed to delete session:', error);
      }
    }
  }, [currentSessionId, removeSession, clearMessages, addMessage, setCurrentSessionId]);

  // 自动保存会话（定期保存）
  useEffect(() => {
    if (!currentSessionId || messages.length <= 1) return;
    const saveInterval = setInterval(() => {
      handleSaveSession();
    }, 30000); // 每30秒自动保存
    return () => clearInterval(saveInterval);
  }, [currentSessionId, messages, handleSaveSession]);

  // 离开页面时保存
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (currentSessionId && messages.length > 1) {
        handleSaveSession();
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [currentSessionId, messages, handleSaveSession]);

  // 加载知识库列表
  useEffect(() => {
    const loadKnowledge = async () => {
      try {
        const list = await knowledgeApi.list();
        setKnowledgeItems(list);
      } catch (error) {
        console.error('Failed to load knowledge:', error);
      }
    };
    loadKnowledge();
    // 定时刷新
    const interval = setInterval(loadKnowledge, 10000);
    return () => clearInterval(interval);
  }, []);

  // Auto-scroll to bottom (only if user is near bottom)
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 150;

    if (isNearBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [messages]);

  // Manual scroll function for citation detail
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  };

  const handleSendMessage = useCallback(async () => {
    if (!inputValue.trim() || isStreaming) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
    };
    addMessage(userMessage);
    const currentInput = inputValue;
    setInputValue('');
    setIsLoading(true);
    setStreaming(true);

    try {
      const response = await chatApi.streamSend(currentInput, selectedDoc || undefined);

      if (!response.ok || !response.body) {
        throw new Error(`HTTP ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      const agentMessageId = (Date.now() + 1).toString();
      let agentMessageAdded = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        for (const line of chunk.split('\n')) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data: ')) continue;
          const data = trimmed.slice(6);
          if (data === '[DONE]') break;

          try {
            const parsed = JSON.parse(data);
            if (parsed.answer !== undefined) {
              if (!agentMessageAdded) {
                const citations: Citation[] = (parsed.citations || []).map((c: Citation) => ({
                  docId: c.docId || '未知',
                  docName: c.docName || '未知',
                  chunkId: c.chunkId || '',
                  score: typeof c.score === 'number' ? c.score : 0,
                  preview: c.preview || '',
                  pageNumber: c.pageNumber,
                }));
                const newMsg: Message = {
                  id: agentMessageId,
                  role: 'agent',
                  content: parsed.answer,
                  timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
                  citations,
                };
                addMessage(newMsg);
                agentMessageAdded = true;
              } else {
                // 后续更新消息内容
                useChatStore.setState((state) => ({
                  messages: state.messages.map((m) =>
                    m.id === agentMessageId ? { ...m, content: parsed.answer } : m
                  ),
                }));
              }
            }
          } catch {
            // ignore parse errors for partial chunks
          }
        }
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      const agentMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'agent',
        content: `Request failed: ${errorMsg}`,
        timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
      };
      addMessage(agentMessage);
    } finally {
      setIsLoading(false);
      setStreaming(false);
    }
  }, [inputValue, isStreaming, selectedDoc, addMessage, setInputValue, setStreaming]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFileUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,.md,.txt,.json,.csv';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        try {
          addMessage({
            id: Date.now().toString(),
            role: 'user',
            content: `[Uploaded file: ${file.name}]`,
            timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
          });
          const docId = await knowledgeApi.upload(file, 1);
          // 添加到知识库列表
          setKnowledgeItems((prev) => [
            {
              id: docId,
              name: file.name,
              chunks: 0,
              simIdx: 0,
              status: 'processing',
            },
            ...prev,
          ]);
        } catch (error) {
          console.error('Upload failed:', error);
          addMessage({
            id: (Date.now() + 1).toString(),
            role: 'agent',
            content: `Upload failed: ${(error as Error).message}`,
            timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
          });
        }
      }
    };
    input.click();
  };

  return (
        <div className="h-full grid grid-cols-10 gap-px bg-primary/10 overflow-hidden">
      {/* 会话历史侧边栏 */}
      <AnimatePresence>
        {showSessionHistory && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="col-span-3 flex flex-col bg-background border-r border-primary/10"
          >
            <div className="p-4 border-b border-primary/10 flex justify-between items-center bg-black/20">
              <h3 className="font-headline text-xs font-bold tracking-widest text-primary uppercase flex items-center gap-2">
                <History size={14} /> 历史会话
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCreateSession}
                  className="text-primary/50 hover:text-primary transition-colors"
                  title="新建会话"
                >
                  <Plus size={14} />
                </button>
                <button
                  onClick={() => setShowSessionHistory(false)}
                  className="text-primary/50 hover:text-primary transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-2 scrollbar-thin">
              {isLoadingHistory ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 size={20} className="text-primary animate-spin" />
                </div>
              ) : sessions.length > 0 ? (
                sessions.map((session) => (
                  <div
                    key={session.id}
                    className={`p-3 transition-colors cursor-pointer group border ${
                      currentSessionId === session.id
                        ? 'bg-primary/10 border-primary/30'
                        : 'bg-slate-900/50 border-transparent hover:bg-primary/5 hover:border-primary/20'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className="font-mono text-[10px] text-slate-300 group-hover:text-primary truncate flex-1"
                        title={session.title}
                      >
                        {session.title}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteSession(session.id);
                        }}
                        className="text-slate-500 hover:text-error transition-colors opacity-0 group-hover:opacity-100"
                        title="删除会话"
                      >
                        <Trash2 size={10} />
                      </button>
                    </div>
                    <div className="flex items-center gap-2 font-mono text-[9px] text-slate-500">
                      <MessageSquare size={8} />
                      <span>{session.messageCount} 条消息</span>
                    </div>
                    <div className="mt-1 font-mono text-[8px] text-slate-600">
                      {session.updateTime ? new Date(session.updateTime).toLocaleString('zh-CN', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      }) : ''}
                    </div>
                    <button
                      onClick={() => handleLoadSession(session.id)}
                      className="mt-2 w-full py-1 text-[9px] font-mono text-primary/60 hover:text-primary border border-primary/20 hover:border-primary/40 transition-colors"
                    >
                      加载此会话
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-center text-slate-500 font-mono text-xs py-8">
                  暂无历史会话
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Knowledge Index */}
      <section className="col-span-2 flex flex-col bg-background border-r border-primary/10">
        <div className="p-4 border-b border-primary/10 flex justify-between items-center bg-black/20">
          <h3 className="font-headline text-xs font-bold tracking-widest text-primary uppercase">
            知识索引
          </h3>
          <button className="text-primary/50 hover:text-primary transition-colors">
            <Filter size={14} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-2 scrollbar-thin">
          {knowledgeItems.map((item) => (
            <div
              key={item.id}
              onClick={() => setSelectedDoc(selectedDoc === item.id ? null : item.id)}
              className={`p-3 transition-colors cursor-pointer group border ${
                item.status === 'processing'
                  ? 'bg-primary/5 border-dashed border-primary/20 opacity-60'
                  : 'bg-slate-900/50 border-transparent hover:bg-primary/5 hover:border-primary/20'
              } ${selectedDoc === item.id ? 'border-primary/30 bg-primary/5' : ''}`}
            >
              <div className="flex items-center justify-between mb-1">
                <span
                  className={`font-mono text-[10px] ${
                    item.status === 'processing' ? 'text-slate-500' : 'text-slate-300 group-hover:text-primary'
                  }`}
                >
                  {item.name}
                </span>
                {item.status === 'active' && (
                  <div className="w-1.5 h-1.5 rounded-full bg-secondary shadow-[0_0_5px_#00ffa3]" />
                )}
                {item.status === 'processing' && (
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}>
                    <History size={10} className="text-primary" />
                  </motion.div>
                )}
              </div>
              <div className="flex items-center gap-3 font-mono text-[9px] text-slate-500">
                <span>CHUNKS: {item.chunks.toLocaleString()}</span>
                {item.simIdx > 0 && <span>SIM_IDX: {item.simIdx}</span>}
              </div>
              {item.status === 'processing' && (
                <div className="w-full bg-slate-800 h-0.5 mt-2 overflow-hidden">
                  <motion.div
                    initial={{ x: '-100%' }}
                    animate={{ x: '0%' }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="bg-primary w-2/3 h-full"
                  />
                </div>
              )}
            </div>
          ))}
          {knowledgeItems.length === 0 && (
            <div className="text-center text-slate-500 font-mono text-xs py-4">
              暂无已索引的文档
            </div>
          )}
        </div>
        <div className="p-4 bg-black/40 border-t border-primary/10">
          <button
            onClick={handleFileUpload}
            className="w-full py-2 border border-primary/30 text-primary font-mono text-[10px] flex items-center justify-center gap-2 hover:bg-primary/10 transition-all uppercase"
          >
            <Search size={12} /> 索引新文档
          </button>
        </div>
      </section>

      {/* Terminal Chat */}
      <section className="col-span-5 flex flex-col bg-background relative overflow-hidden min-h-0">
        <div className="h-12 border-b border-primary/10 flex items-center px-6 justify-between bg-black/20 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-secondary rounded-full shadow-[0_0_5px_#00ffa3]" />
            <span className="font-mono text-[10px] tracking-widest text-secondary uppercase">
              智能体活跃 // RAG模式已启用
            </span>
          </div>
          <div className="flex items-center gap-4 font-mono text-[10px] text-slate-500">
            {/* 会话保存按钮 */}
            {currentSessionId && messages.length > 1 && (
              <button
                onClick={handleSaveSession}
                className="flex items-center gap-1 text-primary/60 hover:text-primary transition-colors"
                title="保存当前会话"
              >
                <Save size={12} />
                <span>保存</span>
              </button>
            )}
            <span>TOKEN_COST: {tokenCost.toFixed(4)}</span>
            <span>TEMP: 0.7</span>
          </div>
        </div>

        <div
          ref={scrollContainerRef}
          className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-8 space-y-8 scrollbar-thin"
        >
          <AnimatePresence>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={`flex flex-col gap-2 max-w-[90%] ${msg.role === 'user' ? 'items-end ml-auto' : 'items-start'}`}
              >
                <div className={`flex items-center gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <span
                    className={`font-mono text-[10px] px-2 py-0.5 ${
                      msg.role === 'agent' ? 'text-primary bg-primary/10' : 'text-secondary bg-secondary/10'
                    }`}
                  >
                    {msg.role === 'agent' ? 'OMNI智能体' : '用户'}
                  </span>
                  <span className="font-mono text-[8px] text-slate-500">{msg.timestamp}</span>
                  {msg.tokens && <span className="font-mono text-[8px] text-slate-600">[{msg.tokens} tokens]</span>}
                </div>
                <div
                  className={`p-4 text-sm leading-relaxed glass-panel border-l-2 ${
                    msg.role === 'agent' ? 'border-l-primary' : 'border-l-secondary bg-slate-800/40'
                  }`}
                >
                  {msg.content.split('\n').map((line, i) => (
                    <p key={i} className={i > 0 ? 'mt-2' : ''}>
                      {line}
                    </p>
                  ))}
                  {msg.role === 'agent' && msg.citations && msg.citations.length > 0 && (
                    <div className="mt-4 border-t border-primary/10 pt-3 space-y-2">
                      <div className="flex items-center gap-2 font-mono text-[9px] text-slate-500">
                        <Search size={10} /> RAG检索完成（找到 {msg.citations.length} 个匹配）
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {msg.citations.map((citation, idx) => (
                          <button
                            key={idx}
                            onClick={() => {
                              setSelectedCitation(citation);
                              setActiveMessageId(msg.id);
                            }}
                            className={`flex items-center gap-1.5 px-2 py-1 bg-primary/10 hover:bg-primary/20 border rounded text-[10px] font-mono transition-all group ${
                              activeMessageId === msg.id && selectedCitation?.chunkId === citation.chunkId
                                ? 'border-secondary/50 bg-secondary/10'
                                : 'border-primary/30 hover:border-primary/50'
                            }`}
                          >
                            <Database size={10} className="text-secondary" />
                            <span className="text-slate-300 group-hover:text-white truncate max-w-[120px]">
                              {citation.docName.length > 15 ? citation.docName.slice(0, 15) + '...' : citation.docName}
                            </span>
                            <span className="text-secondary/70">
                              {Math.round(citation.score * 100)}%
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {isLoading && (
            <div className="flex items-center gap-3 text-primary">
              <Loader2 size={16} className="animate-spin" />
              <span className="font-mono text-sm text-primary/60">正在处理查询...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <div className="p-6 bg-black/40 border-t border-primary/10 shrink-0">
          <div className="relative group">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <span className="font-mono text-primary group-focus-within:glow-text-primary">&gt;</span>
            </div>
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isStreaming}
              className="w-full bg-slate-900/50 border-b border-primary/30 text-slate-200 font-mono text-sm pl-10 pr-12 py-4 focus:ring-0 focus:border-primary transition-all placeholder:text-slate-600 disabled:opacity-50"
              placeholder="在此输入问题或命令..."
            />
            <button
              onClick={handleSendMessage}
              disabled={isStreaming || !inputValue.trim()}
              className="absolute inset-y-0 right-4 flex items-center text-primary hover:text-secondary transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <Send size={18} />
            </button>
          </div>
          <div className="mt-3 flex gap-4">
            <button
              onClick={handleFileUpload}
              className="flex items-center gap-1.5 px-2 py-1 bg-slate-800/50 border border-primary/10 hover:bg-primary/10 transition-colors"
            >
              <Paperclip size={10} className="text-slate-500" />
              <span className="font-mono text-[9px] text-slate-500 uppercase">上传上下文</span>
            </button>
            <button
              onClick={() => setShowSessionHistory(!showSessionHistory)}
              className={`flex items-center gap-1.5 px-2 py-1 border transition-colors ${
                showSessionHistory
                  ? 'bg-primary/20 border-primary/40 text-primary'
                  : 'bg-slate-800/50 border-primary/10 text-slate-500 hover:bg-primary/10'
              }`}
            >
              <History size={10} className={showSessionHistory ? 'text-primary' : ''} />
              <span className="font-mono text-[9px] uppercase">会话历史</span>
            </button>
            <button
              onClick={() => {
                clearMessages();
                INITIAL_MESSAGES.forEach((msg) => addMessage(msg));
                setCurrentSessionId(null);
              }}
              className="flex items-center gap-1.5 px-2 py-1 bg-slate-800/50 border border-primary/10 hover:bg-primary/10 transition-colors"
            >
              <Plus size={10} className="text-slate-500" />
              <span className="font-mono text-[9px] text-slate-500 uppercase">新建会话</span>
            </button>
          </div>
        </div>
      </section>

      {/* Trace & State */}
      <section className="col-span-3 flex flex-col bg-background border-l border-primary/10 overflow-hidden">
        <div className="h-1/2 flex flex-col border-b border-primary/10">
          <div className="p-4 bg-black/20 flex justify-between items-center shrink-0">
          <h3 className="font-headline text-xs font-bold tracking-widest text-primary uppercase">
            状态机追踪
          </h3>
          <span className="font-mono text-[9px] text-secondary uppercase">实时流程</span>
          </div>
          <div className="flex-1 flex items-center justify-center p-6 bg-black/40 relative overflow-hidden">
            <div
              className="absolute inset-0 opacity-5 pointer-events-none"
              style={{ backgroundImage: 'radial-gradient(circle, #00E5FF 1px, transparent 1px)', backgroundSize: '20px 20px' }}
            />
            <svg viewBox="0 0 400 300" className="w-full h-full drop-shadow-2xl">
              <path d="M 50 150 L 150 70 L 250 150 L 150 230 Z" fill="none" stroke="rgba(0, 229, 255, 0.1)" strokeWidth="1" />
              <path d="M 50 150 L 150 70" fill="none" stroke="rgba(0, 229, 255, 0.4)" strokeWidth="2" className="animate-flow" />
              <path
                d="M 150 70 L 250 150"
                fill="none"
                stroke="rgba(0, 255, 163, 0.4)"
                strokeWidth="2"
                className="animate-flow"
                style={{ animationDelay: '0.5s' }}
              />

              <g transform="translate(50, 150)">
                <rect x="-15" y="-15" width="30" height="30" className="fill-slate-900 stroke-primary/50" />
                <text y="30" textAnchor="middle" className="fill-primary font-mono text-[10px]">INGEST</text>
                <circle r="3" className="fill-secondary" />
              </g>
              <g transform="translate(150, 70)">
                <rect x="-15" y="-15" width="30" height="30" className="fill-slate-900 stroke-primary/50" />
                <text y="-25" textAnchor="middle" className="fill-primary font-mono text-[10px]">EMBED</text>
                <circle r="3" className="fill-secondary" />
              </g>
              <g transform="translate(250, 150)">
                <rect x="-15" y="-15" width="30" height="30" className="fill-primary stroke-primary" />
                <text y="30" textAnchor="middle" className="fill-primary font-mono text-[10px] font-bold">RETRIEVE</text>
                <circle r="4" className="fill-white" />
              </g>
              <g transform="translate(150, 230)">
                <rect x="-15" y="-15" width="30" height="30" className="fill-slate-900 stroke-primary/50" />
                <text y="30" textAnchor="middle" className="fill-primary font-mono text-[10px]">SYNTHESIZE</text>
              </g>
            </svg>
          </div>
        </div>

        <div className="h-1/2 flex flex-col overflow-hidden">
          <div className="p-4 bg-black/20 flex justify-between items-center border-b border-primary/10 shrink-0">
            <h3 className="font-headline text-xs font-bold tracking-widest text-primary uppercase">来源引用</h3>
            <div className="flex items-center gap-2">
              {/* 文档过滤下拉 */}
              <select
                value={citationFilter || ''}
                onChange={(e) => setCitationFilter(e.target.value || null)}
                className="bg-slate-900/50 border border-primary/20 text-[9px] font-mono text-slate-400 px-2 py-1 rounded"
              >
                <option value="">全部文档</option>
                {Array.from(new Set(
                  (activeMessageId
                    ? messages.find(m => m.id === activeMessageId)
                    : messages.filter(m => m.role === 'agent' && m.citations?.length).at(-1)
                  )?.citations?.map(c => c.docId) || []
                )).map(docId => {
                  const citation = (activeMessageId
                    ? messages.find(m => m.id === activeMessageId)
                    : messages.filter(m => m.role === 'agent' && m.citations?.length).at(-1)
                  )?.citations?.find(c => c.docId === docId);
                  return citation ? (
                    <option key={docId} value={docId}>{citation.docName}</option>
                  ) : null;
                })}
              </select>
              <span className="font-mono text-[9px] text-slate-500 uppercase">
                匹配数: {(activeMessageId ? messages.find(m => m.id === activeMessageId) : messages.filter(m => m.role === 'agent' && m.citations?.length).at(-1))?.citations?.length ?? 0}
              </span>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
            {(() => {
              const activeMsg = activeMessageId
                ? messages.find(m => m.id === activeMessageId)
                : messages.filter(m => m.role === 'agent' && m.citations?.length).at(-1);
              const citations = activeMsg?.citations || [];
              const filteredCitations = citationFilter
                ? citations.filter(c => c.docId === citationFilter)
                : citations;

              return filteredCitations.length > 0 ? filteredCitations.map((citation, idx) => (
                <div
                  key={`${citation.chunkId}-${idx}`}
                  className={`glass-panel p-3 border-l-2 cursor-pointer transition-all hover:bg-primary/5 ${
                    selectedCitation?.chunkId === citation.chunkId ? 'border-l-secondary bg-secondary/5' : 'border-l-secondary'
                  }`}
                  onClick={() => {
                    setSelectedCitation(citation);
                    setActiveMessageId(activeMsg!.id);
                  }}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <Database size={12} className="text-secondary" />
                      <span className="font-mono text-[10px] text-slate-200">{citation.docName}</span>
                      {citation.pageNumber && citation.pageNumber > 0 && (
                        <span className="text-[8px] text-primary/50">P{citation.pageNumber}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {/* 相似度指示条 */}
                      <div className="w-12 h-1 bg-slate-700 rounded overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-secondary to-primary"
                          style={{ width: `${Math.round(citation.score * 100)}%` }}
                        />
                      </div>
                      <span className="font-mono text-[10px] bg-secondary/20 text-secondary px-1.5">
                        {Math.round(citation.score * 100)}%
                      </span>
                    </div>
                  </div>
                  <p className="text-[11px] leading-relaxed text-slate-400 font-mono mb-2 italic line-clamp-2">
                    &quot;{citation.preview}&quot;
                  </p>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="text-[8px] font-mono text-slate-500">{citation.chunkId}</span>
                      <span className="text-[8px] font-mono text-slate-600">#{idx + 1}</span>
                    </div>
                    <button
                      className="text-[9px] font-mono text-primary hover:text-secondary transition-colors uppercase flex items-center gap-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedCitation(citation);
                        setActiveMessageId(activeMsg!.id);
                      }}
                    >
                      查看详情 <FileText size={10} />
                    </button>
                  </div>
                </div>
              )) : citations.length > 0 ? (
                <div className="text-center text-slate-500 font-mono text-xs py-4">
                  筛选结果为空
                </div>
              ) : (
                <div className="text-center text-slate-500 font-mono text-xs py-8">
                  暂无引用可用
                </div>
              );
            })()}

            <div className="mt-4 p-4 border border-primary/20 bg-black/40 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full border-2 border-primary/20 flex items-center justify-center relative">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                  className="absolute inset-0 rounded-full border-2 border-primary border-t-transparent"
                />
                <span className="font-mono text-[10px] text-primary">
                  {Math.round((tokenCost / 10) * 100) || 82}%
                </span>
              </div>
              <div>
                <p className="font-headline text-[10px] font-bold text-primary uppercase">上下文密度</p>
                <p className="font-mono text-[8px] text-slate-500">最优检索参数已激活</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Citation Detail Modal */}
      <AnimatePresence>
        {selectedCitation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
            onClick={() => setSelectedCitation(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-panel rounded-lg w-[650px] max-h-[85vh] overflow-hidden border border-secondary/30"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-secondary/20 bg-black/40">
                <div className="flex items-center gap-3">
                  <FileText size={18} className="text-secondary" />
                  <h3 className="text-white font-bold font-headline uppercase tracking-wider">
                    来源引用详情
                  </h3>
                </div>
                <div className="flex items-center gap-3">
                  {/* 快速复制按钮 */}
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(selectedCitation.preview);
                    }}
                    className="text-slate-400 hover:text-white transition-colors p-1.5 hover:bg-primary/10 rounded"
                    title="复制原文"
                  >
                    <Copy size={16} />
                  </button>
                  {/* 回到最新 */}
                  <button
                    onClick={scrollToBottom}
                    className="text-slate-400 hover:text-white transition-colors p-1.5 hover:bg-primary/10 rounded"
                    title="回到最新消息"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 5v14M19 12l-7 7-7-7"/>
                    </svg>
                  </button>
                  <button
                    onClick={() => setSelectedCitation(null)}
                    className="text-slate-400 hover:text-white transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>
              <div className="p-6 max-h-[65vh] overflow-y-auto space-y-4">
                {/* 元数据网格 */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 rounded bg-black/40 border border-secondary/20">
                    <p className="text-[9px] font-mono text-slate-500 uppercase mb-1">文档名称</p>
                    <p className="text-xs text-white font-mono truncate" title={selectedCitation.docName}>
                      {selectedCitation.docName}
                    </p>
                  </div>
                  <div className="p-3 rounded bg-black/40 border border-secondary/20">
                    <p className="text-[9px] font-mono text-slate-500 uppercase mb-1">文档 ID</p>
                    <p className="text-xs text-secondary font-mono truncate" title={selectedCitation.docId}>
                      {selectedCitation.docId.slice(0, 16)}...
                    </p>
                  </div>
                  <div className="p-3 rounded bg-black/40 border border-secondary/20">
                    <p className="text-[9px] font-mono text-slate-500 uppercase mb-1">切片 ID</p>
                    <p className="text-xs text-white font-mono truncate">
                      {selectedCitation.chunkId.split('_').pop()}
                    </p>
                  </div>
                </div>

                {/* 相似度可视化 */}
                <div className="p-4 rounded bg-black/40 border border-secondary/20">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[9px] font-mono text-slate-500 uppercase">相似度评分</p>
                    <span className="font-mono text-sm text-secondary font-bold">
                      {(selectedCitation.score * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${selectedCitation.score * 100}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                      className="h-full bg-gradient-to-r from-primary via-secondary to-primary"
                    />
                  </div>
                  <div className="flex justify-between mt-1 text-[8px] font-mono text-slate-600">
                    <span>低相关</span>
                    <span>中相关</span>
                    <span>高相关</span>
                  </div>
                </div>

                {/* 页码信息 */}
                {selectedCitation.pageNumber && selectedCitation.pageNumber > 0 && (
                  <div className="p-3 rounded bg-black/40 border border-secondary/20 flex items-center gap-3">
                    <span className="text-[9px] font-mono text-slate-500 uppercase">来源页码</span>
                    <span className="font-mono text-sm text-primary font-bold">
                      第 {selectedCitation.pageNumber} 页
                    </span>
                  </div>
                )}

                {/* 内容预览 */}
                <div className="p-4 rounded bg-black/40 border border-secondary/20">
                  <p className="text-[9px] font-mono text-slate-500 uppercase mb-3">原文内容</p>
                  <p className="text-sm text-slate-300 font-mono leading-relaxed">
                    &quot;{selectedCitation.preview}&quot;
                  </p>
                </div>

                {/* 完整 Chunk ID */}
                <div className="p-3 rounded bg-black/20 border border-secondary/10">
                  <p className="text-[9px] font-mono text-slate-600 uppercase mb-1">完整切片标识</p>
                  <p className="text-[10px] text-slate-500 font-mono break-all">
                    {selectedCitation.chunkId}
                  </p>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(JSON.stringify(selectedCitation, null, 2));
                    }}
                    className="flex-1 py-2.5 bg-slate-800/50 border border-slate-600 text-slate-400 font-mono text-xs uppercase hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
                  >
                    <Copy size={12} /> 复制 JSON
                  </button>
                  <button
                    onClick={() => setSelectedCitation(null)}
                    className="flex-1 py-2.5 bg-primary/10 border border-primary/30 text-primary font-mono text-xs uppercase hover:bg-primary/20 transition-colors"
                  >
                    关闭
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* New Session Modal */}
      <AnimatePresence>
        {showSessionModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
            onClick={() => setShowSessionModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-panel rounded-lg w-[450px] overflow-hidden border border-primary/30"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-primary/20 bg-black/40">
                <div className="flex items-center gap-3">
                  <Plus size={18} className="text-primary" />
                  <h3 className="text-white font-bold font-headline uppercase tracking-wider">
                    新建会话
                  </h3>
                </div>
                <button
                  onClick={() => setShowSessionModal(false)}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-[11px] font-mono text-slate-500 uppercase tracking-widest mb-2">
                    会话标题（可选）
                  </label>
                  <input
                    type="text"
                    value={newSessionTitle}
                    onChange={(e) => setNewSessionTitle(e.target.value)}
                    placeholder="输入会话标题..."
                    className="w-full bg-slate-900/50 border border-primary/30 text-white font-mono text-sm px-4 py-3 focus:outline-none focus:border-primary transition-all"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleCreateSession();
                      }
                    }}
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setShowSessionModal(false)}
                    className="flex-1 py-2.5 bg-slate-800/50 border border-slate-600 text-slate-400 font-mono text-xs uppercase hover:bg-slate-800 transition-colors"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleCreateSession}
                    className="flex-1 py-2.5 bg-primary/10 border border-primary/30 text-primary font-mono text-xs uppercase hover:bg-primary/20 transition-colors"
                  >
                    创建
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
