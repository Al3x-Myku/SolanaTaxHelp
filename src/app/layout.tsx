import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SolTax RO - Raportare Tranzacții Solana pentru ANAF",
  description: "Generează rapoarte CSV cu tranzacțiile tale Solana și prețuri istorice în RON pentru declarații ANAF.",
  keywords: ["Solana", "taxe", "ANAF", "RON", "crypto", "România"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ro">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  );
}
