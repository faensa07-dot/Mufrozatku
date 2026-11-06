"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireManager } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const schema=z.object({category_id:z.string().uuid(),arabic:z.string().min(1),latin:z.string().min(1),meaning:z.string().min(1),image_url:z.string().url().optional().or(z.literal("")),audio_url:z.string().url().optional().or(z.literal(""))});
export async function createVocabulary(formData:FormData){
  await requireManager(); const parsed=schema.safeParse(Object.fromEntries(formData));
  if(!parsed.success) throw new Error("Data kosakata belum valid.");
  const supabase=await createClient(); const {error}=await supabase.from("vocabulary").insert({...parsed.data,image_url:parsed.data.image_url||null,audio_url:parsed.data.audio_url||null});
  if(error) throw new Error(error.message); revalidatePath("/admin/mufradat"); revalidatePath("/mufradat");
}
export async function deleteVocabulary(formData:FormData){
  await requireManager(); const id=String(formData.get("id")??""); const supabase=await createClient();
  const {error}=await supabase.from("vocabulary").delete().eq("id",id); if(error)throw new Error(error.message);
  revalidatePath("/admin/mufradat"); revalidatePath("/mufradat");
}
