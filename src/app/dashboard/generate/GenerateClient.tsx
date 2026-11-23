"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Zap, Brain, Info, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { triggerManualGeneration } from "@/lib/actions/generate-actions";
import { toast } from "sonner";

interface Niche {
  id: string;
  name: string;
}

interface XAccount {
  id: string;
  screenName: string | null;
}

interface GenerateClientProps {
  niches: Niche[];
  accounts: XAccount[];
  isAdmin?: boolean;
}

export function GenerateClient({ niches, accounts, isAdmin }: GenerateClientProps) {
  const [selectedNiche, setSelectedNiche] = useState<string>(niches[0]?.id || "");
  const [selectedAccount, setSelectedAccount] = useState<string>(accounts[0]?.id || "");
  const [selectedLang, setSelectedLang] = useState<string>("en");
  const [selectedLocation, setSelectedLocation] = useState<string>("");
  const [customNicheName, setCustomNicheName] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const handleRunGeneration = async () => {
    if (!selectedNiche || !selectedAccount) {
      toast.error("Please select both a niche and an account.");
      return;
    }

    setIsGenerating(true);
    try {
      const result = await triggerManualGeneration(
        selectedNiche, 
        selectedAccount,
        selectedLang,
        selectedLocation,
        selectedNiche === "other" ? customNicheName : undefined
      );
      
      if (result.success) {
        toast.success(`Success! Generated ${result.generated} new posts.`);
      } else {
        toast.error(result.error || "Failed to generate posts.");
      }
    } catch (error) {
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
      <div className="lg:col-span-2 space-y-10">
        <Card className="bg-white border-slate-100 shadow-sm rounded-[2.5rem] overflow-hidden">
          <CardHeader className="p-10 border-b border-slate-50">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center shadow-inner">
                <Brain size={28} />
              </div>
              <div>
                <CardTitle className="text-2xl font-black text-slate-900 leading-tight">Generation Settings</CardTitle>
                <CardDescription className="text-slate-400 font-bold mt-1 uppercase tracking-widest text-[10px]">Configure your AI creative parameters</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-10 space-y-8">
            <div className="space-y-4">
              <label className="text-sm font-black text-slate-900 uppercase tracking-widest ml-1">Select Target Niche</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {niches.map((niche) => (
                  <button
                    key={niche.id}
                    onClick={() => setSelectedNiche(niche.id)}
                    className={cn(
                      "p-5 rounded-2xl border-2 transition-all text-left group",
                      selectedNiche === niche.id 
                        ? "border-sky-500 bg-sky-50/50 shadow-inner" 
                        : "border-slate-100 hover:border-sky-200 hover:bg-sky-50/50"
                    )}
                  >
                    <p className={cn(
                      "font-black transition-colors",
                      selectedNiche === niche.id ? "text-sky-600" : "text-slate-800 group-hover:text-sky-600"
                    )}>
                      {niche.name}
                    </p>
                    <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-tighter">AI Optimized</p>
                  </button>
                ))}

                {/* Other Option Card */}
                <button
                  onClick={() => setSelectedNiche("other")}
                  className={cn(
                    "p-5 rounded-2xl border-2 transition-all text-left group border-dashed",
                    selectedNiche === "other" 
                      ? "border-sky-500 bg-sky-50/50 shadow-inner" 
                      : "border-slate-100 hover:border-sky-200 hover:bg-sky-50/50"
                  )}
                >
                  <p className={cn(
                    "font-black transition-colors flex items-center gap-2",
                    selectedNiche === "other" ? "text-sky-600" : "text-slate-500 group-hover:text-sky-600"
                  )}>
                    <Sparkles size={14} />
                    Other
                  </p>
                  <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-tighter">Custom Topic</p>
                </button>
              </div>
            </div>

            {selectedNiche === "other" && (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                <label className="text-sm font-black text-sky-600 uppercase tracking-widest ml-1">Describe Custom Niche</label>
                <input 
                  type="text"
                  placeholder="e.g. USA Immigration News, Living in Texas, EB-2 Visa Tips..."
                  value={customNicheName}
                  onChange={(e) => setCustomNicheName(e.target.value)}
                  className="w-full h-16 rounded-2xl border-2 border-sky-100 bg-sky-50/30 px-6 font-bold text-slate-700 focus:border-sky-500 focus:bg-white outline-none transition-all shadow-inner"
                />
                <p className="text-[10px] text-slate-400 font-bold ml-1 italic">Our AI will perform a fresh search and generate content based on this specific topic.</p>
              </div>
            )}

            <div className="space-y-4">
              <label className="text-sm font-black text-slate-900 uppercase tracking-widest ml-1">Target Account</label>
              <select 
                value={selectedAccount}
                onChange={(e) => setSelectedAccount(e.target.value)}
                className="w-full h-16 rounded-2xl border-2 border-slate-100 bg-slate-50/50 px-6 font-bold text-slate-700 focus:border-sky-500 focus:bg-white outline-none transition-all appearance-none"
              >
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>@{acc.screenName}</option>
                ))}
                {accounts.length === 0 && <option value="">No accounts connected</option>}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <label className="text-sm font-black text-slate-900 uppercase tracking-widest ml-1">Language</label>
                <select 
                  value={selectedLang}
                  onChange={(e) => setSelectedLang(e.target.value)}
                  className="w-full h-16 rounded-2xl border-2 border-slate-100 bg-slate-50/50 px-6 font-bold text-slate-700 focus:border-sky-500 focus:bg-white outline-none transition-all appearance-none"
                >
                  <option value="en">English</option>
                  <option value="tr">Turkish</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                  <option value="de">German</option>
                </select>
              </div>

              <div className="space-y-4">
                <label className="text-sm font-black text-slate-900 uppercase tracking-widest ml-1">Location</label>
                <select 
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  className="w-full h-16 rounded-2xl border-2 border-slate-100 bg-slate-50/50 px-6 font-bold text-slate-700 focus:border-sky-500 focus:bg-white outline-none transition-all appearance-none"
                >
                  <option value="">Global</option>
                  <option value="USA">United States</option>
                  <option value="Turkey">Turkey</option>
                  <option value="London">United Kingdom</option>
                  <option value="Berlin">Germany</option>
                </select>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-50">
              <Button 
                onClick={handleRunGeneration}
                disabled={isGenerating || accounts.length === 0}
                className="w-full h-20 gap-4 text-xl rounded-[1.5rem] bg-gradient-to-br from-sky-400 to-blue-600 shadow-xl shadow-sky-500/25"
              >
                {isGenerating ? (
                  <>
                    <Loader2 size={28} className="animate-spin" />
                    Generating Content...
                  </>
                ) : (
                  <>
                    <Sparkles size={28} className="animate-pulse" />
                    Run AI Generation Cycle
                  </>
                )}
              </Button>
              <p className="text-center text-slate-400 font-bold text-xs mt-6 flex items-center justify-center gap-2">
                <Info size={14} />
                Each cycle generates 5 unique posts and costs 10 credits.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-8">
        {/* Pro Automation Card */}
        <Card className="bg-slate-900 text-white border-0 rounded-[2.5rem] overflow-hidden shadow-2xl shadow-slate-900/20 relative group">
          <div className="absolute top-0 right-0 w-48 h-48 bg-sky-500/20 rounded-full blur-[80px] -mr-24 -mt-24 group-hover:bg-sky-500/30 transition-colors" />
          <CardContent className="p-10 relative z-10">
            <div className="w-16 h-16 rounded-[1.5rem] bg-sky-500 flex items-center justify-center mb-8 shadow-lg shadow-sky-500/30">
              <Zap size={32} className="text-white" />
            </div>
            <h3 className="text-3xl font-black mb-4 leading-tight">Pro Automation</h3>
            <p className="text-slate-400 text-lg leading-relaxed mb-8 font-medium">
              {isAdmin 
                ? "You have full administrative access. All automation features are unlocked for your testing and management." 
                : "Unlock full automation and let our AI manage your accounts 24/7 without manual triggers."}
            </p>
            {!isAdmin && (
              <Button className="w-full bg-white text-slate-900 hover:bg-slate-50 font-black rounded-2xl py-8 h-auto shadow-sm border-0 text-lg">
                Upgrade Now
              </Button>
            )}
            {isAdmin && (
              <div className="p-4 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-400 text-center font-black uppercase tracking-widest text-xs">
                Admin Mode Active
              </div>
            )}
          </CardContent>
        </Card>

        {/* Help / How it Works Card */}
        <Card className="bg-white border-slate-100 shadow-sm rounded-[2.5rem] overflow-hidden">
          <CardHeader className="p-8 border-b border-slate-50">
            <CardTitle className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Info size={18} className="text-sky-500" />
              How it Works
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 space-y-6">
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex-shrink-0 flex items-center justify-center font-black text-xs border border-sky-100">1</div>
                <div>
                  <p className="font-bold text-slate-900 text-sm">Select Niche & Account</p>
                  <p className="text-xs text-slate-400 font-medium leading-relaxed">Choose your target audience and the X account you want to create content for.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex-shrink-0 flex items-center justify-center font-black text-xs border border-sky-100">2</div>
                <div>
                  <p className="font-bold text-slate-900 text-sm">Rapid API Search</p>
                  <p className="text-xs text-slate-400 font-medium leading-relaxed">The system fetches real-time viral tweets and trending topics using Rapid API for your specific niche.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex-shrink-0 flex items-center justify-center font-black text-xs border border-sky-100">3</div>
                <div>
                  <p className="font-bold text-slate-900 text-sm">AI Analysis & Generation</p>
                  <p className="text-xs text-slate-400 font-medium leading-relaxed">Our AI analyzes high-performing content and creates 5 original, engaging posts inspired by current trends.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex-shrink-0 flex items-center justify-center font-black text-xs border border-sky-100">4</div>
                <div>
                  <p className="font-bold text-slate-900 text-sm">Review & Credits</p>
                  <p className="text-xs text-slate-400 font-medium leading-relaxed">Generated posts appear in your history. Each cycle costs 10 credits from your balance.</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
