import type { Metadata } from "next";
import { Inter, Fraunces, Amiri, Dancing_Script } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-fraunces",
  display: "swap",
});

const amiri = Amiri({
  subsets: ["arabic"],
  weight: ["400", "700"],
  variable: "--font-amiri",
  display: "swap",
});

const dancingScript = Dancing_Script({
  subsets: ["latin"],
  weight: ["700"],
  variable: "--font-signature",
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
        className={`${inter.variable} ${fraunces.variable} ${amiri.variable} ${dancingScript.variable} font-sans`}
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
