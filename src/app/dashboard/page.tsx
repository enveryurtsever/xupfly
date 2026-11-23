import { auth } from "@/auth";
import { db } from "@/db";
import { xAccounts, creditTransactions, generatedPosts } from "@/db/schema";
import { eq, desc, count } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  TrendingUp, 
  CreditCard, 
  Send, 
  Clock, 
  ArrowUpRight,
  Sparkles,
  ChevronRight,
  Plus,
  History
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/layout/PageHeader";
import { EngineControl } from "@/components/dashboard/EngineControl";

export const metadata = { title: "Dashboard Overview" };

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) return null;
  const userId = session.user.id;

  const accounts = await db
    .select()
    .from(xAccounts)
    .where(eq(xAccounts.ownerId, userId));

  const firstAccountId = accounts[0]?.id;
  const [postStats] = firstAccountId 
    ? await db
        .select({ total: count() })
        .from(generatedPosts)
        .where(eq(generatedPosts.accountId, firstAccountId))
    : [{ total: 0 }];

  const recentTx = await db
    .select()
    .from(creditTransactions)
    .where(eq(creditTransactions.userId, userId))
    .orderBy(desc(creditTransactions.createdAt))
    .limit(5);

  const stats = [
    { label: "Active Accounts", value: accounts.length, icon: TrendingUp, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Credits Balance", value: session.user.totalCredits, icon: CreditCard, color: "text-sky-600", bg: "bg-sky-50" },
    { label: "Total Posts", value: postStats.total, icon: Send, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Pending Approval", value: 0, icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
  ];

  return (
    <div className="space-y-12">
      <PageHeader 
        title="Welcome back,"
        description="Your X automation is running smoothly. Here's your performance snapshot for today."
        badge={<span className="text-3xl font-black text-sky-500">{session.user.name?.split(' ')[0]}</span>}
        actions={
          <Link href="/dashboard/generate">
            <Button size="lg" className="px-8 py-6 h-auto gap-3 text-lg rounded-2xl shadow-lg shadow-sky-500/20 bg-gradient-to-br from-sky-400 to-blue-600">
              <Sparkles size={20} className="animate-pulse" />
              Generate Content
            </Button>
          </Link>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-700 text-white border-0 rounded-3xl shadow-lg shadow-blue-500/20 overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform">
            <TrendingUp size={60} />
          </div>
          <CardContent className="p-8 relative z-10">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-100 mb-1">Active Accounts</p>
            <p className="text-4xl font-black">{accounts.length}</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-sky-400 to-sky-600 text-white border-0 rounded-3xl shadow-lg shadow-sky-400/20 overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform">
            <CreditCard size={60} />
          </div>
          <CardContent className="p-8 relative z-10">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-sky-100 mb-1">Credits Balance</p>
            <p className="text-4xl font-black">{session.user.totalCredits?.toLocaleString()}</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-400 to-teal-600 text-white border-0 rounded-3xl shadow-lg shadow-emerald-500/20 overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform">
            <Send size={60} />
          </div>
          <CardContent className="p-8 relative z-10">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-100 mb-1">Total Posts</p>
            <p className="text-4xl font-black">{postStats.total}</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-100 border-2 border-dashed rounded-3xl flex items-center justify-center group hover:bg-slate-50 transition-colors cursor-pointer">
          <div className="text-center p-6">
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center mx-auto mb-2 text-slate-400 group-hover:bg-sky-50 group-hover:text-sky-500 transition-colors">
              <Plus size={20} />
            </div>
            <p className="text-sm font-black text-slate-400 group-hover:text-slate-600">Connect New</p>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 border-slate-100 shadow-sm rounded-3xl overflow-hidden bg-white">
          <CardHeader className="p-8 border-b border-slate-50 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-xl font-black text-slate-900">Recent Activity</CardTitle>
              <CardDescription className="text-slate-400 font-medium mt-0.5 text-sm">Your latest credit usage and plan updates.</CardDescription>
            </div>
            <Link href="/dashboard/credits">
              <Button variant="ghost" className="rounded-xl font-bold text-sky-500 hover:bg-sky-50 h-10">
                View History <ChevronRight size={14} />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {recentTx.length === 0 ? (
              <div className="p-16 text-center text-slate-300 font-bold">
                No recent activity found.
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {recentTx.map((tx) => (
                  <div key={tx.id} className="p-6 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center font-black shadow-sm",
                        tx.amount > 0 ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                      )}>
                        {tx.amount > 0 ? "+" : ""}{tx.amount}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">{tx.description}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                          {new Date(tx.createdAt!).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="rounded-lg font-black bg-slate-100 text-slate-500 border-0 px-2 py-0.5 text-[10px]">
                      {tx.type}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <EngineControl />
          
          <div className="p-8 rounded-[2rem] bg-sky-50 border border-sky-100">
            <div className="flex items-center gap-3 text-sky-600 mb-3">
              <History size={20} />
              <p className="font-black uppercase tracking-widest text-xs">Automation Tip</p>
            </div>
            <p className="text-sky-900/70 font-bold text-sm leading-relaxed">
              Posting consistently 3 times a day at peak hours increases engagement by up to 400%.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ");
}
