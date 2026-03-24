import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
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

// 🔥 METADATA (non lasciare roba default)
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
        {children}
      </body>
    </html>
  );
}