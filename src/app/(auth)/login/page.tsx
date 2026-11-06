"use client";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email,setEmail]=useState(""); const [password,setPassword]=useState(""); const [error,setError]=useState(""); const [busy,setBusy]=useState(false);
  const router=useRouter(); const supabase=createClient();
  async function submit(e:FormEvent){e.preventDefault();setBusy(true);setError("");const {error}=await supabase.auth.signInWithPassword({email,password});setBusy(false);if(error){setError(error.message);return;}router.push("/dashboard");router.refresh();}
  return <main className="grid min-h-screen place-items-center px-5"><form onSubmit={submit} className="w-full max-w-md rounded-3xl border bg-white p-8 shadow-sm"><Link href="/" className="font-bold text-emerald-700">← Mufrodati</Link><h1 className="mt-5 text-3xl font-black">Masuk</h1><p className="mb-6 mt-2 text-slate-500">Lanjutkan perjalanan belajarmu.</p><label className="mb-2 block text-sm font-semibold">Email</label><input required type="email" value={email} onChange={e=>setEmail(e.target.value)} className="mb-4 w-full rounded-xl border p-3"/><label className="mb-2 block text-sm font-semibold">Password</label><input required type="password" value={password} onChange={e=>setPassword(e.target.value)} className="mb-4 w-full rounded-xl border p-3"/>{error&&<p className="mb-3 text-sm text-red-600">{error}</p>}<button disabled={busy} className="w-full rounded-xl bg-emerald-700 p-3 font-bold text-white disabled:opacity-50">{busy?"Memproses...":"Masuk"}</button><p className="mt-5 text-center text-sm">Belum punya akun? <Link className="font-bold text-emerald-700" href="/register">Daftar</Link></p></form></main>;
}
