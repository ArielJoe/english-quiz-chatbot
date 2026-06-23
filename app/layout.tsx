import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "English Quiz Chatbot",
  description: "Kuis Bahasa Inggris interaktif dengan Gemini API"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
