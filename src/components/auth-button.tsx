"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { GoogleSignInButton } from "@/components/google-sign-in-button";

export function AuthButton() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <Button variant="outline" disabled>
        Loading...
      </Button>
    );
  }

  if (session) {
    if (session.error === "RefreshAccessTokenError") {
      return (
        <Button variant="outline" onClick={() => signIn("google")}>
          Session expired - sign in again
        </Button>
      );
    }

    const initial = session.user?.email?.[0]?.toUpperCase();

    return (
      <div className="flex items-center gap-3">
        <span className="hidden items-center gap-2 text-sm text-muted-foreground sm:flex">
          {initial && (
            <span className="flex size-6 items-center justify-center rounded-full bg-secondary text-xs font-medium text-secondary-foreground">
              {initial}
            </span>
          )}
          {session.user?.email}
        </span>
        <Button variant="outline" size="sm" onClick={() => signOut()}>
          Sign out
        </Button>
      </div>
    );
  }

  return <GoogleSignInButton />;
}
