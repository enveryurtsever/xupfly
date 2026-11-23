import { auth } from "@/auth";
import { db } from "@/db";
import { xAccounts, niches } from "@/db/schema";
import { eq } from "drizzle-orm";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  X as XIcon, 
  Plus
} from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";

import { AccountsClient } from "./AccountsClient";

export const metadata = { title: "X Accounts" };

export default async function XAccountsPage() {
  const session = await auth();
  if (!session?.user) return null;

  const accounts = await db
    .select({
      id: xAccounts.id,
      screenName: xAccounts.screenName,
      profileImage: xAccounts.avatarUrl,
      nicheId: xAccounts.nicheId,
      nicheName: niches.name,
      isActive: xAccounts.automationEnabled,
      lastSync: xAccounts.updatedAt,
    })
    .from(xAccounts)
    .leftJoin(niches, eq(xAccounts.nicheId, niches.id))
    .where(eq(xAccounts.ownerId, session.user.id));

  return (
    <div className="space-y-10">
      <PageHeader 
        title="X Accounts"
        description="Connect and manage your X profiles for automated growth."
        actions={
          <Link href="/api/auth/x/connect">
            <Button size="lg" className="px-6 py-6 h-auto gap-3 text-base rounded-2xl shadow-lg shadow-sky-500/20 bg-sky-500">
              <Plus size={20} />
              Connect Account
            </Button>
          </Link>
        }

      />

      {accounts.length === 0 ? (
        <Card className="bg-white border-slate-100 shadow-sm rounded-3xl overflow-hidden border-dashed border-2">
          <CardContent className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 rounded-2xl bg-sky-50 flex items-center justify-center mb-6 shadow-inner">
              <XIcon size={36} className="text-sky-500" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 mb-2">No Accounts Connected</h2>
            <p className="text-slate-500 max-w-sm mb-8 text-base font-medium leading-relaxed">
              Start your automation journey by connecting your first X account.
            </p>
            <Link href="/api/auth/x/connect">
              <Button size="lg" className="px-8 py-6 h-auto gap-3 text-lg bg-sky-500 shadow-xl shadow-sky-500/20 rounded-xl">
                <XIcon size={18} />
                Connect via X.com
              </Button>
            </Link>

          </CardContent>
        </Card>
      ) : (
        <AccountsClient initialAccounts={accounts} />
      )}
    </div>
  );
}

