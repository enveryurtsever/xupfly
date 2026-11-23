"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { User, Shield, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { updateProfileAction, updatePasswordAction } from "@/lib/actions/user-actions";

interface SettingsClientProps {
  user: {
    fullName: string | null;
    email: string;
  };
}

export function SettingsClient({ user }: SettingsClientProps) {
  const [name, setName] = useState(user.fullName || "");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  
  const [currentPass, setCurrentPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [isUpdatingPass, setIsUpdatingPass] = useState(false);

  const handleSaveProfile = async () => {
    setIsSavingProfile(true);
    try {
      const result = await updateProfileAction(name);
      if (result.success) {
        toast.success("Profile updated successfully!");
      } else {
        toast.error(result.error || "Failed to update profile.");
      }
    } catch (error) {
      toast.error("An error occurred.");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!currentPass || !newPass) {
      toast.error("Please fill in both password fields.");
      return;
    }
    setIsUpdatingPass(true);
    try {
      const result = await updatePasswordAction(currentPass, newPass);
      if (result.success) {
        toast.success("Password updated successfully!");
        setCurrentPass("");
        setNewPass("");
      } else {
        toast.error(result.error || "Failed to update password.");
      }
    } catch (error) {
      toast.error("An error occurred.");
    } finally {
      setIsUpdatingPass(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <Card className="lg:col-span-2 bg-white border-slate-100 shadow-sm rounded-3xl overflow-hidden">
        <CardHeader className="p-8 border-b border-slate-50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center shadow-inner">
              <User size={24} />
            </div>
            <div>
              <CardTitle className="text-xl font-black text-slate-900">Profile Information</CardTitle>
              <CardDescription className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-0.5">Your personal identity</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Full Name</Label>
              <Input 
                id="name" 
                value={name} 
                onChange={(e) => setName(e.target.value)}
                className="h-12 rounded-xl border-slate-100 bg-slate-50/50 font-bold focus:bg-white transition-all" 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Email Address</Label>
              <Input id="email" defaultValue={user.email} disabled className="h-12 rounded-xl border-slate-100 bg-slate-100 opacity-60 cursor-not-allowed font-bold" />
            </div>
          </div>
          
          <div className="pt-4 border-t border-slate-50 flex justify-end">
            <Button 
              onClick={handleSaveProfile}
              disabled={isSavingProfile}
              className="bg-blue-500 hover:bg-blue-600 text-white rounded-xl h-12 px-8 font-black border-0 shadow-lg shadow-blue-500/20 gap-2"
            >
              {isSavingProfile ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              Save Changes
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white border-slate-100 shadow-sm rounded-3xl overflow-hidden self-start">
        <CardHeader className="p-8 border-b border-slate-50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center shadow-inner">
              <Shield size={24} />
            </div>
            <div>
              <CardTitle className="text-xl font-black text-slate-900">Security</CardTitle>
              <CardDescription className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-0.5">Protect your account</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-8 space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current-pass" className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Current Password</Label>
              <Input 
                id="current-pass" 
                type="password" 
                placeholder="••••••••" 
                value={currentPass}
                onChange={(e) => setCurrentPass(e.target.value)}
                className="h-12 rounded-xl border-slate-100 bg-slate-50/50 font-bold focus:bg-white transition-all" 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-pass" className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">New Password</Label>
              <Input 
                id="new-pass" 
                type="password" 
                placeholder="New password" 
                value={newPass}
                onChange={(e) => setNewPass(e.target.value)}
                className="h-12 rounded-xl border-slate-100 bg-slate-50/50 font-bold focus:bg-white transition-all" 
              />
            </div>
          </div>
          <Button 
            onClick={handleUpdatePassword}
            disabled={isUpdatingPass}
            variant="outline" 
            className="w-full h-12 rounded-xl border-slate-100 font-black hover:bg-slate-50"
          >
            {isUpdatingPass ? <Loader2 size={18} className="animate-spin" /> : "Update Password"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
