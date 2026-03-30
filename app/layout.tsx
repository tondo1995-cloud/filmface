import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import Script from "next/script";
import "./globals.css";

// 🔥 FONT
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const grotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-grotesk",
});

// 🔥 METADATA
export const metadata: Metadata = {
  title: "FilmFace",
  description: "Metti la faccia del tuo amico in un film in pochi secondi",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="it"
      className={`${inter.variable} ${grotesk.variable}`}
    >
      <body
        style={{
          fontFamily: "var(--font-inter)",
          margin: 0,
        }}
      >
        {/* 🔥 GOOGLE ANALYTICS (CORRETTO) */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-RCG961Z856"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-RCG961Z856');
          `}
        </Script>

        {children}

        {/* 🔥 VERCEL ANALYTICS */}
        <Analytics />
      </body>
    </html>
  );
}