import { auth } from "@/auth";
import { db } from "@/db";
import { niches, xAccounts, generatedPosts } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Zap, History, ChevronRight } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { GenerateClient } from "./GenerateClient";

export const metadata = { title: "AI Content Studio" };

export default async function GeneratePage() {
  const session = await auth();
  if (!session?.user) return null;

  const userNiches = await db.select().from(niches);
  const userAccounts = await db
    .select()
    .from(xAccounts)
    .where(eq(xAccounts.ownerId, session.user.id));

  // Fetch latest generations
  const recentPosts = userAccounts.length > 0
    ? await db
        .select()
        .from(generatedPosts)
        .where(eq(generatedPosts.accountId, userAccounts[0].id))
        .orderBy(desc(generatedPosts.createdAt))
        .limit(5)
    : [];

  return (
    <div className="space-y-12">
      <PageHeader 
        title="Content Studio"
        description="Use our advanced AI engine to generate high-engagement content tailored to your niche."
        actions={
          <Card className="bg-sky-50 border-sky-100 rounded-2xl px-6 py-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-sky-500">
              <Zap size={20} className="fill-current" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-sky-600">Available Credits</p>
              <p className="text-xl font-black text-slate-900">{session.user.totalCredits}</p>
            </div>
          </Card>
        }
      />

      <GenerateClient 
        niches={userNiches.map((n) => ({ id: n.id, name: n.name }))} 
        accounts={userAccounts.map((a) => ({ id: a.id, screenName: a.screenName }))} 
        isAdmin={session.user.role === "admin"}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2">
           <Card className="bg-white border-slate-100 shadow-sm rounded-[2.5rem] overflow-hidden">
            <CardHeader className="p-8 pb-4">
              <CardTitle className="text-lg font-black text-slate-900 flex items-center gap-2">
                <History size={18} className="text-sky-500" />
                Latest Generations
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 pt-0 space-y-4">
              {recentPosts.length === 0 ? (
                <div className="p-10 text-center text-slate-400 font-bold border-2 border-dashed border-slate-100 rounded-3xl">
                  No generations yet. Start your first cycle above!
                </div>
              ) : (
                recentPosts.map((post) => (
                  <div key={post.id} className="p-5 rounded-2xl bg-slate-50 border border-slate-100 group cursor-pointer hover:border-sky-200 transition-all">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-black text-sky-600 uppercase tracking-widest">
                        {new Date(post.createdAt!).toLocaleString()}
                      </span>
                      <ChevronRight size={14} className="text-slate-300 group-hover:text-sky-500 transition-colors" />
                    </div>
                    <p className="text-sm font-bold text-slate-700 line-clamp-2">{post.generatedText}</p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

