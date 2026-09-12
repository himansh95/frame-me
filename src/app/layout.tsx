import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthSessionProvider } from "@/components/auth-session-provider";
import { AuthButton } from "@/components/auth-button";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Frame Me",
  description: "Find your photos from a shared event album.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AuthSessionProvider>
          <header className="flex items-center justify-between border-b px-6 py-4">
            <span className="flex items-center gap-2 font-semibold">
              <span className="size-6 rounded-md bg-gradient-to-br from-primary to-accent-foreground" />
              Frame Me
            </span>
            <AuthButton />
          </header>
          {children}
        </AuthSessionProvider>
      </body>
    </html>
  );
}
