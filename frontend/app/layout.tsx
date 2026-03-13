import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "trustmebro - AI-Mediated Freelance Platform",
  description: "AI-powered gig platform with escrow and automated verification",
};

import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`antialiased`}
      >
        <Navbar />
        <main className="min-h-screen">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
