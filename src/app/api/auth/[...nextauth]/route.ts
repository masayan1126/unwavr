import NextAuth from "next-auth";
import { authOptions } from "@/lib/authOptions";

// See: https://authjs.dev/reference/nextjs
type JwtToken = {
  access_token?: string;
  refresh_token?: string;
  expires_at?: number;
  provider?: string;
  // Allow additional provider-specific fields without using `any`
  [key: string]: unknown;
};

async function refreshAccessToken(token: JwtToken): Promise<JwtToken> {
  try {
    const params = new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      grant_type: "refresh_token",
      refresh_token: String(token.refresh_token ?? ""),
    });
    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(JSON.stringify(data));
    return {
      ...token,
      access_token: typeof data.access_token === "string" ? data.access_token : token.access_token,
      expires_at: Math.floor(Date.now() / 1000) + (Number(data.expires_in ?? 3600)) - 60,
      refresh_token: (typeof token.refresh_token === "string" && token.refresh_token) || (typeof data.refresh_token === "string" ? data.refresh_token : undefined),
    };
  } catch {
    return { ...token, error: "RefreshAccessTokenError" };
  }
}

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };


