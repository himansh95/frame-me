"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";

export default function Home() {
  const { data: session, status } = useSession();

  useEffect(() => {
    if (session?.accessToken) {
      // Temporary: confirm the Drive-scoped access token is available client-side.
      console.log("Drive access token:", session.accessToken);
    }
  }, [session]);

  return (
    <div className="flex flex-1 items-center justify-center">
      <main className="flex max-w-md flex-col items-center gap-3 text-center">
        <h1 className="text-2xl font-semibold">Frame Me</h1>
        {status === "authenticated" ? (
          <p className="text-muted-foreground">
            Signed in as {session.user?.email}. Access token logged to the
            console.
          </p>
        ) : (
          <p className="text-muted-foreground">
            Sign in with Google to get started.
          </p>
        )}
      </main>
    </div>
  );
}

