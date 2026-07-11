import { useState, useEffect } from "react";
import { 
  Activity, 
  Cpu, 
  Database, 
  HardDrive, 
  AlertTriangle, 
  CheckCircle2, 
  Server, 
  Clock, 
  RefreshCw,
  TrendingUp,
  Sliders
} from "lucide-react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";

export default function AdminSystemHealthPage() {
  const [latency, setLatency] = useState(14);
  const [cpuUsage, setCpuUsage] = useState(38);
  const [memUsage, setMemUsage] = useState(54);
  const [refreshing, setRefreshing] = useState(false);

  // Simulate real-time monitoring variations
  useEffect(() => {
    const interval = setInterval(() => {
      setLatency(prev => Math.max(10, Math.min(45, prev + Math.floor(Math.random() * 7) - 3)));
      setCpuUsage(prev => Math.max(15, Math.min(85, prev + Math.floor(Math.random() * 11) - 5)));
      setMemUsage(prev => Math.max(40, Math.min(75, prev + Math.floor(Math.random() * 5) - 2)));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  function handleTriggerRefresh() {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      toast.success("Infrastructure health telemetry metrics updated!");
    }, 800);
  }

  // System services list
  const services = [
    { name: "PostgreSQL Database", status: "Operational", desc: "Multi-tenant tables, orders, products", latency: "14ms", statusType: "healthy" },
    { name: "Realtime WebSocket Hub", status: "Operational", desc: "Signalling channels, active peer counts", latency: "8ms", statusType: "healthy" },
    { name: "Supabase REST API Host", status: "Operational", desc: "PostgREST endpoints gateway connection", latency: "32ms", statusType: "healthy" },
    { name: "S3 Product Images Storage", status: "Operational", desc: "Product media, files buckets server", latency: "42ms", statusType: "healthy" },
    { name: "Global TURN/STUN Signalling Host", status: "Operational", desc: "WebRTC candidate ICE routing", latency: "18ms", statusType: "healthy" },
  ];

  // Simulated critical console logs
  const errorLogs = [
    { time: "12:04:12", source: "TURN_SERVER", message: "Refused candidate allocation from blocked client port.", type: "warning" },
    { time: "11:58:34", source: "POSTGREST", message: "Resolved schema reloads notified successfully.", type: "info" },
    { time: "11:42:01", source: "WEBSOCKET", message: "Active signalling room call_4da2ad29-3fbe client connection dropped.", type: "warning" }
  ];

  return (
    <div className="space-y-4 md:space-y-6 text-white max-w-7xl relative">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">System Infrastructure Health</h1>
          <p className="mt-1 text-xs text-slate-400">Monitor active WebRTC channels, memory capacities, STUN servers, and database telemetry.</p>
        </div>

        <Button
          onClick={handleTriggerRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 rounded-xl bg-slate-900 border border-slate-200 hover:border-slate-800 px-4 py-2.5 text-xs font-bold text-slate-700 cursor-pointer transition-all active:scale-[0.98] disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
          <span>Refresh Telemetry</span>
        </Button>
      </div>

      {/* Scorecards */}
      <div className="grid gap-6 sm:grid-cols-3">
        
        {/* CPU */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
          <div className="flex items-center justify-between text-[10px] text-slate-500 font-bold uppercase tracking-wider">
            <span>CPU Core Load</span>
            <Cpu className="h-4.5 w-4.5 text-blue-400" />
          </div>
          <div className="space-y-2">
            <p className="text-2xl font-extrabold tracking-tight text-white">{cpuUsage}%</p>
            
            {/* Progress load */}
            <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-900">
              <div 
                style={{ width: `${cpuUsage}%` }} 
                className={`h-full rounded-full transition-all duration-500 ${
                  cpuUsage > 80 ? "bg-red-500" : cpuUsage > 60 ? "bg-amber-500" : "bg-blue-500"
                }`}
              />
            </div>
          </div>
        </div>

        {/* Memory */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
          <div className="flex items-center justify-between text-[10px] text-slate-500 font-bold uppercase tracking-wider">
            <span>Memory Utilisation</span>
            <HardDrive className="h-4.5 w-4.5 text-indigo-400" />
          </div>
          <div className="space-y-2">
            <p className="text-2xl font-extrabold tracking-tight text-white">{memUsage}%</p>
            
            {/* Progress load */}
            <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-900">
              <div 
                style={{ width: `${memUsage}%` }} 
                className="h-full bg-indigo-500 rounded-full transition-all duration-500"
              />
            </div>
          </div>
        </div>

        {/* Latency */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
          <div className="flex items-center justify-between text-[10px] text-slate-500 font-bold uppercase tracking-wider">
            <span>Database Ping latency</span>
            <Database className="h-4.5 w-4.5 text-emerald-400" />
          </div>
          <div className="space-y-2">
            <p className="text-2xl font-extrabold tracking-tight text-white">{latency}ms</p>
            
            {/* Progress load */}
            <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-900">
              <div 
                style={{ width: `${(latency / 100) * 100}%` }} 
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
              />
            </div>
          </div>
        </div>

      </div>

      <div className="grid gap-4 md:gap-6 grid-cols-1 lg:grid-cols-3">
        
        {/* Left 2 Cols: Platform Services status list */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-900 bg-slate-900/20 p-6 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider text-[10px] text-slate-400">Core Microservices status</h3>
            <p className="text-xs text-slate-500">Live operational validation logs for primary interfaces</p>
          </div>

          <div className="divide-y divide-slate-900 text-xs">
            {services.map(ser => (
              <div key={ser.name} className="flex justify-between items-center py-4 first:pt-0 last:pb-0">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-slate-900 border border-slate-200 flex items-center justify-center shrink-0">
                    <Server className="h-4 w-4 text-slate-500" />
                  </div>
                  <div>
                    <p className="font-bold text-white text-xs">{ser.name}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">{ser.desc}</p>
                  </div>
                </div>

                <div className="text-right flex items-center gap-3">
                  <span className="font-mono text-[10px] text-slate-500">Lat: {ser.latency}</span>
                  <span className="inline-flex items-center gap-1 text-[8px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded uppercase">
                    <CheckCircle2 className="h-2.5 w-2.5" /> Operational
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right 1 Col: Platform Diagnostic Logs console */}
        <div className="rounded-2xl border border-slate-900 bg-slate-900/20 p-6 space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider text-[10px] text-slate-400">Diagnostic Logs console</h3>
            <p className="text-xs text-slate-500">Real-time gateway warning & allocation logs</p>
          </div>

          <div className="space-y-3 font-mono text-[9px] text-slate-400 bg-slate-950 p-4 rounded-xl border border-slate-900 h-56 overflow-y-auto leading-normal">
            {errorLogs.map((log, idx) => (
              <div key={idx} className="pb-2.5 border-b border-slate-100/80 last:border-0 last:pb-0 space-y-0.5">
                <div className="flex justify-between text-slate-500">
                  <span>[{log.time}] {log.source}</span>
                  <span className={`uppercase font-bold ${
                    log.type === "warning" ? "text-amber-500" : "text-blue-500"
                  }`}>{log.type}</span>
                </div>
                <p className="text-slate-300 leading-normal">{log.message}</p>
              </div>
            ))}
          </div>

          <div className="text-[9px] text-slate-500 pt-3 border-t border-slate-100">
            For critical database diagnostic triggers, visit Developer endpoints webhooks.
          </div>
        </div>

      </div>

    </div>
  );
}
