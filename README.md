# English Quiz Chatbot

English Quiz Chatbot adalah aplikasi kuis interaktif berbasis Next.js App Router, TypeScript, Tailwind CSS, dan Groq API.

## Tech Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Groq SDK `groq-sdk`

## Fitur Utama

- Generate soal Bahasa Inggris berdasarkan level, subtopik, dan tipe soal.
- Mode Multiple Choice, Fill in the Blank, dan Campuran.
- Grading deterministik tanpa memanggil Groq.
- Feedback benar/salah, penjelasan Bahasa Indonesia, dan rekomendasi materi.
- Ringkasan skor dan kelemahan berdasarkan `skill_tag`.
- Chatbot mini khusus pembelajaran Bahasa Inggris.

## Menjalankan Project

```bash
npm install
npm run dev
```

Buat file `.env.local` secara lokal berdasarkan `.env.example` dan isi `GROQ_API_KEY`. Jangan commit `.env.local`.

Model default adalah `openai/gpt-oss-20b`, yang mendukung JSON, chat, dan penilaian isian. Untuk menggunakan model chat lain yang aktif dan dapat diakses akun Anda, atur `GROQ_MODEL` di environment server lalu restart server. Model lama `llama-3.3-70b-versatile` sudah tidak tersedia untuk akun non-enterprise; lihat [pengumuman Groq](https://console.groq.com/docs/deprecations).

Per 14 November 2026, tarif standar GPT-OSS 20B adalah US$0,075 per 1 juta token input dan US$0,30 per 1 juta token output, dibandingkan US$0,15 / US$0,60 pada GPT-OSS 120B. Tarif per token sekitar 50% lebih rendah; tagihan aktual tetap bergantung pada pemakaian token, reasoning, retry, dan paket akun. Lihat [harga GPT-OSS 20B](https://console.groq.com/docs/model/openai/gpt-oss-20b) dan [GPT-OSS 120B](https://console.groq.com/docs/model/openai/gpt-oss-120b).

Untuk menghemat pemakaian, GPT-OSS menggunakan `reasoning_effort: low`. Output kuis dibatasi `1024 + (jumlah soal yang diminta × 500)` token per panggilan, sedangkan chat dan grading masing-masing maksimal 1024 token termasuk reasoning. Batas ini bukan jumlah token yang pasti terpakai. Kuis dibuat sekaligus dalam satu batch; hanya soal yang kurang yang diminta ulang, dan pilihan ganda dinilai lokal tanpa panggilan model.

Pembuatan kuis mencoba maksimal tiga batch untuk menangani koneksi sementara, rate limit, dan JSON yang tidak valid. Soal selalu divalidasi sebelum dikirim, dan jumlah soal harus sesuai permintaan. Browser tidak mengulang request pembuatan kuis secara otomatis. Jika gagal, pesan error membedakan konfigurasi model, koneksi, timeout, dan hasil soal yang tidak valid.

## Environment di Vercel

Di pengaturan project Vercel, buka **Settings > Environment Variables** dan tambahkan:

| Name | Value |
|---|---|
| `GROQ_API_KEY` | API key Groq Anda, sama dengan konfigurasi lokal |
| `GROQ_MODEL` | `openai/gpt-oss-20b` |
| `GIPHY_API_KEY` | API key Giphy Anda, sama dengan konfigurasi lokal |

Pilih environment yang digunakan, misalnya **Production** dan **Preview**, lalu simpan dan redeploy. Perubahan environment hanya berlaku pada deployment baru. Lihat [dokumentasi environment Vercel](https://vercel.com/docs/environment-variables/managing-environment-variables).

Gunakan nama variabel persis seperti di atas tanpa prefix `NEXT_PUBLIC_`. File `.env` lokal tidak ikut diunggah melalui Git karena sudah diabaikan; isi nilai variabel secara terpisah di Vercel. Untuk lokal, restart `npm run dev` setelah mengubah `.env`.

### Jika production menampilkan API key tidak valid

Pesan ini muncul ketika Groq menolak kredensial, bukan ketika model tidak tersedia. Periksa apakah key masih aktif di [Groq Console](https://console.groq.com/keys). Jika ditolak juga saat dipakai lokal, ganti dengan key aktif yang baru.

Di Vercel, isi Value `GROQ_API_KEY` dengan nilai key saja, tanpa tanda kutip, awalan `Bearer`, atau teks `GROQ_API_KEY=`. Pastikan variabel diterapkan ke environment **Production** pada project yang benar. Setelah menyimpan, redeploy deployment terbaru dan buka domain production yang menunjuk ke deployment baru. Deployment lama tetap memakai konfigurasi lamanya. Jangan membagikan key melalui pesan atau memasukkannya ke Git.

## Keamanan API Key

- Groq hanya dipanggil dari Route Handler di `app/api/...`.
- API key dibaca dari `process.env.GROQ_API_KEY`.
- Jangan memakai prefix `NEXT_PUBLIC_` untuk API key.
- `.env.local` sudah masuk `.gitignore`.

## Script

```bash
npm run lint
npm run build
npm test
```

Tes regresi menggunakan test runner bawaan Node.js 24 dan mock Groq, tanpa membutuhkan API key atau akses jaringan.
