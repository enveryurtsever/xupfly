"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  X as XIcon, 
  Plus, 
  Settings2, 
  RefreshCcw, 
  Trash2, 
  ShieldCheck,
  Loader2
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { deleteAccountAction, syncAccountAction } from "@/lib/actions/account-actions";

interface Account {
  id: string;
  screenName: string | null;
  profileImage: string | null;
  nicheId: string | null;
  nicheName: string | null;
  isActive: boolean | null;
  lastSync: Date | null;
}

interface AccountsClientProps {
  initialAccounts: Account[];
}

export function AccountsClient({ initialAccounts }: AccountsClientProps) {
  const [accounts, setAccounts] = useState(initialAccounts);
  const [isSyncing, setIsSyncing] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this account?")) return;
    
    setIsDeleting(id);
    try {
      const result = await deleteAccountAction(id);
      if (result.success) {
        setAccounts(accounts.filter(a => a.id !== id));
        toast.success("Account removed.");
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error("Error deleting account.");
    } finally {
      setIsDeleting(null);
    }
  };

  const handleSync = async (id: string) => {
    setIsSyncing(id);
    try {
      const result = await syncAccountAction(id);
      if (result.success) {
        toast.success("Account synced successfully.");
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error("Sync error.");
    } finally {
      setIsSyncing(null);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {accounts.map((acc) => (
        <Card key={acc.id} className="bg-white border-slate-100 shadow-sm rounded-3xl overflow-hidden group hover:shadow-lg hover:shadow-sky-500/5 transition-all duration-300">
          <CardHeader className="p-6 pb-0 flex flex-row items-center justify-between space-y-0">
            <div className={cn(
              "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2",
              acc.isActive ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-400"
            )}>
              <div className={cn("w-1.5 h-1.5 rounded-full", acc.isActive ? "bg-emerald-500 animate-pulse" : "bg-slate-300")} />
              {acc.isActive ? "Active" : "Paused"}
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => handleDelete(acc.id)}
              disabled={isDeleting === acc.id}
              className="w-10 h-10 rounded-xl text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-colors"
            >
              {isDeleting === acc.id ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
            </Button>
          </CardHeader>
          <CardContent className="p-6 pt-4">
            <div className="flex items-center gap-4 mb-6">
              <div className="relative">
                <img 
                  src={acc.profileImage || `https://ui-avatars.com/api/?name=${acc.screenName || 'X'}&background=0EA5E9&color=fff`} 
                  alt={acc.screenName || "X Account"} 
                  className="w-16 h-16 rounded-2xl object-cover ring-4 ring-slate-50"
                />
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-sky-500 rounded-lg flex items-center justify-center border-2 border-white shadow-sm">
                  <XIcon size={10} className="text-white" />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">@{acc.screenName}</h3>
                <p className="text-[10px] font-black text-sky-500 flex items-center gap-1.5 mt-0.5 uppercase tracking-widest">
                  <ShieldCheck size={14} />
                  Verified
                </p>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50/50 border border-slate-100">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Niche</span>
                <span className="text-xs font-black text-slate-700">{acc.nicheName || "Not Set"}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50/50 border border-slate-100">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Sync</span>
                <span className="text-xs font-black text-slate-700">
                  {acc.lastSync ? new Date(acc.lastSync).toLocaleDateString() : "Never"}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Link href={`/dashboard/accounts/${acc.id}/settings`} className="w-full">
                <Button variant="outline" className="w-full py-6 h-auto rounded-xl font-bold text-slate-600 gap-2 border-slate-200 text-sm">
                  <Settings2 size={16} />
                  Settings
                </Button>
              </Link>
              <Button 
                variant="outline" 
                onClick={() => handleSync(acc.id)}
                disabled={isSyncing === acc.id}
                className="w-full py-6 h-auto rounded-xl font-bold text-slate-600 gap-2 border-slate-200 text-sm"
              >
                {isSyncing === acc.id ? <Loader2 size={16} className="animate-spin" /> : <RefreshCcw size={16} />}
                Sync
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}

      <Link href="/api/auth/x/connect" className="border-2 border-dashed border-slate-200 rounded-3xl p-8 flex flex-col items-center justify-center gap-3 hover:bg-white hover:border-sky-300 transition-all group min-h-[300px]">

        <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-sky-50 group-hover:text-sky-500 transition-colors shadow-inner">
          <Plus size={24} />
        </div>
        <p className="font-black text-lg text-slate-400 group-hover:text-sky-600 transition-colors">Add Account</p>
      </Link>
    </div>
  );
}
