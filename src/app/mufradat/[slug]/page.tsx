import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
export default async function CategoryPage({params}:{params:Promise<{slug:string}>}) {
  await requireUser(); const {slug}=await params; const supabase=await createClient();
  const {data:category}=await supabase.from("categories").select("*").eq("slug",slug).single(); if(!category)notFound();
  const {data:words}=await supabase.from("vocabulary").select("id,arabic,latin,meaning,image_url,audio_url,example_arabic,example_meaning").eq("category_id",category.id).order("created_at");
  return <main className="mx-auto max-w-6xl px-6 py-10"><Link href="/mufradat" className="text-emerald-700">← Semua kategori</Link><h1 className="mt-4 text-3xl font-black">{category.name}</h1><p className="arabic mt-2 text-3xl text-emerald-800">{category.description}</p><div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{(words??[]).map(w=><article key={w.id} className="rounded-2xl border bg-white p-5">{w.image_url&&<img src={w.image_url} alt={w.meaning} className="mb-3 h-36 w-full rounded-xl object-cover"/>}<p className="arabic text-3xl text-emerald-900">{w.arabic}</p><p className="mt-1 font-semibold">{w.latin}</p><p className="text-slate-600">{w.meaning}</p>{w.audio_url&&<audio controls preload="none" className="mt-3 w-full"><source src={w.audio_url}/></audio>}{w.example_arabic&&<div className="mt-3 border-t pt-3"><p className="arabic text-lg">{w.example_arabic}</p><p className="text-sm text-slate-500">{w.example_meaning}</p></div>}</article>)}</div>{!words?.length&&<p className="mt-6 text-slate-500">Belum ada kosakata pada kategori ini.</p>}</main>;
}
