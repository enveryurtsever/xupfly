"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { History, Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { purchasePlanAction } from "@/lib/actions/credit-actions";

interface Plan {
  id: string;
  planName: string;
  priceUsd: string;
  creditAmount: number;
  isPopular: boolean | null;
}

interface Transaction {
  id: string;
  amount: number;
  type: string | null;
  description: string | null;
  createdAt: Date | null;
}

interface CreditsClientProps {
  plans: Plan[];
  initialTransactions: Transaction[];
}

export function CreditsClient({ plans, initialTransactions }: CreditsClientProps) {
  const [isPurchasing, setIsPurchasing] = useState<string | null>(null);

  const handlePurchase = async (plan: Plan) => {
    setIsPurchasing(plan.id);
    try {
      const result = await purchasePlanAction(plan.id, plan.creditAmount, Number(plan.priceUsd));
      if (result.success) {
        toast.success(`Success! ${plan.creditAmount} credits added to your account.`);
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error("Purchase error.");
    } finally {
      setIsPurchasing(null);
    }
  };

  return (
    <div className="space-y-10">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <Card key={plan.id} className={cn(
            "bg-white border-slate-100 shadow-sm rounded-3xl overflow-hidden relative group hover:scale-[1.02] transition-transform duration-300",
            plan.isPopular && "ring-2 ring-blue-500 shadow-lg shadow-blue-500/5"
          )}>
            {plan.isPopular && (
              <div className="absolute top-4 right-4 z-20">
                <Badge className="bg-blue-500 text-white border-0 font-black px-2 py-0.5 text-[9px] tracking-widest uppercase">Popular</Badge>
              </div>
            )}
            <CardHeader className="p-6 pb-2 relative z-10">
              <CardTitle className="text-xl font-black text-slate-900">{plan.planName}</CardTitle>
              <CardDescription className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-1">Growth Package</CardDescription>
            </CardHeader>
            <CardContent className="p-6 pt-4 relative z-10">
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-3xl font-black text-slate-900">${plan.priceUsd}</span>
                <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">/one-time</span>
              </div>
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-2.5 text-[11px] font-bold text-slate-600">
                  <div className="w-4 h-4 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                    <Check size={10} strokeWidth={4} />
                  </div>
                  {plan.creditAmount.toLocaleString()} Credits
                </div>
                <div className="flex items-center gap-2.5 text-[11px] font-bold text-slate-600">
                  <div className="w-4 h-4 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                    <Check size={10} strokeWidth={4} />
                  </div>
                  AI Content Generation
                </div>
                <div className="flex items-center gap-2.5 text-[11px] font-bold text-slate-600">
                  <div className="w-4 h-4 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                    <Check size={10} strokeWidth={4} />
                  </div>
                  Auto-Posting Engine
                </div>
              </div>
              <Button 
                onClick={() => handlePurchase(plan)}
                disabled={isPurchasing === plan.id}
                className={cn(
                  "w-full h-11 rounded-xl font-black text-xs shadow-sm border-0 transition-all uppercase tracking-widest",
                  plan.isPopular ? "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20" : "bg-slate-50 hover:bg-slate-100 text-slate-900"
                )}
              >
                {isPurchasing === plan.id ? <Loader2 size={16} className="animate-spin" /> : "Purchase Plan"}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-white border-slate-100 shadow-sm rounded-3xl overflow-hidden">
        <CardHeader className="p-8 border-b border-slate-50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-slate-50 text-slate-400">
              <History size={20} />
            </div>
            <CardTitle className="text-xl font-bold text-slate-900">Transaction History</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-slate-50">
            {initialTransactions.map((tx) => (
              <div key={tx.id} className="p-6 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center font-black shadow-sm",
                    tx.amount > 0 ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                  )}>
                    {tx.amount > 0 ? "+" : ""}{tx.amount}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">{tx.description}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                      {tx.createdAt ? new Date(tx.createdAt).toLocaleDateString() : "Unknown"}
                    </p>
                  </div>
                </div>
                <div className="px-3 py-1 rounded-full bg-slate-100 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  {tx.type}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
