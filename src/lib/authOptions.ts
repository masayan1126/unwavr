import type { NextAuthOptions, Session } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import type { Account, Profile, User } from "next-auth";
import { supabaseAdmin } from "@/lib/supabaseClient";
import bcrypt from "bcryptjs";

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

export const authOptions: NextAuthOptions = {
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
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          const email = credentials?.email?.toLowerCase().trim();
          const password = credentials?.password ?? "";
          if (!email || !password) return null;
          if (!supabaseAdmin) return null;
          const { data, error } = await supabaseAdmin
            .from("users")
            .select("id, email, name, image, password_hash")
            .eq("email", email)
            .single();
          if (error || !data) return null;
          const withHash = data as unknown as { id: string | number; email?: string | null; name?: string | null; image?: string | null; password_hash?: string | null };
          const ok = typeof withHash.password_hash === "string" && (await bcrypt.compare(password, withHash.password_hash));
          if (!ok) return null;
          return { id: String(withHash.id), email: withHash.email ?? undefined, name: withHash.name ?? undefined, image: withHash.image ?? undefined };
        } catch {
          return null;
        }
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
        // NextAuth の token.sub はプロバイダの subject（安定ID）
        if (typeof (token as { sub?: unknown }).sub === "string") {
          (token as Record<string, unknown>).user_id = (token as { sub?: string }).sub;
        }
        return token;
      }
      // アクセストークン期限チェック
      if ((token as JwtToken).expires_at && Date.now() / 1000 < ((token as JwtToken).expires_at as number)) {
        return token;
      }
      // 期限切れなら更新
      if ((token as JwtToken).refresh_token) {
        return await refreshAccessToken(token as JwtToken);
      }
      return token;
    },
    async session({ session, token }) {
      type ExtendedSession = Session & { provider?: string; access_token?: string; user?: Session["user"] & { id?: string } };
      const t = token as JwtToken;
      const extended: ExtendedSession = {
        ...session,
        provider: typeof t.provider === "string" ? t.provider : undefined,
        access_token: typeof t.access_token === "string" ? t.access_token : undefined,
      };
      // user.id に安定IDを載せる（APIで user_id スコープに使用）
      const userId = (token as Record<string, unknown>).user_id;
      if (typeof userId === "string") {
        extended.user = { ...(session.user ?? {}), id: userId } as ExtendedSession["user"];
      }
      return extended;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  events: {
    // 会員登録/ログイン時に users テーブルへUpsert
    async signIn({ user, account, profile }: { user: User; account?: Account | null; profile?: Profile | undefined }) {
      if (!supabaseAdmin) return;
      const email = user.email ?? (typeof (profile as Record<string, unknown> | undefined)?.email === "string" ? (profile as Record<string, unknown>).email as string : undefined);
      if (!email) return;
      const lowerEmail = email.toLowerCase();

      // 既存ユーザーが同じメールで存在する場合は、そのidを尊重して上書き（重複emailの新規作成を避ける）
      const existing = await supabaseAdmin.from("users").select("id").eq("email", lowerEmail).maybeSingle();
      let idToUse: string | undefined = existing.data ? String(existing.data.id) : undefined;
      if (!idToUse) {
        const providerSubject = typeof (profile as Record<string, unknown> | undefined)?.sub === "string"
          ? (profile as Record<string, unknown>).sub as string
          : undefined;
        idToUse = providerSubject || lowerEmail;
      }
      const payload: Record<string, unknown> = {
        id: idToUse,
        email: lowerEmail,
        name: user.name ?? null,
        image: user.image ?? null,
        provider: account?.provider ?? null,
        provider_account_id: account?.providerAccountId ?? null,
        updated_at: new Date().toISOString(),
      };
      await supabaseAdmin.from("users").upsert(payload, { onConflict: "id" });
    },
  },
};


