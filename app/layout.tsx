import type { Metadata } from "next";
import { Work_Sans, Bitter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

// Body face: clean humanist sans
const workSans = Work_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

// Display face: characterful slab serif
const bitter = Bitter({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

// Data/numeric face: monospace with tabular figures
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "StockBros",
  description: "Swing Trading Analytics & Journal",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${workSans.variable} ${bitter.variable} ${jetbrainsMono.variable}`}>
      <body className="font-sans antialiased text-ink bg-paper min-h-screen">
        {children}
      </body>
    </html>
  );
}
