import { auth } from "@/auth";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { 
  Sparkles, 
  Zap, 
  ShieldCheck, 
  TrendingUp, 
  ArrowRight, 
  X as XIcon,
  Globe,
  Users,
  Calendar
} from "lucide-react";
import { cn } from "@/lib/utils";

export default async function LandingPage() {
  const session = await auth();

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-sky-100 selection:text-sky-900">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <XIcon size={22} className="text-white" />
            </div>
            <span className="text-2xl font-black tracking-tight text-slate-900">XUPFLY</span>
          </div>
          
          <div className="hidden md:flex items-center gap-10">
            <Link href="#features" className="text-sm font-bold text-slate-500 hover:text-sky-500 transition-colors">Features</Link>
            <Link href="#how-it-works" className="text-sm font-bold text-slate-500 hover:text-sky-500 transition-colors">How it Works</Link>
            <Link href="#pricing" className="text-sm font-bold text-slate-500 hover:text-sky-500 transition-colors">Pricing</Link>
          </div>

          <div className="flex items-center gap-4">
            {session ? (
              <Link href="/dashboard">
                <Button className="bg-slate-900 hover:bg-black text-white px-6 rounded-xl font-bold h-11 transition-all">
                  Dashboard <ArrowRight size={16} className="ml-2" />
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/login" className="text-sm font-bold text-slate-600 hover:text-slate-900 px-4">Log in</Link>
                <Link href="/register">
                  <Button className="bg-sky-500 hover:bg-sky-600 text-white px-6 rounded-xl font-black h-11 shadow-lg shadow-sky-500/20 transition-all">
                    Get Started Free
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-40 pb-32 overflow-hidden">
        {/* Background Elements */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-sky-50 rounded-full blur-[120px] opacity-60" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-50 rounded-full blur-[120px] opacity-60" />
        </div>

        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-sky-50 border border-sky-100 mb-8 animate-fade-in">
            <Sparkles size={14} className="text-sky-500 fill-sky-500" />
            <span className="text-[10px] font-black uppercase tracking-widest text-sky-600">The Future of X Automation</span>
          </div>
          
          <h1 className="text-6xl md:text-8xl font-black text-slate-900 tracking-tighter mb-8 leading-[0.9]">
            Scale Your Reach <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-600">Without Lifting a Finger</span>
          </h1>
          
          <p className="max-w-2xl mx-auto text-xl text-slate-500 font-medium leading-relaxed mb-12">
            XUPFLY uses advanced AI to search trends, generate viral content, and manage your X accounts 24/7. High engagement, zero effort.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <Link href="/register">
              <Button size="lg" className="h-16 px-10 text-lg font-black bg-slate-900 hover:bg-black text-white rounded-2xl shadow-2xl shadow-slate-200 transition-all group">
                Start Growing Now
                <ArrowRight size={20} className="ml-3 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <div className="flex items-center gap-4">
              <div className="flex -space-x-3">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center overflow-hidden shadow-sm">
                    <img src={`https://i.pravatar.cc/100?img=${i+10}`} alt="User" />
                  </div>
                ))}
              </div>
              <p className="text-sm font-bold text-slate-400">Trusted by 2,000+ creators</p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 border-y border-slate-100 bg-slate-50/30">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12 text-center">
            <div>
              <p className="text-4xl font-black text-slate-900 mb-1">500k+</p>
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Posts Generated</p>
            </div>
            <div>
              <p className="text-4xl font-black text-slate-900 mb-1">12M+</p>
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Impressions Delivered</p>
            </div>
            <div>
              <p className="text-4xl font-black text-slate-900 mb-1">98%</p>
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Engagement Boost</p>
            </div>
            <div>
              <p className="text-4xl font-black text-slate-900 mb-1">24/7</p>
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Always Online</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-32">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight mb-4">Powerful Features for Serious Growth</h2>
            <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Everything you need to dominate the feed</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<Brain className="text-sky-500" size={32} />}
              title="AI Content Engine"
              description="Our AI analyzes thousands of viral tweets in your niche to generate original, high-performing content that resonates."
            />
            <FeatureCard 
              icon={<Globe className="text-blue-500" size={32} />}
              title="Trend Analysis"
              description="Stay ahead of the curve. XUPFLY automatically scans global trends and local news to keep your content fresh and relevant."
            />
            <FeatureCard 
              icon={<Calendar className="text-indigo-500" size={32} />}
              title="Smart Scheduling"
              description="Post at the perfect time, every time. Our algorithm determines when your audience is most active and schedules accordingly."
            />
            <FeatureCard 
              icon={<ShieldCheck className="text-emerald-500" size={32} />}
              title="Account Security"
              description="We use human-like interaction patterns and staggered posting to ensure your accounts stay safe and compliant."
            />
            <FeatureCard 
              icon={<TrendingUp className="text-rose-500" size={32} />}
              title="Growth Analytics"
              description="Track your progress with detailed insights into follower growth, engagement rates, and top-performing content."
            />
            <FeatureCard 
              icon={<Users className="text-amber-500" size={32} />}
              title="Multi-Account Sync"
              description="Manage multiple X accounts from a single dashboard. Perfect for agencies and multi-niche creators."
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-12">
            <div className="text-center md:text-left">
              <div className="flex items-center gap-2 justify-center md:justify-start mb-6">
                <div className="w-8 h-8 rounded-lg bg-sky-500 flex items-center justify-center">
                  <XIcon size={18} className="text-white" />
                </div>
                <span className="text-xl font-black tracking-tight">XUPFLY</span>
              </div>
              <p className="text-slate-400 max-w-sm font-medium">
                The world's most advanced X automation platform. Built for creators who value their time.
              </p>
            </div>
            
            <div className="flex gap-12 text-sm font-bold uppercase tracking-widest text-slate-500">
              <Link href="#" className="hover:text-white transition-colors">Privacy</Link>
              <Link href="#" className="hover:text-white transition-colors">Terms</Link>
              <Link href="#" className="hover:text-white transition-colors">Support</Link>
            </div>
          </div>
          
          <div className="mt-20 pt-10 border-t border-slate-800 text-center text-slate-600 text-xs font-bold uppercase tracking-widest">
            © 2026 XUPFLY INC. ALL RIGHTS RESERVED.
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="p-10 rounded-[2.5rem] bg-slate-50 border border-slate-100 hover:bg-white hover:shadow-2xl hover:shadow-slate-200 transition-all duration-500 group">
      <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center mb-8 shadow-sm group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h3 className="text-2xl font-black text-slate-900 mb-4">{title}</h3>
      <p className="text-slate-500 font-medium leading-relaxed">{description}</p>
    </div>
  );
}

function Brain(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-2.54Z" />
      <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-4.44-2.54Z" />
    </svg>
  );
}

