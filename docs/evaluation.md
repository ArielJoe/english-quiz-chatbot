# Evaluasi English Quiz Chatbot

## Verifikasi Model Hemat (14 November 2026)

- Model default dan `.env` menggunakan `openai/gpt-oss-20b`, dengan konfigurasi Vercel yang sama di `.env.example` dan README. Kedua API key yang sudah ada tetap dipertahankan.
- Model tersedia pada daftar model akun Groq dan mendukung JSON. Tarif standar yang dipublikasikan saat verifikasi: US$0,075 per 1 juta token input dan US$0,30 per 1 juta token output, sekitar 50% lebih rendah per token daripada GPT-OSS 120B. Sumber: [Groq GPT-OSS 20B](https://console.groq.com/docs/model/openai/gpt-oss-20b) dan [120B](https://console.groq.com/docs/model/openai/gpt-oss-120b).
- GPT-OSS memakai reasoning `low`. Batas output per panggilan kuis adalah `1024 + jumlah soal yang diminta × 500` token; chat dan grading maksimal 1024 token. Batas mencakup reasoning dan tidak berarti seluruh token selalu digunakan.
- Uji langsung: 5 soal beginner grammar multiple choice, 5 soal intermediate vocabulary fill in the blank, dan 10 soal advanced translation mixed berhasil. Seluruh 20 soal lolos validasi kontrak data dan kesesuaian request; mixed berisi kedua tipe soal.
- Uji langsung chat menghasilkan respons; grading menerima jawaban benar dan menolak jawaban salah.
- Verifikasi tersebut memeriksa integrasi dan struktur data; kualitas pedagogis seluruh soal belum ditinjau secara manual. Penghematan tagihan aktual bergantung pada token, retry, dan paket akun.

## Verifikasi Perbaikan Generate Soal (14 November 2026)

- Penyebab terverifikasi: Groq menolak model lama `llama-3.3-70b-versatile` dengan HTTP 404 `model_not_found`.
- Model pengganti `openai/gpt-oss-120b` terdaftar pada API models akun yang digunakan.
- Uji langsung Groq: masing-masing 5 soal beginner grammar untuk multiple choice, fill in the blank, dan mixed berhasil; seluruh soal lolos validasi struktur, level, topik, dan tipe. Mode mixed berisi kedua tipe soal.
- Uji langsung chat: respons pembelajaran tersedia. Grading isian dengan model pengganti menerima jawaban benar dan menolak jawaban salah setelah batas token disesuaikan.
- Tes regresi otomatis mencakup pemilihan model, retry JSON rusak, JSON validation error dari Groq, output terpotong, kelengkapan batch, model tidak tersedia, gangguan layanan, rate limit, validasi request, keamanan error API key, dan grading deterministik.
- Uji langsung ini memeriksa integrasi dan kontrak data; belum merupakan penilaian manual menyeluruh atas kualitas pedagogis soal atau pengujian tampilan browser. Status evaluasi manual di bawah tetap berlaku.

## 12.1 Contoh Soal Manual

1. Beginner grammar: Choose the correct sentence. Options: "She likes tea.", "She like tea.", "She liking tea.", "She liked tea now." Correct: "She likes tea."
2. Beginner grammar: Fill in the blank: I ___ a student. Correct: "am". Acceptable: "am".
3. Beginner vocabulary: What is the opposite of "big"? Options: "small", "tall", "long", "heavy". Correct: "small".
4. Beginner vocabulary: Fill in the blank: A person who teaches is a ___. Correct: "teacher". Acceptable: "teacher".
5. Beginner translation: Translate "Saya makan nasi" into English. Options: "I eat rice.", "I drink rice.", "I cook water.", "I read rice." Correct: "I eat rice."
6. Beginner conversation: Choose the best reply to "How are you?" Options: "I am fine, thank you.", "It is a book.", "At seven.", "Blue." Correct: "I am fine, thank you."
7. Intermediate grammar: Choose the correct sentence. Options: "I have lived here for five years.", "I live here since five years.", "I lived here for five years now.", "I am live here for five years." Correct: "I have lived here for five years."
8. Intermediate grammar: Fill in the blank: She has been studying ___ morning. Correct: "since". Acceptable: "since".
9. Intermediate vocabulary: What does "reliable" mean? Options: "dependable", "expensive", "dangerous", "silent". Correct: "dependable".
10. Intermediate vocabulary: Fill in the blank: The meeting was ___ because everyone agreed quickly. Correct: "efficient". Acceptable: "efficient".
11. Intermediate translation: Translate "Dia sudah menyelesaikan tugasnya" into English. Options: "She has finished her assignment.", "She finish her assignment.", "She finishing her assignment.", "She has finish her assignment." Correct: "She has finished her assignment."
12. Intermediate conversation: Choose the best response to "Could you repeat that, please?" Options: "Sure, I said we meet at noon.", "No, I am hungry.", "It is under the chair.", "Yesterday was rainy." Correct: "Sure, I said we meet at noon."
13. Advanced grammar: Choose the correct conditional sentence. Options: "Had I known earlier, I would have called you.", "Had I knew earlier, I will call you.", "If I had knew earlier, I call you.", "I would called you had I know earlier." Correct: "Had I known earlier, I would have called you."
14. Advanced grammar: Fill in the blank: No sooner had the speech ended ___ the audience applauded. Correct: "than". Acceptable: "than".
15. Advanced vocabulary: What does "meticulous" mean? Options: "very careful and detailed", "quick and careless", "angry and loud", "unclear and vague". Correct: "very careful and detailed".
16. Advanced vocabulary: Fill in the blank: Her explanation was clear but lacked ___. Correct: "nuance". Acceptable: "nuance".
17. Advanced translation: Translate "Seandainya saya tahu, saya akan membantumu" into English. Options: "If I had known, I would have helped you.", "If I know, I will helped you.", "If I knew, I help you.", "If I had know, I would help you." Correct: "If I had known, I would have helped you."
18. Advanced conversation: Choose the most natural response to "I am afraid I cannot make it to the meeting." Options: "No problem, we can reschedule.", "I am a table.", "Blue is better.", "It was cooked." Correct: "No problem, we can reschedule."
19. Mixed grammar: Fill in the blank: The report ___ by the team yesterday. Correct: "was prepared". Acceptable: "was prepared".
20. Mixed conversation: Choose the best reply to "Would you mind opening the window?" Options: "Not at all.", "Yes, it is a window.", "I opened tomorrow.", "Because I am blue." Correct: "Not at all."

## 12.2 Tabel Evaluasi Fungsional

| No | Skenario | Ekspektasi | Status |
|---|---|---|---|
| 1 | User memilih Beginner | Sistem menghasilkan soal level beginner | Belum diuji |
| 2 | User menjawab benar | Sistem menampilkan apresiasi | Belum diuji |
| 3 | User menjawab salah | Sistem menampilkan koreksi dan penjelasan | Belum diuji |
| 4 | User klik Soal Berikutnya | Sistem menampilkan soal baru | Belum diuji |
| 5 | User bertanya di luar topik | Sistem menolak secara sopan | Belum diuji |

## 12.3 Tabel Evaluasi Kualitas Respons

| No | Aspek | Kriteria Lolos | Status |
|---|---|---|---|
| 1 | Kesesuaian subtopik | Soal sesuai grammar, vocabulary, translation, atau conversation | Belum diuji |
| 2 | Kesesuaian level | Tingkat kesulitan sesuai beginner, intermediate, atau advanced | Belum diuji |
| 3 | Akurasi jawaban | Kunci jawaban benar | Belum diuji |
| 4 | Kejelasan explanation | Penjelasan mudah dipahami dalam Bahasa Indonesia | Belum diuji |
| 5 | Konsistensi format | Format soal konsisten | Belum diuji |
| 6 | Variasi tipe soal | Ada variasi Multiple Choice dan Fill in the Blank | Belum diuji |
