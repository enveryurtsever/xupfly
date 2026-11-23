import { auth } from "@/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { Settings } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { SettingsClient } from "./SettingsClient";

export const metadata = { title: "Account Settings" };

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user) return null;

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  return (
    <div className="space-y-10">
      <PageHeader 
        title="Settings"
        description="Manage your profile information and account preferences."
        icon={<Settings size={18} />}
      />

      <SettingsClient user={{ fullName: user.fullName, email: user.email }} />
    </div>
  );
}

