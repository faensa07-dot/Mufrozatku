import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const { data: categories } = await supabase.from("categories").select("id,name,slug,description").order("sort_order");
  return <main className="min-h-screen">
    <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
      <Link href="/" className="text-2xl font-black text-emerald-800">مُفْرَدَاتِي <span className="text-sm font-semibold">Mufrodati</span></Link>
      <nav className="flex gap-3 text-sm"><Link href="/login" className="rounded-xl border px-4 py-2">Masuk</Link><Link href="/register" className="rounded-xl bg-emerald-700 px-4 py-2 text-white">Daftar</Link></nav>
    </header>
    <section className="mx-auto grid max-w-6xl gap-8 px-6 py-16 md:grid-cols-2 md:items-center">
      <div><p className="mb-3 font-bold text-emerald-700">BELAJAR BAHASA ARAB JADI MENYENANGKAN</p><h1 className="text-4xl font-black leading-tight md:text-6xl">Kenali kata, pahami dunia.</h1><p className="mt-5 max-w-xl text-lg text-slate-600">Belajar mufradat berdasarkan tempat, dengarkan pelafalan, dan uji pemahamanmu melalui latihan interaktif.</p><Link href="/register" className="mt-8 inline-block rounded-xl bg-emerald-700 px-6 py-3 font-bold text-white">Mulai belajar</Link></div>
      <div className="rounded-[2rem] bg-emerald-100 p-10 text-center"><div className="arabic text-7xl text-emerald-900">مَرْحَبًا</div><p className="mt-4 text-xl font-bold text-emerald-900">Ahlan wa sahlan!</p><p className="mt-2 text-emerald-800">Selamat datang di Mufrodati</p></div>
    </section>
    <section className="mx-auto max-w-6xl px-6 pb-20"><h2 className="mb-5 text-2xl font-extrabold">Jelajahi mufradat</h2><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {(categories ?? []).map((c) => <Link key={c.id} href={`/mufradat/${c.slug}`} className="rounded-2xl border bg-white p-5 transition hover:-translate-y-1 hover:shadow-md"><h3 className="text-xl font-bold">{c.name}</h3><p className="arabic mt-2 text-2xl text-emerald-800">{c.description ?? ""}</p></Link>)}
      {!categories?.length && <p className="text-slate-500">Kategori akan tampil setelah admin menambahkan materi.</p>}
    </div></section>
  </main>;
}
