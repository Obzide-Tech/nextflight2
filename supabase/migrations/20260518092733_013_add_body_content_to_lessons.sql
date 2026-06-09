/*
  # Add body_content to course_lessons

  1. Changes
    - `course_lessons.body_content` (text, default '') — stores the full lesson text
      content imported from the Kajabi export (leccion.md files), used to render
      the "Resumen" tab in the lesson player via a markdown renderer.

  2. Notes
    - Column is nullable-safe via DEFAULT '' so existing rows are not affected.
    - Content is populated in the next migration via bulk UPDATE from video_mapping.json.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'course_lessons' AND column_name = 'body_content'
  ) THEN
    ALTER TABLE course_lessons ADD COLUMN body_content text DEFAULT '';
  END IF;
END $$;
