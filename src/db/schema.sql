-- IssueLoom Schema v1 (Agent Issue Tracker)
-- 표준 SQL 호환성 우선, SQLite 고유 기능 의존 최소화

CREATE TABLE IF NOT EXISTS schema_version (
    version         INTEGER PRIMARY KEY,
    applied_at      TEXT NOT NULL,
    description     TEXT
);

CREATE TABLE IF NOT EXISTS issues (
    id              INTEGER PRIMARY KEY,
    issue_number    TEXT NOT NULL UNIQUE,
    title           TEXT NOT NULL,
    description     TEXT NOT NULL,
    category        TEXT NOT NULL,
    related_system  TEXT NOT NULL,
    status          TEXT NOT NULL DEFAULT 'open',
    priority        TEXT DEFAULT 'normal',
    created_at      TEXT NOT NULL,
    updated_at      TEXT NOT NULL,
    resolved_at     TEXT,
    created_by      TEXT NOT NULL,
    iteration       TEXT
);

CREATE TABLE IF NOT EXISTS issue_comments (
    id              INTEGER PRIMARY KEY,
    issue_id        INTEGER NOT NULL REFERENCES issues(id) ON DELETE RESTRICT,
    author          TEXT NOT NULL,
    content         TEXT NOT NULL,
    created_at      TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS issue_relations (
    id              INTEGER PRIMARY KEY,
    source_issue_id INTEGER NOT NULL REFERENCES issues(id) ON DELETE RESTRICT,
    target_issue_id INTEGER NOT NULL REFERENCES issues(id) ON DELETE RESTRICT,
    relation_type   TEXT NOT NULL,
    CHECK (source_issue_id != target_issue_id)
);

CREATE INDEX IF NOT EXISTS idx_issues_system_status ON issues(related_system, status);
CREATE INDEX IF NOT EXISTS idx_issues_category ON issues(category);
CREATE INDEX IF NOT EXISTS idx_issues_updated ON issues(updated_at);
CREATE INDEX IF NOT EXISTS idx_comments_issue ON issue_comments(issue_id);
