-- =====================================================
-- User Preferences Table
-- =====================================================
-- テーマ設定やUI設定をユーザーごとに保存するテーブル

CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- テーマ設定
  theme_palette VARCHAR(50) DEFAULT 'coolBlue',
  border_radius VARCHAR(20) DEFAULT 'md',
  shadow_intensity VARCHAR(20) DEFAULT 'md',
  transition_speed VARCHAR(20) DEFAULT 'normal',

  -- 汎用JSON設定（将来の拡張用）
  custom_settings JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- ユーザーごとに1レコードのみ
  UNIQUE(user_id)
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);

-- RLSを有効化
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- anon keyでのアクセスをブロック
CREATE POLICY "Deny all for anon on user_preferences" ON user_preferences
  FOR ALL
  USING (false);

-- updated_atを自動更新するトリガー
CREATE OR REPLACE FUNCTION update_user_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_user_preferences_updated_at();

-- =====================================================
-- 実行方法:
-- 1. Supabase Dashboard > SQL Editor でこのSQLを実行
-- または
-- 2. supabase db push コマンドを使用
-- =====================================================
