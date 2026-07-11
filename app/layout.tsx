import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://viefolio.com"),
  title: {
    default: "Viefolio — Your Work Deserves a Beautiful Home",
    template: "%s | Viefolio",
  },
  description:
    "Build a stunning portfolio in minutes — for developers, designers, creators, and students. Six themes, live progress tracking, and your own yourname.viefolio.com link.",
  keywords: [
    "portfolio",
    "portfolio builder",
    "developer portfolio",
    "designer portfolio",
    "creator link in bio",
    "no-code",
    "viefolio",
  ],
  openGraph: {
    title: "Viefolio — Your Work Deserves a Beautiful Home",
    description:
      "Build a stunning portfolio in minutes — for developers, designers, creators, and students. Live from day one at yourname.viefolio.com.",
    type: "website",
    url: "https://viefolio.com",
    siteName: "Viefolio",
  },
  twitter: {
    card: "summary_large_image",
    title: "Viefolio — Your Work Deserves a Beautiful Home",
    description:
      "Build a stunning portfolio in minutes — for developers, designers, creators, and students.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        {/* Warm up Firebase connections — avatars/images and Firestore reads */}
        <link rel="preconnect" href="https://firebasestorage.googleapis.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://firestore.googleapis.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-full flex flex-col bg-background text-[#0f172a]">
        {children}
      </body>
    </html>
  );
}
