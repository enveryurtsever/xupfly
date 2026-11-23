"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Play, Loader2, Zap, CheckCircle2, History, AlertCircle } from "lucide-react";
import { runFullEngineCycleAction, getEngineLogsAction } from "@/lib/actions/engine-actions";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export function EngineControl() {
  const [isRunning, setIsRunning] = useState(false);
  const [status, setStatus] = useState<"idle" | "running" | "success" | "error">("idle");
  const [logs, setLogs] = useState<any[]>([]);
  const [cooldown, setCooldown] = useState(0); // in seconds

  const fetchLogs = useCallback(async () => {
    const data = await getEngineLogsAction();
    setLogs(data);
  }, []);

  useEffect(() => {
    fetchLogs();
    
    // Check if there's a stored cooldown in localStorage
    const savedCooldown = localStorage.getItem("engine_cooldown");
    if (savedCooldown) {
      const remaining = Math.floor((parseInt(savedCooldown) - Date.now()) / 1000);
      if (remaining > 0) setCooldown(remaining);
    }
  }, [fetchLogs]);

  useEffect(() => {
    let timer: any;
    if (cooldown > 0) {
      timer = setInterval(() => {
        setCooldown((prev) => {
          if (prev <= 1) {
            localStorage.removeItem("engine_cooldown");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleRunCycle = async () => {
    if (cooldown > 0) {
      toast.error(`Please wait ${Math.ceil(cooldown / 60)} minutes before next run.`);
      return;
    }

    setIsRunning(true);
    setStatus("running");
    
    try {
      const result = await runFullEngineCycleAction();
      if (result.success) {
        setStatus("success");
        toast.success(result.message || "Engine cycle completed!");
        
        // Set 3 minute cooldown (180 seconds)
        const expiry = Date.now() + 180 * 1000;
        setCooldown(180);
        localStorage.setItem("engine_cooldown", expiry.toString());
        
        await fetchLogs();
        setTimeout(() => setStatus("idle"), 5000);
      } else {
        setStatus("error");
        toast.error(result.error || "Failed to run engine cycle");
      }
    } catch (error) {
      setStatus("error");
      toast.error("An error occurred while running the engine.");
    } finally {
      setIsRunning(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="space-y-6">
      <Card className={cn(
        "border-0 text-white rounded-[2.5rem] overflow-hidden shadow-2xl transition-all duration-500 relative group",
        status === "running" ? "bg-slate-900 scale-[0.98]" : 
        status === "success" ? "bg-emerald-600" : "bg-slate-900"
      )}>
        <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/10 rounded-full blur-3xl -mr-16 -mt-16 animate-pulse" />
        
        <CardContent className="p-8 relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div className={cn(
              "w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-transform duration-500",
              status === "running" ? "bg-sky-500 animate-spin-slow" : 
              status === "success" ? "bg-white text-emerald-600 scale-110" : "bg-sky-500 text-white"
            )}>
              {status === "running" ? <Loader2 size={24} className="animate-spin" /> : 
               status === "success" ? <CheckCircle2 size={24} /> : <Zap size={24} fill="currentColor" />}
            </div>
            {cooldown > 0 && (
              <Badge className="bg-amber-500/20 text-amber-500 border-0 font-black px-3 py-1 animate-pulse">
                Cooldown: {formatTime(cooldown)}
              </Badge>
            )}
          </div>

          <h3 className="text-xl font-black mb-2 tracking-tight">Otonom Engine</h3>
          <p className="text-slate-400 text-xs font-medium mb-8">
            Trigger one smart action based on account priority.
          </p>

          <Button 
            onClick={handleRunCycle}
            disabled={isRunning || cooldown > 0}
            className={cn(
              "w-full h-14 rounded-2xl font-black text-sm gap-3 transition-all duration-300 shadow-xl",
              cooldown > 0 ? "bg-slate-800 text-slate-500 cursor-not-allowed" :
              status === "success" ? "bg-white text-emerald-600" : "bg-sky-500 hover:bg-sky-600 text-white"
            )}
          >
            {isRunning ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Processing...
              </>
            ) : cooldown > 0 ? (
              <>
                <AlertCircle size={18} />
                Ready in {formatTime(cooldown)}
              </>
            ) : (
              <>
                <Play size={18} fill="currentColor" />
                Run Smart Cycle
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Activity Logs Section */}
      <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-slate-900">
            <History size={18} className="text-sky-500" />
            <span className="font-black text-sm uppercase tracking-wider">Engine Activity</span>
          </div>
          <Button variant="ghost" size="sm" onClick={fetchLogs} className="h-8 text-[10px] font-black uppercase text-slate-400">
            Refresh
          </Button>
        </div>

        <div className="space-y-3">
          {logs.length === 0 ? (
            <p className="text-center py-6 text-slate-300 text-xs font-bold italic">No recent activity recorded.</p>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50/50 border border-slate-100/50">
                <div className={cn(
                  "mt-0.5 w-6 h-6 rounded-lg flex items-center justify-center shrink-0",
                  log.actionType === 'like' ? "bg-rose-50 text-rose-500" :
                  log.actionType === 'post' ? "bg-sky-50 text-sky-500" :
                  log.actionType === 'reply' ? "bg-emerald-50 text-emerald-500" : "bg-slate-100 text-slate-500"
                )}>
                  <Zap size={12} fill="currentColor" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-bold text-slate-800 leading-tight">
                    <span className="text-sky-600">@{log.screenName}</span>: {log.description}
                  </p>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter mt-1">
                    {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {log.actionType}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
