import type { Metadata } from "next";
import { Inter, Cormorant_Garamond, Amiri } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-cormorant",
  display: "swap",
});

const amiri = Amiri({
  subsets: ["arabic"],
  weight: ["400", "700"],
  variable: "--font-amiri",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Ahl Al-Islah — People of Reform",
    template: "%s | Ahl Al-Islah",
  },
  description:
    "A student-led community within Humanity Still Exists (HSE), powered by Rijal Al-Huda — cultivating character, purpose, and service in medical education through dedicated brothers' and sisters' programming.",
  keywords: [
    "Ahl Al-Islah",
    "Muslim medical students",
    "Rijal Al-Huda",
    "HSE",
    "medical college",
    "student leadership",
    "community",
    "service",
  ],
  authors: [{ name: "Muhammad Awais Moeen" }],
  openGraph: {
    title: "Ahl Al-Islah — People of Reform",
    description:
      "Reviving the Prophetic spirit of guidance and service in medical education.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body
        className={`${inter.variable} ${cormorant.variable} ${amiri.variable} font-sans`}
      >
        {children}
        <Toaster
          position="top-center"
          richColors
          toastOptions={{
            style: {
              fontFamily: "var(--font-inter), system-ui, sans-serif",
            },
          }}
        />
      </body>
    </html>
  );
}
