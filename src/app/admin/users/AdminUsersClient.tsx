"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  Search, 
  UserPlus, 
  MoreVertical, 
  Mail, 
  Calendar,
  ShieldCheck,
  ChevronRight,
  Loader2,
  Trash2,
  Ban,
  CheckCircle2,
  Edit
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { toast } from "sonner";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

import { toggleUserStatusAction, deleteUserAction } from "@/lib/actions/admin-user-actions";

interface User {
  id: string;
  email: string;
  fullName: string | null;
  role: string | null;
  isActive: boolean | null;
  createdAt: Date | null;
}

interface AdminUsersClientProps {
  initialUsers: User[];
}

export function AdminUsersClient({ initialUsers }: AdminUsersClientProps) {
  const [users, setUsers] = useState(initialUsers);
  const [searchQuery, setSearchQuery] = useState("");
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  const filteredUsers = users.filter(user => 
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.fullName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    setIsProcessing(id);
    try {
      const result = await toggleUserStatusAction(id, currentStatus);
      if (result.success) {
        setUsers(users.map(u => u.id === id ? { ...u, isActive: !currentStatus } : u));
        toast.success(currentStatus ? "User disabled" : "User enabled");
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error("Error updating user status");
    } finally {
      setIsProcessing(null);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm("Are you sure you want to delete this user? This cannot be undone.")) return;
    setIsProcessing(id);
    try {
      const result = await deleteUserAction(id);
      if (result.success) {
        setUsers(users.filter(u => u.id !== id));
        toast.success("User deleted permanently");
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error("Error deleting user");
    } finally {
      setIsProcessing(null);
    }
  };


  return (
    <div className="space-y-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">User Management</h1>
          <p className="text-slate-500 mt-2 text-lg font-medium">Manage system access, roles, and review user activity.</p>
        </div>
        <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white rounded-2xl h-16 px-8 font-black border-0 shadow-xl shadow-blue-500/20 gap-3">
          <UserPlus size={24} />
          Create New User
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-8">
        <Card className="bg-white border-slate-100 shadow-sm rounded-3xl overflow-hidden">
          <CardHeader className="p-8 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center shadow-inner">
                <Search size={20} />
              </div>
              <div className="relative w-full md:w-[300px]">
                <input 
                  type="text" 
                  placeholder="Search users by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-11 rounded-xl border border-slate-100 bg-slate-50/50 px-4 text-sm font-bold text-slate-700 focus:border-blue-500 focus:bg-white outline-none transition-all shadow-inner"
                />
              </div>
            </div>
            <Badge variant="outline" className="px-3 py-1 rounded-lg border-slate-100 font-black text-slate-400 uppercase tracking-widest text-[9px]">
              Showing {filteredUsers.length} of {users.length} Users
            </Badge>
          </CardHeader>
          <CardContent className="p-0">
            {filteredUsers.length === 0 ? (
              <div className="p-20 text-center text-slate-400 font-bold">No users found matching your search.</div>
            ) : (
              <div className="divide-y divide-slate-50">
                {filteredUsers.map((user) => (
                  <div key={user.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-slate-50/50 transition-colors group">
                    <div className="flex items-center gap-5">
                      <div className="relative">
                        <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center font-black text-slate-400 text-xl group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors shadow-inner">
                          {user.fullName?.[0] || user.email[0].toUpperCase()}
                        </div>
                        {user.role === "admin" && (
                          <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-500 rounded-lg flex items-center justify-center border-2 border-white shadow-sm">
                            <ShieldCheck size={10} className="text-white" />
                          </div>
                        )}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2.5">
                          <h3 className="text-lg font-black text-slate-900 leading-tight">{user.fullName || "Anonymous User"}</h3>
                          <Badge className={cn(
                            "px-2 py-0.5 rounded-lg font-black text-[8px] uppercase tracking-widest border shadow-sm",
                            user.role === "admin" ? "bg-blue-50 text-blue-600 border-blue-100" : "bg-slate-100 text-slate-500 border-slate-200"
                          )}>
                            {user.role}
                          </Badge>
                          {!user.isActive && (
                            <Badge variant="outline" className="bg-rose-50 text-rose-600 border-rose-100 font-black text-[8px] uppercase tracking-widest">Suspended</Badge>
                          )}
                        </div>
                        <div className="flex flex-col md:flex-row md:items-center gap-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          <span className="flex items-center gap-1.5">
                            <Mail size={12} className="text-slate-200" />
                            {user.email}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Calendar size={12} className="text-slate-200" />
                            Joined {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "Unknown"}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link href={`/admin/users/${user.id}`}>
                        <Button variant="outline" className="rounded-xl border-slate-100 font-black px-5 h-10 text-xs text-slate-600 hover:border-blue-200 hover:text-blue-600 shadow-sm transition-all">
                          Details
                        </Button>
                      </Link>
                      <DropdownMenu>
                        <DropdownMenuTrigger className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-200 hover:text-slate-600 hover:bg-slate-100 transition-all outline-none">
                          <MoreVertical size={18} />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 rounded-2xl border-slate-100 p-2 shadow-xl">
                          <DropdownMenuLabel className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2 py-1.5">Actions</DropdownMenuLabel>
                          <DropdownMenuItem className="rounded-xl font-bold text-slate-600 gap-2 focus:bg-blue-50 focus:text-blue-600">
                            <Edit size={16} /> Edit User
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleToggleActive(user.id, user.isActive || false)}
                            className={cn(
                              "rounded-xl font-bold gap-2",
                              user.isActive ? "text-rose-600 focus:bg-rose-50" : "text-emerald-600 focus:bg-emerald-50"
                            )}
                          >
                            {user.isActive ? <Ban size={16} /> : <CheckCircle2 size={16} />}
                            {user.isActive ? "Suspend User" : "Activate User"}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-slate-50 mx-2" />
                          <DropdownMenuItem 
                            onClick={() => handleDeleteUser(user.id)}
                            className="rounded-xl font-bold text-rose-600 gap-2 focus:bg-rose-50"
                          >
                            <Trash2 size={16} /> Delete Permanently
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
