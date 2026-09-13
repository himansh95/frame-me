import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import type { JWT } from "@auth/core/jwt";

// Drive scopes: drive.readonly to browse a shared folder, drive.file to
// create/copy files into a folder this app creates (for export later).
const DRIVE_SCOPES = [
  "openid",
  "email",
  "profile",
  "https://www.googleapis.com/auth/drive.readonly",
  "https://www.googleapis.com/auth/drive.file",
].join(" ");

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      authorization: {
        params: {
          scope: DRIVE_SCOPES,
          access_type: "offline",
          prompt: "consent",
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {
      // Only present on initial sign-in; persist it onto the JWT.
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.accessTokenExpiresAt = account.expires_at
          ? account.expires_at * 1000
          : undefined;
        delete token.error;
        return token;
      }

      // Still valid (with a minute of buffer) - nothing to do.
      if (
        token.accessTokenExpiresAt &&
        Date.now() < token.accessTokenExpiresAt - 60_000
      ) {
        return token;
      }

      return refreshAccessToken(token);
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken;
      session.accessTokenExpiresAt = token.accessTokenExpiresAt;
      session.error = token.error;
      return session;
    },
  },
});

/** Exchanges the refresh token for a new access token. Google keeps the same
 * refresh token for the lifetime of the grant, so we only replace it if a
 * new one is actually returned. */
async function refreshAccessToken(token: JWT): Promise<JWT> {
  if (!token.refreshToken) {
    return { ...token, error: "RefreshAccessTokenError" };
  }

  try {
    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.AUTH_GOOGLE_ID!,
        client_secret: process.env.AUTH_GOOGLE_SECRET!,
        grant_type: "refresh_token",
        refresh_token: token.refreshToken,
      }),
    });

    const refreshed: {
      access_token?: string;
      expires_in?: number;
      refresh_token?: string;
    } = await res.json();
    if (!res.ok || !refreshed.access_token) throw refreshed;

    return {
      ...token,
      accessToken: refreshed.access_token,
      accessTokenExpiresAt: Date.now() + (refreshed.expires_in ?? 3600) * 1000,
      refreshToken: refreshed.refresh_token ?? token.refreshToken,
      error: undefined,
    };
  } catch (err) {
    console.error("Failed to refresh Google access token", err);
    return { ...token, error: "RefreshAccessTokenError" };
  }
}
