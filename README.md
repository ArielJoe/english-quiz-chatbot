# English Quiz Chatbot

English Quiz Chatbot adalah aplikasi kuis interaktif berbasis Next.js App Router, TypeScript, Tailwind CSS, dan Google Gemini API.

## Tech Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Google GenAI SDK `@google/genai`

## Fitur Utama

- Generate soal Bahasa Inggris berdasarkan level, subtopik, dan tipe soal.
- Mode Multiple Choice, Fill in the Blank, dan Campuran.
- Grading deterministik tanpa memanggil Gemini.
- Feedback benar/salah, penjelasan Bahasa Indonesia, dan rekomendasi materi.
- Ringkasan skor dan kelemahan berdasarkan `skill_tag`.
- Chatbot mini khusus pembelajaran Bahasa Inggris.

## Menjalankan Project

```bash
npm install
npm run dev
```

Buat file `.env.local` secara lokal berdasarkan `.env.example` dan isi `GEMINI_API_KEY`. Jangan commit `.env.local`.

## Keamanan API Key

- Gemini hanya dipanggil dari Route Handler di `app/api/...`.
- API key dibaca dari `process.env.GEMINI_API_KEY`.
- Jangan memakai prefix `NEXT_PUBLIC_` untuk API key.
- `.env.local` sudah masuk `.gitignore`.

## Script

```bash
npm run lint
npm run build
```
