import { auth } from "@/auth";
import { db } from "@/db";
import { xAccounts, niches, automationRules } from "@/db/schema";
import { eq } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { 
  Settings2, 
  Sparkles, 
  ShieldCheck, 
  ArrowLeft, 
  Save, 
  AlertCircle,
  Zap,
  Brain,
  Trash2
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { XIcon } from "@/components/ui/icons";
import { PageHeader } from "@/components/layout/PageHeader";
import { SettingsForm } from "./SettingsForm";

export const metadata = { title: "Account Settings" };

export default async function AccountSettingsPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return null;

  const { id } = await params;

  const [account] = await db
    .select()
    .from(xAccounts)
    .where(eq(xAccounts.id, id));


  if (!account) return <div>Account not found</div>;

  const [rules] = await db
    .select()
    .from(automationRules)
    .where(eq(automationRules.accountId, account.id));

  const allNiches = await db.select().from(niches);

  return (
    <div className="space-y-10">
      <PageHeader 
        title="Account Settings"
        description="Configure automation rules and AI behavior."
        badge={<Badge variant="secondary" className="rounded-lg bg-sky-50 text-sky-600 font-black text-[10px] uppercase tracking-widest px-3 py-1">@{account.screenName}</Badge>}
        actions={
          <div className="flex items-center gap-3">
            <Link href="/dashboard/accounts">
              <Button variant="ghost" size="icon" className="w-10 h-10 rounded-xl bg-white shadow-sm hover:bg-slate-50 text-slate-400 transition-all border border-slate-100">
                <ArrowLeft size={18} />
              </Button>
            </Link>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <SettingsForm account={account} rules={rules} niches={allNiches} />

        <div className="space-y-8">
          <Card className="bg-white border-slate-100 shadow-sm rounded-3xl overflow-hidden self-start">
            <CardHeader className="p-8 border-b border-slate-50">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-500 flex items-center justify-center shadow-sm">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <CardTitle className="text-xl font-black text-slate-900">Health Check</CardTitle>
                  <CardDescription className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-0.5">API Status</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100">
                <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-1">Connection</p>
                <p className="text-emerald-700 font-black text-sm flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Healthy & Active
                </p>
              </div>
              
              <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-50/50 border border-amber-100">
                <AlertCircle className="text-amber-500 shrink-0 mt-0.5" size={16} />
                <p className="text-amber-800 text-[11px] font-medium leading-relaxed">
                  Avoid frequent niche changes to maintain AI consistency.
                </p>
              </div>

              <Button variant="outline" className="w-full h-11 rounded-xl font-black text-rose-600 border-rose-100 hover:bg-rose-50 text-xs">
                Disconnect Account
              </Button>
            </CardContent>
          </Card>

          <Card className={cn(
            "border-0 rounded-3xl overflow-hidden shadow-xl shadow-slate-900/20 relative",
            session.user.role === "admin" ? "bg-gradient-to-br from-blue-600 to-sky-500 text-white" : "bg-slate-900 text-white"
          )}>
            <CardContent className="p-8">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center mb-6">
                <Brain size={20} className={cn(session.user.role === "admin" ? "text-white" : "text-sky-400")} />
              </div>
              <h3 className="text-xl font-black mb-2 leading-tight">
                {session.user.role === "admin" ? "AI Personality Active" : "AI Personality"}
              </h3>
              <p className="text-blue-50 text-[11px] leading-relaxed mb-6 font-medium">
                {session.user.role === "admin" 
                  ? "As an Admin, you have full access to customize AI behavior and tone." 
                  : "Customize how the AI talks and interacts. Available in the Professional plan."}
              </p>
              <Button className={cn(
                "w-full font-black rounded-xl h-11 text-xs border-0",
                session.user.role === "admin" ? "bg-white text-blue-600 hover:bg-blue-50" : "bg-sky-500 text-white hover:bg-sky-400"
              )}>
                {session.user.role === "admin" ? "Configure Personality" : "Upgrade Plan"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
