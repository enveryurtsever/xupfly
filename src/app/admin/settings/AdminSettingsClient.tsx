"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Zap, 
  Users, 
  CreditCard, 
  Server,
  Save,
  ShieldCheck,
  ArrowRight,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { updateSystemSettingAction } from "@/lib/actions/admin-settings-actions";

interface AdminSettingsClientProps {
  initialSettings: {
    signupCredits: string;
    creditPrice: string;
  };
}

export function AdminSettingsClient({ initialSettings }: AdminSettingsClientProps) {
  const [signupCredits, setSignupCredits] = useState(initialSettings.signupCredits);
  const [creditPrice, setCreditPrice] = useState(initialSettings.creditPrice);
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
      await updateSystemSettingAction("signup_credits", signupCredits);
      await updateSystemSettingAction("credit_price", creditPrice);
      toast.success("System settings updated successfully!");
    } catch (error) {
      toast.error("Failed to save some settings.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-10">
      <div className="flex justify-end">
        <Button 
          onClick={handleSaveAll}
          disabled={isSaving}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-12 px-6 font-black border-0 shadow-lg shadow-blue-500/20 gap-2"
        >
          {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
          Save All Changes
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Card className="bg-white border-slate-100 shadow-sm rounded-3xl overflow-hidden">
            <CardHeader className="p-8 border-b border-slate-50">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-500 flex items-center justify-center shadow-inner">
                  <Zap size={20} />
                </div>
                <div>
                  <CardTitle className="text-xl font-black text-slate-900">Economic Config</CardTitle>
                  <CardDescription className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-0.5">Credits & Pricing</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Default Signup Credits</label>
                  <input 
                    type="number" 
                    value={signupCredits} 
                    onChange={(e) => setSignupCredits(e.target.value)}
                    className="w-full h-11 rounded-xl border border-slate-100 bg-slate-50/50 px-4 font-bold text-slate-700 focus:border-blue-500 focus:bg-white transition-all outline-none" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Credit Price ($)</label>
                  <input 
                    type="text" 
                    value={creditPrice} 
                    onChange={(e) => setCreditPrice(e.target.value)}
                    className="w-full h-11 rounded-xl border border-slate-100 bg-slate-50/50 px-4 font-bold text-slate-700 focus:border-blue-500 focus:bg-white transition-all outline-none" 
                  />
                </div>
              </div>

              <div className="pt-6 border-t border-slate-50">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Feature Toggles</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { label: "Signups", icon: Users, color: "text-blue-500" },
                    { label: "AI Engine", icon: Zap, color: "text-amber-500" },
                    { label: "Payments", icon: CreditCard, color: "text-emerald-500" },
                    { label: "API Sync", icon: Server, color: "text-slate-500" }
                  ].map((f, i) => (
                    <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50/50 border border-slate-100 group hover:border-blue-200 transition-all">
                      <div className="flex items-center gap-3">
                        <div className={cn("w-8 h-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center", f.color)}>
                          <f.icon size={14} />
                        </div>
                        <span className="text-sm font-bold text-slate-700">{f.label}</span>
                      </div>
                      <div className="w-10 h-5 bg-blue-500 rounded-full relative cursor-pointer">
                        <div className="absolute right-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow-sm" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
          <Card className="bg-white border-slate-100 shadow-sm rounded-3xl overflow-hidden self-start">
            <CardHeader className="p-8 border-b border-slate-50">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center shadow-sm">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <CardTitle className="text-xl font-black text-slate-900">Security & API</CardTitle>
                  <CardDescription className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-0.5">Access control</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8 space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">X API Key</label>
                <input type="password" value="••••••••••••••••" className="w-full h-11 rounded-xl border border-slate-100 bg-slate-50/50 px-4 font-bold text-slate-700 outline-none" readOnly />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">AI Endpoint</label>
                <input type="text" value="https://api.openai.com/v1" className="w-full h-11 rounded-xl border border-slate-100 bg-slate-50/50 px-4 font-bold text-slate-700 outline-none" readOnly />
              </div>
              <Button variant="ghost" className="w-full h-11 rounded-xl font-black text-[10px] uppercase tracking-widest text-blue-500 bg-blue-50 hover:bg-blue-100 gap-2 mt-2">
                Rotate Keys
                <ArrowRight size={14} />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
