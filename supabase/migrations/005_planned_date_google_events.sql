-- =====================================================
-- plannedDateGoogleEvents カラムを tasks テーブルに追加
-- =====================================================
-- このカラムは実行日とGoogle CalendarイベントIDのマッピングを保存します。
-- 形式: { "timestamp": "googleEventId", ... }
-- 例: { "1734307200000": "abc123xyz" }
-- =====================================================

ALTER TABLE tasks ADD COLUMN IF NOT EXISTS "plannedDateGoogleEvents" JSONB DEFAULT '{}';

-- =====================================================
-- 実行方法:
-- 1. Supabase Dashboard > SQL Editor でこのSQLを実行
-- または
-- 2. supabase db push コマンドを使用
-- =====================================================
