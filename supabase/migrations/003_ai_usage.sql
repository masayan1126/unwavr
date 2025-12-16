-- =====================================================
-- AI使用量管理テーブル
-- プランごとの月間上限を管理
-- =====================================================

-- 1. usersテーブルにプラン情報を追加
ALTER TABLE users ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'free';
ALTER TABLE users ADD COLUMN IF NOT EXISTS plan_expires_at TIMESTAMPTZ;

-- 2. AI使用量テーブル
CREATE TABLE IF NOT EXISTS ai_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  year_month TEXT NOT NULL,  -- '2025-01' 形式
  message_count INT DEFAULT 0,
  token_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, year_month)
);

-- 3. インデックス
CREATE INDEX IF NOT EXISTS idx_ai_usage_user_month ON ai_usage(user_id, year_month);

-- 4. RLS有効化
ALTER TABLE ai_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Deny all for anon on ai_usage" ON ai_usage
  FOR ALL USING (false);

-- 5. 使用量チェック＆インクリメント関数
-- 戻り値: current_count（インクリメント後の値）, limit_count, allowed（上限内かどうか）
CREATE OR REPLACE FUNCTION check_and_increment_ai_usage(
  p_user_id TEXT,
  p_messages INT DEFAULT 1
) RETURNS TABLE(current_count INT, limit_count INT, allowed BOOLEAN, plan_name TEXT) AS $$
DECLARE
  v_plan TEXT;
  v_month TEXT;
  v_limit INT;
  v_current INT;
BEGIN
  -- 現在の月（YYYY-MM形式）
  v_month := TO_CHAR(NOW() AT TIME ZONE 'UTC', 'YYYY-MM');

  -- ユーザーのプランを取得
  SELECT plan INTO v_plan FROM users WHERE id = p_user_id;
  v_plan := COALESCE(v_plan, 'free');

  -- プランごとの上限
  v_limit := CASE v_plan
    WHEN 'pro' THEN 100
    WHEN 'personal' THEN 30
    ELSE 3  -- free
  END;

  -- 現在の使用量を取得
  SELECT message_count INTO v_current
  FROM ai_usage
  WHERE user_id = p_user_id AND year_month = v_month;

  v_current := COALESCE(v_current, 0);

  -- 上限チェック（インクリメント前にチェック）
  IF v_current >= v_limit THEN
    RETURN QUERY SELECT v_current, v_limit, FALSE, v_plan;
    RETURN;
  END IF;

  -- UPSERT（使用量をインクリメント）
  INSERT INTO ai_usage (user_id, year_month, message_count, token_count)
  VALUES (p_user_id, v_month, p_messages, 0)
  ON CONFLICT (user_id, year_month)
  DO UPDATE SET
    message_count = ai_usage.message_count + p_messages,
    updated_at = NOW();

  -- インクリメント後の値
  v_current := v_current + p_messages;

  RETURN QUERY SELECT v_current, v_limit, TRUE, v_plan;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. 使用量取得関数（読み取り専用）
CREATE OR REPLACE FUNCTION get_ai_usage(p_user_id TEXT)
RETURNS TABLE(current_count INT, limit_count INT, plan_name TEXT, year_month TEXT) AS $$
DECLARE
  v_plan TEXT;
  v_month TEXT;
  v_limit INT;
  v_current INT;
BEGIN
  v_month := TO_CHAR(NOW() AT TIME ZONE 'UTC', 'YYYY-MM');

  SELECT plan INTO v_plan FROM users WHERE id = p_user_id;
  v_plan := COALESCE(v_plan, 'free');

  v_limit := CASE v_plan
    WHEN 'pro' THEN 100
    WHEN 'personal' THEN 30
    ELSE 3
  END;

  SELECT message_count INTO v_current
  FROM ai_usage
  WHERE user_id = p_user_id AND year_month = v_month;

  v_current := COALESCE(v_current, 0);

  RETURN QUERY SELECT v_current, v_limit, v_plan, v_month;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 実行方法:
-- Supabase Dashboard > SQL Editor でこのSQLを実行
-- =====================================================
