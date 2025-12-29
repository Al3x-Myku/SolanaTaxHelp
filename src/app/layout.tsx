import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SolTax RO – Raportare Solana pentru ANAF",
  description: "Generează rapoarte CSV cu tranzacțiile Solana și prețuri istorice RON.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ro">
      <body>{children}</body>
    </html>
  );
}
