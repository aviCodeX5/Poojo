-- Migration number: 0001 	 2026-05-26T12:56:01.485Z

CREATE TABLE IF NOT EXISTS committees (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  puja_type TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  pincode TEXT NOT NULL,
  pandal_address TEXT NOT NULL,
  pandal_lat REAL NOT NULL,
  pandal_lng REAL NOT NULL,
  founded_year INTEGER NOT NULL,
  admin_email TEXT NOT NULL,
  admin_phone TEXT NOT NULL,
  current_edition_id TEXT,
  current_year INTEGER,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_committees_location_name
ON committees (lower(name), lower(city), pincode);

CREATE TABLE IF NOT EXISTS members (
  committee_id TEXT NOT NULL,
  member_id TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  role TEXT NOT NULL,
  address TEXT,
  login_code TEXT,
  added_at TEXT NOT NULL,
  added_by TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY (committee_id, member_id),
  FOREIGN KEY (committee_id) REFERENCES committees(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_members_phone_committee
ON members (committee_id, phone);

CREATE INDEX IF NOT EXISTS idx_members_phone_code
ON members (phone, login_code);

CREATE TABLE IF NOT EXISTS collection_records (
  committee_id TEXT NOT NULL,
  collection_name TEXT NOT NULL,
  record_id TEXT NOT NULL,
  data_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (committee_id, collection_name, record_id),
  FOREIGN KEY (committee_id) REFERENCES committees(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_collection_records_lookup
ON collection_records (committee_id, collection_name, updated_at);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_type TEXT NOT NULL CHECK (user_type IN ('ADMIN', 'MEMBER')),
  committee_id TEXT NOT NULL,
  member_id TEXT,
  email TEXT,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  FOREIGN KEY (committee_id) REFERENCES committees(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_sessions_expires_at
ON sessions (expires_at);

CREATE TABLE IF NOT EXISTS email_verification_codes (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  code_hash TEXT NOT NULL,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  consumed_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_email_verification_codes_email
ON email_verification_codes (email, expires_at);

CREATE TABLE IF NOT EXISTS audit_log (
  id TEXT PRIMARY KEY,
  committee_id TEXT,
  actor_id TEXT,
  action TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  created_at TEXT NOT NULL
);
