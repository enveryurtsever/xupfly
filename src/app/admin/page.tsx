import { auth } from "@/auth";
import { db } from "@/db";
import { users, pricingPlans, creditTransactions, xAccounts } from "@/db/schema";
import { count, sum, desc } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  CreditCard, 
  TrendingUp, 
  Activity, 
  ArrowUpRight,
  ChevronRight,
  Zap,
  ShieldCheck
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/layout/PageHeader";

export const metadata = { title: "Admin Overview" };

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") return null;

  const [userCount] = await db.select({ value: count() }).from(users);
  const [planCount] = await db.select({ value: count() }).from(pricingPlans);
  const [totalCredits] = await db.select({ value: sum(creditTransactions.amount) }).from(creditTransactions);
  const [accountCount] = await db.select({ value: count() }).from(xAccounts);

  const recentUsers = await db
    .select()
    .from(users)
    .orderBy(desc(users.createdAt))
    .limit(5);

  return (
    <div className="space-y-12">
      <PageHeader 
        title="Admin Overview"
        description="Monitor system performance, user growth, and credit transactions."
        icon={<ShieldCheck size={18} />}
        actions={
          <Button size="lg" className="bg-slate-900 text-white rounded-xl h-12 px-6 font-black border-0 text-sm">
            System Health: 100%
          </Button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-indigo-500 to-indigo-700 text-white border-0 rounded-3xl shadow-lg shadow-indigo-500/20 overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform">
            <Users size={60} />
          </div>
          <CardContent className="p-8 relative z-10">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-100 mb-1">Total Users</p>
            <p className="text-4xl font-black">{userCount.value}</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500 to-blue-700 text-white border-0 rounded-3xl shadow-lg shadow-blue-500/20 overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform">
            <Zap size={60} />
          </div>
          <CardContent className="p-8 relative z-10">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-100 mb-1">Total Credits Circ.</p>
            <p className="text-4xl font-black">{Math.abs(Number(totalCredits.value)).toLocaleString()}</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-sky-400 to-sky-600 text-white border-0 rounded-3xl shadow-lg shadow-sky-400/20 overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform">
            <TrendingUp size={60} />
          </div>
          <CardContent className="p-8 relative z-10">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-sky-100 mb-1">Active Accounts</p>
            <p className="text-4xl font-black">{accountCount.value}</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-slate-700 to-slate-900 text-white border-0 rounded-3xl shadow-lg shadow-slate-900/20 overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform">
            <CreditCard size={60} />
          </div>
          <CardContent className="p-8 relative z-10">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300 mb-1">Pricing Plans</p>
            <p className="text-4xl font-black">{planCount.value}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 border-slate-100 shadow-sm rounded-3xl overflow-hidden bg-white">
          <CardHeader className="p-8 border-b border-slate-50 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-xl font-black text-slate-900 leading-tight">Recent Registrations</CardTitle>
              <CardDescription className="text-slate-400 font-bold mt-0.5 uppercase tracking-widest text-[9px]">Activity from the last 7 days</CardDescription>
            </div>
            <Link href="/admin/users">
              <Button variant="ghost" className="rounded-xl font-black text-blue-500 hover:bg-blue-50 uppercase tracking-widest text-[10px] h-10">
                View All <ChevronRight size={14} />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-50">
              {recentUsers.map((user) => (
                <div key={user.id} className="p-8 flex items-center justify-between hover:bg-slate-50/50 transition-colors group">
                  <div className="flex items-center gap-6">
                    <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center font-black text-slate-400 text-xl group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors shadow-inner">
                      {user.fullName?.[0] || user.email[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="font-black text-slate-900 text-lg">{user.fullName || "Anonymous"}</p>
                      <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">
                        {user.email} • Joined {new Date(user.createdAt!).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge variant="secondary" className="px-4 py-1.5 rounded-full bg-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest border-0">
                      {user.role}
                    </Badge>
                    <Button variant="ghost" size="icon" className="rounded-2xl text-slate-200 hover:text-blue-500 hover:bg-blue-50">
                      <ArrowUpRight size={20} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-8">
          <Card className="bg-white border-slate-100 shadow-sm rounded-[2.5rem] overflow-hidden">
            <CardHeader className="p-8 pb-4">
              <CardTitle className="text-xl font-black text-slate-900 flex items-center gap-3 leading-tight">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center shadow-sm">
                  <Activity size={20} />
                </div>
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 pt-0 space-y-4">
              <Button className="w-full h-16 rounded-2xl bg-blue-500 hover:bg-blue-600 text-white font-black gap-3 border-0 shadow-lg shadow-blue-500/20">
                <Users size={20} />
                Manage Users
              </Button>
              <Button variant="outline" className="w-full h-16 rounded-2xl border-slate-100 hover:bg-slate-50 text-slate-600 font-black gap-3">
                <CreditCard size={20} />
                System Credits
              </Button>
              <Link href="/admin/settings" className="block">
                <Button variant="outline" className="w-full h-16 rounded-2xl border-slate-100 hover:bg-slate-50 text-slate-600 font-black gap-3">
                  <ShieldCheck size={20} />
                  Security Audit
                </Button>
              </Link>
            </CardContent>
          </Card>
          
          <div className="p-10 rounded-[2.5rem] bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-xl shadow-blue-500/20">
            <h3 className="text-2xl font-black mb-3">Revenue Projection</h3>
            <p className="text-blue-100 font-medium leading-relaxed mb-8">
              Based on current user growth, the system is projected to scale by 25% this month.
            </p>
            <div className="h-2 w-full bg-white/20 rounded-full overflow-hidden">
              <div className="h-full bg-white w-3/4 shadow-[0_0_20px_rgba(255,255,255,0.5)]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
