import NextAuth, { type NextAuthOptions, type Session } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

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

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope:
            "openid email profile https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/tasks.readonly",
          access_type: "offline",
          prompt: "consent",
        },
      },
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, account }) {
      // 初回ログイン時
      if (account) {
        const acc = account as unknown as Record<string, unknown>;
        const accessToken = typeof acc.access_token === "string" ? acc.access_token : undefined;
        const expiresIn = typeof acc.expires_in === "number" ? acc.expires_in : 3600;
        const refreshToken = typeof acc.refresh_token === "string" ? acc.refresh_token : undefined;
        token.access_token = accessToken;
        token.expires_at = Math.floor(Date.now() / 1000) + expiresIn - 60;
        token.refresh_token = refreshToken;
        token.provider = account.provider;
        return token;
      }
      // アクセストークン期限チェック
      if (token.expires_at && Date.now() / 1000 < (token.expires_at as number)) {
        return token;
      }
      // 期限切れなら更新
      if (token.refresh_token) {
        return await refreshAccessToken(token as JwtToken);
      }
      return token;
    },
    async session({ session, token }) {
      type ExtendedSession = Session & { provider?: string; access_token?: string };
      const t = token as JwtToken;
      const extended: ExtendedSession = {
        ...session,
        provider: typeof t.provider === "string" ? t.provider : undefined,
        access_token: typeof t.access_token === "string" ? t.access_token : undefined,
      };
      return extended;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
} satisfies NextAuthOptions);

export { handler as GET, handler as POST };


