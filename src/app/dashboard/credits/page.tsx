import { auth } from "@/auth";
import { db } from "@/db";
import { pricingPlans, creditTransactions } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { Card } from "@/components/ui/card";
import { Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/layout/PageHeader";
import { CreditsClient } from "./CreditsClient";

export const metadata = { title: "Credits & Plans" };

export default async function CreditsPage() {
  const session = await auth();
  if (!session?.user) return null;

  const plans = await db.select().from(pricingPlans);
  const transactions = await db
    .select()
    .from(creditTransactions)
    .where(eq(creditTransactions.userId, session.user.id))
    .orderBy(desc(creditTransactions.createdAt))
    .limit(10);

  return (
    <div className="space-y-10">
      <PageHeader 
        title="Credits"
        description={session.user.role === "admin" ? "As an Admin, you have unlimited access to all platform features." : "Manage your balance and upgrade your plan to unlock more automation."}
        actions={
          <Card className={cn(
            "border-0 rounded-2xl shadow-md px-6 py-3 flex flex-row items-center gap-4",
            session.user.role === "admin" ? "bg-gradient-to-br from-slate-900 to-black text-white" : "bg-gradient-to-br from-sky-500 to-blue-600 text-white"
          )}>
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-blue-100 mb-0.5 opacity-60">
                {session.user.role === "admin" ? "Admin Status" : "Balance"}
              </p>
              <p className="text-2xl font-black">
                {session.user.role === "admin" ? "Unlimited" : session.user.totalCredits?.toLocaleString()}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <Zap size={20} className="fill-white" />
            </div>
          </Card>
        }
      />

      <CreditsClient plans={plans} initialTransactions={transactions} />
    </div>
  );
}

