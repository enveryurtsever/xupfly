"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { 
  Save, 
  Zap,
  Check
} from "lucide-react";
import { toast } from "sonner";
import { updateAccountSettingsAction } from "@/lib/actions/account-actions";
import { cn } from "@/lib/utils";

interface SettingsFormProps {
  account: any;
  rules: any;
  niches: any[];
}

export function SettingsForm({ account, rules, niches }: SettingsFormProps) {
  const [loading, setLoading] = useState(false);
  const [automationEnabled, setAutomationEnabled] = useState(account.automationEnabled || false);
  const [dailyPostLimit, setDailyPostLimit] = useState(rules?.dailyPostLimit || 3);
  const [dailyReplyLimit, setDailyReplyLimit] = useState(rules?.dailyReplyLimit || 0);
  const [dailyLikeLimit, setDailyLikeLimit] = useState(rules?.dailyLikeLimit || 0);
  const [autoReply, setAutoReply] = useState(rules?.autoReply || false);
  const [autoLike, setAutoLike] = useState(rules?.autoLike || false);
  const [smartRetweet, setSmartRetweet] = useState(rules?.smartRetweet || false);
  const [aiWelcome, setAiWelcome] = useState(rules?.aiWelcome || false);
  const [searchKeywords, setSearchKeywords] = useState(rules?.searchKeywords || "");
  const [preferredHours, setPreferredHours] = useState<number[]>(rules?.preferredHours || []);
  const [nicheId, setNicheId] = useState(account.nicheId || "none");
  const [customNicheName, setCustomNicheName] = useState("");

  async function handleSave() {
    setLoading(true);
    try {
      const result = await updateAccountSettingsAction(account.id, {
        automationEnabled,
        dailyPostLimit: Number(dailyPostLimit),
        dailyReplyLimit: Number(dailyReplyLimit),
        dailyLikeLimit: Number(dailyLikeLimit),
        autoReply,
        autoLike,
        smartRetweet,
        aiWelcome,
        searchKeywords,
        preferredHours,
        nicheId,
        customNicheName: nicheId === "other" ? customNicheName : undefined,
      });

      if (result.success) {
        toast.success("Settings saved successfully!");
      } else {
        toast.error(result.error || "Failed to save settings");
      }
    } catch (err) {
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="lg:col-span-2 space-y-8">
      <Card className="bg-white border-slate-100 shadow-sm rounded-3xl overflow-hidden">
        <CardHeader className="p-8 border-b border-slate-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-inner">
                <Zap size={20} />
              </div>
              <div>
                <CardTitle className="text-xl font-black text-slate-900 leading-tight">Automation Engine</CardTitle>
                <CardDescription className="text-slate-400 font-bold mt-0.5 uppercase tracking-widest text-[9px]">Master switch for AI activity</CardDescription>
              </div>
            </div>
            <Switch 
              className="data-[state=checked]:bg-emerald-500" 
              checked={automationEnabled}
              onCheckedChange={setAutomationEnabled}
            />
          </div>
        </CardHeader>
        <CardContent className="p-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Daily Post Limit</label>
              <div className="relative">
                <input 
                  type="number" 
                  value={dailyPostLimit}
                  onChange={(e) => setDailyPostLimit(e.target.value)}
                  className="w-full h-11 rounded-xl border border-slate-100 bg-slate-50/50 px-4 font-bold text-slate-700 focus:border-sky-500 focus:bg-white outline-none transition-all"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 font-black text-[9px] uppercase">Posts/Day</div>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Target Niche</label>
              <select 
                value={nicheId}
                onChange={(e) => setNicheId(e.target.value)}
                className="w-full h-11 rounded-xl border border-slate-100 bg-slate-50/50 px-4 font-bold text-slate-700 focus:border-sky-500 focus:bg-white outline-none transition-all appearance-none cursor-pointer"
              >
                <option value="none">Select a niche...</option>
                {niches.map(niche => (
                  <option key={niche.id} value={niche.id}>{niche.name}</option>
                ))}
                <option value="other" className="text-sky-600 font-black">+ Other (Write manually)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Daily Reply Limit</label>
              <div className="relative">
                <input 
                  type="number" 
                  value={dailyReplyLimit}
                  onChange={(e) => setDailyReplyLimit(e.target.value)}
                  className="w-full h-11 rounded-xl border border-slate-100 bg-slate-50/50 px-4 font-bold text-slate-700 focus:border-sky-500 focus:bg-white outline-none transition-all"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 font-black text-[9px] uppercase">Replies/Day</div>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Daily Like Limit</label>
              <div className="relative">
                <input 
                  type="number" 
                  value={dailyLikeLimit}
                  onChange={(e) => setDailyLikeLimit(e.target.value)}
                  className="w-full h-11 rounded-xl border border-slate-100 bg-slate-50/50 px-4 font-bold text-slate-700 focus:border-sky-500 focus:bg-white outline-none transition-all"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 font-black text-[9px] uppercase">Likes/Day</div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Search Keywords (Trends)</label>
            <input 
              type="text" 
              placeholder="e.g. usa news, immigration laws, visa tips..."
              value={searchKeywords}
              onChange={(e) => setSearchKeywords(e.target.value)}
              className="w-full h-11 rounded-xl border border-slate-100 bg-slate-50/50 px-4 font-bold text-slate-700 focus:border-sky-500 focus:bg-white outline-none transition-all shadow-sm"
            />
            <p className="text-[9px] text-slate-400 font-medium ml-1">Comma-separated terms to track on X. AI will use these for inspiration.</p>
          </div>

          {nicheId === "other" && (
            <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
              <label className="text-[10px] font-black text-sky-500 uppercase tracking-widest ml-1">Custom Niche Name</label>
              <input 
                type="text" 
                placeholder="e.g. USA Immigration, Living in America..."
                value={customNicheName}
                onChange={(e) => setCustomNicheName(e.target.value)}
                className="w-full h-11 rounded-xl border-2 border-sky-100 bg-sky-50/30 px-4 font-bold text-slate-700 focus:border-sky-500 focus:bg-white outline-none transition-all shadow-inner"
              />
              <p className="text-[9px] text-slate-400 font-medium ml-1">System will create this niche and focus AI content on it.</p>
            </div>
          )}

          <div className="space-y-4 pt-6 border-t border-slate-50">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Active Hours</h3>
                <p className="text-[10px] text-slate-400 font-medium mt-0.5">Select the hours when AI automation should be active.</p>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-[9px] font-black uppercase text-sky-600 h-7"
                  onClick={() => setPreferredHours(Array.from({ length: 24 }).map((_, i) => i))}
                >
                  All
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-[9px] font-black uppercase text-slate-400 h-7"
                  onClick={() => setPreferredHours([])}
                >
                  None
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-12 gap-2">
              {Array.from({ length: 24 }).map((_, i) => {
                const isSelected = preferredHours.includes(i);
                return (
                  <button
                    key={i}
                    onClick={() => {
                      if (isSelected) setPreferredHours(preferredHours.filter(h => h !== i));
                      else setPreferredHours([...preferredHours, i].sort((a, b) => a - b));
                    }}
                    className={cn(
                      "h-10 rounded-lg flex items-center justify-center font-bold text-xs transition-all border",
                      isSelected 
                        ? "bg-sky-500 text-white border-sky-500 shadow-sm" 
                        : "bg-slate-50 text-slate-400 border-slate-100 hover:border-slate-200"
                    )}
                  >
                    {i.toString().padStart(2, "0")}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-6 pt-6 border-t border-slate-50">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Engagement Rules</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { label: "Auto-Reply", desc: "Respond to mentions", value: autoReply, setter: setAutoReply },
                { label: "Auto-Like", desc: "Like niche content", value: autoLike, setter: setAutoLike },
                { label: "Smart Retweet", desc: "Share high-value posts", value: smartRetweet, setter: setSmartRetweet },
                { label: "AI Welcome", desc: "Greet new followers", value: aiWelcome, setter: setAiWelcome }
              ].map((rule, i) => (
                <div key={i} className="flex items-start justify-between p-4 rounded-2xl bg-slate-50/50 border border-slate-100 group hover:border-sky-100 transition-all">
                  <div>
                    <p className="font-black text-slate-800 text-sm mb-0.5">{rule.label}</p>
                    <p className="text-[10px] font-medium text-slate-400 leading-tight">{rule.desc}</p>
                  </div>
                  <Switch 
                    className="data-[state=checked]:bg-sky-500" 
                    checked={rule.value}
                    onCheckedChange={rule.setter}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4">
            <Button 
              onClick={handleSave} 
              disabled={loading}
              size="lg" 
              className="w-full md:w-auto px-8 h-12 gap-2 text-sm font-black bg-sky-500 rounded-xl shadow-lg shadow-sky-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Save size={18} />
              )}
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
