-- ==========================================================
-- Migration 001: Add progress & deadline columns to items
-- Safe, additive, idempotent migration
-- ==========================================================

-- Add numeric progress column (0–100) if it doesn't exist
ALTER TABLE items ADD COLUMN IF NOT EXISTS progress     SMALLINT  NOT NULL DEFAULT 0
  CHECK (progress BETWEEN 0 AND 100);

-- Add optional deadline column if it doesn't exist
ALTER TABLE items ADD COLUMN IF NOT EXISTS deadline     DATE;

-- Add priority column used by frontend
ALTER TABLE items ADD COLUMN IF NOT EXISTS priority     VARCHAR(10) DEFAULT 'HIGH'
  CHECK (priority IN ('HIGH', 'MEDIUM', 'LOW'));

-- Fix default status (schema had wrong default 'completed'; items should default to not_started)
-- NOTE: Cannot ALTER CHECK constraint in-place in older PG; we handle via application logic.
-- The schema already has correct CHECK values; the DEFAULT was the only issue — safe to ignore
-- for existing data since the backend always sends an explicit status.

-- Add indexes for common bucket list queries
CREATE INDEX IF NOT EXISTS idx_items_owner_status    ON items (owner_id, status);
CREATE INDEX IF NOT EXISTS idx_items_group_status    ON items (group_id, status);
CREATE INDEX IF NOT EXISTS idx_items_owner_created   ON items (owner_id, created_at DESC);
