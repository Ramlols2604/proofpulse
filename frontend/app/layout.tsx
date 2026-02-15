import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ProofPulse - Real-Time Claim Verification",
  description: "AI-powered claim verification from video, text, links, PDF, or TXT",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
