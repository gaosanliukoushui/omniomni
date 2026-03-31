import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Search,
  Filter,
  Send,
  Paperclip,
  History,
  Database,
  Loader2,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useChatStore, useKnowledgeStore, useAppStore } from '@/stores';
import type { Message, KnowledgeItem } from '@/types';

const INITIAL_MESSAGES: Message[] = [
  {
    id: '1',
    role: 'agent',
    content:
      'Terminal initialized. Knowledge base sources verified (3 active). How can I assist with the system state analysis today?',
    timestamp: '14:02:11',
  },
  {
    id: '2',
    role: 'user',
    content:
      'Analyze the discrepancy between DOC_8829 and SYSTEM_SPECS regarding core cooling parameters.',
    timestamp: '14:02:45',
  },
  {
    id: '3',
    role: 'agent',
    content:
      'I found a direct conflict in the cooling thresholds. According to DOC_8829_QA.pdf, the nominal range is 20°C - 45°C. However, SYSTEM_SPECS_V4.md specifies a stricter operational envelope of 22°C - 38°C.\n\nThis discrepancy (Δ7°C) could trigger false positive alarms in the secondary circuit. Should I update the policy state?',
    timestamp: '14:02:48',
    citations: [
      {
        docId: '1',
        docName: 'DOC_8829_QA.pdf',
        chunkId: '044-A',
        score: 0.94,
        preview:
          '...nominal operating temperatures for the core capacitor array must maintain a stable range between 20C and 45C to ensure longevity...',
      },
      {
        docId: '2',
        docName: 'SYSTEM_SPECS_V4.md',
        chunkId: '112-C',
        score: 0.89,
        preview:
          '...Hard-limit threshold established at 38C for emergency venting. Operations exceeding this value without override will...',
      },
    ],
  },
];

const INITIAL_KNOWLEDGE: KnowledgeItem[] = [
  { id: '1', name: 'DOC_8829_QA.pdf', chunks: 1242, simIdx: 0.94, status: 'active' },
  { id: '2', name: 'SYSTEM_SPECS_V4.md', chunks: 412, simIdx: 0.88, status: 'active' },
  { id: '3', name: 'USER_GUIDE_EN.txt', chunks: 89, simIdx: 0.99, status: 'active' },
  {
    id: '4',
    name: 'NEW_UPLOAD_441.csv',
    chunks: 0,
    simIdx: 0,
    status: 'processing',
  },
];

export default function Console() {
  const { messages, isStreaming, inputValue, tokenCost, setInputValue, addMessage, setStreaming, clearMessages } =
    useChatStore();
  const [selectedDoc, setSelectedDoc] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize with demo data
  useEffect(() => {
    if (messages.length === 0) {
      INITIAL_MESSAGES.forEach((msg) => addMessage(msg));
    }
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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

    // Simulate AI response
    setTimeout(() => {
      const agentMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'agent',
        content: `Processing query: "${currentInput}"\n\nSearching knowledge base for relevant context...\n\nFound 2 matching documents. Generating response based on retrieved context.`,
        timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
        tokens: Math.floor(Math.random() * 500) + 100,
      };
      addMessage(agentMessage);
      setIsLoading(false);
      setStreaming(false);
    }, 1500);
  }, [inputValue, isStreaming, addMessage, setInputValue, setStreaming]);

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
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const newDoc: KnowledgeItem = {
          id: Date.now().toString(),
          name: file.name,
          chunks: 0,
          simIdx: 0,
          status: 'processing',
        };
        // In real app, would upload to server
        setTimeout(() => {
          // Simulate processing complete
        }, 3000);
      }
    };
    input.click();
  };

  return (
    <div className="h-full grid grid-cols-10 gap-px bg-primary/10">
      {/* Knowledge Index */}
      <section className="col-span-2 flex flex-col bg-background border-r border-primary/10">
        <div className="p-4 border-b border-primary/10 flex justify-between items-center bg-black/20">
          <h3 className="font-headline text-xs font-bold tracking-widest text-primary uppercase">
            Knowledge Index
          </h3>
          <button className="text-primary/50 hover:text-primary transition-colors">
            <Filter size={14} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {INITIAL_KNOWLEDGE.map((item) => (
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
        </div>
        <div className="p-4 bg-black/40 border-t border-primary/10">
          <button
            onClick={handleFileUpload}
            className="w-full py-2 border border-primary/30 text-primary font-mono text-[10px] flex items-center justify-center gap-2 hover:bg-primary/10 transition-all uppercase"
          >
            <Search size={12} /> INDEX_NEW_SOURCE
          </button>
        </div>
      </section>

      {/* Terminal Chat */}
      <section className="col-span-5 flex flex-col bg-background relative">
        <div className="h-12 border-b border-primary/10 flex items-center px-6 justify-between bg-black/20 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-secondary rounded-full shadow-[0_0_5px_#00ffa3]" />
            <span className="font-mono text-[10px] tracking-widest text-secondary uppercase">
              Agent_Active // RAG_Mode_Enabled
            </span>
          </div>
          <div className="flex items-center gap-4 font-mono text-[10px] text-slate-500">
            <span>TOKEN_COST: {tokenCost.toFixed(4)}</span>
            <span>TEMP: 0.7</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-8">
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
                    {msg.role === 'agent' ? 'OMNI_AGENT' : 'ADMIN_USER'}
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
                    <div className="mt-4 border-t border-primary/10 pt-3 flex items-center gap-2 font-mono text-[9px] text-slate-500">
                      <Search size={10} /> RAG_SEARCH_COMPLETE ({msg.citations.length} hits found)
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {isLoading && (
            <div className="flex items-center gap-3 text-primary">
              <Loader2 size={16} className="animate-spin" />
              <span className="font-mono text-sm text-primary/60">Processing query...</span>
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
              placeholder="TYPE_COMMAND_OR_QUERY_HERE..."
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
              <span className="font-mono text-[9px] text-slate-500 uppercase">Upload_Context</span>
            </button>
            <button
              onClick={clearMessages}
              className="flex items-center gap-1.5 px-2 py-1 bg-slate-800/50 border border-primary/10 hover:bg-primary/10 transition-colors"
            >
              <History size={10} className="text-slate-500" />
              <span className="font-mono text-[9px] text-slate-500 uppercase">Clear_History</span>
            </button>
          </div>
        </div>
      </section>

      {/* Trace & State */}
      <section className="col-span-3 flex flex-col bg-background border-l border-primary/10 overflow-hidden">
        <div className="h-1/2 flex flex-col border-b border-primary/10">
          <div className="p-4 bg-black/20 flex justify-between items-center shrink-0">
            <h3 className="font-headline text-xs font-bold tracking-widest text-primary uppercase">
              State Machine Tracker
            </h3>
            <span className="font-mono text-[9px] text-secondary uppercase">Real_Time_Flow</span>
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
            <h3 className="font-headline text-xs font-bold tracking-widest text-primary uppercase">Source Citations</h3>
            <span className="font-mono text-[9px] text-slate-500 uppercase">Matched: {messages[messages.length - 1]?.citations?.length ?? 0}</span>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages[messages.length - 1]?.citations ? (
              messages[messages.length - 1].citations?.map((citation, idx) => (
                <div key={idx} className="glass-panel p-3 border-l-2 border-l-secondary">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <Database size={12} className="text-secondary" />
                      <span className="font-mono text-[10px] text-slate-200">{citation.docName}</span>
                    </div>
                    <span className="font-mono text-[10px] bg-secondary/20 text-secondary px-1.5">
                      SCORE: {citation.score}
                    </span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-slate-400 font-mono mb-2 italic">
                    &quot;{citation.preview}&quot;
                  </p>
                  <div className="flex justify-between items-center">
                    <span className="text-[8px] font-mono text-slate-500">CHUNK_ID: {citation.chunkId}</span>
                    <button className="text-[9px] font-mono text-primary hover:underline uppercase">
                      Open_Full_Source
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-slate-500 font-mono text-xs py-8">
                No citations available
              </div>
            )}

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
                <p className="font-headline text-[10px] font-bold text-primary uppercase">Contextual Density</p>
                <p className="font-mono text-[8px] text-slate-500">Optimal retrieval parameters active</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
