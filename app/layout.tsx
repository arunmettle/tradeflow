import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { getCurrentAuthUserAsync } from "@/lib/auth/session";
import { AppTopNav } from "@/components/AppTopNav";
import { ClientProviders } from "@/components/ClientProviders";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TradeFlow",
  description: "Lead-to-quote workflow for tradies",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentAuthUserAsync();

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ClientProviders>
          {user && <AppTopNav user={user} />}
          {children}
        </ClientProviders>
      </body>
    </html>
  );
}
