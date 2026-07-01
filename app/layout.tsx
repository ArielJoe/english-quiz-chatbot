import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Lingofy — Kuis Bahasa Inggris bareng Lingo",
  description:
    "Lingofy: kuis Bahasa Inggris interaktif yang ditemani Lingo, maskot pintarmu, ditenagai Groq API."
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
