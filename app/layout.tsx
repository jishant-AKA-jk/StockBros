import type { Metadata } from "next";
import { Work_Sans, Bitter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Navbar } from "@/components/Navbar";

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
    <html lang="en" className={`${workSans.variable} ${bitter.variable} ${jetbrainsMono.variable}`} suppressHydrationWarning>
      <body className="font-sans antialiased text-ink bg-paper min-h-screen flex flex-col transition-colors duration-300">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <Navbar />
          <main className="flex-grow">
            {children}
          </main>
          <footer className="border-t border-hairline bg-surface py-6 mt-12 text-center text-sm text-ink-light font-sans">
            <div className="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-4">
              <p className="opacity-80">
                © 2026 StockBros. Built for disciplined trading research.
              </p>
              <p className="text-xs max-w-sm text-center sm:text-right">
                Platform is for historical research only. Not financial advice.
              </p>
            </div>
          </footer>
        </ThemeProvider>
      </body>
    </html>
  );
}
