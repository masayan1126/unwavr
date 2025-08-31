import { NextRequest, NextResponse } from "next/server";
import { z, ZodError } from "zod";
import bcrypt from "bcryptjs";
import { supabaseAdmin, supabaseUrl } from "@/lib/supabaseClient";
import { randomUUID } from "crypto";
import { Resend } from "resend";

const RegisterSchema = z.object({
  email: z.string().email().min(5).max(200),
  password: z.string().min(8).max(200),
});

export async function POST(req: NextRequest) {
  try {
    if (!supabaseAdmin) {
      const missing: string[] = [];
      if (!supabaseUrl) missing.push("SUPABASE_URL");
      if (!process.env.SUPABASE_SERVICE_ROLE_KEY) missing.push("SUPABASE_SERVICE_ROLE_KEY");
      return NextResponse.json({ error: "not configured", missing }, { status: 400 });
    }
    const body = await req.json();
    const { email, password } = RegisterSchema.parse(body);
    const lower = email.toLowerCase();

    // 既存確認
    const { data: exists } = await supabaseAdmin.from("users").select("id").eq("email", lower).maybeSingle();
    if (exists) return NextResponse.json({ error: "already_exists" }, { status: 409 });

    const password_hash = await bcrypt.hash(password, 10);
    // DB側でデフォルトが無い構成のため、ここでUUIDを生成
    const id = randomUUID();
    const payload = { id, email: lower, password_hash, updated_at: new Date().toISOString(), provider: "credentials" };
    const { error } = await supabaseAdmin.from("users").insert(payload);
    if (error) {
      const code = typeof (error as { code?: string }).code === "string" ? (error as { code: string }).code : undefined;
      return NextResponse.json({ error: "db_error", message: error.message, code }, { status: 500 });
    }
    // 登録完了メール（失敗しても登録は成功させる）
    try {
      const resendKey = process.env.RESEND_API_KEY;
      const from = process.env.EMAIL_FROM || "noreply@unwavr.local";
      if (resendKey) {
        const resend = new Resend(resendKey);
        await resend.emails.send({
          from,
          to: lower,
          subject: "ご登録ありがとうございます（Unwavr）",
          text: `Unwavr へのご登録が完了しました。\n\nログイン: ${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/auth/signin\n\n引き続きよろしくお願いいたします。`,
        });
      }
    } catch {
      // noop
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof ZodError) {
      return NextResponse.json({ error: "validation_error", issues: e.issues }, { status: 422 });
    }
    const message = e instanceof Error ? e.message : "unknown_error";
    return NextResponse.json({ error: "invalid_request", message }, { status: 400 });
  }
}


