import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  HelpCircle, 
  MessageCircle, 
  BookOpen, 
  Mail, 
  Zap, 
  Shield, 
  Clock,
  ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Help & Support" };

export default function HelpPage() {
  const faqs = [
    {
      q: "How does the AI generation work?",
      a: "Our AI engine scans viral content in your chosen niche and uses it as inspiration to create 5 original, high-engagement posts tailored to your brand voice."
    },
    {
      q: "Is my X account safe?",
      a: "Yes. We use staggered posting and human-like interaction patterns to ensure full compliance with X's terms of service and prevent shadowbans."
    },
    {
      q: "What are credits used for?",
      a: "Credits are used for manual and automated AI generation cycles. Each cycle (5 posts) costs 10 credits."
    },
    {
      q: "Can I manage multiple accounts?",
      a: "Absolutely. Depending on your plan, you can connect multiple X accounts and manage them all from a single dashboard."
    }
  ];

  return (
    <div className="space-y-12">
      <PageHeader 
        title="Help Center"
        description="Everything you need to know about XUPFLY and how to maximize your growth."
        icon={<HelpCircle size={18} />}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <Card className="bg-white border-slate-100 shadow-sm rounded-3xl overflow-hidden group hover:shadow-lg transition-all">
          <CardContent className="p-8">
            <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-500 flex items-center justify-center mb-6 shadow-inner">
              <BookOpen size={24} />
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-2">Documentation</h3>
            <p className="text-slate-500 text-sm font-medium mb-6 leading-relaxed">
              Explore our comprehensive guides on how to set up your automation and best practices for growth.
            </p>
            <Button variant="ghost" className="p-0 h-auto font-black text-sky-500 hover:bg-transparent hover:text-sky-600 gap-2">
              View Guides <ArrowRight size={14} />
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-100 shadow-sm rounded-3xl overflow-hidden group hover:shadow-lg transition-all">
          <CardContent className="p-8">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center mb-6 shadow-inner">
              <MessageCircle size={24} />
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-2">Community</h3>
            <p className="text-slate-500 text-sm font-medium mb-6 leading-relaxed">
              Join our private Discord community to chat with other creators and get tips from the pros.
            </p>
            <Button variant="ghost" className="p-0 h-auto font-black text-emerald-500 hover:bg-transparent hover:text-emerald-600 gap-2">
              Join Discord <ArrowRight size={14} />
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-100 shadow-sm rounded-3xl overflow-hidden group hover:shadow-lg transition-all">
          <CardContent className="p-8">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center mb-6 shadow-inner">
              <Mail size={24} />
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-2">Direct Support</h3>
            <p className="text-slate-500 text-sm font-medium mb-6 leading-relaxed">
              Need personal help? Reach out to our support team and we'll get back to you within 24 hours.
            </p>
            <Button variant="ghost" className="p-0 h-auto font-black text-amber-500 hover:bg-transparent hover:text-amber-600 gap-2">
              Open Ticket <ArrowRight size={14} />
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-white border-slate-100 shadow-sm rounded-[2.5rem] overflow-hidden">
        <CardHeader className="p-10 border-b border-slate-50">
          <CardTitle className="text-2xl font-black text-slate-900 leading-tight">Frequently Asked Questions</CardTitle>
        </CardHeader>
        <CardContent className="p-10 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {faqs.map((faq, i) => (
              <div key={i} className="space-y-3">
                <p className="text-lg font-black text-slate-900">{faq.q}</p>
                <p className="text-slate-500 font-medium leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
