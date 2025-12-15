-- =====================================================
-- Row Level Security (RLS) を有効化
-- =====================================================
-- このプロジェクトはNextAuthを使用しているため、
-- Supabase Authのauth.uid()は使用できません。
-- 代わりに、anon keyでの直接アクセスを完全にブロックし、
-- Service Role Key (supabaseAdmin) のみでアクセスを許可します。
-- API層で所有者チェックを行います。
-- =====================================================

-- 1. RLSを有効化（各テーブル）
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE launcher_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE launcher_shortcuts ENABLE ROW LEVEL SECURITY;
ALTER TABLE bgm_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE bgm_tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 2. anon key でのアクセスを完全にブロック
-- Service Role Key はRLSをバイパスするため影響なし

-- tasks
CREATE POLICY "Deny all for anon on tasks" ON tasks
  FOR ALL
  USING (false);

-- milestones
CREATE POLICY "Deny all for anon on milestones" ON milestones
  FOR ALL
  USING (false);

-- launcher_categories
CREATE POLICY "Deny all for anon on launcher_categories" ON launcher_categories
  FOR ALL
  USING (false);

-- launcher_shortcuts
CREATE POLICY "Deny all for anon on launcher_shortcuts" ON launcher_shortcuts
  FOR ALL
  USING (false);

-- bgm_groups
CREATE POLICY "Deny all for anon on bgm_groups" ON bgm_groups
  FOR ALL
  USING (false);

-- bgm_tracks
CREATE POLICY "Deny all for anon on bgm_tracks" ON bgm_tracks
  FOR ALL
  USING (false);

-- users (認証情報を保護)
CREATE POLICY "Deny all for anon on users" ON users
  FOR ALL
  USING (false);

-- =====================================================
-- 実行方法:
-- 1. Supabase Dashboard > SQL Editor でこのSQLを実行
-- または
-- 2. supabase db push コマンドを使用
-- =====================================================
