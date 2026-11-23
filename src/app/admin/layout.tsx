import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") redirect("/dashboard");

  return (
    <div className="flex h-screen overflow-hidden bg-transparent">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="w-full p-6 lg:p-10">
          {children}
        </div>
      </main>
    </div>
  );
}
