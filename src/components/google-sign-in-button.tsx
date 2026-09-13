"use client";

import { signIn } from "next-auth/react";
import { cn } from "@/lib/utils";

/** Google's official 4-color "G" mark, per Google's Sign In branding guidelines. */
function GoogleLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <path
        fill="#4285F4"
        d="M45.1 24.5c0-1.6-.1-3.1-.4-4.6H24v9.1h11.9c-.5 2.8-2.1 5.1-4.4 6.7v5.5h7.1c4.1-3.8 6.5-9.4 6.5-16.7z"
      />
      <path
        fill="#34A853"
        d="M24 46c6 0 11-2 14.6-5.3l-7.1-5.5c-2 1.3-4.5 2.1-7.5 2.1-5.8 0-10.7-3.9-12.4-9.1H4.3v5.7C7.9 41.1 15.4 46 24 46z"
      />
      <path
        fill="#FBBC05"
        d="M11.6 28.2c-.4-1.3-.7-2.7-.7-4.2s.3-2.9.7-4.2v-5.7H4.3C2.8 17 2 20.4 2 24s.8 7 2.3 9.9z"
      />
      <path
        fill="#EA4335"
        d="M24 10.7c3.3 0 6.2 1.1 8.5 3.3l6.3-6.3C34.9 4.2 29.9 2 24 2 15.4 2 7.9 6.9 4.3 14.1l7.3 5.7c1.7-5.2 6.6-9.1 12.4-9.1z"
      />
    </svg>
  );
}

export function GoogleSignInButton({
  size = "default",
  className,
}: {
  size?: "default" | "lg";
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => signIn("google")}
      className={cn(
        "inline-flex items-center justify-center gap-3 rounded-md border border-[#747775] bg-white font-medium text-[#1f1f1f] shadow-sm transition-all hover:bg-[#f8f8f8] hover:shadow-md active:bg-[#f0f0f0] dark:border-[#8e918f] dark:bg-[#131314] dark:text-[#e3e3e3] dark:hover:bg-[#1e1f20]",
        size === "lg" ? "h-12 px-6 text-base" : "h-9 px-4 text-sm",
        className,
      )}
    >
      <GoogleLogo className={size === "lg" ? "size-5" : "size-4"} />
      Sign in with Google
    </button>
  );
}
