import { auth } from "@/auth";
import { db } from "@/db";
import { systemSettings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { Settings } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { AdminSettingsClient } from "./AdminSettingsClient";

export const metadata = { title: "System Settings" };

export default async function AdminSettingsPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") return null;

  const allSettings = await db.select().from(systemSettings);
  
  const signupCredits = allSettings.find(s => s.key === "signup_credits")?.value || "10";
  const creditPrice = allSettings.find(s => s.key === "credit_price")?.value || "0.05";

  return (
    <div className="space-y-10">
      <PageHeader 
        title="System Settings"
        description="Global configuration for the XUPFLY platform."
        icon={<Settings size={18} />}
      />

      <AdminSettingsClient initialSettings={{ signupCredits, creditPrice }} />
    </div>
  );
}

