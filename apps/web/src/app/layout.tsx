import { Inter, Ibarra_Real_Nova } from "next/font/google";
import "./globals.css";
import type { Metadata } from "next";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const ibarra = Ibarra_Real_Nova({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-ibarra",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Trailwright - Adventure Planning for Small Groups",
  description: "Plan extraordinary journeys with minimal fuss. Collaborative trip planning with an adventure-minimal aesthetic.",
  keywords: ["trip planning", "travel", "adventure", "collaboration", "itinerary"],
  authors: [{ name: "Trailwright" }],
  viewport: "width=device-width, initial-scale=1",
  robots: "index, follow",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: process.env.NEXT_PUBLIC_APP_URL,
    title: "Trailwright - Adventure Planning for Small Groups",
    description: "Plan extraordinary journeys with minimal fuss.",
    siteName: "Trailwright",
  },
  twitter: {
    card: "summary_large_image",
    title: "Trailwright - Adventure Planning for Small Groups",
    description: "Plan extraordinary journeys with minimal fuss.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${ibarra.variable}`}>
      <body className="min-h-screen bg-bone text-ink antialiased">
        {children}
      </body>
    </html>
  );
}