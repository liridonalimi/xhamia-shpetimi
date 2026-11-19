PRAGMA foreign_keys = ON;

CREATE TABLE announcements (
  id TEXT PRIMARY KEY NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  title_sq TEXT NOT NULL CHECK (length(trim(title_sq)) BETWEEN 1 AND 160),
  title_de TEXT NOT NULL CHECK (length(trim(title_de)) BETWEEN 1 AND 160),
  body_sq TEXT NOT NULL CHECK (length(trim(body_sq)) BETWEEN 1 AND 10000),
  body_de TEXT NOT NULL CHECK (length(trim(body_de)) BETWEEN 1 AND 10000),
  starts_at TEXT,
  ends_at TEXT,
  published_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  created_by TEXT NOT NULL,
  updated_by TEXT NOT NULL,
  CHECK (ends_at IS NULL OR starts_at IS NULL OR ends_at > starts_at),
  CHECK (status != 'published' OR published_at IS NOT NULL)
) STRICT;

CREATE INDEX announcements_publication_window_idx
  ON announcements (status, starts_at, ends_at, published_at DESC);

CREATE TABLE prayer_overrides (
  service_date TEXT PRIMARY KEY NOT NULL
    CHECK (
      length(service_date) = 10
      AND service_date GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'
    ),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  fajr TEXT,
  dhuhr TEXT,
  asr TEXT,
  maghrib TEXT,
  isha TEXT,
  jummah_1 TEXT,
  jummah_2 TEXT,
  note_sq TEXT CHECK (note_sq IS NULL OR length(note_sq) <= 1000),
  note_de TEXT CHECK (note_de IS NULL OR length(note_de) <= 1000),
  published_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  created_by TEXT NOT NULL,
  updated_by TEXT NOT NULL,
  CHECK (fajr IS NULL OR (length(fajr) = 5 AND fajr GLOB '[0-2][0-9]:[0-5][0-9]' AND substr(fajr, 1, 2) <= '23')),
  CHECK (dhuhr IS NULL OR (length(dhuhr) = 5 AND dhuhr GLOB '[0-2][0-9]:[0-5][0-9]' AND substr(dhuhr, 1, 2) <= '23')),
  CHECK (asr IS NULL OR (length(asr) = 5 AND asr GLOB '[0-2][0-9]:[0-5][0-9]' AND substr(asr, 1, 2) <= '23')),
  CHECK (maghrib IS NULL OR (length(maghrib) = 5 AND maghrib GLOB '[0-2][0-9]:[0-5][0-9]' AND substr(maghrib, 1, 2) <= '23')),
  CHECK (isha IS NULL OR (length(isha) = 5 AND isha GLOB '[0-2][0-9]:[0-5][0-9]' AND substr(isha, 1, 2) <= '23')),
  CHECK (jummah_1 IS NULL OR (length(jummah_1) = 5 AND jummah_1 GLOB '[0-2][0-9]:[0-5][0-9]' AND substr(jummah_1, 1, 2) <= '23')),
  CHECK (jummah_2 IS NULL OR (length(jummah_2) = 5 AND jummah_2 GLOB '[0-2][0-9]:[0-5][0-9]' AND substr(jummah_2, 1, 2) <= '23')),
  CHECK (
    fajr IS NOT NULL OR dhuhr IS NOT NULL OR asr IS NOT NULL OR maghrib IS NOT NULL
    OR isha IS NOT NULL OR jummah_1 IS NOT NULL OR jummah_2 IS NOT NULL
  ),
  CHECK (status != 'published' OR published_at IS NOT NULL)
) STRICT;

CREATE INDEX prayer_overrides_status_date_idx
  ON prayer_overrides (status, service_date);

CREATE TABLE site_settings (
  setting_key TEXT PRIMARY KEY NOT NULL CHECK (length(trim(setting_key)) BETWEEN 1 AND 100),
  value_json TEXT NOT NULL CHECK (json_valid(value_json)),
  updated_at TEXT NOT NULL,
  updated_by TEXT NOT NULL
) STRICT;

CREATE TABLE audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  actor TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('create', 'update', 'publish', 'archive')),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('announcement', 'prayer_override', 'site_setting')),
  entity_id TEXT NOT NULL,
  summary_json TEXT NOT NULL CHECK (json_valid(summary_json)),
  created_at TEXT NOT NULL
) STRICT;

CREATE INDEX audit_log_created_at_idx
  ON audit_log (created_at DESC, id DESC);

CREATE TRIGGER audit_log_reject_update
BEFORE UPDATE ON audit_log
BEGIN
  SELECT RAISE(ABORT, 'audit_log is append-only');
END;

CREATE TRIGGER audit_log_reject_delete
BEFORE DELETE ON audit_log
BEGIN
  SELECT RAISE(ABORT, 'audit_log is append-only');
END;
