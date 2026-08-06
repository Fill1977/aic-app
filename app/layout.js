import { Archivo, Public_Sans, IBM_Plex_Mono } from "next/font/google";

const display = Archivo({ subsets: ["latin"], weight: ["600", "700"], variable: "--font-display", display: "swap" });
const body = Public_Sans({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-body", display: "swap" });
const mono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-mono", display: "swap" });

export const metadata = {
  title: "Dashboard · Adempimenti in Cloud",
  robots: { index: false, follow: false },
};

export const viewport = { themeColor: "#0B0F17" };

export default function RootLayout({ children }) {
  return (
    <html lang="it" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
