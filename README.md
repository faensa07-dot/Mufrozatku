# Mufradat Ceria

Aplikasi pembelajaran kosakata Bahasa Arab untuk siswa kelas 4 SD/MI. Dibuat dengan React + Vite di sisi frontend dan Node.js + Express di sisi backend. Data awal disimpan dalam file JSON.

## Fitur

- Materi mufradat berdasarkan tiga kategori: benda di kelas, rumah, dan perpustakaan.
- Kartu kosakata dengan tulisan Arab berharakat, transliterasi, arti, ilustrasi emoji, dan contoh kalimat.
- Pelafalan kosakata menggunakan Web Speech API pada browser yang mendukung suara Bahasa Arab.
- Permainan menjodohkan gambar dengan kosakata Arab.
- Kuis pilihan ganda dan penghitungan nilai otomatis.
- Riwayat hasil belajar dan papan peringkat.
- Nama siswa dan fallback riwayat lokal disimpan pada browser.
- Backend Express menyediakan API kategori, kosakata, statistik, nilai, dan leaderboard.

## Persyaratan

- Node.js 18 atau lebih baru
- npm

## Menjalankan di laptop

1. Ekstrak folder project.
2. Buka terminal pada folder `mufradat-ceria`.
3. Instal dependensi:

   ```bash
   npm install
   ```

4. Jalankan frontend dan backend bersamaan:

   ```bash
   npm run dev
   ```

5. Buka `http://localhost:5173`.

Frontend berjalan pada port `5173`, sedangkan backend API berjalan pada port `4000`.

Jika ingin menjalankan secara terpisah:

```bash
npm run server
npm run client
```

## Struktur penting

```text
mufradat-ceria/
├── public/
├── server/
│   ├── data/db.json       # Data kategori, kosakata, dan nilai
│   └── index.js           # Express API
├── src/
│   ├── App.jsx            # Antarmuka dan alur pembelajaran
│   ├── api.js             # Penghubung frontend ke backend
│   ├── main.jsx
│   └── styles.css
├── index.html
├── package.json
├── vite.config.js
└── vercel.json
```

## API backend

| Method | Endpoint | Keterangan |
|---|---|---|
| GET | `/api/health` | Status backend |
| GET | `/api/categories` | Daftar kategori materi |
| GET | `/api/vocabulary` | Semua kosakata |
| GET | `/api/vocabulary?category=kelas` | Kosakata berdasarkan kategori |
| GET | `/api/vocabulary/:id` | Detail satu kosakata |
| GET | `/api/stats` | Statistik aplikasi |
| POST | `/api/scores` | Menyimpan hasil latihan |
| GET | `/api/scores?student=Nama` | Riwayat nilai siswa |
| GET | `/api/leaderboard?limit=5` | Papan peringkat |

Contoh body untuk `POST /api/scores`:

```json
{
  "studentName": "Aisyah",
  "mode": "Kuis",
  "category": "Benda di Kelas",
  "score": 4,
  "total": 5
}
```

## Deploy frontend ke Vercel

1. Push repository ke GitHub.
2. Import repository tersebut dari dashboard Vercel.
3. Framework preset: **Vite**.
4. Build command: `npm run build`.
5. Output directory: `dist`.
6. Tambahkan environment variable:

   ```text
   VITE_API_URL=https://URL-BACKEND-ANDA/api
   ```

   Ganti nilai tersebut dengan URL backend yang sudah di-deploy.

File `vercel.json` sudah disertakan untuk mendukung navigasi aplikasi.

## Deploy backend

Backend Express perlu di-deploy sebagai service Node.js terpisah, misalnya di Render:

1. Buat Web Service dari repository GitHub yang sama.
2. Build command: `npm install`.
3. Start command: `npm run start:server`.
4. Atur environment variable `CLIENT_ORIGIN` ke URL frontend Vercel, misalnya `https://nama-aplikasi.vercel.app`.
5. Setelah backend aktif, salin URL service dan masukkan ke environment variable `VITE_API_URL` di Vercel dengan akhiran `/api`.

### Catatan penyimpanan data

Saat dijalankan lokal, hasil latihan disimpan ke `server/data/db.json`. Pada hosting serverless atau filesystem hosting yang bersifat sementara, perubahan file JSON tidak dijamin bertahan setelah instance berhenti atau deployment baru. Untuk penggunaan online yang benar-benar menyimpan nilai secara permanen, gunakan persistent disk pada hosting backend yang mendukungnya atau migrasikan penyimpanan ke database terkelola. Jangan mengandalkan file JSON lokal sebagai database produksi multi-pengguna.

## Catatan pembelajaran

Kosakata pada project ini merupakan materi contoh awal. Sebelum digunakan dalam pembelajaran formal, cocokkan kembali istilah, harakat, transliterasi, dan contoh kalimat dengan buku ajar Bahasa Arab kelas 4 yang digunakan sekolah. Pelafalan Web Speech API bergantung pada ketersediaan voice Bahasa Arab di perangkat/browser siswa.
