"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { MessageSquare, Bell, Clock, CheckCircle2, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

interface Mention {
  id: string;
  authorHandle: string | null;
  authorName: string | null;
  authorAvatar: string | null;
  contentText: string | null;
  repliedToTweetId: string | null;
  isRead: boolean | null;
  createdAt: Date | null;
  accountName: string | null;
  aiReplyText: string | null;
  aiReplyStatus: string | null;
}

interface NotificationsClientProps {
  initialMentions: Mention[];
}

export function NotificationsClient({ initialMentions }: NotificationsClientProps) {
  const [mentions, setMentions] = useState(initialMentions);

  return (
    <div className="space-y-10">
      <PageHeader 
        title="Notifications"
        description="Monitor how people are interacting with your automated posts."
        badge={
          <Badge variant="outline" className="px-3 py-1 rounded-lg border-slate-200 font-black text-slate-400 uppercase tracking-widest text-[9px]">
            {mentions.length} New Interactions
          </Badge>
        }
      />

      <div className="space-y-4">
        {mentions.length === 0 ? (
          <Card className="bg-slate-50/50 border-dashed border-2 border-slate-200 shadow-none rounded-3xl">
            <CardContent className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center shadow-sm mb-4">
                <Bell size={24} className="text-slate-300" />
              </div>
              <h3 className="text-lg font-black text-slate-900">No notifications yet</h3>
              <p className="text-slate-400 text-sm max-w-xs mt-2 font-medium">
                When people reply to your automated posts, they will appear here.
              </p>
            </CardContent>
          </Card>
        ) : (
          mentions.map((mention) => (
            <Card key={mention.id} className={cn(
              "bg-white border-slate-100 shadow-sm rounded-3xl overflow-hidden transition-all hover:shadow-md",
              !mention.isRead && "border-l-4 border-l-sky-500"
            )}>
              <CardContent className="p-6">
                <div className="flex gap-4">
                  <Avatar className="w-12 h-12 rounded-xl border-2 border-slate-50 shadow-inner">
                    <AvatarImage src={mention.authorAvatar || ""} />
                    <AvatarFallback className="bg-slate-100 text-slate-400 font-black text-xs">
                      {mention.authorHandle?.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-black text-slate-900 text-sm">{mention.authorName}</span>
                          <span className="text-xs font-bold text-slate-400">@{mention.authorHandle}</span>
                        </div>
                        <p className="text-[10px] font-black text-sky-500 uppercase tracking-widest mt-0.5">
                          replied to @{mention.accountName}
                        </p>
                      </div>
                      <div className="text-[10px] font-black text-slate-300 flex items-center gap-1.5 uppercase tracking-widest">
                        <Clock size={12} />
                        {mention.createdAt ? formatDistanceToNow(new Date(mention.createdAt), { addSuffix: true }) : ""}
                      </div>
                    </div>

                    <p className="text-slate-700 font-bold leading-relaxed">
                      {mention.contentText}
                    </p>

                    {mention.aiReplyText && (
                      <div className="mt-4 p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100/50 space-y-2 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-2 bg-emerald-100/50 rounded-bl-xl">
                          <Sparkles size={12} className="text-emerald-600" />
                        </div>
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className="bg-emerald-500 text-white border-none text-[8px] font-black uppercase px-2 h-4">AI Replied</Badge>
                        </div>
                        <p className="text-xs font-bold text-emerald-800 italic leading-relaxed">
                          "{mention.aiReplyText}"
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
