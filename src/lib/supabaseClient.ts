import { createClient } from '@supabase/supabase-js';

// サーバ/クライアントの両方から読めるよう、優先順で解決
export const supabaseUrl = process.env.SUPABASE_URL
  ?? process.env.NEXT_PUBLIC_SUPABASE_URL
  ?? '';
export const supabaseAnonKey = process.env.SUPABASE_ANON_KEY
  ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ?? '';

// 環境変数が未設定の場合は未初期化（APIルート側で空配列等を返す）
export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : undefined;


