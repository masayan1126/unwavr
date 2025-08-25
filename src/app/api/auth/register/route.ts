import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { supabase } from "@/lib/supabaseClient";

const RegisterSchema = z.object({
  email: z.string().email().min(5).max(200),
  password: z.string().min(8).max(200),
});

export async function POST(req: NextRequest) {
  try {
    if (!supabase) return NextResponse.json({ error: "not configured" }, { status: 400 });
    const body = await req.json();
    const { email, password } = RegisterSchema.parse(body);
    const lower = email.toLowerCase();

    // 既存確認
    const { data: exists } = await supabase.from("users").select("id").eq("email", lower).maybeSingle();
    if (exists) return NextResponse.json({ error: "already_exists" }, { status: 409 });

    const password_hash = await bcrypt.hash(password, 10);
    // 既存メールと衝突しないように、IDは安定だがメールとは別の値にする
    const id = `cred_${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}`;
    const payload = { id, email: lower, password_hash, updated_at: new Date().toISOString(), provider: "credentials" };
    const { error } = await supabase.from("users").insert(payload);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (_e) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }
}


