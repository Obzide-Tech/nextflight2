/*
  # Add watched_seconds column to lesson_progress

  1. Modified Tables
    - `lesson_progress`
      - Added `watched_seconds` (integer, default 0) — tracks total seconds a user has spent watching a lesson

  2. Notes
    - This column was already referenced in the application code (fetchWeeklyProgress)
      but was missing from the schema. This migration adds it.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'lesson_progress' AND column_name = 'watched_seconds'
  ) THEN
    ALTER TABLE lesson_progress ADD COLUMN watched_seconds integer DEFAULT 0;
  END IF;
END $$;
