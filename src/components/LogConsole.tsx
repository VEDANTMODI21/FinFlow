import React from "react";
import { 
  Terminal, 
  Trash2, 
  RefreshCw,
  ShieldCheck,
  ShieldAlert,
  Link2,
  Link2Off
} from "lucide-react";
import { ServerLog, ConfigStatus } from "../types";

interface LogConsoleProps {
  logs: ServerLog[];
  config: ConfigStatus | null;
  onClearLogs: () => void;
  onRefreshLogs: () => void;
  isRefreshing: boolean;
}

export default function LogConsole({ 
  logs, 
  config, 
  onClearLogs, 
  onRefreshLogs,
  isRefreshing
}: LogConsoleProps) {
  const getLevelStyles = (level: string) => {
    switch (level) {
      case "SUCCESS":
        return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
      case "WARNING":
        return "text-amber-400 bg-amber-500/10 border-amber-500/20";
      case "ERROR":
        return "text-rose-400 bg-rose-500/10 border-rose-500/20";
      default:
        return "text-blue-400 bg-blue-500/10 border-blue-500/20";
    }
  };

  return (
    <div id="logs-console-card" className="bg-[#141414] border border-white/10 p-6 rounded-none flex flex-col h-[400px]">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
        <div className="flex items-center gap-2">
          <Terminal className="w-4.5 h-4.5 text-white/60" />
          <div>
            <h3 className="font-display font-light text-md text-white tracking-wide">
              Server Terminal Logs
            </h3>
            <p className="text-[9px] font-mono text-white/40 uppercase tracking-widest mt-0.5">
              Live server-side execution outputs & exceptions
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onRefreshLogs}
            disabled={isRefreshing}
            className="p-1.5 hover:bg-white/5 border border-white/10 hover:border-white/20 text-white/60 hover:text-white rounded-none cursor-pointer transition-all disabled:opacity-50"
            title="Force Sync Logs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={onClearLogs}
            className="p-1.5 hover:bg-rose-950/20 border border-white/10 hover:border-rose-500/30 text-white/40 hover:text-rose-400 rounded-none cursor-pointer transition-all"
            title="Clear Terminal logs"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Integration Status Sub-Bar */}
      <div className="grid grid-cols-2 gap-2 mb-4 bg-black/40 p-2.5 border border-white/5 font-mono text-[9px] text-white/60">
        <div className="flex items-center gap-2">
          {config?.hasResendKey ? (
            <>
              <Link2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Resend API: <span className="text-emerald-400 font-bold uppercase">Connected</span></span>
            </>
          ) : (
            <>
              <Link2Off className="w-3.5 h-3.5 text-white/30" />
              <span>Resend API: <span className="text-white/30 font-semibold uppercase">Sandbox mode</span></span>
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          {config?.hasBrevoKey ? (
            <>
              <Link2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Brevo API: <span className="text-emerald-400 font-bold uppercase">Connected</span></span>
            </>
          ) : (
            <>
              <Link2Off className="w-3.5 h-3.5 text-white/30" />
              <span>Brevo API: <span className="text-white/30 font-semibold uppercase">Sandbox mode</span></span>
            </>
          )}
        </div>
      </div>

      {/* Terminal Output */}
      <div className="flex-1 overflow-y-auto bg-black border border-white/5 p-4 font-mono text-[10.5px] leading-relaxed text-white/75 space-y-2 select-text">
        {logs.length === 0 ? (
          <div className="h-full flex items-center justify-center text-white/30 text-[10px] uppercase tracking-widest font-mono">
            Terminal Idle • Awaiting Events
          </div>
        ) : (
          logs.map((log) => (
            <div key={log.id} className="flex items-start gap-2.5 border-b border-white/[0.02] pb-1.5 last:border-0">
              <span className="text-white/30 text-[9px] select-none shrink-0 pt-0.5">
                [{log.timestamp}]
              </span>
              <span className={`px-1.5 py-0.5 text-[8px] font-bold border shrink-0 ${getLevelStyles(log.level)}`}>
                {log.level}
              </span>
              <span className="text-white/40 shrink-0 select-none">
                [{log.service}]
              </span>
              <span className="text-white/90 break-all">
                {log.message}
              </span>
            </div>
          ))
        )}
      </div>

      <div className="pt-2 border-t border-white/5 mt-2 flex justify-between text-[9px] font-mono text-white/30">
        <span>CWD: /app/applet</span>
        <span>Status Code: 200 OK</span>
      </div>
    </div>
  );
}
