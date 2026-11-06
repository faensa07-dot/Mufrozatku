"use client";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function RegisterPage() {
  const [name,setName]=useState(""); const [email,setEmail]=useState(""); const [password,setPassword]=useState(""); const [message,setMessage]=useState(""); const [error,setError]=useState(""); const [busy,setBusy]=useState(false);
  const supabase=createClient(); const router=useRouter();
  async function submit(e:FormEvent){e.preventDefault();setBusy(true);setError("");setMessage("");const {data,error}=await supabase.auth.signUp({email,password,options:{data:{full_name:name}}});setBusy(false);if(error){setError(error.message);return;}if(data.session){router.push("/dashboard");router.refresh();}else setMessage("Pendaftaran berhasil. Periksa email untuk konfirmasi akun sebelum masuk.");}
  return <main className="grid min-h-screen place-items-center px-5"><form onSubmit={submit} className="w-full max-w-md rounded-3xl border bg-white p-8 shadow-sm"><Link href="/" className="font-bold text-emerald-700">← Mufrodati</Link><h1 className="mt-5 text-3xl font-black">Buat akun</h1><p className="mb-6 mt-2 text-slate-500">Akun baru otomatis memiliki peran siswa.</p><label className="mb-2 block text-sm font-semibold">Nama lengkap</label><input required value={name} onChange={e=>setName(e.target.value)} className="mb-4 w-full rounded-xl border p-3"/><label className="mb-2 block text-sm font-semibold">Email</label><input required type="email" value={email} onChange={e=>setEmail(e.target.value)} className="mb-4 w-full rounded-xl border p-3"/><label className="mb-2 block text-sm font-semibold">Password (minimal 8 karakter)</label><input required minLength={8} type="password" value={password} onChange={e=>setPassword(e.target.value)} className="mb-4 w-full rounded-xl border p-3"/>{error&&<p className="mb-3 text-sm text-red-600">{error}</p>}{message&&<p className="mb-3 text-sm text-emerald-700">{message}</p>}<button disabled={busy} className="w-full rounded-xl bg-emerald-700 p-3 font-bold text-white">{busy?"Memproses...":"Daftar"}</button><p className="mt-5 text-center text-sm">Sudah punya akun? <Link className="font-bold text-emerald-700" href="/login">Masuk</Link></p></form></main>;
}
