import { auth } from "@/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { desc } from "drizzle-orm";
import { AdminUsersClient } from "./AdminUsersClient";

export const metadata = { title: "User Management" };

export default async function AdminUsersPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") return null;

  const allUsers = await db
    .select()
    .from(users)
    .orderBy(desc(users.createdAt));

  return <AdminUsersClient initialUsers={allUsers} />;
}
