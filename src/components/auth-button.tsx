"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";

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

    return (
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground">
          {session.user?.email}
        </span>
        <Button variant="outline" onClick={() => signOut()}>
          Sign out
        </Button>
      </div>
    );
  }

  return <Button onClick={() => signIn("google")}>Sign in with Google</Button>;
}
