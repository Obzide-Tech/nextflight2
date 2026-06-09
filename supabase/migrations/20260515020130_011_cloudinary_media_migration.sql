/*
  # Migrate media URLs to Cloudinary CDN

  1. Modified Tables
    - `products_programs` — update cover_url to use Cloudinary image URLs
    - `courses` — update cover_url to use Cloudinary image URLs
    - `course_lessons` — update video_external_url to point to Cloudinary video folder NextFLGHTs

  2. Notes
    - All video content (~80GB) has been uploaded to Cloudinary cloud "dwp64dtwa"
      in folder "NextFLGHTs"
    - Videos are delivered via Cloudinary CDN with adaptive bitrate (q_auto, f_auto)
    - Cover images use Cloudinary image transformations (c_fill, g_auto)
    - Replaces placeholder Google sample video URLs with Cloudinary paths
    - Lesson video URLs follow pattern: NextFLGHTs/{module_slug}/{lesson_order}
    - The sign-lesson-url Edge Function now supports Cloudinary signed delivery

  3. New system_settings entry
    - `cloudinary_cloud_name` — stores the Cloudinary cloud name for admin reference
*/

-- Add Cloudinary config to system_settings
INSERT INTO system_settings (key, value, description)
VALUES (
  'cloudinary_cloud_name',
  '"dwp64dtwa"',
  'Cloudinary cloud name for media CDN delivery'
)
ON CONFLICT (key) DO NOTHING;

INSERT INTO system_settings (key, value, description)
VALUES (
  'cloudinary_folder',
  '"NextFLGHTs"',
  'Root folder in Cloudinary where all course media is stored'
)
ON CONFLICT (key) DO NOTHING;

-- Update program cover images to Cloudinary
UPDATE products_programs
SET cover_url = 'https://res.cloudinary.com/dwp64dtwa/image/upload/c_fill,w_1200,g_auto,q_auto,f_auto/NextFLGHTs/covers/nextflight-starter'
WHERE slug = 'nextflight-starter';

UPDATE products_programs
SET cover_url = 'https://res.cloudinary.com/dwp64dtwa/image/upload/c_fill,w_1200,g_auto,q_auto,f_auto/NextFLGHTs/covers/nextflight-premium-method'
WHERE slug = 'nextflight-premium-method';

-- Update course cover images
UPDATE courses
SET cover_url = 'https://res.cloudinary.com/dwp64dtwa/image/upload/c_fill,w_800,g_auto,q_auto,f_auto/NextFLGHTs/covers/curso-starter'
WHERE id = (SELECT id FROM courses WHERE title = 'Curso Starter' LIMIT 1);

UPDATE courses
SET cover_url = 'https://res.cloudinary.com/dwp64dtwa/image/upload/c_fill,w_800,g_auto,q_auto,f_auto/NextFLGHTs/covers/metodo-premium'
WHERE id = (SELECT id FROM courses WHERE title = 'Método Premium' LIMIT 1);

-- Update all lesson video URLs from Google samples to Cloudinary paths
-- Starter Program lessons
UPDATE course_lessons SET video_external_url = 'https://res.cloudinary.com/dwp64dtwa/video/upload/NextFLGHTs/starter/tu-primer-despegue/01-bienvenida-a-tu-cabina'
WHERE title = 'Bienvenida a tu cabina';

UPDATE course_lessons SET video_external_url = 'https://res.cloudinary.com/dwp64dtwa/video/upload/NextFLGHTs/starter/tu-primer-despegue/02-define-tu-destino'
WHERE title = 'Define tu destino';

UPDATE course_lessons SET video_external_url = 'https://res.cloudinary.com/dwp64dtwa/video/upload/NextFLGHTs/starter/tu-primer-despegue/03-como-leer-tus-instrumentos'
WHERE title = 'Cómo leer tus instrumentos';

UPDATE course_lessons SET video_external_url = 'https://res.cloudinary.com/dwp64dtwa/video/upload/NextFLGHTs/starter/tu-primer-despegue/04-lista-de-pre-vuelo'
WHERE title = 'Lista de pre-vuelo';

UPDATE course_lessons SET video_external_url = 'https://res.cloudinary.com/dwp64dtwa/video/upload/NextFLGHTs/starter/altitud-de-crucero/01-manten-tu-rumbo'
WHERE title = 'Mantén tu rumbo';

UPDATE course_lessons SET video_external_url = 'https://res.cloudinary.com/dwp64dtwa/video/upload/NextFLGHTs/starter/altitud-de-crucero/02-turbulencias-suaves'
WHERE title = 'Turbulencias suaves';

UPDATE course_lessons SET video_external_url = 'https://res.cloudinary.com/dwp64dtwa/video/upload/NextFLGHTs/starter/altitud-de-crucero/03-comunicacion-con-la-torre'
WHERE title = 'Comunicación con la torre';

UPDATE course_lessons SET video_external_url = 'https://res.cloudinary.com/dwp64dtwa/video/upload/NextFLGHTs/starter/altitud-de-crucero/04-reabastecimiento'
WHERE title = 'Reabastecimiento';

UPDATE course_lessons SET video_external_url = 'https://res.cloudinary.com/dwp64dtwa/video/upload/NextFLGHTs/starter/aterrizaje/01-aproximacion-final'
WHERE title = 'Aproximación final';

UPDATE course_lessons SET video_external_url = 'https://res.cloudinary.com/dwp64dtwa/video/upload/NextFLGHTs/starter/aterrizaje/02-touchdown'
WHERE title = 'Touchdown';

UPDATE course_lessons SET video_external_url = 'https://res.cloudinary.com/dwp64dtwa/video/upload/NextFLGHTs/starter/aterrizaje/03-despues-del-vuelo'
WHERE title = 'Después del vuelo';

UPDATE course_lessons SET video_external_url = 'https://res.cloudinary.com/dwp64dtwa/video/upload/NextFLGHTs/starter/aterrizaje/04-tu-proxima-ruta'
WHERE title = 'Tu próxima ruta';

-- Premium Method lessons
UPDATE course_lessons SET video_external_url = 'https://res.cloudinary.com/dwp64dtwa/video/upload/NextFLGHTs/premium/mindset-de-comandante/01'
WHERE title = 'Lección 1 · Mindset de Comandante';

UPDATE course_lessons SET video_external_url = 'https://res.cloudinary.com/dwp64dtwa/video/upload/NextFLGHTs/premium/mindset-de-comandante/02'
WHERE title = 'Lección 2 · Mindset de Comandante';

UPDATE course_lessons SET video_external_url = 'https://res.cloudinary.com/dwp64dtwa/video/upload/NextFLGHTs/premium/mindset-de-comandante/03'
WHERE title = 'Lección 3 · Mindset de Comandante';

UPDATE course_lessons SET video_external_url = 'https://res.cloudinary.com/dwp64dtwa/video/upload/NextFLGHTs/premium/mindset-de-comandante/04'
WHERE title = 'Lección 4 · Mindset de Comandante';

UPDATE course_lessons SET video_external_url = 'https://res.cloudinary.com/dwp64dtwa/video/upload/NextFLGHTs/premium/posicionamiento-editorial/01'
WHERE title = 'Lección 1 · Posicionamiento Editorial';

UPDATE course_lessons SET video_external_url = 'https://res.cloudinary.com/dwp64dtwa/video/upload/NextFLGHTs/premium/posicionamiento-editorial/02'
WHERE title = 'Lección 2 · Posicionamiento Editorial';

UPDATE course_lessons SET video_external_url = 'https://res.cloudinary.com/dwp64dtwa/video/upload/NextFLGHTs/premium/posicionamiento-editorial/03'
WHERE title = 'Lección 3 · Posicionamiento Editorial';

UPDATE course_lessons SET video_external_url = 'https://res.cloudinary.com/dwp64dtwa/video/upload/NextFLGHTs/premium/posicionamiento-editorial/04'
WHERE title = 'Lección 4 · Posicionamiento Editorial';

UPDATE course_lessons SET video_external_url = 'https://res.cloudinary.com/dwp64dtwa/video/upload/NextFLGHTs/premium/rutas-de-monetizacion/01'
WHERE title = 'Lección 1 · Rutas de Monetización';

UPDATE course_lessons SET video_external_url = 'https://res.cloudinary.com/dwp64dtwa/video/upload/NextFLGHTs/premium/rutas-de-monetizacion/02'
WHERE title = 'Lección 2 · Rutas de Monetización';

UPDATE course_lessons SET video_external_url = 'https://res.cloudinary.com/dwp64dtwa/video/upload/NextFLGHTs/premium/rutas-de-monetizacion/03'
WHERE title = 'Lección 3 · Rutas de Monetización';

UPDATE course_lessons SET video_external_url = 'https://res.cloudinary.com/dwp64dtwa/video/upload/NextFLGHTs/premium/rutas-de-monetizacion/04'
WHERE title = 'Lección 4 · Rutas de Monetización';

UPDATE course_lessons SET video_external_url = 'https://res.cloudinary.com/dwp64dtwa/video/upload/NextFLGHTs/premium/sistemas-y-tripulacion/01'
WHERE title = 'Lección 1 · Sistemas y Tripulación';

UPDATE course_lessons SET video_external_url = 'https://res.cloudinary.com/dwp64dtwa/video/upload/NextFLGHTs/premium/sistemas-y-tripulacion/02'
WHERE title = 'Lección 2 · Sistemas y Tripulación';

UPDATE course_lessons SET video_external_url = 'https://res.cloudinary.com/dwp64dtwa/video/upload/NextFLGHTs/premium/sistemas-y-tripulacion/03'
WHERE title = 'Lección 3 · Sistemas y Tripulación';

UPDATE course_lessons SET video_external_url = 'https://res.cloudinary.com/dwp64dtwa/video/upload/NextFLGHTs/premium/sistemas-y-tripulacion/04'
WHERE title = 'Lección 4 · Sistemas y Tripulación';

UPDATE course_lessons SET video_external_url = 'https://res.cloudinary.com/dwp64dtwa/video/upload/NextFLGHTs/premium/visibilidad-y-vuelo-internacional/01'
WHERE title = 'Lección 1 · Visibilidad y Vuelo Internacional';

UPDATE course_lessons SET video_external_url = 'https://res.cloudinary.com/dwp64dtwa/video/upload/NextFLGHTs/premium/visibilidad-y-vuelo-internacional/02'
WHERE title = 'Lección 2 · Visibilidad y Vuelo Internacional';

UPDATE course_lessons SET video_external_url = 'https://res.cloudinary.com/dwp64dtwa/video/upload/NextFLGHTs/premium/visibilidad-y-vuelo-internacional/03'
WHERE title = 'Lección 3 · Visibilidad y Vuelo Internacional';

UPDATE course_lessons SET video_external_url = 'https://res.cloudinary.com/dwp64dtwa/video/upload/NextFLGHTs/premium/visibilidad-y-vuelo-internacional/04'
WHERE title = 'Lección 4 · Visibilidad y Vuelo Internacional';
