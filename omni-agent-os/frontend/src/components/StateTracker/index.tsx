import { useState } from 'react';
import { Share2, Database, Filter, MemoryStick, PersonStanding, X, Copy, Activity, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import type { PipelineNode, PayloadData } from '@/types';

const NODES: PipelineNode[] = [
  { id: '0', label: 'USER_INPUT', icon: 'user', color: 'primary', x: 110, y: 260 },
  { id: '1', label: 'VECTOR_DB', icon: 'database', color: 'primary', x: 310, y: 110 },
  { id: '2', label: 'RERANKER', icon: 'filter', color: 'primary', x: 510, y: 260 },
  { id: '3', label: 'LLM_GENERATOR', icon: 'cpu', color: 'purple', isLarge: true, x: 710, y: 110 },
];

const ICON_MAP: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  user: PersonStanding,
  database: Database,
  filter: Filter,
  cpu: MemoryStick,
};

const SAMPLE_PAYLOAD: PayloadData = {
  queryId: 'req_9a8b7c6d',
  timestamp: 1715843201.45,
  action: 'retrieve_chunks',
  parameters: {
    top_k: 5,
    similarity_threshold: 0.85,
    namespace: 'technical_docs',
  },
  results: [
    { chunk_id: 'chk_001', score: 0.92, preview: 'The main console...' },
    { chunk_id: 'chk_042', score: 0.89, preview: 'Hologram state...' },
  ],
};

const METRICS = [
  { label: 'Sys_Latency', value: '420ms', color: 'text-secondary' },
  { label: 'Generation_Rate', value: '64 T/s', color: 'text-primary' },
  { label: 'Vector_Dim', value: '1536', color: 'text-purple' },
  { label: 'Active_Nodes', value: '4/4', color: 'text-slate-200' },
];

interface NodeProps {
  x: number;
  y: number;
  label: string;
  icon: string;
  color: 'primary' | 'purple';
  isLarge?: boolean;
  isActive?: boolean;
  onClick?: () => void;
}

function Node({ x, y, label, icon, color, isLarge, isActive, onClick }: NodeProps) {
  const Icon = ICON_MAP[icon];
  const size = isLarge ? 24 : 20;

  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', stiffness: 200 }}
      className="absolute z-10 group cursor-pointer"
      style={{ left: x, top: y }}
      onClick={onClick}
    >
      <div
        className={`transform rotate-45 glass-panel flex items-center justify-center bg-black/80 transition-all ${
          isLarge ? 'w-24 h-24' : 'w-20 h-20'
        } ${
          color === 'primary'
            ? 'border-primary'
            : 'border-purple'
        } ${
          isActive
            ? 'shadow-[0_0_30px_rgba(0,229,255,0.6)]'
            : 'hover:shadow-[0_0_20px_rgba(0,229,255,0.4)]'
        }`}
      >
        <motion.div
          animate={isActive ? { rotate: 360 } : {}}
          transition={isActive ? { duration: 2, repeat: Infinity, ease: 'linear' } : {}}
          className="transform -rotate-45 flex flex-col items-center"
        >
          <Icon size={isLarge ? 32 : 24} className={color === 'primary' ? 'text-primary' : 'text-purple'} />
        </motion.div>
      </div>
      <div className="absolute top-28 left-1/2 -translate-x-1/2 text-center w-40">
        <p
          className={`font-mono text-xs ${
            color === 'primary' ? 'text-primary' : 'text-purple font-bold'
          }`}
        >
          [{NODES.findIndex((n) => n.label === label)}] {label}
        </p>
        {isLarge && (
          <motion.p
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="font-mono text-[10px] text-slate-500"
          >
            STREAMING...
          </motion.p>
        )}
      </div>
    </motion.div>
  );
}

export default function StateTracker() {
  const [activeNode, setActiveNode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(SAMPLE_PAYLOAD, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="h-full flex relative overflow-hidden">
      {/* Telemetry Panel */}
      <motion.div
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="absolute top-6 left-6 z-20 glass-panel rounded-md p-4 w-72"
      >
        <h3 className="font-display font-bold text-sm text-primary uppercase tracking-widest mb-4 flex items-center gap-2">
          <Activity size={16} />
          Live Telemetry
        </h3>
        <div className="space-y-4 font-mono text-sm">
          {METRICS.map((stat, idx) => (
            <motion.div
              key={stat.label}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: idx * 0.1 }}
              className="flex justify-between items-end border-b border-primary/10 pb-1"
            >
              <span className="text-slate-500 text-xs">{stat.label}</span>
              <span className={`${stat.color} ${stat.color === 'text-secondary' ? 'glow-primary' : ''}`}>
                {stat.value}
              </span>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Isometric Visualization */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="relative w-[800px] h-[600px]">
          <svg className="absolute inset-0 w-full h-full overflow-visible pointer-events-none">
            {/* Connection Lines */}
            <path d="M 150 300 L 350 150" fill="none" stroke="rgba(0, 229, 255, 0.2)" strokeWidth="2" />
            <motion.path
              d="M 150 300 L 350 150"
              fill="none"
              stroke="#00E5FF"
              strokeWidth="2"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 2, repeat: Infinity }}
              style={{ strokeDasharray: '10' }}
            />

            <path d="M 350 150 L 550 300" fill="none" stroke="rgba(0, 229, 255, 0.2)" strokeWidth="2" />
            <motion.path
              d="M 350 150 L 550 300"
              fill="none"
              stroke="#00E5FF"
              strokeWidth="2"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
              style={{ strokeDasharray: '10' }}
            />

            <path d="M 550 300 L 750 150" fill="none" stroke="rgba(176, 38, 255, 0.2)" strokeWidth="2" />
            <motion.path
              d="M 550 300 L 750 150"
              fill="none"
              stroke="#B026FF"
              strokeWidth="2"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 2, repeat: Infinity, delay: 1 }}
              style={{ strokeDasharray: '10' }}
            />

            {/* Active Data Packets */}
            <motion.circle
              cx={0}
              cy={0}
              r="4"
              fill="#00E5FF"
              initial={{ offsetDistance: '0%' }}
              animate={{ offsetDistance: '100%' }}
              style={{ offsetPath: 'path("M 150 300 L 350 150")' }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </svg>

          {/* Nodes */}
          {NODES.map((node) => (
            <Node
              key={node.id}
              {...node}
              isActive={activeNode === node.id}
              onClick={() => setActiveNode(node.id)}
            />
          ))}
        </div>
      </div>

      {/* Payload Inspector */}
      <motion.div
        initial={{ x: 100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="w-96 glass-panel border-l border-primary/20 flex flex-col z-30 h-full"
      >
        <div className="p-6 border-b border-primary/15 flex justify-between items-center bg-black/40 shrink-0">
          <div className="flex items-center gap-2">
            <Share2 size={18} className="text-primary" />
            <h3 className="font-display font-bold text-lg text-white tracking-wide uppercase">
              Payload Inspector
            </h3>
          </div>
          <button className="text-slate-500 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 flex-1 flex flex-col gap-6 overflow-y-auto">
          {/* Meta Grid */}
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'SOURCE_NODE', value: activeNode ? NODES.find((n) => n.id === activeNode)?.label : 'Vector Retrieval', color: 'text-primary' },
              { label: 'TARGET_NODE', value: 'Context Assembly', color: 'text-purple' },
              { label: 'PAYLOAD_SIZE', value: '1.2 KB', color: 'text-white' },
              { label: 'STATUS', value: '200 OK', color: 'text-secondary' },
            ].map((meta, idx) => (
              <motion.div
                key={meta.label}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: idx * 0.1 }}
                className="flex flex-col gap-1 border border-primary/15 bg-black/40 p-3 rounded-md"
              >
                <p className="text-slate-500 text-[10px] font-mono uppercase">{meta.label}</p>
                <p className={`${meta.color} text-xs font-mono truncate`}>{meta.value}</p>
              </motion.div>
            ))}
          </div>

          {/* JSON Viewer */}
          <div className="flex-1 flex flex-col border border-primary/15 rounded-md overflow-hidden bg-black">
            <div className="bg-slate-900/80 border-b border-primary/15 px-3 py-2 flex justify-between items-center shrink-0">
              <span className="text-xs font-mono text-slate-500">raw_data.json</span>
              <button
                onClick={handleCopy}
                className="text-slate-500 hover:text-primary transition-colors flex items-center gap-1"
              >
                <Copy size={14} />
                {copied && <span className="text-[10px] text-secondary">Copied!</span>}
              </button>
            </div>
            <div className="p-4 overflow-auto flex-1 text-xs font-mono leading-relaxed text-slate-300">
              <pre className="whitespace-pre-wrap">{JSON.stringify(SAMPLE_PAYLOAD, null, 2)}</pre>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex gap-2 shrink-0">
            <button className="flex-1 py-2 bg-primary/10 border border-primary/30 text-primary text-xs font-mono uppercase hover:bg-primary/20 transition-colors flex items-center justify-center gap-2">
              <ChevronRight size={12} />
              Step Forward
            </button>
            <button className="flex-1 py-2 bg-slate-800/50 border border-primary/10 text-slate-400 text-xs font-mono uppercase hover:bg-slate-800 transition-colors flex items-center justify-center gap-2">
              Reset
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
