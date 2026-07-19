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
      <body className="font-sans antialiased text-ink bg-paper min-h-screen flex flex-col">
        <nav className="border-b border-gray-200 bg-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex space-x-8 overflow-x-auto scrollbar-hide py-1">
                <a href="/" className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900 border-b-2 border-transparent hover:border-gray-300 whitespace-nowrap">Dashboard</a>
                <a href="/screener" className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 border-b-2 border-transparent hover:text-gray-700 hover:border-gray-300 whitespace-nowrap">Screener</a>
                <a href="/scanner" className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 border-b-2 border-transparent hover:text-gray-700 hover:border-gray-300 whitespace-nowrap">Scanner</a>
                <a href="/watchlist" className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 border-b-2 border-transparent hover:text-gray-700 hover:border-gray-300 whitespace-nowrap">Watchlist</a>
                <a href="/journal" className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 border-b-2 border-transparent hover:text-gray-700 hover:border-gray-300 whitespace-nowrap">Journal</a>
              </div>
            </div>
          </div>
        </nav>
        <main className="flex-grow">
          {children}
        </main>
        <footer className="border-t border-gray-200 bg-white py-8 mt-12 text-center text-xs text-gray-500 font-sans">
          <div className="max-w-4xl mx-auto px-4 space-y-2">
            <p className="font-semibold text-gray-700">Disclaimer & Platform Information</p>
            <p className="leading-relaxed">
              StockBros is an end-of-day (EOD) swing trading analytics platform. It is <strong>NOT</strong> a live-trading system or financial advice platform. All analytics, calculations, and signals are generated based on historical data.
            </p>
            <p className="text-gray-400">
              © 2026 StockBros. Built for disciplined trading research.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
