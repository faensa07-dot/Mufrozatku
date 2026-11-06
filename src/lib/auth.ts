import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type AppRole = "student" | "teacher" | "admin";

export async function getCurrentProfile() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from("profiles").select("id, full_name, role").eq("id", user.id).maybeSingle();
  return profile;
}

export async function requireUser() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  return profile;
}

export async function requireManager() {
  const profile = await requireUser();
  if (!["admin", "teacher"].includes(profile.role)) redirect("/dashboard");
  return profile;
}
