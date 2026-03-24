CREATE TABLE IF NOT EXISTS feedback_submissions (
  id TEXT PRIMARY KEY,
  submitted_at TEXT NOT NULL DEFAULT (datetime('now')),
  submitter_name TEXT,
  raw_text TEXT NOT NULL,
  section TEXT DEFAULT 'General',
  type TEXT NOT NULL DEFAULT 'product',
  organize_status TEXT DEFAULT 'pending',
  deleted INTEGER DEFAULT 0,
  deleted_at TEXT
);

CREATE TABLE IF NOT EXISTS feedback_summaries (
  track TEXT PRIMARY KEY,
  summary_json TEXT NOT NULL,
  prev_json TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_feedback_type ON feedback_submissions(type);
CREATE INDEX IF NOT EXISTS idx_feedback_deleted ON feedback_submissions(deleted);
