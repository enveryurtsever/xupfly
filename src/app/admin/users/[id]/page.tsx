import { auth } from "@/auth";
import { db } from "@/db";
import { users, xAccounts, creditTransactions } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  User, 
  X as XIcon, 
  CreditCard, 
  Calendar, 
  ShieldCheck, 
  History,
  ArrowLeft,
  Settings,
  Mail,
  Zap
} from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { cn } from "@/lib/utils";

export const metadata = { title: "User Details" };

export default async function UserDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") return null;

  const { id: userId } = await params;


  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) notFound();

  const accounts = await db
    .select()
    .from(xAccounts)
    .where(eq(xAccounts.ownerId, userId));

  const transactions = await db
    .select()
    .from(creditTransactions)
    .where(eq(creditTransactions.userId, userId))
    .orderBy(desc(creditTransactions.createdAt))
    .limit(10);

  return (
    <div className="space-y-12">
      <div className="flex items-center gap-4">
        <Link href="/admin/users">
          <Button variant="ghost" className="rounded-xl h-10 w-10 p-0 text-slate-400 hover:text-slate-900 hover:bg-slate-100">
            <ArrowLeft size={20} />
          </Button>
        </Link>
        <PageHeader 
          title="User Profile"
          description={`Viewing details for ${user.email}`}
          icon={<User size={18} />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Basic Info Card */}
        <Card className="lg:col-span-2 bg-white border-slate-100 shadow-sm rounded-3xl overflow-hidden">
          <CardHeader className="p-8 border-b border-slate-50 flex flex-row items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center font-black text-2xl shadow-inner">
                {user.fullName?.[0] || user.email[0].toUpperCase()}
              </div>
              <div>
                <CardTitle className="text-2xl font-black text-slate-900 leading-tight">{user.fullName || "Anonymous"}</CardTitle>
                <CardDescription className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-1 flex items-center gap-2">
                  <Mail size={14} />
                  {user.email}
                </CardDescription>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <Badge className={cn(
                "px-3 py-1 rounded-full font-black text-[9px] uppercase tracking-widest border",
                user.role === "admin" ? "bg-blue-50 text-blue-600 border-blue-100" : "bg-slate-100 text-slate-500 border-slate-200"
              )}>
                {user.role}
              </Badge>
              <Badge variant="outline" className={cn(
                "px-3 py-1 rounded-full font-black text-[9px] uppercase tracking-widest border-emerald-100 text-emerald-600",
                !user.isActive && "border-rose-100 text-rose-600"
              )}>
                {user.isActive ? "Active" : "Disabled"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Credits</p>
                <div className="flex items-center gap-2">
                  <Zap size={16} className="text-amber-500 fill-amber-500" />
                  <p className="text-2xl font-black text-slate-900">{user.totalCredits?.toLocaleString()}</p>
                </div>
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Accounts</p>
                <div className="flex items-center gap-2">
                  <XIcon size={16} className="text-sky-500" />
                  <p className="text-2xl font-black text-slate-900">{accounts.length}</p>
                </div>
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Member Since</p>
                <div className="flex items-center gap-2">
                  <Calendar size={16} className="text-slate-400" />
                  <p className="text-lg font-black text-slate-900">{new Date(user.createdAt!).toLocaleDateString()}</p>
                </div>
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Last Update</p>
                <div className="flex items-center gap-2">
                  <History size={16} className="text-slate-400" />
                  <p className="text-lg font-black text-slate-900">{new Date(user.updatedAt!).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats/Actions */}
        <div className="space-y-6">
          <Card className="bg-slate-900 text-white border-0 rounded-3xl overflow-hidden shadow-xl shadow-slate-900/20">
            <CardContent className="p-8">
              <h3 className="text-xl font-black mb-6">Admin Actions</h3>
              <div className="space-y-3">
                <Button className="w-full h-12 bg-white text-slate-900 hover:bg-slate-50 font-black rounded-xl border-0">
                  Edit User Profile
                </Button>
                <Button variant="outline" className="w-full h-12 border-slate-700 hover:bg-slate-800 text-white font-black rounded-xl">
                  Adjust Credits
                </Button>
                <Button variant="destructive" className="w-full h-12 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-xl border-0">
                  Disable Account
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Connected Accounts */}
        <Card className="bg-white border-slate-100 shadow-sm rounded-3xl overflow-hidden">
          <CardHeader className="p-8 border-b border-slate-50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-500 flex items-center justify-center">
                <XIcon size={20} />
              </div>
              <CardTitle className="text-xl font-black text-slate-900">X Accounts</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {accounts.length === 0 ? (
              <div className="p-12 text-center text-slate-400 font-bold">No accounts connected.</div>
            ) : (
              <div className="divide-y divide-slate-50">
                {accounts.map(acc => (
                  <div key={acc.id} className="p-6 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <img src={acc.avatarUrl || `https://ui-avatars.com/api/?name=${acc.screenName}&background=0EA5E9&color=fff`} className="w-10 h-10 rounded-xl" />
                      <div>
                        <p className="font-bold text-slate-900">@{acc.screenName}</p>
                        <p className="text-[10px] font-black text-sky-500 uppercase tracking-widest">Connected {new Date(acc.createdAt!).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <Badge className={acc.automationEnabled ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-400"}>
                      {acc.automationEnabled ? "Auto" : "Manual"}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Transaction History */}
        <Card className="lg:col-span-2 bg-white border-slate-100 shadow-sm rounded-3xl overflow-hidden">
          <CardHeader className="p-8 border-b border-slate-50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center">
                <History size={20} />
              </div>
              <CardTitle className="text-xl font-black text-slate-900">Transaction History</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {transactions.length === 0 ? (
              <div className="p-12 text-center text-slate-400 font-bold">No transactions found.</div>
            ) : (
              <div className="divide-y divide-slate-50">
                {transactions.map(tx => (
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
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{new Date(tx.createdAt!).toLocaleString()}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="rounded-lg border-slate-100 text-slate-400 font-black text-[9px] uppercase tracking-widest">
                      {tx.type}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
