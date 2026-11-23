import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: { default: "XUPFLY — X Automation SaaS", template: "%s | XUPFLY" },
  description:
    "AI-powered X (Twitter) automation platform. Grow your audience with intelligent content generation, scheduling, and engagement automation.",
  keywords: ["X automation", "Twitter bot", "AI content", "social media SaaS"],
  openGraph: {
    title: "XUPFLY — X Automation SaaS",
    description: "AI-powered X automation for creators and agencies",
    type: "website",
  },
};

import { Providers } from "@/components/Providers";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="antialiased">
        <Providers>
          {children}
        </Providers>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
