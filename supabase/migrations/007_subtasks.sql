-- サブタスク機能: 親子関係を実現するためのカラム追加
-- parentTaskId: 親タスクのID（NULLの場合はルートタスク）

-- 1. parentTaskIdカラムを追加
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS "parentTaskId" TEXT;

-- 2. インデックス追加（親タスクID検索の高速化）
CREATE INDEX IF NOT EXISTS idx_tasks_parent_task_id ON tasks ("parentTaskId");

-- 注: 外部キー制約は設けない（親タスク削除時にサブタスクをルートに昇格させるため）
