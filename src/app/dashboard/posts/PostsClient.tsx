"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CalendarClock, Trash2, Clock, Send, Sparkles, Loader2, Eye } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { XIcon } from "@/components/ui/icons";
import { toast } from "sonner";
import { deletePostAction, publishAllAction, publishPostAction } from "@/lib/actions/post-actions";
import { PageHeader } from "@/components/layout/PageHeader";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface Post {
  id: string;
  text: string;
  status: string | null;
  scheduledAt: Date | null;
  publishedAt: Date | null;
  accountName: string | null;
  mediaUrl: string | null;
  mediaType: string | null;
  imagePrompt: string | null;
}

interface PostsClientProps {
  initialPosts: Post[];
}

export function PostsClient({ initialPosts }: PostsClientProps) {
  const [posts, setPosts] = useState(initialPosts);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isPublishingAll, setIsPublishingAll] = useState(false);
  const [isPublishing, setIsPublishing] = useState<string | null>(null);
  const [viewingPost, setViewingPost] = useState<Post | null>(null);

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "published": return "bg-emerald-50 text-emerald-600 border-emerald-100 shadow-emerald-500/10";
      case "scheduled": return "bg-sky-50 text-sky-600 border-sky-100 shadow-sky-500/10";
      case "failed": return "bg-rose-50 text-rose-600 border-rose-100 shadow-rose-500/10";
      default: return "bg-slate-100 text-slate-500 border-slate-200";
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this post?")) return;
    
    setIsDeleting(id);
    try {
      const result = await deletePostAction(id);
      if (result.success) {
        setPosts(posts.filter(p => p.id !== id));
        toast.success("Post deleted.");
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error("Error deleting post.");
    } finally {
      setIsDeleting(null);
    }
  };

  const handlePublishAll = async () => {
    const unpublishedIds = posts
      .filter(p => p.status !== "published")
      .map(p => p.id);
    
    if (unpublishedIds.length === 0) {
      toast.info("No posts to publish.");
      return;
    }

    setIsPublishingAll(true);
    try {
      const result = await publishAllAction(unpublishedIds);
      if (result.success) {
        setPosts(posts.map(p => 
          unpublishedIds.includes(p.id) ? { ...p, status: "published", publishedAt: new Date() } : p
        ));
        toast.success("All posts published successfully!");
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error("Error publishing posts.");
    } finally {
      setIsPublishingAll(false);
    }
  };

  const handlePublishSingle = async (id: string) => {
    setIsPublishing(id);
    try {
      const result = await publishPostAction(id);
      if (result.success) {
        setPosts(posts.map(p => 
          p.id === id ? { ...p, status: "published", publishedAt: new Date() } : p
        ));
        toast.success("Post published successfully!");
        setViewingPost(null);
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error("Error publishing post.");
    } finally {
      setIsPublishing(null);
    }
  };

  return (
    <div className="space-y-10">
      <PageHeader 
        title="Post Queue"
        description="Monitor and manage your automated content pipeline."
        badge={
          <Badge variant="outline" className="px-3 py-1 rounded-lg border-slate-200 font-black text-slate-400 uppercase tracking-widest text-[9px]">
            Total: {posts.length}
          </Badge>
        }
        actions={
          <Button 
            onClick={handlePublishAll}
            disabled={isPublishingAll}
            className="bg-slate-900 hover:bg-black text-white h-12 rounded-xl font-black px-6 gap-2 border-0 shadow-lg shadow-slate-200 text-sm"
          >
            {isPublishingAll ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            Publish All
          </Button>
        }
      />

      <Card className="bg-white border-slate-100 shadow-sm rounded-3xl overflow-hidden">
        <CardHeader className="p-8 border-b border-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center shadow-inner">
              <CalendarClock size={20} />
            </div>
            <div>
              <CardTitle className="text-xl font-black text-slate-900 leading-tight">Content Pipeline</CardTitle>
              <CardDescription className="text-slate-400 font-bold mt-0.5 uppercase tracking-widest text-[9px]">Schedule & history</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {posts.length === 0 ? (
            <div className="p-20 text-center">
              <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-6 text-slate-200">
                <CalendarClock size={32} />
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-2">Queue is Empty</h3>
              <p className="text-slate-400 font-bold max-w-sm mx-auto mb-8 text-sm">No posts yet. Head over to Content Studio to start.</p>
              <Link href="/dashboard/generate">
                <Button size="lg" className="bg-sky-500 px-8 h-12 rounded-xl shadow-lg shadow-sky-500/20 text-sm">
                  <Sparkles size={16} className="mr-2" />
                  Generate First Post
                </Button>
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {posts.map((post) => (
                <div key={post.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-slate-50/50 transition-colors group">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3">
                      <Badge className={cn("px-2.5 py-0.5 rounded-lg font-black text-[9px] uppercase tracking-widest border shadow-sm", getStatusStyle(post.status || ""))}>
                        {post.status}
                      </Badge>
                      <span className="text-[10px] font-black text-slate-400 flex items-center gap-1.5 uppercase tracking-widest">
                        <XIcon size={12} className="text-sky-500" />
                        @{post.accountName}
                      </span>
                    </div>
                    <p className="text-lg font-bold text-slate-800 leading-relaxed max-w-3xl group-hover:text-slate-900 transition-colors">
                      {post.text}
                    </p>
                    
                    {post.mediaUrl && (
                      <div className="mt-4 rounded-2xl overflow-hidden border border-slate-100 max-w-md shadow-sm">
                        {post.mediaType === "video" ? (
                          <video src={post.mediaUrl} controls className="w-full h-auto" />
                        ) : (
                          <img src={post.mediaUrl} alt="Post media" className="w-full h-auto object-cover" />
                        )}
                      </div>
                    )}
                    <div className="flex items-center gap-4 text-[10px] font-black text-slate-300 uppercase tracking-widest">
                      <span className="flex items-center gap-2">
                        <Clock size={14} className="text-slate-200" />
                        {post.scheduledAt ? new Date(post.scheduledAt).toLocaleString() : "Manual"}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button 
                      variant="outline" 
                      className="rounded-xl border-slate-200 font-black px-5 h-10 text-xs text-slate-600 hover:border-sky-200 hover:text-sky-600 transition-all flex items-center gap-2"
                      onClick={() => setViewingPost(post)}
                    >
                      <Eye size={16} />
                      View
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleDelete(post.id)}
                      disabled={isDeleting === post.id}
                      className="w-10 h-10 rounded-xl text-slate-200 hover:text-rose-600 hover:bg-rose-50 transition-all"
                    >
                      {isDeleting === post.id ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!viewingPost} onOpenChange={(open) => !open && setViewingPost(null)}>
        <DialogContent className="sm:max-w-[600px] bg-white rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
          <DialogHeader className="p-8 pb-4">
            <div className="flex items-center gap-3 mb-2">
              <Badge className={cn("px-2.5 py-0.5 rounded-lg font-black text-[9px] uppercase tracking-widest border shadow-sm", viewingPost ? getStatusStyle(viewingPost.status || "") : "")}>
                {viewingPost?.status}
              </Badge>
              <span className="text-[10px] font-black text-slate-400 flex items-center gap-1.5 uppercase tracking-widest">
                <XIcon size={12} className="text-sky-500" />
                @{viewingPost?.accountName}
              </span>
            </div>
            <DialogTitle className="text-2xl font-black text-slate-900 leading-tight">Post Preview</DialogTitle>
            <DialogDescription className="text-slate-400 font-bold uppercase tracking-widest text-[9px]">
              Inspect content before publishing to X
            </DialogDescription>
          </DialogHeader>

          <div className="p-8 pt-0 space-y-6">
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 relative group">
              <p className="text-lg font-bold text-slate-800 leading-relaxed whitespace-pre-wrap">
                {viewingPost?.text}
              </p>
              <Button 
                variant="ghost" 
                size="sm" 
                className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-black uppercase text-sky-600 h-7"
                onClick={() => {
                  navigator.clipboard.writeText(viewingPost?.text || "");
                  toast.success("Copied to clipboard!");
                }}
              >
                Copy
              </Button>
            </div>

            {viewingPost?.mediaUrl ? (
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Source Media</label>
                <div className="rounded-2xl overflow-hidden border border-slate-100 shadow-sm">
                  {viewingPost.mediaType === "video" ? (
                    <video src={viewingPost.mediaUrl} controls className="w-full h-auto" />
                  ) : (
                    <img src={viewingPost.mediaUrl} alt="Post media" className="w-full h-auto object-cover" />
                  )}
                </div>
              </div>
            ) : viewingPost?.imagePrompt ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between ml-1">
                  <label className="text-[10px] font-black text-sky-500 uppercase tracking-widest">AI Image Prompt (Fal.ai)</label>
                  <Sparkles size={14} className="text-sky-500" />
                </div>
                <div className="p-4 rounded-xl bg-sky-50/50 border border-sky-100">
                  <p className="text-[11px] font-bold text-sky-700 italic leading-relaxed">
                    "{viewingPost.imagePrompt}"
                  </p>
                </div>
                <p className="text-[9px] text-slate-400 font-medium ml-1">
                  System will generate a unique 8k image based on this prompt when publishing.
                </p>
              </div>
            ) : null}

            <div className="flex items-center gap-3 pt-4">
              <Button 
                className="flex-1 h-12 bg-sky-500 hover:bg-sky-600 text-white font-black text-sm rounded-xl shadow-lg shadow-sky-500/20 disabled:opacity-50"
                disabled={isPublishing === viewingPost?.id}
                onClick={() => {
                  if (viewingPost) {
                    handlePublishSingle(viewingPost.id);
                  }
                }}
              >
                {isPublishing === viewingPost?.id ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                {isPublishing === viewingPost?.id ? "Publishing..." : "Publish Now"}
              </Button>
              <Button 
                variant="outline"
                className="flex-1 h-12 border-2 border-slate-100 font-black text-sm rounded-xl text-slate-600 hover:bg-slate-50 transition-all"
                onClick={() => setViewingPost(null)}
              >
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
