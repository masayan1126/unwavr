import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { supabase } from "@/lib/supabaseClient";
import { jwtVerify } from "jose";

const Schema = z.object({ token: z.string().min(10), password: z.string().min(8).max(200) });

export async function POST(req: NextRequest) {
  if (!supabase) return NextResponse.json({ error: "not configured" }, { status: 400 });
  const { token, password } = Schema.parse(await req.json());
  try {
    const secret = new TextEncoder().encode(process.env.RESET_TOKEN_SECRET || process.env.NEXTAUTH_SECRET || "dev-secret");
    const { payload } = await jwtVerify(token, secret, { algorithms: ["HS256"] });
    if (payload.t !== "reset" || typeof payload.sub !== "string") {
      return NextResponse.json({ error: "invalid_token" }, { status: 400 });
    }
    const hash = await bcrypt.hash(password, 10);
    const { error } = await supabase.from("users").update({ password_hash: hash, updated_at: new Date().toISOString() }).eq("id", payload.sub);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (_e) {
    return NextResponse.json({ error: "invalid_or_expired" }, { status: 400 });
  }
}


