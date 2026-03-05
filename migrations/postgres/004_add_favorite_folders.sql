-- ============================================
-- MoonTV Plus - 收藏夹功能迁移 (Postgres)
-- 版本: 1.1.0
-- 创建时间: 2026-03-04
-- ============================================

-- 1. 为收藏表添加 folder_id 列（可选字段，不设置则为默认收藏夹）
ALTER TABLE favorites ADD COLUMN IF NOT EXISTS folder_id TEXT;

CREATE INDEX IF NOT EXISTS idx_favorites_folder ON favorites(username, folder_id);

-- 2. 创建收藏夹表
CREATE TABLE IF NOT EXISTS favorite_folders (
  username TEXT NOT NULL,
  id TEXT NOT NULL,
  name TEXT NOT NULL,
  cover TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (username, id),
  FOREIGN KEY (username) REFERENCES users(username) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_favorite_folders_user ON favorite_folders(username);
