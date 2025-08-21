import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { supabase } from "@/lib/supabaseClient";
import { SignJWT } from "jose";
import { Resend } from "resend";

const Schema = z.object({ email: z.string().email() });

export async function POST(req: NextRequest) {
  if (!supabase) return NextResponse.json({ error: "not configured" }, { status: 400 });
  const { email } = Schema.parse(await req.json());
  const { data } = await supabase.from("users").select("id").eq("email", email.toLowerCase()).maybeSingle();
  if (!data) return NextResponse.json({ ok: true });
  console.log(email);
  const secret = new TextEncoder().encode(process.env.RESET_TOKEN_SECRET || process.env.NEXTAUTH_SECRET || "dev-secret");
  const token = await new SignJWT({ sub: String(data.id), email: email.toLowerCase(), t: "reset" })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("30m")
    .sign(secret);
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const url = `${baseUrl}/auth/reset/confirm?token=${encodeURIComponent(token)}`;
  const resendKey = process.env.RESEND_API_KEY;
  if (resendKey) {
    try {
      const resend = new Resend(resendKey);
      await resend.emails.send({
        from: process.env.EMAIL_FROM || "noreply@unwavr.local",
        to: email,
        subject: "パスワード再設定のご案内",
        text: `以下のURLから30分以内にパスワード再設定を完了してください。\n${url}`,
      });
      return NextResponse.json({ ok: true });
    } catch (e) {
      // 送信失敗時は開発向けにトークンも返却
      return NextResponse.json({ ok: true, token });
    }
  }
  // メールサービス未設定時はトークン返却（開発用）
  return NextResponse.json({ ok: true, token });
}


