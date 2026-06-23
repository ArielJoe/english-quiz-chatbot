# AGENTS.md

## Project Context

Project ini adalah English Quiz Chatbot berbasis Next.js App Router, TypeScript, Tailwind CSS, dan Google Gemini API.

Tujuan utama:
- Menghasilkan soal Bahasa Inggris secara dinamis.
- Memberikan feedback benar atau salah.
- Menjelaskan jawaban dalam Bahasa Indonesia.
- Memberikan rekomendasi materi lanjutan.
- Menyediakan chatbot mini untuk pertanyaan terkait pembelajaran Bahasa Inggris.

## Working Rules

- Gunakan Next.js App Router.
- Gunakan TypeScript secara ketat.
- Gunakan Tailwind CSS untuk styling.
- Gemini hanya boleh dipanggil dari server Route Handler di `app/api/...`.
- Jangan pernah memanggil Gemini dari Client Component.
- Jangan mengekspos `GEMINI_API_KEY` ke browser.
- Jangan memakai prefix `NEXT_PUBLIC_` untuk API key.
- Buat `.env.example`, bukan `.env.local`.
- Pastikan `.env.local` masuk ke `.gitignore`.

## Quality Gate

Sebelum menyelesaikan task, gunakan skill `$impeccable-nextjs-qa` untuk memeriksa:
- TypeScript correctness.
- Next.js App Router correctness.
- Validasi input API.
- Keamanan environment variable.
- Error handling.
- Grading deterministik.
- Konsistensi UI.
- `npm run lint`.
- `npm run build`.

## Completion Criteria

Task dianggap selesai hanya jika:
- Fitur utama berjalan.
- Tidak ada error TypeScript.
- Tidak ada error lint yang kritis.
- `npm run build` berhasil.
- Tidak ada API key yang di-hardcode.
- Error state dan loading state tersedia.
- Perubahan kode mudah dijelaskan untuk laporan.