import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default async function Dashboard() {
  const profile=await requireUser(); const supabase=await createClient();
  const [{count:words},{count:lessons}]=await Promise.all([
    supabase.from("vocabulary").select("*",{count:"exact",head:true}),
    supabase.from("lessons").select("*",{count:"exact",head:true})
  ]);
  const manager=["admin","teacher"].includes(profile.role);
  return <main className="mx-auto min-h-screen max-w-6xl px-6 py-10"><header className="flex flex-wrap items-center justify-between gap-4"><div><Link href="/" className="font-bold text-emerald-700">Mufrodati</Link><h1 className="mt-3 text-3xl font-black">Assalamu&apos;alaikum, {profile.full_name ?? "Sahabat"}!</h1><p className="mt-1 text-slate-500">Selamat belajar bahasa Arab hari ini.</p></div><form action="/auth/signout" method="post"><button className="rounded-xl border px-4 py-2">Keluar</button></form></header>
    <div className="mt-8 grid gap-4 sm:grid-cols-2"><div className="rounded-2xl bg-emerald-700 p-6 text-white"><p className="opacity-80">Total kosakata</p><p className="mt-2 text-4xl font-black">{words??0}</p></div><div className="rounded-2xl bg-amber-100 p-6 text-amber-950"><p className="opacity-80">Materi tersedia</p><p className="mt-2 text-4xl font-black">{lessons??0}</p></div></div>
    <section className="mt-10"><h2 className="text-xl font-extrabold">Menu belajar</h2><div className="mt-4 grid gap-3 sm:grid-cols-2"><Link href="/mufradat" className="rounded-2xl border bg-white p-5 font-bold">📚 Jelajahi mufradat →</Link><Link href="/materi" className="rounded-2xl border bg-white p-5 font-bold">📝 Materi kelas 4 →</Link><Link href="/latihan" className="rounded-2xl border bg-white p-5 font-bold">🎯 Latihan dan kuis →</Link>{manager&&<Link href="/admin" className="rounded-2xl border border-emerald-300 bg-emerald-50 p-5 font-bold text-emerald-900">⚙️ Dashboard pengelola →</Link>}</div></section>
  </main>;
}
