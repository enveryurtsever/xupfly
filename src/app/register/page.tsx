"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import Link from "next/link";
import { X as XIcon, Loader2, ArrowRight } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ fullName: "", email: "", password: "", confirm: "" });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.password !== form.confirm) {
      toast.error("Passwords do not match.");
      return;
    }
    if (form.password.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    setLoading(true);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fullName: form.fullName, email: form.email, password: form.password }),
    });
    setLoading(false);
    if (res.ok) {
      toast.success("Account created! Redirecting to login…");
      setTimeout(() => router.push("/login"), 1500);
    } else {
      const data = await res.json();
      toast.error(data.error ?? "Registration failed. Please try again.");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-sky-500/5 rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-[480px] relative">
        <div className="text-center mb-10">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-br from-sky-400 to-blue-600 items-center justify-center shadow-xl shadow-blue-500/20 mb-6 mx-auto">
            <XIcon size={28} className="text-white" />
          </div>
          <h1 className="text-4xl font-black tracking-tight text-slate-900">Get Started</h1>
          <p className="text-slate-500 mt-3 text-lg font-medium">Create your X automation empire today.</p>
        </div>

        <Card className="border-0 shadow-2xl rounded-[2rem] overflow-hidden bg-white/80 backdrop-blur-xl">
          <CardHeader className="p-10 pb-4">
            <CardTitle className="text-2xl font-bold text-slate-900">Sign Up</CardTitle>
            <CardDescription className="text-slate-400 font-medium">Join 1,000+ creators and automate your growth.</CardDescription>
          </CardHeader>
          <CardContent className="p-10 pt-4">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-slate-700 font-bold ml-1">Full Name</Label>
                <Input id="fullName" placeholder="John Doe" value={form.fullName}
                  onChange={(e) => setForm(f => ({ ...f, fullName: e.target.value }))}
                  className="h-14 bg-slate-50 border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all font-medium text-slate-900" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reg-email" className="text-slate-700 font-bold ml-1">Email</Label>
                <Input id="reg-email" type="email" placeholder="name@company.com" value={form.email}
                  onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
                  required className="h-14 bg-slate-50 border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all font-medium text-slate-900" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reg-password" className="text-slate-700 font-bold ml-1">Password</Label>
                <Input id="reg-password" type="password" placeholder="••••••••" value={form.password}
                  onChange={(e) => setForm(f => ({ ...f, password: e.target.value }))}
                  required className="h-14 bg-slate-50 border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all font-medium text-slate-900" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password" className="text-slate-700 font-bold ml-1">Confirm Password</Label>
                <Input id="confirm-password" type="password" placeholder="••••••••" value={form.confirm}
                  onChange={(e) => setForm(f => ({ ...f, confirm: e.target.value }))}
                  required className="h-14 bg-slate-50 border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all font-medium text-slate-900" />
              </div>

              <Button id="register-btn" type="submit" disabled={loading}
                className="w-full h-14 bg-gradient-to-br from-sky-400 to-blue-600 border-0 text-white font-bold rounded-2xl shadow-lg shadow-blue-500/25 hover:scale-[1.01] transition-all flex items-center justify-center gap-2 group"
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : (
                  <>
                    Create Account
                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </Button>
            </form>
            <div className="mt-8 text-center">
              <p className="text-sm text-slate-400 font-medium">
                Already have an account?{" "}
                <Link href="/login" className="text-blue-600 font-black hover:underline">Sign in</Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
