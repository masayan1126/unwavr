-- タスクに複数マイルストーンを紐付け可能にする
-- milestoneId (単一) -> milestoneIds (配列) への変更

-- 1. 新しいmilestoneIdsカラムを追加（JSONB配列）
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS "milestoneIds" JSONB DEFAULT '[]'::jsonb;

-- 2. 既存のmilestoneIdデータをmilestoneIdsに移行
UPDATE tasks
SET "milestoneIds" = CASE
  WHEN "milestoneId" IS NOT NULL AND "milestoneId" != ''
  THEN jsonb_build_array("milestoneId")
  ELSE '[]'::jsonb
END
WHERE "milestoneIds" = '[]'::jsonb OR "milestoneIds" IS NULL;

-- 3. 旧milestoneIdカラムを削除
ALTER TABLE tasks DROP COLUMN IF EXISTS "milestoneId";
