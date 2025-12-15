import { NextRequest, NextResponse } from 'next/server';
import type { PostgrestError } from '@supabase/supabase-js';
import { supabaseAdmin } from '@/lib/supabaseClient';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';

export type UserPreferences = {
  id?: string;
  user_id?: string;
  theme_palette: string;
  border_radius: string;
  shadow_intensity: string;
  transition_speed: string;
  custom_settings?: Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
};

const DEFAULT_PREFERENCES: Omit<UserPreferences, 'id' | 'user_id' | 'created_at' | 'updated_at'> = {
  theme_palette: 'coolBlue',
  border_radius: 'md',
  shadow_intensity: 'md',
  transition_speed: 'normal',
  custom_settings: {},
};

export async function GET() {
  if (!supabaseAdmin) return NextResponse.json({ preferences: DEFAULT_PREFERENCES });

  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { data, error } = await supabaseAdmin
    .from('user_preferences')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    // レコードが見つからない場合はデフォルト値を返す
    if (error.code === 'PGRST116') {
      return NextResponse.json({ preferences: DEFAULT_PREFERENCES });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ preferences: data });
}

export async function PUT(req: NextRequest) {
  if (!supabaseAdmin) return NextResponse.json({ error: 'not configured' }, { status: 400 });

  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const raw = await req.json();

  // 許可するカラムのみ
  const payload: Record<string, unknown> = { user_id: userId };
  const allow = ['theme_palette', 'border_radius', 'shadow_intensity', 'transition_speed', 'custom_settings'];
  for (const k of allow) {
    if (raw[k] !== undefined) payload[k] = raw[k];
  }

  // UPSERT: 存在すれば更新、なければ挿入
  const { data, error } = await supabaseAdmin
    .from('user_preferences')
    .upsert(payload, { onConflict: 'user_id' })
    .select('*')
    .single();

  if (error) {
    const err = error as PostgrestError;
    console.error('Supabase upsert error (user_preferences):', {
      message: err.message,
      details: err.details,
      hint: err.hint,
      code: err.code,
    });
    return NextResponse.json(
      { error: err.message, details: err.details, hint: err.hint, code: err.code },
      { status: 500 }
    );
  }

  return NextResponse.json({ preferences: data });
}
