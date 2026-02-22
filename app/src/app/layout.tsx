import type { Metadata } from "next";
import { Inter, JetBrains_Mono, DM_Serif_Display } from "next/font/google";
import { RootProvider } from "fumadocs-ui/provider";
import "./globals.css";
import { Providers } from "@/components/providers";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const jetbrains = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains" });
const dmSerif = DM_Serif_Display({ weight: "400", subsets: ["latin"], variable: "--font-serif" });

export const metadata: Metadata = {
  title: "Sentinel",
  description: "Enterprise audit & compliance for x402 payments",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${inter.variable} ${jetbrains.variable} ${dmSerif.variable} font-sans antialiased`}>
        <RootProvider>
          <Providers>{children}</Providers>
        </RootProvider>
      </body>
    </html>
  );
}
