import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="flex h-screen overflow-hidden bg-transparent">
      <Sidebar />
      <main className="flex-1 overflow-y-auto bg-transparent">
        <div className="w-full px-4 md:px-10 py-8 lg:py-12">
          {children}
        </div>
      </main>
    </div>
  );
}
