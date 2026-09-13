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
          <header className="sticky top-0 z-10 flex items-center justify-between border-b bg-background/80 px-6 py-3 backdrop-blur">
            <span className="flex items-center gap-2 font-heading font-semibold">
              <span className="flex size-7 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent-foreground text-sm text-primary-foreground">
                🖼️
              </span>
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
