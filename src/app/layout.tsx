import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mufrodati — Belajar Bahasa Arab",
  description: "Platform belajar mufradat dan bahasa Arab kelas 4 SD/MI."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="id"><body>{children}</body></html>;
}
