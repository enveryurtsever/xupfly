"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X as XIcon, Loader2, Mail, Lock, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  
  // Handle NextAuth errors from URL
  const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const urlError = searchParams?.get("error");
  
  useState(() => {
    if (urlError === "OAuthSignin") setError("Error occurred during OAuth sign in.");
    if (urlError === "OAuthCallback") setError("Error occurred during OAuth callback.");
    if (urlError === "OAuthCreateAccount") setError("Could not create OAuth account.");
    if (urlError === "EmailCreateAccount") setError("Could not create email account.");
    if (urlError === "Callback") setError("Error occurred during callback.");
    if (urlError === "OAuthAccountNotLinked") setError("To confirm your identity, please sign in with the same account you used originally.");
    if (urlError === "EmailSignin") setError("Check your email address.");
    if (urlError === "CredentialsSignin") setError("Invalid email or password.");
    if (urlError === "SessionRequired") setError("Please sign in to access this page.");
    if (urlError === "Default") setError("An unexpected error occurred.");
  });


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await signIn("credentials", {
        email: form.email,
        password: form.password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid email or password");
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-sky-500/5 rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-[440px] relative">
        <div className="text-center mb-10">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-br from-sky-400 to-blue-600 items-center justify-center shadow-xl shadow-blue-500/20 mb-6 mx-auto">
            <XIcon size={28} className="text-white" />
          </div>
          <h1 className="text-4xl font-black tracking-tight text-slate-900">Welcome Back</h1>
          <p className="text-slate-500 mt-3 text-lg font-medium">Log in to manage your X empire.</p>
        </div>

        <Card className="border-0 shadow-2xl rounded-[2rem] overflow-hidden bg-white/80 backdrop-blur-xl">
          <CardHeader className="p-10 pb-4">
            <CardTitle className="text-2xl font-bold text-slate-900">Sign In</CardTitle>
            <CardDescription className="text-slate-400 font-medium">Enter your credentials below</CardDescription>
          </CardHeader>
          <CardContent className="p-10 pt-4">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-4 rounded-2xl bg-red-50 border border-red-100 text-red-600 text-sm font-bold flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-600" />
                  {error}
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-700 font-bold ml-1">Email</Label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@company.com"
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    required
                    className="h-14 pl-12 bg-slate-50 border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all font-medium text-slate-900"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between ml-1">
                  <Label htmlFor="password" title="Password" className="text-slate-700 font-bold">Password</Label>
                  <Link href="#" className="text-xs font-bold text-blue-600 hover:underline">Forgot password?</Link>
                </div>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={form.password}
                    onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                    required
                    className="h-14 pl-12 bg-slate-50 border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all font-medium text-slate-900"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-14 bg-gradient-to-br from-sky-400 to-blue-600 border-0 text-white font-bold rounded-2xl shadow-lg shadow-blue-500/25 hover:scale-[1.01] transition-all flex items-center justify-center gap-2 group"
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : (
                  <>
                    Sign In
                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </Button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-sm text-slate-400 font-medium">
                Don't have an account?{" "}
                <Link href="/register" className="text-blue-600 font-black hover:underline">
                  Create one for free
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
