/*
  # Unique indexes for upsert paths
  - lesson_notes uniqueness on (user_id, lesson_id)
  - lesson_progress uniqueness on (user_id, lesson_id)
  - enrollments uniqueness on (user_id, program_id)
*/

CREATE UNIQUE INDEX IF NOT EXISTS lesson_notes_user_lesson_idx ON lesson_notes (user_id, lesson_id);
CREATE UNIQUE INDEX IF NOT EXISTS lesson_progress_user_lesson_idx ON lesson_progress (user_id, lesson_id);
CREATE UNIQUE INDEX IF NOT EXISTS enrollments_user_program_idx ON enrollments (user_id, program_id);
