import { useState, useCallback, useRef, useEffect } from 'react';
import {
  CloudUpload,
  Terminal,
  CheckCircle2,
  Clock,
  RefreshCw,
  Trash2,
  FileText,
  AlertTriangle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { pipelineApi, knowledgeApi } from '@/services/api';
import { FILE_TYPES, MAX_FILE_SIZE } from '@/constants';
import type { PipelineItem, PipelineStatus, LogEntry } from '@/types';

const LOG_TYPES = {
  info: { color: 'text-secondary', prefix: '[INFO]' },
  proc: { color: 'text-primary', prefix: '[PROC]' },
  warn: { color: 'text-yellow-400', prefix: '[WARN]' },
  error: { color: 'text-error', prefix: '[ERR]' },
};

const INITIAL_LOGS: LogEntry[] = [
  { type: 'info', content: '正在初始化摄入矩阵...', active: false },
  { type: 'info', content: '已建立与向量数据库集群01的连接', active: false },
  { type: 'proc', content: '正在分片 NEURAL_NET_SPECS_V2.MD...', active: false },
  { type: 'proc', content: '分片序列 1-42 已完成。', active: false },
  { type: 'info', content: '块 42 已嵌入。向量维度: 1536', active: false },
  { type: 'info', content: '块 43 已嵌入。向量维度: 1536', active: false },
  { type: 'warn', content: '接近OpenAI API速率限制。正在节流...', active: false },
  { type: 'proc', content: '正在上传向量到命名空间: "production-v4"', active: false },
  { type: 'info', content: '块 44 已嵌入。向量维度: 1536', active: false },
  { type: 'info', content: '系统正在稳定中', active: true },
];

export default function Ingestion() {
  const [isDragOver, setIsDragOver] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>(INITIAL_LOGS);
  const [pipeline, setPipeline] = useState<PipelineItem[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [systemMetrics, setSystemMetrics] = useState({ cpu: 42.1, mem: 12.8, disk: 88 });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);

  // 加载管道数据
  useEffect(() => {
    const loadPipeline = async () => {
      try {
        const data = await pipelineApi.list();
        setPipeline(data);
        addLog('info', `Loaded ${data.length} pipeline items`);
      } catch (error) {
        console.error('Failed to load pipeline:', error);
        addLog('error', '连接后端失败');
      }
    };
    loadPipeline();
    // 定时刷新
    const interval = setInterval(loadPipeline, 5000);
    return () => clearInterval(interval);
  }, []);

  // 加载系统指标
  useEffect(() => {
    const loadMetrics = async () => {
      try {
        await knowledgeApi.getStats();
        setSystemMetrics({
          cpu: 42.1,
          mem: 12.8,
          disk: 88,
        });
      } catch (error) {
        console.error('Failed to load metrics:', error);
      }
    };
    loadMetrics();
    const interval = setInterval(loadMetrics, 10000);
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: PipelineStatus) => {
    switch (status) {
      case 'synced':
        return <CheckCircle2 size={12} className="text-secondary" />;
      case 'vectorizing':
        return <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}>
          <RefreshCw size={12} className="text-primary" />
        </motion.div>;
      case 'queued':
        return <Clock size={12} className="text-slate-500" />;
      case 'error':
        return <AlertTriangle size={12} className="text-error" />;
      default:
        return null;
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    handleFiles(files);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const handleFiles = (files: File[]) => {
    const validFiles = files.filter((file) => {
      const ext = file.name.split('.').pop()?.toUpperCase() || '';
      if (!FILE_TYPES.includes(ext as typeof FILE_TYPES[number])) {
        addLog('error', `Unsupported file type: ${ext}`);
        return false;
      }
      if (file.size > MAX_FILE_SIZE) {
        addLog('error', `File too large: ${file.name} (max 512MB)`);
        return false;
      }
      return true;
    });

    validFiles.forEach((file) => {
      const newItem: PipelineItem = {
        id: Date.now().toString() + Math.random().toString(36).slice(2),
        name: file.name.toUpperCase(),
        chunks: '--',
        tokens: '--',
        vectors: '--',
        status: 'uploading',
        progress: 0,
        uploadedAt: new Date().toISOString(),
      };
      setPipeline((prev) => [newItem, ...prev]);
      addLog('proc', `Uploading ${newItem.name}...`);
      uploadFile(file, newItem.id);
    });
  };

  const uploadFile = async (file: File, tempId: string) => {
    try {
      const docId = await knowledgeApi.upload(file, 1, (percent) => {
        // 更新进度
        setPipeline((prev) =>
          prev.map((item) =>
            item.id === tempId ? { ...item, progress: percent } : item
          )
        );
      });
      addLog('info', `${file.name.toUpperCase()} uploaded successfully`);
      // 确保 docId 是字符串类型，后端返回的是数字
      const docIdStr = String(docId);
      // 更新状态为处理中
      setPipeline((prev) =>
        prev.map((item) =>
          item.id === tempId
            ? { ...item, id: docIdStr, status: 'vectorizing' as PipelineStatus, progress: 50 }
            : item
        )
      );
    } catch (error) {
      console.error('Upload failed:', error);
      addLog('error', `上传失败: ${(error as Error).message}`);
      setPipeline((prev) =>
        prev.map((item) =>
          item.id === tempId ? { ...item, status: 'error' as PipelineStatus } : item
        )
      );
    }
  };

  const addLog = (type: LogEntry['type'], content: string) => {
    const newLog = { type, content, active: true };
    setLogs((prev) => [...prev.map((l) => ({ ...l, active: false })), newLog]);
    setTimeout(() => {
      setLogs((prev) => prev.map((l) => (l.content === content ? { ...l, active: false } : l)));
    }, 1000);
  };

  const toggleFileSelection = (id: string) => {
    setSelectedFiles((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedFiles.length === pipeline.length) {
      setSelectedFiles([]);
    } else {
      setSelectedFiles(pipeline.map((item) => item.id));
    }
  };

  const deleteSelected = async () => {
    try {
      for (const id of selectedFiles) {
        await pipelineApi.delete(id);
      }
      setPipeline((prev) => prev.filter((item) => !selectedFiles.includes(item.id)));
      addLog('warn', `Deleted ${selectedFiles.length} file(s)`);
      setSelectedFiles([]);
    } catch (error) {
      console.error('Delete failed:', error);
      addLog('error', `Failed to delete files`);
    }
  };

  return (
    <div className="h-full flex flex-col p-6 gap-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />

      {/* Dropzone */}
      <section className="h-[35%] shrink-0">
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`h-full glass-panel border-dashed border-2 relative group cursor-pointer flex flex-col items-center justify-center transition-all ${
            isDragOver
              ? 'border-secondary bg-secondary/5'
              : 'border-primary/40 hover:border-secondary hover:bg-secondary/5'
          }`}
        >
          <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-primary" />
          <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-primary" />

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.md,.txt,.json,.csv,.xlsx"
            onChange={handleFileSelect}
            className="hidden"
          />

          <motion.div
            animate={{ y: isDragOver ? -15 : [0, -10, 0] }}
            transition={{ duration: isDragOver ? 0.3 : 3, repeat: Infinity, ease: 'easeInOut' }}
            className="mb-4 text-primary"
          >
            <CloudUpload
              size={48}
              className={`drop-shadow-[0_0_10px_rgba(0,229,255,0.5)] ${isDragOver ? 'text-secondary' : ''}`}
            />
          </motion.div>

          <h2 className="font-headline font-bold text-3xl text-slate-100 tracking-tighter uppercase">
            {isDragOver ? '释放文件' : '初始化知识上传'}
          </h2>
          <p className="font-mono text-xs text-primary/60 mt-2 tracking-widest uppercase">
            拖放原始数据进行神经网络映射
          </p>

          <div className="absolute bottom-4 right-6 flex gap-4">
            <div className="text-[10px] font-mono text-slate-500 uppercase">
              支持格式: {FILE_TYPES.join(', ')}
            </div>
            <div className="text-[10px] font-mono text-primary uppercase">最大: 512MB</div>
          </div>
        </div>
      </section>

      {/* Split View */}
      <section className="flex-1 min-h-0 grid grid-cols-12 gap-6 pb-4">
        {/* Pipeline Table */}
        <div className="col-span-8 flex flex-col glass-panel overflow-hidden">
          <div className="bg-slate-900/80 px-6 py-3 border-b border-primary/10 flex justify-between items-center shrink-0">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-secondary animate-pulse rounded-full" />
              <h3 className="font-headline text-xs font-bold tracking-widest uppercase text-slate-200">
                活跃管道监控
              </h3>
            </div>
            <div className="flex gap-4 items-center">
              {selectedFiles.length > 0 && (
                <button
                  onClick={deleteSelected}
                  className="flex items-center gap-1 text-error hover:text-error/80 transition-colors"
                >
                  <Trash2 size={12} />
                  <span className="font-mono text-[10px]">Delete ({selectedFiles.length})</span>
                </button>
              )}
              <span className="font-mono text-[10px] text-slate-500 uppercase">节点数: {pipeline.length + 1}</span>
              <span className="font-mono text-[10px] text-secondary uppercase">Latency: 14ms</span>
            </div>
          </div>

          <div className="flex-1 overflow-auto">
            <table className="w-full text-left font-mono text-[11px]">
              <thead className="sticky top-0 bg-slate-900/95 backdrop-blur text-primary/70 border-b border-primary/10 uppercase tracking-tighter">
                <tr>
                  <th className="px-2 py-4 w-8">
                    <input
                      type="checkbox"
                      className="accent-primary"
                      checked={selectedFiles.length === pipeline.length && pipeline.length > 0}
                      onChange={toggleSelectAll}
                    />
                  </th>
                  <th className="px-6 py-4 font-medium">资源</th>
                  <th className="px-4 py-4 font-medium">块数</th>
                  <th className="px-4 py-4 font-medium">Token数</th>
                  <th className="px-4 py-4 font-medium">向量数</th>
                  <th className="px-6 py-4 font-medium">状态</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-primary/5">
                {pipeline.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => toggleFileSelection(item.id)}
                    className={`hover:bg-primary/5 transition-colors cursor-pointer group ${
                      selectedFiles.includes(item.id) ? 'bg-primary/10' : ''
                    }`}
                  >
                    <td className="px-2 py-4">
                      <input
                        type="checkbox"
                        checked={selectedFiles.includes(item.id)}
                        onChange={() => {}}
                        onClick={(e) => e.stopPropagation()}
                        className="accent-primary"
                      />
                    </td>
                    <td className="px-6 py-4 text-slate-200 font-medium flex items-center gap-2">
                      <FileText size={14} className="text-primary" />
                      {item.name}
                      {item.errorMessage && (
                        <span className="text-[9px] text-error ml-2" title={item.errorMessage}>
                          {item.errorMessage}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-slate-400">{item.chunks}</td>
                    <td className="px-4 py-4 text-slate-400">{item.tokens}</td>
                    <td className="px-4 py-4 text-slate-400">{item.vectors}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-1 bg-slate-800 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${item.progress}%` }}
                            className={`h-full ${
                              item.status === 'error' ? 'bg-error' : 'bg-secondary shadow-[0_0_8px_#00ffa3]'
                            }`}
                          />
                        </div>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(item.status)}
                          <span
                            className={`text-[9px] uppercase font-bold ${
                              item.status === 'synced'
                                ? 'text-secondary'
                                : item.status === 'vectorizing'
                                ? 'text-primary animate-pulse'
                                : item.status === 'error'
                                ? 'text-error'
                                : 'text-slate-500'
                            }`}
                          >
                            {item.status}
                          </span>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
                {pipeline.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                      管道中暂无文档。上传文件到上方开始。
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Live Logs */}
        <div className="col-span-4 flex flex-col glass-panel bg-black/40 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-secondary/30 to-transparent" />

          <div className="bg-slate-900/50 px-4 py-2 border-b border-primary/10 flex items-center gap-2 shrink-0">
            <Terminal size={12} className="text-secondary" />
            <h3 className="font-mono text-[10px] uppercase font-bold text-slate-400">实时系统日志</h3>
          </div>

          <div ref={logsEndRef} className="flex-1 p-4 font-mono text-[10px] leading-relaxed overflow-auto text-primary/80">
            <AnimatePresence>
              {logs.map((log, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="mb-1 flex gap-2"
                >
                  <span className={LOG_TYPES[log.type].color}>{LOG_TYPES[log.type].prefix}</span>
                  <span className="flex-1">
                    {log.content}
                    {log.active && (
                      <span className="w-1 h-3 bg-secondary animate-pulse inline-block ml-1 align-middle" />
                    )}
                  </span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          <div className="mt-auto border-t border-primary/10 p-2 bg-black/40 shrink-0">
            <div className="flex justify-between font-mono text-[9px] text-slate-500 px-2">
              <span>CPU: {systemMetrics.cpu.toFixed(1)}%</span>
              <span>内存: {systemMetrics.mem.toFixed(1)}GB</span>
              <span>磁盘: {systemMetrics.disk}%</span>
            </div>
          </div>
        </div>
      </section>

      {/* HUD Widget */}
      <div className="fixed bottom-10 right-10 pointer-events-none">
        <div className="glass-panel p-4 flex flex-col gap-2">
          <span className="font-mono text-[10px] text-primary/60 uppercase">系统负载</span>
          <div className="flex items-end gap-1 h-8">
            {[40, 60, 30, 80, 50, 90, 45, 70].map((h, i) => (
              <motion.div
                key={i}
                initial={{ height: 0 }}
                animate={{ height: `${h}%` }}
                transition={{
                  duration: 1,
                  delay: i * 0.1,
                  repeat: Infinity,
                  repeatType: 'reverse',
                }}
                className="w-1 bg-secondary"
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
