import { useEffect } from 'react';
import { LayoutDashboard, Database, Activity, Settings, Cpu, Radio, User } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAppStore, useSystemStore } from '@/stores';
import { HEADER_NAV, NAV_ITEMS } from '@/constants';
import type { PageId } from '@/types';

const ICON_MAP: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  terminal: LayoutDashboard,
  database: Database,
  activity: Activity,
  settings: Settings,
};

function formatUptime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const { currentPage, setCurrentPage } = useAppStore();
  const { metrics, isConnected } = useSystemStore();

  useEffect(() => {
    const interval = setInterval(() => {
      // System metrics would be fetched here in production
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const uptimeSeconds = metrics?.uptime
    ? parseInt(metrics.uptime.replace(/\D/g, '')) || 0
    : 142 * 3600 + 12 * 60 + 5;

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden relative">
      {/* Scanline Effect */}
      <div className="absolute inset-0 scanline z-50 pointer-events-none opacity-30" />

      {/* Top Navigation */}
      <header className="h-16 border-b border-primary/15 bg-black/60 backdrop-blur-lg flex items-center justify-between px-6 z-40 shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 text-primary">
              <Cpu size={20} />
            </div>
            <h1 className="text-primary font-headline font-bold text-lg tracking-widest uppercase glow-text-primary">
              Omni-Agent-OS
            </h1>
          </div>
          <div className="h-4 w-px bg-primary/20 mx-2 hidden md:block" />
          <nav className="hidden md:flex gap-8 items-center">
            {HEADER_NAV.map((item) => (
              <button
                key={item.id}
                onClick={() => setCurrentPage(item.id as PageId)}
                className={`font-headline uppercase tracking-tighter text-sm transition-all relative py-1 ${
                  currentPage === item.id
                    ? 'text-primary'
                    : 'text-primary/40 hover:text-primary/70'
                }`}
              >
                {item.label}
                {currentPage === item.id && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute -bottom-1 left-0 right-0 h-0.5 bg-secondary shadow-[0_0_8px_#00ffa3]"
                  />
                )}
              </button>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-6">
          <div className="hidden lg:flex flex-col items-end">
            <span className="font-mono text-[10px] text-secondary">
              SYSTEM_UPTIME: {formatUptime(uptimeSeconds)}
            </span>
            <span className="font-mono text-[10px] text-primary/60">
              LATENCY: {metrics?.latency ?? 12}ms
            </span>
          </div>
          <button
            className={`p-2 transition-all rounded ${
              isConnected
                ? 'hover:bg-primary/10 text-primary'
                : 'bg-error/20 text-error'
            }`}
            title={isConnected ? 'System Connected' : 'System Disconnected'}
          >
            <Radio size={18} />
          </button>
          <div className="w-8 h-8 bg-slate-800 border border-primary/30 flex items-center justify-center rounded-sm">
            <User size={16} className="text-primary" />
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Side Navigation */}
        <aside className="w-16 md:w-64 border-r border-primary/15 bg-black/40 backdrop-blur-xl flex flex-col py-4 z-30 shrink-0">
          <div className="px-6 mb-8 hidden md:block">
            <h2 className="text-secondary font-mono text-xs uppercase font-bold tracking-widest">
              SYSTEM_CORE
            </h2>
            <p className="text-primary/40 text-[10px] font-mono">v4.0.2-ALPHA</p>
          </div>

          <nav className="flex-1 space-y-1">
            {NAV_ITEMS.map((item) => {
              const Icon = ICON_MAP[item.icon];
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentPage(item.id)}
                  className={`w-full flex items-center gap-4 px-6 py-3 transition-all group relative ${
                    currentPage === item.id
                      ? 'bg-secondary/10 text-secondary border-l-4 border-secondary'
                      : 'text-primary/40 hover:bg-primary/5 hover:text-primary/60'
                  }`}
                >
                  <Icon size={18} />
                  <span className="font-mono text-xs uppercase hidden md:inline">
                    {item.labelEn}
                  </span>
                  {currentPage === item.id && (
                    <div className="absolute right-4 w-1 h-1 bg-secondary rounded-full shadow-[0_0_8px_#00ffa3]" />
                  )}
                </button>
              );
            })}
          </nav>

          <div className="px-4 mt-auto">
            <button
              className="w-full py-3 bg-secondary text-black font-mono text-[10px] font-bold tracking-tighter transition-all hover:shadow-[0_0_15px_#00ffa3] active:scale-95 hidden md:block uppercase"
              onClick={() => {
                if (confirm('确定要重启系统吗？')) {
                  window.location.reload();
                }
              }}
            >
              REBOOT_SYSTEM
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-hidden relative">{children}</main>
      </div>

      {/* Footer Stats */}
      <footer className="h-6 bg-black border-t border-primary/15 flex items-center justify-between px-4 z-50 shrink-0">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className={`w-1.5 h-1.5 ${isConnected ? 'bg-secondary animate-pulse' : 'bg-error'} rounded-full`} />
            <span className="font-mono text-[8px] text-secondary uppercase tracking-widest">
              Live System Feed
            </span>
          </div>
          <div className="flex items-center gap-4 font-mono text-[8px] text-primary/40">
            <span>CPU: {metrics?.cpu ?? 14.2}%</span>
            <span>
              MEM: {metrics ? `${metrics.memory}/${metrics.memoryTotal}` : '4.8GB / 16GB'}
            </span>
            <span>IO: {metrics?.disk ?? 1.2} MB/s</span>
          </div>
        </div>
        <div className="font-mono text-[8px] text-primary/30">
          LOCAL_IP: {metrics?.ip ?? '192.168.1.144'} | ENCRYPTION: AES-256-GCM
        </div>
      </footer>
    </div>
  );
}
