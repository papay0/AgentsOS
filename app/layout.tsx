import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { ClerkProvider } from '@clerk/nextjs';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: "AgentsOS - Your AI Coding Operating System",
  description: "Claude Code + VSCode in your browser. Zero setup. Even works on your phone.",
  openGraph: {
    title: "Your AI Coding Operating System",
    description: "Claude Coder + VSCode in your browser. Zero setup. Even works on your phone.",
    url: "https://agentspod.dev",
    siteName: "AgentsOS",
    images: [
      {
        url: "/api/og",
        width: 1200,
        height: 630,
        alt: "AgentsOS - Your AI Coding Operating System",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Your AI Coding Operating System",
    description: "Claude Code + VSCode in your browser. Zero setup. Even works on your phone.",
    images: ["/api/og"],
  },
  metadataBase: new URL("https://agentspod.dev"),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          <ThemeProvider
            defaultTheme="system"
            storageKey="agentsos-ui-theme"
          >
            {children}
            <Toaster />
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
