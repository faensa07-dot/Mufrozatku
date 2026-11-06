# Mufrodati

Aplikasi pembelajaran mufradat dan Bahasa Arab kelas 4 SD/MI.

## Stack
- Next.js 15 App Router + TypeScript
- Tailwind CSS v4
- Supabase PostgreSQL, Auth, Storage
- Vercel

## 1. Persiapan
Pastikan Node.js 20.9+ dan npm tersedia. Buat project Supabase baru.

```bash
npm install
cp .env.example .env.local
```

Isi `.env.local` dari **Supabase → Project Settings → API**:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (publishable/anon key, bukan service_role)

## 2. Database dan keamanan
1. Buka Supabase → SQL Editor.
2. Jalankan seluruh isi `supabase/schema.sql`.
3. Di Supabase → Authentication → URL Configuration, set Site URL ke URL lokal saat development (`http://localhost:3000`) dan tambahkan URL Vercel saat deploy.
4. Daftarkan akun melalui `/register`.
5. Jadikan akun pertama sebagai admin dengan SQL (ganti email):
   ```sql
   update public.profiles
   set role = 'admin'
   where id = (select id from auth.users where email = 'email-admin-anda@example.com');
   ```
6. Guru dapat diberi role `teacher` oleh admin melalui SQL:
   ```sql
   update public.profiles
   set role = 'teacher'
   where id = (select id from auth.users where email = 'email-guru@example.com');
   ```

**Penting:** registrasi publik selalu membuat role `student`. Jangan pernah menerima role dari form registrasi. Jangan masukkan `service_role` key ke variabel `NEXT_PUBLIC_*` atau ke browser.

## 3. Jalankan
```bash
npm run dev
```
Buka http://localhost:3000.

## 4. Fitur starter
- Landing page dan kategori mufradat.
- Registrasi dan login email/password.
- Dashboard siswa dan dashboard pengelola.
- Daftar kosakata berdasarkan kategori.
- Tambah dan hapus kosakata oleh admin/guru.
- CRUD kategori dasar.
- Halaman daftar materi dan kuis (read-only untuk siswa pada starter ini).
- RLS untuk profil, materi, kosakata, kuis, hasil kuis, progres, dan Storage.

## 5. Deploy ke Vercel
1. Buat repository GitHub bernama `mufrodati`.
2. Push kode:
   ```bash
   git init
   git add .
   git commit -m "Initial Mufrodati full-stack app"
   git branch -M main
   git remote add origin https://github.com/USERNAME/mufrodati.git
   git push -u origin main
   ```
3. Di Vercel pilih **Add New → Project**, import repository `mufrodati`.
4. Tambahkan `NEXT_PUBLIC_SUPABASE_URL` dan `NEXT_PUBLIC_SUPABASE_ANON_KEY` di Project Settings → Environment Variables.
5. Deploy.
6. Tambahkan domain Vercel ke Supabase → Authentication → URL Configuration → Redirect URLs.

## Catatan cakupan
Ini adalah fondasi full-stack yang dapat dijalankan dan dikembangkan. CRUD kategori dan kosakata sudah tersambung ke Supabase. Modul editor materi, pembuat kuis, penilaian otomatis, upload UI Storage, serta laporan guru masih merupakan tahap implementasi berikutnya. RLS dasar sudah disiapkan; sebelum digunakan untuk data siswa sungguhan, lakukan audit keamanan dan uji kebijakan per role.
