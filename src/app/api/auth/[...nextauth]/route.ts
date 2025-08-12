import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

// See: https://authjs.dev/reference/nextjs
async function refreshAccessToken(token: any) {
  try {
    const params = new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      grant_type: "refresh_token",
      refresh_token: token.refresh_token,
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
      access_token: data.access_token,
      expires_at: Math.floor(Date.now() / 1000) + (data.expires_in ?? 3600) - 60,
      refresh_token: token.refresh_token ?? data.refresh_token,
    };
  } catch (e) {
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
        token.access_token = (account as any).access_token;
        token.expires_at = Math.floor(Date.now() / 1000) + ((account as any).expires_in ?? 3600) - 60;
        token.refresh_token = (account as any).refresh_token;
        token.provider = account.provider;
        return token;
      }
      // アクセストークン期限チェック
      if (token.expires_at && Date.now() / 1000 < (token.expires_at as number)) {
        return token;
      }
      // 期限切れなら更新
      if (token.refresh_token) {
        return await refreshAccessToken(token);
      }
      return token;
    },
    async session({ session, token }) {
      (session as any).provider = (token as any).provider;
      (session as any).access_token = (token as any).access_token;
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST };


