/*
  # Replace demo content with real NextFlight Academy course data

  This migration replaces all placeholder/demo content with the actual
  NextFlight Academy course structure scraped from the original Kajabi platform.

  1. Changes
    - Removes old demo lessons, modules, courses, and programs
    - Creates 1 program: "Next Flight Academy" (premium)
    - Creates 1 course: "Next Flight Academy"
    - Creates 43 modules with proper ordering
    - Creates 359 lessons with real titles, descriptions, and Cloudinary video references
    - 345 lessons have video content (Cloudinary public_ids)
    - 14 lessons are text/resource-only (no video)

  2. Data Sources
    - Module/lesson structure: Kajabi export (estructura.json)
    - Lesson content: Kajabi export (EXPORT-CARPETASkajabi/*.md files)
    - Video mapping: Cloudinary Media Library folder structure

  3. Important Notes
    - Existing lesson_progress, lesson_notes, enrollments referencing old IDs will be orphaned
    - lesson_assets referencing old lesson IDs will be cleaned up
    - All video references use Cloudinary public_ids (hash-based, not path-based)
*/

-- Step 1: Clean up old demo data (dependent tables first)
DELETE FROM lesson_assets WHERE lesson_id IN (SELECT id FROM course_lessons);
DELETE FROM lesson_progress WHERE lesson_id IN (SELECT id FROM course_lessons);
DELETE FROM lesson_notes WHERE lesson_id IN (SELECT id FROM course_lessons);
DELETE FROM course_lessons;
DELETE FROM course_modules;
DELETE FROM courses;
DELETE FROM enrollments;
DELETE FROM products_programs;


-- Step 2: Create the real NextFlight Academy program
INSERT INTO products_programs (id, slug, title, subtitle, description, tier, affiliate_enabled, default_commission_rate, price_usd, is_published, display_order)
VALUES (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'nextflight-academy',
  'Next Flight Academy',
  'Tu academia digital de negocios',
  'Experiencia transformadora diseñada para que lleves tu negocio digital a otro nivel.',
  'premium',
  true,
  0.30,
  297,
  true,
  1
);


-- Step 3: Create the course
INSERT INTO courses (id, program_id, title, description, display_order, is_published)
VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'Next Flight Academy',
  'Curso completo con 43 módulos de negocios digitales, desarrollo personal, marketing y más.',
  1,
  true
);


-- Step 4: Create 43 modules

INSERT INTO course_modules (id, course_id, title, description, display_order, is_published)
VALUES ('m00100000-0000-4000-8000-000000000000', 'b2c3d4e5-f6a7-8901-bcde-f12345678901', '¡BIENVENIDOS A BORDO!', '', 1, true);

INSERT INTO course_modules (id, course_id, title, description, display_order, is_published)
VALUES ('m00200000-0000-4000-8000-000000000000', 'b2c3d4e5-f6a7-8901-bcde-f12345678901', 'CAJA DE VUELO', '', 2, true);

INSERT INTO course_modules (id, course_id, title, description, display_order, is_published)
VALUES ('m00300000-0000-4000-8000-000000000000', 'b2c3d4e5-f6a7-8901-bcde-f12345678901', 'RUTA DE GPS INTERNO', '', 3, true);

INSERT INTO course_modules (id, course_id, title, description, display_order, is_published)
VALUES ('m00400000-0000-4000-8000-000000000000', 'b2c3d4e5-f6a7-8901-bcde-f12345678901', 'CABINA DE HÁBITOS PODEROSOS', '', 4, true);

INSERT INTO course_modules (id, course_id, title, description, display_order, is_published)
VALUES ('m00500000-0000-4000-8000-000000000000', 'b2c3d4e5-f6a7-8901-bcde-f12345678901', 'RUTA DE BEACONS', '', 5, true);

INSERT INTO course_modules (id, course_id, title, description, display_order, is_published)
VALUES ('m00600000-0000-4000-8000-000000000000', 'b2c3d4e5-f6a7-8901-bcde-f12345678901', 'SALA DE EMBARQUE STAN STORE', '', 6, true);

INSERT INTO course_modules (id, course_id, title, description, display_order, is_published)
VALUES ('m00700000-0000-4000-8000-000000000000', 'b2c3d4e5-f6a7-8901-bcde-f12345678901', 'PASARELA DE SYSTEM.IO', '', 7, true);

INSERT INTO course_modules (id, course_id, title, description, display_order, is_published)
VALUES ('m00800000-0000-4000-8000-000000000000', 'b2c3d4e5-f6a7-8901-bcde-f12345678901', 'VUELA MÁS RÁPIDO CON IA', '', 8, true);

INSERT INTO course_modules (id, course_id, title, description, display_order, is_published)
VALUES ('m00900000-0000-4000-8000-000000000000', 'b2c3d4e5-f6a7-8901-bcde-f12345678901', 'VENDE MÁS CON IA', '', 9, true);

INSERT INTO course_modules (id, course_id, title, description, display_order, is_published)
VALUES ('m01000000-0000-4000-8000-000000000000', 'b2c3d4e5-f6a7-8901-bcde-f12345678901', 'DESPEGA CON CAPCUT', '', 10, true);

INSERT INTO course_modules (id, course_id, title, description, display_order, is_published)
VALUES ('m01100000-0000-4000-8000-000000000000', 'b2c3d4e5-f6a7-8901-bcde-f12345678901', 'EDICIÓN EN CAPCUT AVANZADO', '', 11, true);

INSERT INTO course_modules (id, course_id, title, description, display_order, is_published)
VALUES ('m01200000-0000-4000-8000-000000000000', 'b2c3d4e5-f6a7-8901-bcde-f12345678901', 'DESPEGA DISEÑANDO EN CANVA', '', 12, true);

INSERT INTO course_modules (id, course_id, title, description, display_order, is_published)
VALUES ('m01300000-0000-4000-8000-000000000000', 'b2c3d4e5-f6a7-8901-bcde-f12345678901', 'ZONA DE REPROGRAMACIÓN MENTAL', '', 13, true);

INSERT INTO course_modules (id, course_id, title, description, display_order, is_published)
VALUES ('m01400000-0000-4000-8000-000000000000', 'b2c3d4e5-f6a7-8901-bcde-f12345678901', 'ITINERARIO SEMANAL CON DISCIPLINA', '', 14, true);

INSERT INTO course_modules (id, course_id, title, description, display_order, is_published)
VALUES ('m01500000-0000-4000-8000-000000000000', 'b2c3d4e5-f6a7-8901-bcde-f12345678901', 'CABINA DE IMAGEN ESTRATÉGICA', '', 15, true);

INSERT INTO course_modules (id, course_id, title, description, display_order, is_published)
VALUES ('m01600000-0000-4000-8000-000000000000', 'b2c3d4e5-f6a7-8901-bcde-f12345678901', 'PUERTA DE EMBARQUE DE TU MARCA', '', 16, true);

INSERT INTO course_modules (id, course_id, title, description, display_order, is_published)
VALUES ('m01700000-0000-4000-8000-000000000000', 'b2c3d4e5-f6a7-8901-bcde-f12345678901', 'RUTINAS EN CASA', '', 17, true);

INSERT INTO course_modules (id, course_id, title, description, display_order, is_published)
VALUES ('m01800000-0000-4000-8000-000000000000', 'b2c3d4e5-f6a7-8901-bcde-f12345678901', 'COMO FUNCIONAN LAS REDES SOCIALES', '', 18, true);

INSERT INTO course_modules (id, course_id, title, description, display_order, is_published)
VALUES ('m01900000-0000-4000-8000-000000000000', 'b2c3d4e5-f6a7-8901-bcde-f12345678901', 'TORRE DE RESISTENCIA FÍSICA', '', 19, true);

INSERT INTO course_modules (id, course_id, title, description, display_order, is_published)
VALUES ('m02000000-0000-4000-8000-000000000000', 'b2c3d4e5-f6a7-8901-bcde-f12345678901', 'SALA VIP DE LAS VENTAS ESTRATÉGICAS', '', 20, true);

INSERT INTO course_modules (id, course_id, title, description, display_order, is_published)
VALUES ('m02100000-0000-4000-8000-000000000000', 'b2c3d4e5-f6a7-8901-bcde-f12345678901', 'TORRE ESTRATÉGICA DE LA VENTA PROFESIONAL', '', 21, true);

INSERT INTO course_modules (id, course_id, title, description, display_order, is_published)
VALUES ('m02200000-0000-4000-8000-000000000000', 'b2c3d4e5-f6a7-8901-bcde-f12345678901', 'TORRE DE INFLUENCIA INVISIBLE', '', 22, true);

INSERT INTO course_modules (id, course_id, title, description, display_order, is_published)
VALUES ('m02300000-0000-4000-8000-000000000000', 'b2c3d4e5-f6a7-8901-bcde-f12345678901', 'DESPEGA EN META ADS', '', 23, true);

INSERT INTO course_modules (id, course_id, title, description, display_order, is_published)
VALUES ('m02400000-0000-4000-8000-000000000000', 'b2c3d4e5-f6a7-8901-bcde-f12345678901', 'CENTRO DE CONTROL MANYCHAT', '', 24, true);

INSERT INTO course_modules (id, course_id, title, description, display_order, is_published)
VALUES ('m02500000-0000-4000-8000-000000000000', 'b2c3d4e5-f6a7-8901-bcde-f12345678901', 'TU RUTA DE VUELO COMO COMMUNITY MANAGER A/Z', '', 25, true);

INSERT INTO course_modules (id, course_id, title, description, display_order, is_published)
VALUES ('m02600000-0000-4000-8000-000000000000', 'b2c3d4e5-f6a7-8901-bcde-f12345678901', 'TORRE DE CREACIÓN DE PRODUCTOS DIGITALES', '', 26, true);

INSERT INTO course_modules (id, course_id, title, description, display_order, is_published)
VALUES ('m02700000-0000-4000-8000-000000000000', 'b2c3d4e5-f6a7-8901-bcde-f12345678901', 'TORRE DE CONTROL DE EMAIL MARKETING', '', 27, true);

INSERT INTO course_modules (id, course_id, title, description, display_order, is_published)
VALUES ('m02800000-0000-4000-8000-000000000000', 'b2c3d4e5-f6a7-8901-bcde-f12345678901', 'UN MILLON DE VISTAS', '', 28, true);

INSERT INTO course_modules (id, course_id, title, description, display_order, is_published)
VALUES ('m02900000-0000-4000-8000-000000000000', 'b2c3d4e5-f6a7-8901-bcde-f12345678901', 'RUTINAS EN GYM', '', 29, true);

INSERT INTO course_modules (id, course_id, title, description, display_order, is_published)
VALUES ('m03000000-0000-4000-8000-000000000000', 'b2c3d4e5-f6a7-8901-bcde-f12345678901', 'MULTINIVEL EN LA TORRE CON PRESENCIA REAL', '', 30, true);

INSERT INTO course_modules (id, course_id, title, description, display_order, is_published)
VALUES ('m03100000-0000-4000-8000-000000000000', 'b2c3d4e5-f6a7-8901-bcde-f12345678901', 'CABINA DE ORATORIA', '', 31, true);

INSERT INTO course_modules (id, course_id, title, description, display_order, is_published)
VALUES ('m03200000-0000-4000-8000-000000000000', 'b2c3d4e5-f6a7-8901-bcde-f12345678901', 'TORRE DE CONTROL DE TU MARCA EN INSTAGRAM', '', 32, true);

INSERT INTO course_modules (id, course_id, title, description, display_order, is_published)
VALUES ('m03300000-0000-4000-8000-000000000000', 'b2c3d4e5-f6a7-8901-bcde-f12345678901', 'PUERTA DE EMBARQUE A LA FACTURACIÓN CON RETOS', '', 33, true);

INSERT INTO course_modules (id, course_id, title, description, display_order, is_published)
VALUES ('m03400000-0000-4000-8000-000000000000', 'b2c3d4e5-f6a7-8901-bcde-f12345678901', 'TORRE DE EMBUDOS ESTRATÉGICOS', '', 34, true);

INSERT INTO course_modules (id, course_id, title, description, display_order, is_published)
VALUES ('m03500000-0000-4000-8000-000000000000', 'b2c3d4e5-f6a7-8901-bcde-f12345678901', 'FORMATOS DE GRABACIÓN', '', 35, true);

INSERT INTO course_modules (id, course_id, title, description, display_order, is_published)
VALUES ('m03600000-0000-4000-8000-000000000000', 'b2c3d4e5-f6a7-8901-bcde-f12345678901', 'TORRE DE CONTROL CREATIVA', '', 36, true);

INSERT INTO course_modules (id, course_id, title, description, display_order, is_published)
VALUES ('m03700000-0000-4000-8000-000000000000', 'b2c3d4e5-f6a7-8901-bcde-f12345678901', 'CALCULADORA VIRAL', '', 37, true);

INSERT INTO course_modules (id, course_id, title, description, display_order, is_published)
VALUES ('m03800000-0000-4000-8000-000000000000', 'b2c3d4e5-f6a7-8901-bcde-f12345678901', 'MONETIZA CON UGC', '', 38, true);

INSERT INTO course_modules (id, course_id, title, description, display_order, is_published)
VALUES ('m03900000-0000-4000-8000-000000000000', 'b2c3d4e5-f6a7-8901-bcde-f12345678901', 'INTELIGENCIA ARTIFICIAL 2.0', '', 39, true);

INSERT INTO course_modules (id, course_id, title, description, display_order, is_published)
VALUES ('m04000000-0000-4000-8000-000000000000', 'b2c3d4e5-f6a7-8901-bcde-f12345678901', 'DA VIDA A TU CLON', '', 40, true);

INSERT INTO course_modules (id, course_id, title, description, display_order, is_published)
VALUES ('m04100000-0000-4000-8000-000000000000', 'b2c3d4e5-f6a7-8901-bcde-f12345678901', 'MONETIZA CON HOTMART', '', 41, true);

INSERT INTO course_modules (id, course_id, title, description, display_order, is_published)
VALUES ('m04200000-0000-4000-8000-000000000000', 'b2c3d4e5-f6a7-8901-bcde-f12345678901', 'MONETIZA CON AMAZON', '', 42, true);

INSERT INTO course_modules (id, course_id, title, description, display_order, is_published)
VALUES ('m04300000-0000-4000-8000-000000000000', 'b2c3d4e5-f6a7-8901-bcde-f12345678901', 'CONECTA Y VENDE CON TIKTOK LIVE', '', 43, true);


-- Step 5: Create 359 lessons with real content and video references

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l00100100-0000-4000-8000-000000000000', 'm00100000-0000-4000-8000-000000000000', 'POLÍTICAS, TÉRMINOS Y CONDICIONES', 'DESCARGA EL PDF EN LA PARTE DE ARRIBA

Y HAS CLICK EN EL SIGUIENTE LINK PARA VER LAS CLÁUSULAS Y POLÍTICAS, LAS CUALES DEBES LEER DETENIDAMENTE PARA CONOCER TUS DERECHOS Y DEBERES DENTRO DE LA ACADEMIA 

[ POLÍTICAS, TÉRMINOS Y CONDICIONES](https://drive.google.com/drive/folders/1LaF6Nz7xXCi66Swut0v3xdD82Xk5h-AS)

 POLÍTICAS, TÉRMINOS Y CONDICIONES: https://drive.google.com/drive/folders/1LaF6Nz7xXCi66Swut0v3xdD82Xk5h-AS | POL&Iacute;TICAS, T&Eacute;RMINOS Y CONDICIONES: https://drive.google.com', '', 1, true, true, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l00100200-0000-4000-8000-000000000000', 'm00100000-0000-4000-8000-000000000000', 'Introduccion', 'Instagram: @duadanielap  
  
Prepárate para despegar. Te damos la bienvenida a NextFlight Academy, una experiencia transformadora diseñada para que lleves tu negocio digital a otro nivel.', 'voourtpftmlysqcdnvs0', 2, true, true, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l00100300-0000-4000-8000-000000000000', 'm00100000-0000-4000-8000-000000000000', 'Mi historia', 'Instagram: @duadanielap  
  
Daniela Patiño, tu instructora en este vuelo, te comparte su historia: de empezar desde cero a construir una marca con propósito. Una dosis de verdad, inspiración y visión.', 'zgwyr6q6lkmsbhfh5nsn', 3, true, true, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l00100400-0000-4000-8000-000000000000', 'm00100000-0000-4000-8000-000000000000', '¿Por qué Next Flight?', 'Instagram: @duadanielap  
  
Descubre el propósito y visión de este curso: una experiencia que combina estrategia, marca personal y libertad digital.', 'tlftggkjxbpgu1uzprje', 4, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l00100500-0000-4000-8000-000000000000', 'm00100000-0000-4000-8000-000000000000', 'Conviértete en parte de la tripulación (afiliados)', 'Explora cómo puedes ganar mientras aprendes. Únete como afiliada y vuela junto a otras emprendedoras que monetizan su misión.

 

**NO OLVIDES DESCARGAR EN EL BOT ÓN DE ARRIBA  (DOWNLOADS) EL PDF DE ESTA LECCIÓN.**', '', 5, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l00100600-0000-4000-8000-000000000000', 'm00100000-0000-4000-8000-000000000000', 'Pasos a seguir al vender', 'Tu bitácora de vuelo para iniciar ventas con claridad. Te guiamos paso a paso para que sepas qué hacer y cómo hacerlo.

**NO OLVIDES DESCARGAR EN EL BOT ÓN DE ARRIBA  (DOWNLOADS) EL PDF DE ESTA LECCIÓN.**', '', 6, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l00100700-0000-4000-8000-000000000000', 'm00100000-0000-4000-8000-000000000000', 'Más de 10 formas de monetizar tu vuelo con Next Flight', 'Desbloquea todas las maneras en que puedes generar ingresos con NextFlight: afiliación, productos, retos, servicios y más.

**NO OLVIDES DESCARGAR EN EL BOT ÓN DE ARRIBA  (DOWNLOADS) EL PDF DE ESTA LECCIÓN.**', '', 7, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l00100800-0000-4000-8000-000000000000', 'm00100000-0000-4000-8000-000000000000', 'Recursos Graficos Next Flight', '<https://drive.google.com/drive/folders/1tZ6fm-AlBenTZv8Dl-qco07PFd59PTJ5?usp=share_link>

https://drive.google.com/drive/folders/1tZ6fm-AlBenTZv8Dl-qco07PFd59PTJ5?usp=share_link: https://drive.google.com/drive/folders/1tZ6fm-AlBenTZv8Dl-qco07PFd59PTJ5?usp=share_link', '', 8, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l00100900-0000-4000-8000-000000000000', 'm00100000-0000-4000-8000-000000000000', 'PRIMEROS PASOS: GUIA DE COMO EMPEZAR TU RECORRIDO EN NEXT FLIGHT', '[CLICK AQUI PARA VER LA CLASE GRABADA](https://us06web.zoom.us/rec/component-page?eagerLoadZvaPages=&accessLevel=meeting&action=viewdetailpage&sharelevel=meeting&useWhichPasswd=meeting&requestFrom=pwdCheck&clusterId=us06&componentName=need-password&meetingId=N_LgpsT7-c9qWHrnzHbYOkKj3yDvvwD5skkPLb5CTp708v_YyGQTXsr56tVB03jX.hWiKNTJWQQxeM2Hn&originRequestUrl=https%3A%2F%2Fus06web.zoom.us%2Frec%2Fshare%2F03tF8DvrYygNHdLYKzZ5OQawRwguSjjxhiIu3xj8EwawxKwgqrl0DC1UAySkfoNM.sONKWMbiomjRuoPI).   
Código de', '', 9, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l00101000-0000-4000-8000-000000000000', 'm00100000-0000-4000-8000-000000000000', 'Guia para ser una mentora de primera clase', '', '', 10, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l00200100-0000-4000-8000-000000000000', 'm00200000-0000-4000-8000-000000000000', 'Reuniones Semanales', 'Tu punto de encuentro para mantener el rumbo claro. Estas reuniones serán tu espacio de acompañamiento, claridad y ajuste estratégico durante todo el viaje.

**Aqu í encontrarás las reuniones de zoom grabados que se hacen mensualmente**

[CLICK AQUI PARA VER REUNIONES GRABADAS](https://www.canva.com/design/DAG0m1zLrHQ/BckCKh-hESYlX8dwA8aeZg/edit?utm_content=DAG0m1zLrHQ&utm_campaign=designshare&utm_medium=link2&utm_source=sharebutton "REUNIONES GRABADAS")

CLICK AQUI PARA VER REUNIONES GRABADAS: ', '', 1, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l00300100-0000-4000-8000-000000000000', 'm00300000-0000-4000-8000-000000000000', 'Cuando tu mente no descansa tu vida se detiene', 'Instagram: @duadanielap', 'qoo7hbsbhxxqgrblgu2b', 1, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l00300200-0000-4000-8000-000000000000', 'm00300000-0000-4000-8000-000000000000', 'Cómo pasar del deseo a la ejecución real', 'Instagram: @duadanielap', 'ctrd6jefmqa4gdkndiuy', 2, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l00300300-0000-4000-8000-000000000000', 'm00300000-0000-4000-8000-000000000000', 'Cómo te hablas puede hacerte millonario', 'Instagram: @duadanielap', 'lk2jpvh4p3hqdnlxqavx', 3, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l00300400-0000-4000-8000-000000000000', 'm00300000-0000-4000-8000-000000000000', 'Maneja tu mente antes de que te maneje a ti', '**NO OLVIDES DESCARGAR EN EL BOT ÓN DE ARRIBA  (DOWNLOADS) EL PDF DE ESTA LECCIÓN.**

 

**Instagram: @duadanielap**', 'etfdmtme0vs2hxlemtmo', 4, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l00300500-0000-4000-8000-000000000000', 'm00300000-0000-4000-8000-000000000000', 'Elevar la autoconfianza (conviertete en tu propio respaldo)', '**Instagram: @duadanielap**', 'lwfoty5tbqfszqftyq7x', 5, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l00300600-0000-4000-8000-000000000000', 'm00300000-0000-4000-8000-000000000000', 'El camino de las 5 P para encontrarte', '**Instagram: @duadanielap**', 'lhfdfjoueoa64wmza5us', 6, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l00300700-0000-4000-8000-000000000000', 'm00300000-0000-4000-8000-000000000000', 'Dejar de procrastinar', '**Instagram: @duadanielap**', 'qiunofwlzlwbgdvfnonc', 7, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l00300800-0000-4000-8000-000000000000', 'm00300000-0000-4000-8000-000000000000', 'Fin del GPS interno', '**Instagram: @duadanielap**', 'u8awhpwsaauas2zc2fsz', 8, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l00400100-0000-4000-8000-000000000000', 'm00400000-0000-4000-8000-000000000000', 'Control de equipaje emocional', 'Aprende a soltar cargas emocionales que no te permiten avanzar y transforma tus emociones en impulso para crecer.', 'le1ktcicetdwrqws1kkk', 1, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l00400200-0000-4000-8000-000000000000', 'm00400000-0000-4000-8000-000000000000', 'Torre de control interna', 'Desarrolla una mente enfocada y resiliente que te ayude a tomar decisiones alineadas con tu visión de vida.', 'fc5pfhvljzjlefvwhkzx', 2, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l00400300-0000-4000-8000-000000000000', 'm00400000-0000-4000-8000-000000000000', 'Frecuencia de vuelo energética', 'Eleva tu energía diaria con hábitos conscientes que fortalezcan tu bienestar físico, mental y espiritual.', 'n49xgklwuesuilnlvywn', 3, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l00400400-0000-4000-8000-000000000000', 'm00400000-0000-4000-8000-000000000000', 'Plan de vuelo de tu futuro yo', 'Diseña una rutina poderosa conectada con la versión de ti que ya logró lo que sueñas, y empieza a vivir desde esa realidad.

**NO OLVIDES DESCARGAR EN EL BOT ÓN DE ARRIBA  (DOWNLOADS) EL PDF DE ESTA LECCIÓN.**', 'h2mldooxi0ufjdysfmdc', 4, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l00400500-0000-4000-8000-000000000000', 'm00400000-0000-4000-8000-000000000000', 'Puerta de embarque familiar', 'Crea un entorno familiar que apoye tu crecimiento, con límites sanos, comunicación clara y propósito compartido.', 'jnjzjfsnau8r06a1bu4v', 5, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l00400600-0000-4000-8000-000000000000', 'm00400000-0000-4000-8000-000000000000', 'Torre de organización semanal con disciplina', '**NO OLVIDES DESCARGAR EN EL BOT ÓN DE ARRIBA  (DOWNLOADS) EL PDF DE ESTA LECCIÓN.**', 'd4zrmnm7i6wblsjeiwhy', 6, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l00400700-0000-4000-8000-000000000000', 'm00400000-0000-4000-8000-000000000000', 'Torre de resistencia física', '', 'yxmadg59doremsea4iao', 7, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l00500100-0000-4000-8000-000000000000', 'm00500000-0000-4000-8000-000000000000', 'Presentación de la plataforma', 'Conoce Beacons, una plataforma práctica para centralizar tu contenido y profesionalizar tu presencia digital.', 'nhxphskjmxjcyexdzkiw', 1, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l00500200-0000-4000-8000-000000000000', 'm00500000-0000-4000-8000-000000000000', 'Crea tu cuenta y edita tu tienda', '[PLANTILLA DE CANVA](https://www.canva.com/design/DAG_5tlO4WE/BcfOkbcU1hRYjtWr-f2cpw/view?utm_content=DAG_5tlO4WE&utm_campaign=designshare&utm_medium=link&utm_source=publishsharelink&mode=preview)

DESCARGA EL "PDF DESPUES DE LA COMPRA" DONDE DICE DOWNLOADS

PLANTILLA DE CANVA: https://www.canva.com/design/DAG_5tlO4WE/BcfOkbcU1hRYjtWr-f2cpw/view?utm_content=DAG_5tlO4WE&utm_campaign=designshare&utm_medium=link&utm_source=publishsharelink&mode=preview | PLANTILLA DE CANVA: https://www.canva.com/de', 'mqrydsrzesbmgsingx19', 2, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l00500300-0000-4000-8000-000000000000', 'm00500000-0000-4000-8000-000000000000', 'Cómo recibir pagos', 'DESCARGA LA GUIA DE STRIPE ACA ARRIBA DONDE DICE DOWNLOADS', 'lqammfqbs3h4kmvgqquv', 3, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l00500400-0000-4000-8000-000000000000', 'm00500000-0000-4000-8000-000000000000', 'Beacons Pro', '**🚨🚨🚨IMPORTANTE:   BEACONS HIZO UNA ACTUALIZACIÓN EN LA CUAL PARA PODER USAR KLARNA,  AFTERPAY Y AFIRM DEBES PAGAR LA SUSCRIPCIÓN DE 30$**', 'elppar8nfgajqgrilaui', 4, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l00500500-0000-4000-8000-000000000000', 'm00500000-0000-4000-8000-000000000000', 'Cómo ubicar tu link', '', 'hz9kuirwlq5ikezmjeee', 5, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l00600100-0000-4000-8000-000000000000', 'm00600000-0000-4000-8000-000000000000', 'Crea una cuenta en Stan store', 'Da el primer paso. Te mostramos cómo registrarte en Stan y dejar lista tu plataforma de despegue digital.', 'mkr2gr0whn8wdjcuzcdz', 1, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l00600200-0000-4000-8000-000000000000', 'm00600000-0000-4000-8000-000000000000', 'Edita tu página', 'Personaliza tu vitrina digital. Aprende a darle tu estilo, voz y enfoque a tu página de ventas.', 'aea0bbk7i8cgvrvbk0xn', 2, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l00600300-0000-4000-8000-000000000000', 'm00600000-0000-4000-8000-000000000000', 'Crea tu primer producto', '[PLANTILLA DE CANVA ](https://www.canva.com/design/DAHCKlBD8jI/e0UHTNMBNTNkGu_TX4sniQ/view?utm_content=DAHCKlBD8jI&utm_campaign=designshare&utm_medium=link&utm_source=publishsharelink&mode=preview)Lleva tu idea al aire. Te guiamos para que subas y configures tu primer producto listo para vender.

PLANTILLA DE CANVA : https://www.canva.com/design/DAHCKlBD8jI/e0UHTNMBNTNkGu_TX4sniQ/view?utm_content=DAHCKlBD8jI&utm_campaign=designshare&utm_medium=link&utm_source=publishsharelink&mode=preview | PLAN', 'hbhpsehbxi9vhe7n7dg0', 3, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l00600400-0000-4000-8000-000000000000', 'm00600000-0000-4000-8000-000000000000', 'Configura tu guía gratis', 'Atrae con valor. Crea un recurso gratuito que conecte con tu audiencia y active tu embudo.', 'izojlsr447zkgsxpjecn', 4, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l00600500-0000-4000-8000-000000000000', 'm00600000-0000-4000-8000-000000000000', 'Klarna y Afterpay', 'Ofrece pagos flexibles. Aprende a integrar estas opciones y mejora la conversión de tus ventas.', 'nxgqny9oemgrrwmlioxb', 5, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l00600600-0000-4000-8000-000000000000', 'm00600000-0000-4000-8000-000000000000', 'Cómo obtener tus pagos', 'Aterriza tus ingresos. Aquí verás cómo recibir los pagos de tus productos sin complicaciones.', 'e62yp5s8h9eb3j0l3opo', 6, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l00600700-0000-4000-8000-000000000000', 'm00600000-0000-4000-8000-000000000000', 'Tu link de Stan store', 'Tu pasarela al mundo digital. Aprende a ubicar y compartir tu link de tienda de forma efectiva.', 'q2wl8grw1meezpfcelaj', 7, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l00700100-0000-4000-8000-000000000000', 'm00700000-0000-4000-8000-000000000000', 'Compra dominio y correo', 'Aprende a comprar un dominio y un correo profesional que respalden tu marca y aumenten tu autoridad digital.

[PLANTILLA FUNNEL EDITABLE](https://systeme.io/dashboard/share?hash=5778001aae16635fdeba7d7ec0cb5e3e54d747e&type=funnel)

PLANTILLA FUNNEL EDITABLE: https://systeme.io/dashboard/share?hash=5778001aae16635fdeba7d7ec0cb5e3e54d747e&type=funnel | PLANTILLA FUNNEL EDITABLE: https://systeme.io/dashboard/share?hash=5778001aae16635fdeba7d7ec0cb5e3e54d747e&amp;type=funnel', 'mowqizffhr0yd5wo0ulz', 1, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l00700200-0000-4000-8000-000000000000', 'm00700000-0000-4000-8000-000000000000', 'Crea tu cuenta en systeme', 'Crea tu cuenta en systeme.io y deja todo listo para comenzar a construir tu sistema de automatización.

[PLANTILLA FUNNEL EDITABLE](https://systeme.io/dashboard/share?hash=5778001aae16635fdeba7d7ec0cb5e3e54d747e&type=funnel)

PLANTILLA FUNNEL EDITABLE: https://systeme.io/dashboard/share?hash=5778001aae16635fdeba7d7ec0cb5e3e54d747e&type=funnel | PLANTILLA FUNNEL EDITABLE: https://systeme.io/dashboard/share?hash=5778001aae16635fdeba7d7ec0cb5e3e54d747e&amp;type=funnel', 'bkauobxl8dhhw3h6bigb', 2, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l00700300-0000-4000-8000-000000000000', 'm00700000-0000-4000-8000-000000000000', 'Conecta dominio y correo', 'Conecta tu dominio y correo con systeme.io para comunicarte con tu audiencia de forma profesional y confiable.

[PLANTILLA FUNNEL EDITABLE](https://systeme.io/dashboard/share?hash=5778001aae16635fdeba7d7ec0cb5e3e54d747e&type=funnel)

PLANTILLA FUNNEL EDITABLE: https://systeme.io/dashboard/share?hash=5778001aae16635fdeba7d7ec0cb5e3e54d747e&type=funnel | PLANTILLA FUNNEL EDITABLE: https://systeme.io/dashboard/share?hash=5778001aae16635fdeba7d7ec0cb5e3e54d747e&amp;type=funnel', 'ucyhkraomsnr9ee0nbqk', 3, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l00700400-0000-4000-8000-000000000000', 'm00700000-0000-4000-8000-000000000000', 'Crea tu primer funnel', 'Diseña tu primer embudo de ventas paso a paso para captar leads y transformar visitas en conversiones.

[PLANTILLA FUNNEL EDITABLE](https://systeme.io/dashboard/share?hash=5778001aae16635fdeba7d7ec0cb5e3e54d747e&type=funnel)

PLANTILLA FUNNEL EDITABLE: https://systeme.io/dashboard/share?hash=5778001aae16635fdeba7d7ec0cb5e3e54d747e&type=funnel | PLANTILLA FUNNEL EDITABLE: https://systeme.io/dashboard/share?hash=5778001aae16635fdeba7d7ec0cb5e3e54d747e&amp;type=funnel', 'n9xja06bgdthzg4dyxbz', 4, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l00700500-0000-4000-8000-000000000000', 'm00700000-0000-4000-8000-000000000000', 'Plantilla de funnel de ventas', 'Accede a una plantilla lista para adaptar a tu producto y optimizar tu proceso de ventas desde el inicio.

[PLANTILLA FUNNEL EDITABLE](https://systeme.io/dashboard/share?hash=5778001aae16635fdeba7d7ec0cb5e3e54d747e&type=funnel)

PLANTILLA FUNNEL EDITABLE: https://systeme.io/dashboard/share?hash=5778001aae16635fdeba7d7ec0cb5e3e54d747e&type=funnel | PLANTILLA FUNNEL EDITABLE: https://systeme.io/dashboard/share?hash=5778001aae16635fdeba7d7ec0cb5e3e54d747e&amp;type=funnel', 'lsirc5wcgf4ocbqtkxq8', 5, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l00700600-0000-4000-8000-000000000000', 'm00700000-0000-4000-8000-000000000000', 'Página de captura', 'Crea una página de captura efectiva para atraer contactos con una propuesta clara, directa y atractiva.

[PLANTILLA FUNNEL EDITABLE](https://systeme.io/dashboard/share?hash=5778001aae16635fdeba7d7ec0cb5e3e54d747e&type=funnel)

PLANTILLA FUNNEL EDITABLE: https://systeme.io/dashboard/share?hash=5778001aae16635fdeba7d7ec0cb5e3e54d747e&type=funnel | PLANTILLA FUNNEL EDITABLE: https://systeme.io/dashboard/share?hash=5778001aae16635fdeba7d7ec0cb5e3e54d747e&amp;type=funnel', 'e1jvb3mo5bquduokglky', 6, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l00700700-0000-4000-8000-000000000000', 'm00700000-0000-4000-8000-000000000000', 'Crea tu guía gratis', 'Diseña y entrega una guía gratuita que conecte con tu público y active tu sistema de email marketing.

[PLANTILLA GUIA GRATIS](https://www.canva.com/design/DAG11MkhzHo/vJkmMYnsnuc1-xiGFeTApQ/view?utm_content=DAG11MkhzHo&utm_campaign=designshare&utm_medium=link&utm_source=publishsharelink&mode=preview)

PLANTILLA GUIA GRATIS: https://www.canva.com/design/DAG11MkhzHo/vJkmMYnsnuc1-xiGFeTApQ/view?utm_content=DAG11MkhzHo&utm_campaign=designshare&utm_medium=link&utm_source=publishsharelink&mode=previe', 'xelba0bsbxczbzielm2r', 7, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l00700800-0000-4000-8000-000000000000', 'm00700000-0000-4000-8000-000000000000', 'Página de ventas', 'Construye una página de ventas persuasiva que muestre el valor de tu producto y motive a la acción.

**NO OLVIDES DESCARGAR EN EL BOT ÓN DE ARRIBA  (DOWNLOADS) EL PDF DE ESTA LECCIÓN.**

**[PLANTILLA FUNNEL EDITABLE](https://systeme.io/dashboard/share?hash=5778001aae16635fdeba7d7ec0cb5e3e54d747e&type=funnel)**

PLANTILLA FUNNEL EDITABLE: https://systeme.io/dashboard/share?hash=5778001aae16635fdeba7d7ec0cb5e3e54d747e&type=funnel | PLANTILLA FUNNEL EDITABLE: https://systeme.io/dashboard/share?hash', 'byslpsfhh78r890sfguo', 8, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l00700900-0000-4000-8000-000000000000', 'm00700000-0000-4000-8000-000000000000', 'Página de agradecimiento', 'Crea una página de agradecimiento para reforzar la conexión con tu cliente tras realizar una compra.

[PLANTILLA FUNNEL EDITABLE](https://systeme.io/dashboard/share?hash=5778001aae16635fdeba7d7ec0cb5e3e54d747e&type=funnel)

PLANTILLA FUNNEL EDITABLE: https://systeme.io/dashboard/share?hash=5778001aae16635fdeba7d7ec0cb5e3e54d747e&type=funnel | PLANTILLA FUNNEL EDITABLE: https://systeme.io/dashboard/share?hash=5778001aae16635fdeba7d7ec0cb5e3e54d747e&amp;type=funnel', 'odsikjstzya49lb5xsrc', 9, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l00701000-0000-4000-8000-000000000000', 'm00700000-0000-4000-8000-000000000000', 'Crea una cuenta en stripe', 'Abre tu cuenta en Stripe para empezar a recibir pagos online de forma segura, rápida y profesional.

[PLANTILLA FUNNEL EDITABLE](https://systeme.io/dashboard/share?hash=5778001aae16635fdeba7d7ec0cb5e3e54d747e&type=funnel)

PLANTILLA FUNNEL EDITABLE: https://systeme.io/dashboard/share?hash=5778001aae16635fdeba7d7ec0cb5e3e54d747e&type=funnel | PLANTILLA FUNNEL EDITABLE: https://systeme.io/dashboard/share?hash=5778001aae16635fdeba7d7ec0cb5e3e54d747e&amp;type=funnel', 'mg1adxxbproe4l9zybn3', 10, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l00701100-0000-4000-8000-000000000000', 'm00700000-0000-4000-8000-000000000000', 'Conecta stripe y PayPal', 'Conecta tus cuentas de Stripe y PayPal para ofrecer métodos de pago flexibles y aumentar tus ventas.

[PLANTILLA FUNNEL EDITABLE](https://systeme.io/dashboard/share?hash=5778001aae16635fdeba7d7ec0cb5e3e54d747e&type=funnel)

PLANTILLA FUNNEL EDITABLE: https://systeme.io/dashboard/share?hash=5778001aae16635fdeba7d7ec0cb5e3e54d747e&type=funnel | PLANTILLA FUNNEL EDITABLE: https://systeme.io/dashboard/share?hash=5778001aae16635fdeba7d7ec0cb5e3e54d747e&amp;type=funnel', 'vlyfhs7aunpbkw9apiiw', 11, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l00701200-0000-4000-8000-000000000000', 'm00700000-0000-4000-8000-000000000000', 'Página de pagos', 'Configura tu página de pagos con todos los elementos clave para facilitar una compra clara y segura.

[PLANTILLA FUNNEL EDITABLE](https://systeme.io/dashboard/share?hash=5778001aae16635fdeba7d7ec0cb5e3e54d747e&type=funnel)

PLANTILLA FUNNEL EDITABLE: https://systeme.io/dashboard/share?hash=5778001aae16635fdeba7d7ec0cb5e3e54d747e&type=funnel | PLANTILLA FUNNEL EDITABLE: https://systeme.io/dashboard/share?hash=5778001aae16635fdeba7d7ec0cb5e3e54d747e&amp;type=funnel', 'drers18rgohesh8fy6q2', 12, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l00701300-0000-4000-8000-000000000000', 'm00700000-0000-4000-8000-000000000000', 'Correos en systeme', 'Aprende a gestionar tus correos dentro de systeme para automatizar la comunicación con tus prospectos.

[PLANTILLA FUNNEL EDITABLE](https://systeme.io/dashboard/share?hash=5778001aae16635fdeba7d7ec0cb5e3e54d747e&type=funnel)

PLANTILLA FUNNEL EDITABLE: https://systeme.io/dashboard/share?hash=5778001aae16635fdeba7d7ec0cb5e3e54d747e&type=funnel | PLANTILLA FUNNEL EDITABLE: https://systeme.io/dashboard/share?hash=5778001aae16635fdeba7d7ec0cb5e3e54d747e&amp;type=funnel', 'jowm9jp1htjvddtdizpb', 13, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l00701400-0000-4000-8000-000000000000', 'm00700000-0000-4000-8000-000000000000', 'Crear campañas', 'Crea campañas de correo estructuradas que informen, conecten y generen ventas de forma constante.

[PLANTILLA FUNNEL EDITABLE](https://systeme.io/dashboard/share?hash=5778001aae16635fdeba7d7ec0cb5e3e54d747e&type=funnel)

PLANTILLA FUNNEL EDITABLE: https://systeme.io/dashboard/share?hash=5778001aae16635fdeba7d7ec0cb5e3e54d747e&type=funnel | PLANTILLA FUNNEL EDITABLE: https://systeme.io/dashboard/share?hash=5778001aae16635fdeba7d7ec0cb5e3e54d747e&amp;type=funnel', 'gdye49cpclvjnalydfqm', 14, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l00701500-0000-4000-8000-000000000000', 'm00700000-0000-4000-8000-000000000000', 'Crear newsletter', 'Diseña un newsletter profesional para mantener tu comunidad activa, informada y fidelizada.

[PLANTILLA FUNNEL EDITABLE](https://systeme.io/dashboard/share?hash=5778001aae16635fdeba7d7ec0cb5e3e54d747e&type=funnel)

PLANTILLA FUNNEL EDITABLE: https://systeme.io/dashboard/share?hash=5778001aae16635fdeba7d7ec0cb5e3e54d747e&type=funnel | PLANTILLA FUNNEL EDITABLE: https://systeme.io/dashboard/share?hash=5778001aae16635fdeba7d7ec0cb5e3e54d747e&amp;type=funnel', 'kxvzgloirk1d4hxfrple', 15, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l00701600-0000-4000-8000-000000000000', 'm00700000-0000-4000-8000-000000000000', 'Automatizaciones y pruebas', 'Automatiza correos y procesos clave para ahorrar tiempo y hacer que tu sistema trabaje por ti.

[PLANTILLA FUNNEL EDITABLE](https://systeme.io/dashboard/share?hash=5778001aae16635fdeba7d7ec0cb5e3e54d747e&type=funnel)

PLANTILLA FUNNEL EDITABLE: https://systeme.io/dashboard/share?hash=5778001aae16635fdeba7d7ec0cb5e3e54d747e&type=funnel | PLANTILLA FUNNEL EDITABLE: https://systeme.io/dashboard/share?hash=5778001aae16635fdeba7d7ec0cb5e3e54d747e&amp;type=funnel', 'axdxrv4hl3kceybxopk8', 16, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l00701700-0000-4000-8000-000000000000', 'm00700000-0000-4000-8000-000000000000', 'Guía gratis + correo de marketing', 'Integra tu guía gratuita con correos de marketing que nutran, conecten y preparen para la venta.

[PLANTILLA FUNNEL EDITABLE](https://systeme.io/dashboard/share?hash=5778001aae16635fdeba7d7ec0cb5e3e54d747e&type=funnel)

 

[https://www.canva.com/design/DAGhzk4JiuM/uF-JQlLtsFTchwdxoED_Mw/view?utm_content=DAGhzk4JiuM&utm_campaign=designshare&utm_medium=link&utm_source=publishsharelink&mode=preview](https://www.canva.com/design/DAGhzk4JiuM/uF-JQlLtsFTchwdxoED_Mw/view?utm_content=DAGhzk4JiuM&utm_cam', 'rrtj0vujkcu6sl2jv35w', 17, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l00701800-0000-4000-8000-000000000000', 'm00700000-0000-4000-8000-000000000000', 'Correo después de la compra', 'Configura un correo postcompra que dé la bienvenida, genere confianza y mejore la experiencia del cliente.

[PLANTILLA FUNNEL EDITABLE](https://systeme.io/dashboard/share?hash=5778001aae16635fdeba7d7ec0cb5e3e54d747e&type=funnel)

PLANTILLA FUNNEL EDITABLE: https://systeme.io/dashboard/share?hash=5778001aae16635fdeba7d7ec0cb5e3e54d747e&type=funnel | PLANTILLA FUNNEL EDITABLE: https://systeme.io/dashboard/share?hash=5778001aae16635fdeba7d7ec0cb5e3e54d747e&amp;type=funnel', 'ymqb6xt4oovvnfflv7xm', 18, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l00701900-0000-4000-8000-000000000000', 'm00700000-0000-4000-8000-000000000000', 'Compra de prueba', 'Realiza una compra de prueba para verificar que todo tu sistema funcione sin errores ni fricciones.

[PLANTILLA FUNNEL EDITABLE](https://systeme.io/dashboard/share?hash=5778001aae16635fdeba7d7ec0cb5e3e54d747e&type=funnel)

PLANTILLA FUNNEL EDITABLE: https://systeme.io/dashboard/share?hash=5778001aae16635fdeba7d7ec0cb5e3e54d747e&type=funnel | PLANTILLA FUNNEL EDITABLE: https://systeme.io/dashboard/share?hash=5778001aae16635fdeba7d7ec0cb5e3e54d747e&amp;type=funnel', 'j4ly23nplpjclohiaro8', 19, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l00702000-0000-4000-8000-000000000000', 'm00700000-0000-4000-8000-000000000000', 'Klarna y Afterpay', 'Cómo agregar klarna y afterpay como opciones de pago en tu tunel de ventas de systeme.', 'wi1cofn2uo18a4juigua', 20, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l00800100-0000-4000-8000-000000000000', 'm00800000-0000-4000-8000-000000000000', 'Introducción a la IA', '', 'x81xkdw2w3re6fntl9hj', 1, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l00800200-0000-4000-8000-000000000000', 'm00800000-0000-4000-8000-000000000000', '¿Qué es la inteligencia artificial y por qué está revolucionando los negocios?', '', 'g3wgzxj2nmhlnoptby8o', 2, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l00800300-0000-4000-8000-000000000000', 'm00800000-0000-4000-8000-000000000000', 'Cómo la IA ya está en tu vida diaria (sin que lo sepas)', '', 'xezlxyla5ac6i2x1ygmp', 3, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l00800400-0000-4000-8000-000000000000', 'm00800000-0000-4000-8000-000000000000', 'ChatGPT como tu asistente profesional 24/7', '', 'r4ue22gav0qj9ppsphms', 4, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l00800500-0000-4000-8000-000000000000', 'm00800000-0000-4000-8000-000000000000', 'Cierre: Pon en práctica con inteligencia', 'Cierra el módulo consolidando lo aprendido, aplicando la IA de forma consciente en tu día a día. Descarga la guía práctica para llevarte herramientas accionables y seguir creando con intención.

**NO OLVIDES DESCARGAR EN EL BOT ÓN DE ARRIBA  (DOWNLOADS) EL PDF DE ESTA LECCIÓN.**', 'ktveq7jfaafkvjzoi10f', 5, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l00900100-0000-4000-8000-000000000000', 'm00900000-0000-4000-8000-000000000000', 'Busca tu producto', '', 'g8rgg5tps0tytyqd1jk2', 1, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l00900200-0000-4000-8000-000000000000', 'm00900000-0000-4000-8000-000000000000', 'Creación de anuncio', '', 'fmiv1vbt944tnd1obwbu', 2, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l00900300-0000-4000-8000-000000000000', 'm00900000-0000-4000-8000-000000000000', 'Tu anuncio listo', '', 'kgbnhqeuywme2efbcp4s', 3, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l00900400-0000-4000-8000-000000000000', 'm00900000-0000-4000-8000-000000000000', 'Efectos disruptivos', '', 'zrfcqzauqt4uacrbibtv', 4, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l00900500-0000-4000-8000-000000000000', 'm00900000-0000-4000-8000-000000000000', 'Efectos de audio que transmiten', '', 'ilsvlqbjkc1jotpq4bxt', 5, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l00900600-0000-4000-8000-000000000000', 'm00900000-0000-4000-8000-000000000000', 'Producción del anuncio animado parte 1', '', 'ffuqupvbthsjlb1thqlr', 6, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l00900700-0000-4000-8000-000000000000', 'm00900000-0000-4000-8000-000000000000', 'Producción del anuncio animado parte 2', '', 'of2qstlosoo6sqifi2ww', 7, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l00900800-0000-4000-8000-000000000000', 'm00900000-0000-4000-8000-000000000000', 'Crea anuncios con avatars en HeyGen', '', 'yooexmvx0dhdnypzixeg', 8, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l01000100-0000-4000-8000-000000000000', 'm01000000-0000-4000-8000-000000000000', 'Bienvenida', '', 'ahd3skodc2mlgml83bv4', 1, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l01000200-0000-4000-8000-000000000000', 'm01000000-0000-4000-8000-000000000000', 'Introducción a CapCut', 'Conoce CapCut y entiende por qué es una herramienta poderosa para crear contenido visual atractivo desde tu celular.', 'mr9s7kane64lgj5nibbr', 2, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l01000300-0000-4000-8000-000000000000', 'm01000000-0000-4000-8000-000000000000', 'Agregar y cortar clips', 'Aprende a cortar, organizar y combinar clips de forma simple para lograr una edición limpia y profesional.', 'qqh1ajlsti4be9gqjxqt', 3, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l01000400-0000-4000-8000-000000000000', 'm01000000-0000-4000-8000-000000000000', 'Subtítulos y textos que impactan', 'Descubre cómo añadir subtítulos y textos que captan la atención y refuerzan tu mensaje en cada video.', 'iabbq4jskj5q9e3m22js', 4, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l01000500-0000-4000-8000-000000000000', 'm01000000-0000-4000-8000-000000000000', 'Animaciones para dar vida a tu contenido', 'Explora las animaciones disponibles y aprende a usarlas para hacer tu contenido más dinámico y envolvente.', 'qz8iv6qvrmkvi1xtp7kl', 5, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l01000600-0000-4000-8000-000000000000', 'm01000000-0000-4000-8000-000000000000', 'Capas y superposiciones', 'Domina las capas y superposiciones para lograr efectos visuales más ricos, ordenados y con profundidad.', 'j2cafimy5olp78npy5uu', 6, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l01000700-0000-4000-8000-000000000000', 'm01000000-0000-4000-8000-000000000000', 'Reemplaza tu fondo', 'Reemplaza el fondo de tus videos con facilidad para crear escenas más limpias, creativas o profesionales.', 'edpu3i0htngd401t7rxj', 7, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l01000800-0000-4000-8000-000000000000', 'm01000000-0000-4000-8000-000000000000', 'Filtros y ajustes visuales', 'Aplica filtros y realiza ajustes visuales que mejoran el color, contraste y estilo general de tu contenido.', 'qbvl6ljbjxepblqamz50', 8, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l01000900-0000-4000-8000-000000000000', 'm01000000-0000-4000-8000-000000000000', 'Música, efectos de sonido y control de audio', 'Agrega música, efectos de sonido y ajusta el audio para lograr una experiencia sensorial más completa.', 'ljsduiwmj0yxsqgtbj9k', 9, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l01001000-0000-4000-8000-000000000000', 'm01000000-0000-4000-8000-000000000000', 'Videos de stock: cómo usarlos bien', 'Utiliza correctamente videos de stock y dale un uso estratégico sin perder autenticidad ni conexión.', 'kjkkzdoyrdpxulh96sih', 10, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l01001100-0000-4000-8000-000000000000', 'm01000000-0000-4000-8000-000000000000', 'Transiciones que suman (no marean)', 'Incorpora transiciones suaves que sumen fluidez a tus videos sin distraer o saturar a tu audiencia.', 'uaatunz5wz2wykwoemqa', 11, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l01001200-0000-4000-8000-000000000000', 'm01000000-0000-4000-8000-000000000000', 'Uso de máscara para efectos pro', 'Explora el uso de máscaras para crear efectos visuales avanzados que diferencian tu contenido con calidad.', 'b3qoga884gkhrkreckf5', 12, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l01100100-0000-4000-8000-000000000000', 'm01100000-0000-4000-8000-000000000000', 'BIENVENIDA', '[@angimarvalbuena  
](https://www.instagram.com/angimarvalbuena/)[@aprendeconangii](https://www.tiktok.com/@aprendeconangii?lang=es-419)

@angimarvalbuena  
: https://www.instagram.com/angimarvalbuena/ | @aprendeconangii: https://www.tiktok.com/@aprendeconangii?lang=es-419 | @angimarvalbuena: https://www.instagram.com/angimarvalbuena/', 'nnwwfjl0ris9dzyhowjx', 1, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l01100200-0000-4000-8000-000000000000', 'm01100000-0000-4000-8000-000000000000', 'MÓDULO 1', '[@angimarvalbuena](https://www.instagram.com/angimarvalbuena/)

@angimarvalbuena: https://www.instagram.com/angimarvalbuena/ | @angimarvalbuena: https://www.instagram.com/angimarvalbuena/', 'odkim2krl7da9nyfc2zl', 2, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l01100300-0000-4000-8000-000000000000', 'm01100000-0000-4000-8000-000000000000', 'MÓDULO 2', '', 'olj7csfsao9ize22nl1w', 3, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l01100400-0000-4000-8000-000000000000', 'm01100000-0000-4000-8000-000000000000', 'MÓDULO 3', '[@angimarvalbuena](https://www.instagram.com/angimarvalbuena/)

@angimarvalbuena: https://www.instagram.com/angimarvalbuena/ | @angimarvalbuena: https://www.instagram.com/angimarvalbuena/', 'f12w2nbeevixq3vrxb0o', 4, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l01100500-0000-4000-8000-000000000000', 'm01100000-0000-4000-8000-000000000000', 'MÓDULO 4', '', 'ayno8itpqmnajjofta0l', 5, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l01100600-0000-4000-8000-000000000000', 'm01100000-0000-4000-8000-000000000000', 'MÓDULO 5', '', 'lpw206rjk4mtc9ainltv', 6, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l01100700-0000-4000-8000-000000000000', 'm01100000-0000-4000-8000-000000000000', 'MÓDULO 6', '', 'ng3fhdgc4agvxqtvmdqh', 7, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l01100800-0000-4000-8000-000000000000', 'm01100000-0000-4000-8000-000000000000', 'MÓDULO 7', '', 'd9vqvyeulnewwgrqpors', 8, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l01100900-0000-4000-8000-000000000000', 'm01100000-0000-4000-8000-000000000000', 'MÓDULO 8', '', 'i6jv3kqh0zyuzs3klht6', 9, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l01101000-0000-4000-8000-000000000000', 'm01100000-0000-4000-8000-000000000000', 'MÓDULO 9', '', 'zdvykflpxybo2j7rnhh6', 10, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l01101100-0000-4000-8000-000000000000', 'm01100000-0000-4000-8000-000000000000', 'MÓDULO 10', '', 'z3jemfmbjlri65esf0c3', 11, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l01101200-0000-4000-8000-000000000000', 'm01100000-0000-4000-8000-000000000000', 'MÓDULO 11', '', 'yug3ekr3uldizynmdkhz', 12, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l01101300-0000-4000-8000-000000000000', 'm01100000-0000-4000-8000-000000000000', 'CIERRE', '', 'wdro3rdonxui3dj8yllz', 13, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l01200100-0000-4000-8000-000000000000', 'm01200000-0000-4000-8000-000000000000', 'Pimeros pasos en Canva', '', 'wvytdqebxgpnk13idtr7', 1, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l01200200-0000-4000-8000-000000000000', 'm01200000-0000-4000-8000-000000000000', 'Formatos digitales y plantillas', '', 'ujyl24xz4anpkd47bqra', 2, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l01200300-0000-4000-8000-000000000000', 'm01200000-0000-4000-8000-000000000000', 'Diseños que posicionan tu marca', '', 'pihed0dwuwt3wkin7abz', 3, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l01200400-0000-4000-8000-000000000000', 'm01200000-0000-4000-8000-000000000000', 'Diseña tu branding y exporta tus archivos', '', 'jauq3xsszqitbja0dwr5', 4, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l01300100-0000-4000-8000-000000000000', 'm01300000-0000-4000-8000-000000000000', 'Introducción', '', 'cy9ydtc6xb00fia34bvq', 1, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l01300200-0000-4000-8000-000000000000', 'm01300000-0000-4000-8000-000000000000', 'Tu mente no quiere que actues', 'Identifica los pensamientos limitantes que te mantienen estancada y aprende a neutralizarlos para recuperar el control de tu vida y decisiones.', 'shqqnhrlvktzb0m9hukp', 2, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l01300300-0000-4000-8000-000000000000', 'm01300000-0000-4000-8000-000000000000', 'La regla de los 5 segundos', 'Activa tu capacidad de visualizar, crear y sostener una mentalidad expansiva que te permita crecer sin miedo y romper tus propios límites.', 'zs8uenhmcpzht8orhw5t', 3, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l01300400-0000-4000-8000-000000000000', 'm01300000-0000-4000-8000-000000000000', 'Acción sin emoción', 'Rediseña tu identidad desde la consciencia, conectando con una versión más auténtica, segura y poderosa de ti misma.', 'vathpcf2juittjvqfahq', 4, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l01300500-0000-4000-8000-000000000000', 'm01300000-0000-4000-8000-000000000000', 'Qué tipo de mente tienes', '', 'pg0sl1gtor6h9iftqfzp', 5, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l01300600-0000-4000-8000-000000000000', 'm01300000-0000-4000-8000-000000000000', 'Reescribe tu relación con el error', '', 'h7a8dqbzxou3waioxxkb', 6, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l01300700-0000-4000-8000-000000000000', 'm01300000-0000-4000-8000-000000000000', 'Reemplaza la critica por curiosidad', '', 'xshhbkleqckabcf0n5zk', 7, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l01300800-0000-4000-8000-000000000000', 'm01300000-0000-4000-8000-000000000000', '¿Quién te dijeron que eres?', '', 'kp4patdxhmznjt2wfvtw', 8, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l01300900-0000-4000-8000-000000000000', 'm01300000-0000-4000-8000-000000000000', 'El duelo de tu vieja versión', '', 'hbmblts2zxzy7qvuaxb1', 9, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l01301000-0000-4000-8000-000000000000', 'm01300000-0000-4000-8000-000000000000', 'Elige tu nueva identidad con intención', '', 'x4vojud6puxawlmtu3jp', 10, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l01400100-0000-4000-8000-000000000000', 'm01400000-0000-4000-8000-000000000000', 'Torre de control: El poder de tener una semana estructurada', 'Descubre cómo una semana bien estructurada puede darte más libertad, claridad y resultados sostenibles.', '', 1, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l01400200-0000-4000-8000-000000000000', 'm01400000-0000-4000-8000-000000000000', 'Ritual de despegue: Crea tu rutina semanal de enfoque', 'Crea un ritual simple pero poderoso para iniciar tu semana con intención y enfoque absoluto.', '', 2, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l01400300-0000-4000-8000-000000000000', 'm01400000-0000-4000-8000-000000000000', 'Plan de vuelo digital: Cómo usar Notion como copiloto', 'Aprende a usar Notion como tu copiloto digital para organizar tareas, metas y prioridades de forma práctica.', '', 3, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l01400400-0000-4000-8000-000000000000', 'm01400000-0000-4000-8000-000000000000', 'Estructura = Libertad: La raíz real de la disciplina', 'Entiende por qué la verdadera disciplina no te limita, sino que te permite vivir con más intención y propósito.', '', 4, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l01400500-0000-4000-8000-000000000000', 'm01400000-0000-4000-8000-000000000000', 'Prioridad de abordaje: Método de 3 prioridades al día', 'Aplica un método efectivo para enfocarte en lo más importante cada día sin abrumarte ni dispersarte.', '', 5, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l01400600-0000-4000-8000-000000000000', 'm01400000-0000-4000-8000-000000000000', 'Simulador de realidad: Diseña tu semana ideal vs. tu realidad actual', 'Contrasta tu semana ideal con tu realidad actual y ajusta tus hábitos para acercarte cada vez más a tu visión.', '', 6, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l01500100-0000-4000-8000-000000000000', 'm01500000-0000-4000-8000-000000000000', 'Imagen estrátegica para vender sin hablar', '**NO OLVIDES DESCARGAR EN EL BOT ÓN DE ARRIBA  (DOWNLOADS) EL PDF DE ESTA LECCIÓN.**', 'bo0obxrtwayhbjjrkcnw', 1, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l01500200-0000-4000-8000-000000000000', 'm01500000-0000-4000-8000-000000000000', 'Lenguaje visual de marca', '', 'pkfm5nch5mrm4nq6z7lo', 2, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l01500300-0000-4000-8000-000000000000', 'm01500000-0000-4000-8000-000000000000', 'Pista de skincare', '', 'cfh9xpwkwjguawbetepj', 3, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l01500400-0000-4000-8000-000000000000', 'm01500000-0000-4000-8000-000000000000', 'Hangar de maquillaje para redes sociales', '**NO OLVIDES DESCARGAR EN EL BOT ÓN DE ARRIBA  (DOWNLOADS) EL PDF DE ESTA LECCIÓN.**', 'fhearwg5ggujovk5rg33', 4, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l01500500-0000-4000-8000-000000000000', 'm01500000-0000-4000-8000-000000000000', 'Torre de cuidado facial', '**NO OLVIDES DESCARGAR EN EL BOT ÓN DE ARRIBA  (DOWNLOADS) EL PDF DE ESTA LECCIÓN.**', 'x5325y60nreqxfmisqqa', 5, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l01600100-0000-4000-8000-000000000000', 'm01600000-0000-4000-8000-000000000000', 'Qué es una marca personal y por qué necesitas una', 'Descubre qué es realmente una marca personal, cómo te posiciona en el mundo digital y por qué construirla hoy es clave para abrir nuevas oportunidades profesionales y personales.', 'w8v1cylfu23imlkkpunp', 1, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l01600200-0000-4000-8000-000000000000', 'm01600000-0000-4000-8000-000000000000', 'Identidad y propósito de tu marca', 'Conecta con tu historia, tus valores y tu propósito para crear una marca que tenga dirección, coherencia y un mensaje claro que inspire y atraiga.', 'cjcmdelhtosvmwlm7jlc', 2, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l01600300-0000-4000-8000-000000000000', 'm01600000-0000-4000-8000-000000000000', 'Posicionamiento claro y memorable', 'Aprende a destacar sin necesidad de gritar, generando un posicionamiento auténtico que te haga inolvidable por lo que representas, no por lo que aparentas.', 'txzqdpi3up5jtod6zngw', 3, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l01600400-0000-4000-8000-000000000000', 'm01600000-0000-4000-8000-000000000000', 'Elementos visuales y energéticos de tu marca', 'Diseña una identidad visual coherente con tu esencia: logo, paleta de colores, estilo gráfico y estética que hablen de ti incluso antes de que digas una palabra.', 'y3lgy9qt89p15esnpgmd', 4, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l01600500-0000-4000-8000-000000000000', 'm01600000-0000-4000-8000-000000000000', 'Construcción de confianza con tu comunidad', 'Desarrolla relaciones genuinas con tu comunidad construyendo confianza desde la empatía, la transparencia y una comunicación sin esfuerzo ni presiones.', 'mxozonmrukvjyn9t1plu', 5, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l01600600-0000-4000-8000-000000000000', 'm01600000-0000-4000-8000-000000000000', 'Despegue Magnético: Vende con tu Marca', 'Convierte tu marca en tu mejor vendedora. Aprende a transmitir valor y generar ventas sin técnicas agresivas, solo desde tu autenticidad y presencia.', 'vcgnny7tzjdwvd4iljis', 6, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l01600700-0000-4000-8000-000000000000', 'm01600000-0000-4000-8000-000000000000', 'Hangar de Errores Fatales de Marca', 'Identifica los errores más comunes que debilitan tu marca, disminuyen tu autoridad y frenan tu crecimiento, para evitarlos y mantener una presencia fuerte y coherente.', 'mczdrezvokqqcavjpbfj', 7, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l01600800-0000-4000-8000-000000000000', 'm01600000-0000-4000-8000-000000000000', 'Encuentra tu nicho sin perder tu esencia', '**NO OLVIDES DESCARGAR EN EL BOT ÓN DE ARRIBA  (DOWNLOADS) EL PDF DE ESTA LECCIÓN.**', 'zdulapbywd7rhtvghqvc', 8, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l01600900-0000-4000-8000-000000000000', 'm01600000-0000-4000-8000-000000000000', 'Organiza tu contenido semanal', '', 'ai6thfz9y7j2gznaoqnt', 9, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l01601000-0000-4000-8000-000000000000', 'm01600000-0000-4000-8000-000000000000', 'Cómo hablar en cámara con confianza', '', 'tsyscofkkwckc7pj6m1z', 10, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l01601100-0000-4000-8000-000000000000', 'm01600000-0000-4000-8000-000000000000', 'De seguidores a comunidad', '', 'pgfq0kqye9dxhrwcnr1q', 11, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l01700100-0000-4000-8000-000000000000', 'm01700000-0000-4000-8000-000000000000', 'Dia 1: Full body + cardio', '', 'qmpwz0j6fhe4mt4s7dkn', 1, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l01700200-0000-4000-8000-000000000000', 'm01700000-0000-4000-8000-000000000000', 'Dia 2: Gluteos y  piernas', '', 'bhk5asoxyodpeg9myrpx', 2, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l01700300-0000-4000-8000-000000000000', 'm01700000-0000-4000-8000-000000000000', 'Dia 3: Core + cardio HIT', '', 'tb11k8q5hmp6gxehqvb5', 3, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l01700400-0000-4000-8000-000000000000', 'm01700000-0000-4000-8000-000000000000', 'Dia 4: Upper Body', '', 'lnottu2kxgc1wh4ivsgs', 4, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l01700500-0000-4000-8000-000000000000', 'm01700000-0000-4000-8000-000000000000', 'Dia 5: Booty + Core', '', 'ecgjzohmnff8sijxutv1', 5, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l01800100-0000-4000-8000-000000000000', 'm01800000-0000-4000-8000-000000000000', '¿Qué es realmente el algoritmo y cómo se activa?', '', 'mx3uxzszcazqvmdy9gtt', 1, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l01800200-0000-4000-8000-000000000000', 'm01800000-0000-4000-8000-000000000000', '¿Seguidor o cliente?', '', 'shle0ak7iamksbfsfuac', 2, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l01800300-0000-4000-8000-000000000000', 'm01800000-0000-4000-8000-000000000000', 'Mínimo necesario para alcanzar la viralidad', '', 'sx7frft0gjv6sextr8vp', 3, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l01800400-0000-4000-8000-000000000000', 'm01800000-0000-4000-8000-000000000000', 'Filtro 5/50', '', 'tutf1wncvugflt4pybgh', 4, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l01800500-0000-4000-8000-000000000000', 'm01800000-0000-4000-8000-000000000000', 'Explicando nicho SSDD', 'DESGARGA AQUÍ LA EXPLICACIÓN DE NICHOS SSDD', 'avdcdvdc6gphqli2ocvz', 5, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l01900100-0000-4000-8000-000000000000', 'm01900000-0000-4000-8000-000000000000', 'Ejercicios para Bajar de Peso y Tonificar Rápido en Casa', 'Activa tu cuerpo desde casa con rutinas simples y efectivas que aumentan tu energía, mejoran tu salud y fortalecen tu disciplina diaria.', 'orw5exk4r8r26ebunecq', 1, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l01900200-0000-4000-8000-000000000000', 'm01900000-0000-4000-8000-000000000000', 'Rutina para aumentar y tener unos glúteos grandes y bonitos', '', 'ceni3aswyozo3amauhkh', 2, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l01900300-0000-4000-8000-000000000000', 'm01900000-0000-4000-8000-000000000000', 'Ejercicios para TONIFICAR BRAZOS sin peso', '', 'bmydvhick3fgq01yfiy7', 3, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l01900400-0000-4000-8000-000000000000', 'm01900000-0000-4000-8000-000000000000', 'Rutina de espalda', '', 'okh643qxmgupkkrscbdx', 4, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l01900500-0000-4000-8000-000000000000', 'm01900000-0000-4000-8000-000000000000', 'Eliminar el vientre bajo abultado', '', 'suztza9hea1fkweigrko', 5, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l01900600-0000-4000-8000-000000000000', 'm01900000-0000-4000-8000-000000000000', 'Full body cardio rutina completa', '', 'wrgeelxtun0ibd2kpr1y', 6, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l02000100-0000-4000-8000-000000000000', 'm02000000-0000-4000-8000-000000000000', 'Mentalidad de Vendedora', 'Activa tu mentalidad de vendedora desde la seguridad, el merecimiento y la confianza en el valor que ofreces, dejando atrás miedos y creencias limitantes.

**NO OLVIDES DESCARGAR EN EL BOT ÓN DE ARRIBA  (DOWNLOADS) EL PDF DE ESTA LECCIÓN.**', 'jbhtroux2je9hqyfg862', 1, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l02000200-0000-4000-8000-000000000000', 'm02000000-0000-4000-8000-000000000000', 'Posiciónate para que te Compren', 'Aprende a posicionarte estratégicamente para que tus clientes ideales te elijan sin que tengas que perseguirlos o convencerlos a la fuerza.', 'qqdfqunnoxveffvqghuj', 2, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l02000300-0000-4000-8000-000000000000', 'm02000000-0000-4000-8000-000000000000', 'Vende sin Vender en Primera Clase', 'Descubre cómo vender desde el valor, la conexión y la intención real de ayudar, sin presión ni discursos forzados: vender sin vender es posible.

**NO OLVIDES DESCARGAR EN EL BOT ÓN DE ARRIBA  (DOWNLOADS) EL PDF DE ESTA LECCIÓN.**', 'xcdyz4h8exdboupbah6o', 3, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l02000400-0000-4000-8000-000000000000', 'm02000000-0000-4000-8000-000000000000', 'Torre de Control Mental', 'Fortalece tu enfoque mental para mantenerte firme en tu energía, claridad y propósito durante todo el proceso de ventas.

**NO OLVIDES DESCARGAR EN EL BOT ÓN DE ARRIBA  (DOWNLOADS) EL PDF DE ESTA LECCIÓN.**', 'ztasjyz2cprmm9f8mljt', 4, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l02000500-0000-4000-8000-000000000000', 'm02000000-0000-4000-8000-000000000000', 'Cierre con Propósito', 'Aprende a cerrar con intención y empatía, guiando a tus potenciales clientes desde la claridad hacia una decisión alineada y sin dudas.

**NO OLVIDES DESCARGAR EN EL BOT ÓN DE ARRIBA  (DOWNLOADS) EL PDF DE ESTA LECCIÓN.**', 'lnvwju1s0dlhhq023wsm', 5, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l02000600-0000-4000-8000-000000000000', 'm02000000-0000-4000-8000-000000000000', 'Seducción de Marca', 'Usa los elementos más poderosos de tu marca para despertar deseo, atracción y conexión genuina con quienes más te necesitan.', 'uins0wicv2btfu5zixw6', 6, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l02000700-0000-4000-8000-000000000000', 'm02000000-0000-4000-8000-000000000000', 'Vende desde historias', '**NO OLVIDES DESCARGAR EN EL BOT ÓN DE ARRIBA  (DOWNLOADS) EL PDF DE ESTA LECCIÓN.**', 'bfkfi4ihy9bey53nc4ki', 7, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l02000800-0000-4000-8000-000000000000', 'm02000000-0000-4000-8000-000000000000', 'La Ruta del Cliente', '', 'nuocei26lb6842dyj1eg', 8, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l02100100-0000-4000-8000-000000000000', 'm02100000-0000-4000-8000-000000000000', 'Bienvenida al módulo', '', 's3fizwmrnhtpwkejfzea', 1, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l02100200-0000-4000-8000-000000000000', 'm02100000-0000-4000-8000-000000000000', 'Lectura Invisible', 'Aprende a leer lo que tu cliente no dice con palabras: interpreta sus gestos, dudas y emociones para guiar la conversación con precisión.', 'x0jw2gyao5gaiqmdpntk', 2, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l02100300-0000-4000-8000-000000000000', 'm02100000-0000-4000-8000-000000000000', 'Diseño de Ofertas Irresistibles', 'Crea ofertas tan bien diseñadas que tus clientes sientan que están perdiendo si no compran. Aprende a sumar valor sin saturar.', 'mjumgyxuverrtfdzhaxr', 3, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l02100400-0000-4000-8000-000000000000', 'm02100000-0000-4000-8000-000000000000', 'Precio con Poder', 'Establece precios con seguridad, entendiendo el valor real de lo que ofreces y cómo comunicarlo con firmeza y sin miedo.', 'vrkv8lzbet4e0mvvyfck', 4, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l02100500-0000-4000-8000-000000000000', 'm02100000-0000-4000-8000-000000000000', 'Cierre Psicológico', 'Aplica técnicas de cierre basadas en psicología del comportamiento para llevar a tus prospectos a decidir con confianza y sin presiones.

**NO OLVIDES DESCARGAR EN EL BOT ÓN DE ARRIBA  (DOWNLOADS) EL PDF DE ESTA LECCIÓN.**', 'engxtnjgjn6wwora7cn6', 5, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l02100600-0000-4000-8000-000000000000', 'm02100000-0000-4000-8000-000000000000', 'Escalera de Valor', 'Construye una escalera de valor que te permita vender más de un producto, creando una experiencia completa para tu cliente.', 'huamh3ug1lkazxxgfbtv', 6, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l02100700-0000-4000-8000-000000000000', 'm02100000-0000-4000-8000-000000000000', 'Venta Indirecta con Prueba Social', 'Descubre cómo usar testimonios, resultados y validación externa para influir sutilmente sin necesidad de vender de forma directa.', 'rpoywu8fud1hoj8qirld', 7, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l02100800-0000-4000-8000-000000000000', 'm02100000-0000-4000-8000-000000000000', 'Tu Energía es tu Precio', 'Comprende cómo tu energía, confianza y presencia impactan en la percepción de valor de tu producto… y en el precio que tus clientes están dispuestos a pagar.', 'uitmhuoe13xy2funpnfk', 8, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l02100900-0000-4000-8000-000000000000', 'm02100000-0000-4000-8000-000000000000', 'Domina las Objeciones', 'Conviértete en una maestra en manejar objeciones: transfórmalas en oportunidades para generar más conexión y seguridad en la compra.

**NO OLVIDES DESCARGAR EN EL BOT ÓN DE ARRIBA  (DOWNLOADS) EL PDF DE ESTA LECCIÓN.**', 'baothy25opb2r3hnnolh', 9, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l02101000-0000-4000-8000-000000000000', 'm02100000-0000-4000-8000-000000000000', 'Cierre de módulo', '', 'ncj40ezv2rcofliyas3c', 10, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l02200100-0000-4000-8000-000000000000', 'm02200000-0000-4000-8000-000000000000', 'Torre del poder silencioso', '', 'sbbsoafpd2t2gxewywte', 1, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l02200200-0000-4000-8000-000000000000', 'm02200000-0000-4000-8000-000000000000', 'Tu cuerpo también vende', '', 'yqcmycpgdhi7wtcph8zd', 2, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l02200300-0000-4000-8000-000000000000', 'm02200000-0000-4000-8000-000000000000', 'Energía de liderazgo', '', 'yw2yuoopgraj87sftboj', 3, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l02200400-0000-4000-8000-000000000000', 'm02200000-0000-4000-8000-000000000000', 'Presencia digital', '', 'zup7wirdul5vkrhbfwcx', 4, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l02200500-0000-4000-8000-000000000000', 'm02200000-0000-4000-8000-000000000000', 'Cierres con dignidad', '', 'kq7ku1c03hcu6lt3uxcn', 5, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l02200600-0000-4000-8000-000000000000', 'm02200000-0000-4000-8000-000000000000', 'Reprogramación de autoridad interna', '', 'wclhu3ewbt0sphgsfjow', 6, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l02200700-0000-4000-8000-000000000000', 'm02200000-0000-4000-8000-000000000000', 'Cabina de cierre interno', '', 'tfii9zrrrocheforkltd', 7, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l02200800-0000-4000-8000-000000000000', 'm02200000-0000-4000-8000-000000000000', 'Torre de precio invisible', '', 'lgfv5jzj9tfuo3ouo9ke', 8, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l02300100-0000-4000-8000-000000000000', 'm02300000-0000-4000-8000-000000000000', 'La base para empezar', '• NUEVO Portafolio Comercial.   
• Configuraciones básicas.   
• Fundamentos Meta Ads.   
• IA en Meta Ads, NUEVAS funcionalidades.', 'hzggncnrzpytdb1rqseq', 1, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l02300200-0000-4000-8000-000000000000', 'm02300000-0000-4000-8000-000000000000', 'Configuremos tu primera campaña', '• Primeros pasos, todo lo que se debe saber (estrategias y tips).   
• Configuración de campaña para principiantes.   
• Estrategias con IA para optimizar tiempos.   
• IA para generar contenidos en Meta.', 'wffoosvysw5uipyifben', 2, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l02300300-0000-4000-8000-000000000000', 'm02300000-0000-4000-8000-000000000000', 'Midamos los resultados y optimicemos', '• Optimización de presupuesto para asegurar resultados.   
• Métricas de las campañas básicas y PRO.', 'arydc2myedbykel9tdsq', 3, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l02400100-0000-4000-8000-000000000000', 'm02400000-0000-4000-8000-000000000000', 'Introducción a ManyChat', 'Conoce qué es ManyChat, para qué sirve y cómo puede ayudarte a automatizar conversaciones que generan ventas mientras duermes.', 'scatne4kqwoswvmsl9vu', 1, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l02400200-0000-4000-8000-000000000000', 'm02400000-0000-4000-8000-000000000000', 'Cómo crear una página en Facebook', 'Aprende a crear correctamente una página de Facebook profesional, el primer paso esencial para integrar tu cuenta con ManyChat.', 'sudpgbrpl5fnsvokeu5r', 2, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l02400300-0000-4000-8000-000000000000', 'm02400000-0000-4000-8000-000000000000', 'Cómo crear una cuenta en ManyChat', 'Sigue el paso a paso para abrir tu cuenta en ManyChat y comenzar a construir tu sistema de automatización desde cero.', 'gthdsvblnkqhnl6svksa', 3, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l02400400-0000-4000-8000-000000000000', 'm02400000-0000-4000-8000-000000000000', 'Cómo conectar Instagram con ManyChat', 'Conecta tu cuenta de Instagram a ManyChat para automatizar respuestas, captar leads y generar conversaciones sin esfuerzo.', 'ofyyygvfatjwrddoa1cz', 4, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l02400500-0000-4000-8000-000000000000', 'm02400000-0000-4000-8000-000000000000', 'Cómo crear una automatización desde cero', 'Diseña tu primera automatización personalizada y convierte cada mensaje en una oportunidad de atención, conexión y cierre de ventas.', 'dlikabt54vs4gyqcuyol', 5, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l02400600-0000-4000-8000-000000000000', 'm02400000-0000-4000-8000-000000000000', 'Plantillas en ManyChat', 'Explora las plantillas prediseñadas que puedes adaptar fácilmente a tu negocio y ahorrar tiempo en la creación de flujos conversacionales.', 'btpv27nbkawuwxofd8un', 6, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l02400700-0000-4000-8000-000000000000', 'm02400000-0000-4000-8000-000000000000', 'Planes de pago', 'Conoce los diferentes planes que ofrece ManyChat, sus beneficios, limitaciones y cuál es el más adecuado para ti según tu etapa de negocio.', 'ctmqh74tmhhvzlyeer1x', 7, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l02500100-0000-4000-8000-000000000000', 'm02500000-0000-4000-8000-000000000000', 'Torre de Control del Community Manager', '¿Qué hace un Community Manager y cómo ser el mejor?', 'cv9tzfrgrjxtnbvlj9iy', 1, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l02500200-0000-4000-8000-000000000000', 'm02500000-0000-4000-8000-000000000000', 'Mapa de Tipos de Community Manager', 'Conoce los diferentes perfiles y elige cuál te representa', 'oorjqhtftghszs4unehd', 2, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l02500300-0000-4000-8000-000000000000', 'm02500000-0000-4000-8000-000000000000', 'Hangar de Crecimiento de Marca', 'Cómo hacer crecer una marca real desde redes sociales', 'u7w8ffjva9rcbllu1jrn', 3, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l02500400-0000-4000-8000-000000000000', 'm02500000-0000-4000-8000-000000000000', 'Radar de Posicionamiento de Marca', 'Acciones clave para destacar y posicionar como CM', 'totfyvmcj4girikdjr28', 4, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l02500500-0000-4000-8000-000000000000', 'm02500000-0000-4000-8000-000000000000', 'Soft Skills en Altitud', 'Habilidades blandas que te diferencian y multiplican tu valor', 'lknvnubs1l24j5npiyf1', 5, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l02500600-0000-4000-8000-000000000000', 'm02500000-0000-4000-8000-000000000000', 'Zona de Turbulencias: Errores Comunes del Community Manager', 'Lo que NO debes hacer si quieres mantener a tus clientes', 'yx6ir3b9nwmy5vi6zciy', 6, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l02500700-0000-4000-8000-000000000000', 'm02500000-0000-4000-8000-000000000000', 'Panel de Indicadores de Éxito (KPIs)', 'Qué debes medir para demostrar resultados reales', 'o7dmyxuqpt3ekcalup3z', 7, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l02500800-0000-4000-8000-000000000000', 'm02500000-0000-4000-8000-000000000000', 'Herramientas de Vuelo para un Community Manager Pro', 'Plataformas y apps que debes dominar para destacar', 'mtxeostznue8itrhvqgm', 8, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l02500900-0000-4000-8000-000000000000', 'm02500000-0000-4000-8000-000000000000', 'Tarifas de Vuelo: ¿Cuánto cobra un Community Manager?', 'Guía clara para ponerle precio justo y profesional a tu trabajo', 'cnrdhcncnswrsr4i5zqr', 9, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l02501000-0000-4000-8000-000000000000', 'm02500000-0000-4000-8000-000000000000', 'Zona de Aterrizaje de Clientes', 'Estrategias efectivas para conseguir clientes como CM', 'wfazn0i0t3w8ttb2xosy', 10, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l02501100-0000-4000-8000-000000000000', 'm02500000-0000-4000-8000-000000000000', 'Puerta de Presentación de Servicios', '', 'jvt4d8xabmzbxnqxgfih', 11, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l02600100-0000-4000-8000-000000000000', 'm02600000-0000-4000-8000-000000000000', 'Puerta de Embarque: Tu primer producto digital', '¿Por qué necesitas uno y qué vas a lograr con él?', 'hrvds0unflyzus4pcbnp', 1, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l02600200-0000-4000-8000-000000000000', 'm02600000-0000-4000-8000-000000000000', 'Visión Estratégica: Tu producto debe transformar algo', 'Define con claridad el problema que resuelve y el resultado que entrega', 'zzfqoik21mcnsuorxo7t', 2, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l02600300-0000-4000-8000-000000000000', 'm02600000-0000-4000-8000-000000000000', 'Elección de Formato: Crea algo que sí puedas sostener', 'PDF, clase grabada, curso, reto, guía, kit… según tu nivel y estilo.', 'p7xadjn0x4vp31ijlzt4', 3, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l02600400-0000-4000-8000-000000000000', 'm02600000-0000-4000-8000-000000000000', 'Organiza tu Producto como una Pro', 'Pasos, estructura interna, bloques de contenido y experiencia para el alumno.', 'smoi5ch0x3ogx4x4quhv', 4, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l02600500-0000-4000-8000-000000000000', 'm02600000-0000-4000-8000-000000000000', 'Cabina de Creación: Manos a la obra', 'Diseña, redacta y da forma al contenido real del producto.

**NO OLVIDES DESCARGAR EN EL BOT ÓN DE ARRIBA  (DOWNLOADS) EL PDF DE ESTA LECCIÓN.**', 'xc4ulmbcrpy85dhlxqlw', 5, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l02600600-0000-4000-8000-000000000000', 'm02600000-0000-4000-8000-000000000000', 'Activa tu Sistema de Ventas', 'Herramientas, pasarelas, páginas y automatización mínima viable', 'vscfy3cjsndwgeyf0mhs', 6, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l02600700-0000-4000-8000-000000000000', 'm02600000-0000-4000-8000-000000000000', 'Lanza y Vende con Seguridad', 'Cómo mostrar tu producto, hablar de él y activar ventas sin presión', 'lzwhvatpomk0khn9chyc', 7, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l02600800-0000-4000-8000-000000000000', 'm02600000-0000-4000-8000-000000000000', 'Validación Previa: No crees a ciegas', 'Cómo testear la idea antes de invertir horas creando', 'cyta1olfsydr3zwsdkbj', 8, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l02700100-0000-4000-8000-000000000000', 'm02700000-0000-4000-8000-000000000000', 'Zona de Embarque Digital', 'Por qué tu lista de correos vale más que tus seguidores y cómo construirla con intención.', 'ujkvmvhqoyfkqksqoref', 1, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l02700200-0000-4000-8000-000000000000', 'm02700000-0000-4000-8000-000000000000', 'Pasaporte de Atracción', 'Cómo crear un lead magnet irresistible para atraer a personas listas para comprar.', 'isfxsxiz0m1vuxgicyda', 2, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l02700300-0000-4000-8000-000000000000', 'm02700000-0000-4000-8000-000000000000', 'Ruta de Vuelo Emocional', 'La secuencia de 5 correos que conecta, posiciona y cierra sin presionar.', 'jjounbsnoqs4uaiff7eq', 3, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l02700400-0000-4000-8000-000000000000', 'm02700000-0000-4000-8000-000000000000', 'Cabina de Persuasión Escrita', 'Cómo escribir correos con estructura psicológica que convierten en ventas.', 'mgakkzoqvryomrfsjpta', 4, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l02700500-0000-4000-8000-000000000000', 'm02700000-0000-4000-8000-000000000000', 'Turbulencias del Correo Mal Enviado', 'Errores comunes que bloquean tus resultados antes de que se abran tus emails.', 'd3yavdyuo3a0bi059opu', 5, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l02700600-0000-4000-8000-000000000000', 'm02700000-0000-4000-8000-000000000000', 'Modo Piloto Automatizado', 'Cómo dejar tu sistema de correos funcionando solo, pero sintiéndose cercano.', 'kjkhh1vatgpjkkkedsdb', 6, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l02700700-0000-4000-8000-000000000000', 'm02700000-0000-4000-8000-000000000000', 'Panel de Monitoreo Comercial', 'Mide, ajusta y optimiza: tasa de apertura, clics y conversiones sin complicarte.', 'kj2h0hrfzzppkbuqy1xh', 7, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l02700800-0000-4000-8000-000000000000', 'm02700000-0000-4000-8000-000000000000', 'Fin de módulo', '**NO OLVIDES DESCARGAR EN EL BOT ÓN DE ARRIBA  (DOWNLOADS) EL PDF DE ESTA LECCIÓN.**', 'wb1c3ofpqbwqxovxkccr', 8, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l02800100-0000-4000-8000-000000000000', 'm02800000-0000-4000-8000-000000000000', '4 pasos para crear un guión', '', 'rf0snf9y3q2fird7ypbk', 1, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l02800200-0000-4000-8000-000000000000', 'm02800000-0000-4000-8000-000000000000', 'Los ganchos y tipos de ganchos', '', 'czuf6lbshftzaxabjwld', 2, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l02800300-0000-4000-8000-000000000000', 'm02800000-0000-4000-8000-000000000000', 'Cómo crear la historia que conecta y retiene', '', 'mpljwqanzw5dywrouvfq', 3, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l02800400-0000-4000-8000-000000000000', 'm02800000-0000-4000-8000-000000000000', 'Cómo crear una moraleja que venda y posicione', '', 'fgsabd3gm50fy55jmt9b', 4, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l02800500-0000-4000-8000-000000000000', 'm02800000-0000-4000-8000-000000000000', 'Cómo crear un llamado a la acción', '', 'ikzusspn61qfrxiimbbf', 5, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l02900100-0000-4000-8000-000000000000', 'm02900000-0000-4000-8000-000000000000', 'Dia 1: Glutens y femorales', '', 'uefjvm1ocftxvh2rvack', 1, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l02900200-0000-4000-8000-000000000000', 'm02900000-0000-4000-8000-000000000000', 'Dia 2: Tren superior y abdominales', '', 'a2jqdfrvbmxuapm6e6ex', 2, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l02900300-0000-4000-8000-000000000000', 'm02900000-0000-4000-8000-000000000000', 'Dia 3: Core + Cardio HIT', '', 'qbr1touyevkqgmixwi64', 3, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l02900400-0000-4000-8000-000000000000', 'm02900000-0000-4000-8000-000000000000', 'Dia 4: Tren superior + abdominales', '', 'xrbeyc3soaosal4d4aru', 4, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l02900500-0000-4000-8000-000000000000', 'm02900000-0000-4000-8000-000000000000', 'Dia 5: Gluteos', '', 'quwf4ynq7kskhzqqecl3', 5, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l03000100-0000-4000-8000-000000000000', 'm03000000-0000-4000-8000-000000000000', 'Tu historia es tu sistema', 'Convierte tu historia personal en el sistema que inspira, conecta y guía a otros, mostrando que tu experiencia es parte del camino al éxito.', 'cos6lcrbfrtr30blyje8', 1, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l03000200-0000-4000-8000-000000000000', 'm03000000-0000-4000-8000-000000000000', 'Tu marca es tu filtro', 'Aprende a usar tu marca personal como filtro para atraer a las personas correctas y alejar a quienes no están alineados con tu visión.', 'o95gdvxxfevzvjjdzaz3', 2, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l03000300-0000-4000-8000-000000000000', 'm03000000-0000-4000-8000-000000000000', 'Invita con postura, no con presión', 'Invita desde la claridad y la convicción, sin perseguir ni convencer, demostrando que el verdadero liderazgo se ejerce con postura, no con presión.', 'mmavmuxoexopc10plolu', 3, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l03000400-0000-4000-8000-000000000000', 'm03000000-0000-4000-8000-000000000000', 'No expliques. Posiciónate.', 'Deja de explicar lo que haces y empieza a mostrar con tu presencia, acciones y resultados el impacto que tiene formar parte de tu red.', 'fqrlcsb34u7xk9faz6kr', 4, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l03000500-0000-4000-8000-000000000000', 'm03000000-0000-4000-8000-000000000000', 'Sostén lo que inspiras', 'Sé coherente con el mensaje que transmites y aprende a sostener, en la práctica, la inspiración que provocas en los demás.', 'zqsk00kjj8aw4wt2o7iv', 5, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l03000600-0000-4000-8000-000000000000', 'm03000000-0000-4000-8000-000000000000', 'Duplica sin que te desgastes', 'Crea sistemas simples, replicables y sostenibles que te permitan duplicarte en tu equipo sin agotarte ni perder la calidad del acompañamiento.', 'sfpsqnlpnd45djg9qemw', 6, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l03000700-0000-4000-8000-000000000000', 'm03000000-0000-4000-8000-000000000000', 'Energía de líder, no de gerente estresada', 'Activa tu energía de liderazgo auténtico, dejando atrás el control excesivo y conectando desde la visión, no desde la exigencia.', 'gbfwd26kigumte5olnli', 7, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l03000800-0000-4000-8000-000000000000', 'm03000000-0000-4000-8000-000000000000', 'Red con cultura, no con caos', 'Construye una red sólida con cultura, valores y dirección, donde las personas se desarrollen en comunidad y no en desorden.', 'ykfk3y9k8r0qyylctu2l', 8, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l03000900-0000-4000-8000-000000000000', 'm03000000-0000-4000-8000-000000000000', 'No reclutas. Proyectas.', 'Deja de reclutar desde la necesidad y comienza a proyectar resultados, claridad y propósito para que las personas te busquen por lo que representas.', 'rq6r8fmn3wagcw5wfqtn', 9, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l03100100-0000-4000-8000-000000000000', 'm03100000-0000-4000-8000-000000000000', 'Introducción', '', 'vlxaha0thkzkldf05lkt', 1, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l03100200-0000-4000-8000-000000000000', 'm03100000-0000-4000-8000-000000000000', 'La base en la teoria', '', 'g1uuody2bvxirsfhnvdp', 2, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l03100300-0000-4000-8000-000000000000', 'm03100000-0000-4000-8000-000000000000', 'La respiración como un todo', '', 'gfuwmpidftpqgzdbvxxx', 3, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l03100400-0000-4000-8000-000000000000', 'm03100000-0000-4000-8000-000000000000', 'Articular como arte', '', 'zuflcamavxliiirpajak', 4, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l03100500-0000-4000-8000-000000000000', 'm03100000-0000-4000-8000-000000000000', 'La estructura del poder', '', 'g1mzrmg1640gip4y2usp', 5, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l03100600-0000-4000-8000-000000000000', 'm03100000-0000-4000-8000-000000000000', 'Dejar huella con tu voz', '', 'uy7smtuehgljgzozd7ch', 6, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l03200100-0000-4000-8000-000000000000', 'm03200000-0000-4000-8000-000000000000', 'Tu perfil no es un CV. Es tu vitrina de poder.', 'Descubre cómo convertir tu perfil en una carta de presentación poderosa que transmita autoridad, confianza y valor desde el primer vistazo.', 'qc2silqrgbua28lh31m7', 1, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l03200200-0000-4000-8000-000000000000', 'm03200000-0000-4000-8000-000000000000', 'Tu bio no es un resumen. Es un embudo.', 'Rediseña tu biografía para que deje de ser una descripción y se convierta en un embudo que guíe a tu audiencia hacia la acción.

**NO OLVIDES DESCARGAR EN EL BOT ÓN DE ARRIBA  (DOWNLOADS) EL PDF DE ESTA LECCIÓN.**', 'cqov8fux5pqhgqbkk9cr', 2, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l03200300-0000-4000-8000-000000000000', 'm03200000-0000-4000-8000-000000000000', 'Reels que posicionan, no que entretienen.', 'Aprende a crear reels que no solo entretienen, sino que posicionan tu marca, mensaje y servicios en la mente de quienes te ven.', 'zx7jltuvhvk5jcon3xla', 3, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l03200400-0000-4000-8000-000000000000', 'm03200000-0000-4000-8000-000000000000', 'Historias que conectan y educan sin esfuerzo.', 'Utiliza las historias como un espacio para educar, conectar y mantener una conversación constante con tu comunidad sin forzar.', 'qwau6joymcnnzpum9efr', 4, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l03200500-0000-4000-8000-000000000000', 'm03200000-0000-4000-8000-000000000000', 'Feed que habla por ti.', 'Construye un feed coherente y visualmente atractivo que comunique tu mensaje incluso sin necesidad de leer los textos.', 'dft8um5tbsn6gnt9d5pv', 5, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l03200600-0000-4000-8000-000000000000', 'm03200000-0000-4000-8000-000000000000', 'El algoritmo no es tu enemigo. Es tu espejo.', 'Entiende cómo funciona realmente el algoritmo y cómo usarlo a tu favor para amplificar tu visibilidad desde la autenticidad.

**NO OLVIDES DESCARGAR EN EL BOT ÓN DE ARRIBA  (DOWNLOADS) EL PDF DE ESTA LECCIÓN.**', 'stpj2ukabelomuexhrfc', 6, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l03200700-0000-4000-8000-000000000000', 'm03200000-0000-4000-8000-000000000000', 'Contenido que vende sin que se note.', 'Diseña contenido con intención estratégica, capaz de generar ventas sin parecer que estás vendiendo, desde el valor y la conexión.', 'ehm2ymxb0l5jtskbarph', 7, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l03200800-0000-4000-8000-000000000000', 'm03200000-0000-4000-8000-000000000000', 'Mensajes que convierten en conversaciones reales.', 'Convierte los mensajes en oportunidades reales de conversación, conexión y conversión sin scripts forzados ni respuestas robóticas.

**NO OLVIDES DESCARGAR EN EL BOT ÓN DE ARRIBA  (DOWNLOADS) EL PDF DE ESTA LECCIÓN.**', 'lu42diklofbbhdjjsedt', 8, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l03200900-0000-4000-8000-000000000000', 'm03200000-0000-4000-8000-000000000000', 'Instagram no es el negocio. Es tu escenario.', 'Comprende que Instagram no es tu negocio, sino tu escenario. Aprende a usarlo como el lugar donde brillas, conectas y atraes.', 'q1xkpjljxvv2ifmh6qwy', 9, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l03300100-0000-4000-8000-000000000000', 'm03300000-0000-4000-8000-000000000000', 'Puerta de embarque a la facturación con retos', '', 'f6kvjwxfdon76fxhsxwp', 1, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l03300200-0000-4000-8000-000000000000', 'm03300000-0000-4000-8000-000000000000', 'Plan de vuelo diario', '**NO OLVIDES DESCARGAR EN EL BOT ÓN DE ARRIBA  (DOWNLOADS) EL PDF DE ESTA LECCIÓN.**', 'baiozey6whv4xircp2bq', 2, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l03300300-0000-4000-8000-000000000000', 'm03300000-0000-4000-8000-000000000000', 'El efecto comunidad: haz que se queden y recomienden', 'Activa el poder del grupo: genera comunidad, pertenencia y motivación colectiva para que tus participantes se queden, se involucren y recomienden.', 'uzkr1g1p4oqj08zoxjm7', 3, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l03300400-0000-4000-8000-000000000000', 'm03300000-0000-4000-8000-000000000000', 'Cierre camuflado, impacto directo', 'Integra un cierre sutil dentro del reto que no interrumpa el proceso, pero que provoque un impacto directo en tus resultados de ventas.', 'wnhq7jkbeqeg81vnt80k', 4, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l03300500-0000-4000-8000-000000000000', 'm03300000-0000-4000-8000-000000000000', 'Post-reto: donde realmente se factura', 'Descubre cómo aprovechar el momento post-reto para facturar con más claridad, seguimiento estratégico y una oferta irresistible que dé el siguiente paso.', 'dwq3rqgzjhazf192skmt', 5, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l03400100-0000-4000-8000-000000000000', 'm03400000-0000-4000-8000-000000000000', 'Qué es un embudo de ventas y por qué necesitas uno', 'Comprende qué es un embudo de ventas, cómo funciona y por qué es clave para transformar seguidores en clientes de forma automática y sostenible.', 'moxjvjdqa6bmippu51ci', 1, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l03400200-0000-4000-8000-000000000000', 'm03400000-0000-4000-8000-000000000000', 'El recorrido de un cliente desde que te ve hasta que compra', 'Visualiza cada paso que da tu cliente, desde que te descubre hasta que toma la decisión de comprarte, y aprende a optimizar cada etapa.', 'foqxnvzlvdlwmnj1o0ys', 2, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l03400300-0000-4000-8000-000000000000', 'm03400000-0000-4000-8000-000000000000', 'Embudo con lead magnet: guía, clase o checklist', 'Diseña un embudo utilizando un lead magnet como guía, clase gratuita o checklist, para captar leads calificados y generar confianza.', 'gd6ltibsqlanpbqdepdz', 3, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l03400400-0000-4000-8000-000000000000', 'm03400000-0000-4000-8000-000000000000', 'Embudo con retos: crea comunidad y deseo en 7 días', 'Aprende a usar los retos como una herramienta de atracción masiva, conexión emocional y ventas al final de 7 días intensivos.', 'hdk5jfasy4gdzr6ton4n', 4, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l03400500-0000-4000-8000-000000000000', 'm03400000-0000-4000-8000-000000000000', 'Qué decir en cada etapa del embudo', 'Domina el mensaje correcto para cada fase del embudo: atracción, conexión, conversión y fidelización, con ejemplos claros y efectivos.', 'oxigetjsitbf9tsot3gs', 5, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l03400600-0000-4000-8000-000000000000', 'm03400000-0000-4000-8000-000000000000', 'Cómo combinar Instagram, ManyChat y email para automatizar tu proceso', 'Integra Instagram, ManyChat y email marketing en un sistema automatizado que trabaje por ti, conectando, nutriendo y vendiendo sin esfuerzo manual.', 'pndabsaylmh4vjdivke4', 6, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l03500100-0000-4000-8000-000000000000', 'm03500000-0000-4000-8000-000000000000', 'Formato POV', '', 'hx0mgwtrasqouljkyiah', 1, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l03500200-0000-4000-8000-000000000000', 'm03500000-0000-4000-8000-000000000000', 'Formato hablando a cámara', '', 'qhcm1l6q9ijtltdcgudf', 2, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l03500300-0000-4000-8000-000000000000', 'm03500000-0000-4000-8000-000000000000', 'Formato voz en off', '', 'w3p4fkz5l6dwujhlz5iy', 3, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l03500400-0000-4000-8000-000000000000', 'm03500000-0000-4000-8000-000000000000', 'Formato entrevista', '', 'yleyh2uutdjas7vjreud', 4, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l03600100-0000-4000-8000-000000000000', 'm03600000-0000-4000-8000-000000000000', 'Introducción al módulo', '', 'i5pom0pbu5mde3pu2rub', 1, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l03600200-0000-4000-8000-000000000000', 'm03600000-0000-4000-8000-000000000000', '¿Por qué llamar la atención en las redes sociales?', '', 'arpoghjqowosue6bvvcp', 2, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l03600300-0000-4000-8000-000000000000', 'm03600000-0000-4000-8000-000000000000', 'Nichos para ser viral', '', 'pvque3w1vxginyqzeshj', 3, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l03600400-0000-4000-8000-000000000000', 'm03600000-0000-4000-8000-000000000000', '¿Cuál es tu trabajo como experto en viralidad?', '', 'mpwubqbe2dgbqk0krjnw', 4, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l03600500-0000-4000-8000-000000000000', 'm03600000-0000-4000-8000-000000000000', '¿Cómo funciona este negocio?', '', 'wx2acj3mapqsgarvwxim', 5, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l03600600-0000-4000-8000-000000000000', 'm03600000-0000-4000-8000-000000000000', 'Qué debes dominar para ser exitoso en el mundo de la viralidad', '', 'zqkesuaeyq6zy4nr8tah', 6, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l03600700-0000-4000-8000-000000000000', 'm03600000-0000-4000-8000-000000000000', 'Tomar responsabilidad real', '', 'yecg9fcwiywg4vwqdfwr', 7, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l03600800-0000-4000-8000-000000000000', 'm03600000-0000-4000-8000-000000000000', '¿Cómo ganar dinero en redes sin invertir?', '', 'afokyxzjuh7azku9jkzw', 8, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l03600900-0000-4000-8000-000000000000', 'm03600000-0000-4000-8000-000000000000', 'Deja de prepararte y empieza a vender hoy', '', 'esdhnw3m7lngjvvanczj', 9, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l03700100-0000-4000-8000-000000000000', 'm03700000-0000-4000-8000-000000000000', 'Calculadora viral', '', 'nc8rwsy9qwx54curkfgj', 1, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l03800100-0000-4000-8000-000000000000', 'm03800000-0000-4000-8000-000000000000', 'Monetiza con UGC', '[GLOSARIO UGC](https://docs.google.com/document/d/1slCsnsQDh54LE5ng7yCA0QYk-ZB2dZNh6-WdygNso_I/edit?usp=sharing "CLICK AQUI PARA VER GLOSARIO UGC")

GLOSARIO UGC: https://docs.google.com/document/d/1slCsnsQDh54LE5ng7yCA0QYk-ZB2dZNh6-WdygNso_I/edit?usp=sharing "CLICK AQUI PARA VER GLOSARIO UGC" | GLOSARIO UGC: https://docs.google.com/document/d/1slCsnsQDh54LE5ng7yCA0QYk-ZB2dZNh6-WdygNso_I/edit?usp=sharing', 'zsoxewypm9xcsgqmztlr', 1, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l03800200-0000-4000-8000-000000000000', 'm03800000-0000-4000-8000-000000000000', 'Despega tu historia con UGC', '', 'nqtgweb2bekfvbiwkibv', 2, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l03800300-0000-4000-8000-000000000000', 'm03800000-0000-4000-8000-000000000000', 'Mitos sobre UGC', '', 'jauhs8auao8oygsdmy7h', 3, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l03800400-0000-4000-8000-000000000000', 'm03800000-0000-4000-8000-000000000000', 'UGC vs Micro Influencer', '', 'knj3qhhbbn0cja9kodvs', 4, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l03800500-0000-4000-8000-000000000000', 'm03800000-0000-4000-8000-000000000000', 'Tipos de contenido UGC', '', 'ug2hov2pzw3h0hrxkcjy', 5, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l03800600-0000-4000-8000-000000000000', 'm03800000-0000-4000-8000-000000000000', 'Cómo manejar tus redes', '', 'z9udfhygdljhwyevje4o', 6, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l03800700-0000-4000-8000-000000000000', 'm03800000-0000-4000-8000-000000000000', 'Integra el UGC en tu vida diaria', '', 'tb60m4ltyo5ozcrd1mu8', 7, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l03800800-0000-4000-8000-000000000000', 'm03800000-0000-4000-8000-000000000000', 'Desbloquea tu creatividad', '', 'z3xubno5s9gjfei1un2r', 8, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l03800900-0000-4000-8000-000000000000', 'm03800000-0000-4000-8000-000000000000', 'FEED vs ADS', '', 'skc0d2al8tqbfrwijjkt', 9, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l03801000-0000-4000-8000-000000000000', 'm03800000-0000-4000-8000-000000000000', 'Tu primer video UGC', '[CHECK LIST UGC](https://www.canva.com/design/DAGxJZ1Fznw/buxaE4l-3Vt6fDqnjAPffg/edit "CHECK LIST UGC")[PLANTILLA UGC](https://docs.google.com/document/d/1kJ_tkO5zpGodGfvACB7DB4q34pJ6XRdw63ghKpKQeI8/edit?tab=t.0 "DESCARGA AQUI TU PLANTILLA")[DESCARGA AQUI TU PLANTILLA](https://docs.google.com/document/d/1kJ_tkO5zpGodGfvACB7DB4q34pJ6XRdw63ghKpKQeI8/edit?tab=t.0 "DESCARGA AQUI TU PLANTILLA")

CHECK LIST UGC: https://www.canva.com/design/DAGxJZ1Fznw/buxaE4l-3Vt6fDqnjAPffg/edit "CHECK LIST UGC" | PL', 'pbz7fuq3rnmciz4udsaz', 10, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l03801100-0000-4000-8000-000000000000', 'm03800000-0000-4000-8000-000000000000', 'Estructura de tu primer video UGC', '[DESCARGA AQUÍ TU PLANTILLA](https://docs.google.com/document/d/1kJ_tkO5zpGodGfvACB7DB4q34pJ6XRdw63ghKpKQeI8/edit?tab=t.0 "DESCARGA AQUÍ TU PLANTILLA")

DESCARGA AQUÍ TU PLANTILLA: https://docs.google.com/document/d/1kJ_tkO5zpGodGfvACB7DB4q34pJ6XRdw63ghKpKQeI8/edit?tab=t.0 "DESCARGA AQUÍ TU PLANTILLA" | DESCARGA AQU&Iacute; TU PLANTILLA: https://docs.google.com/document/d/1kJ_tkO5zpGodGfvACB7DB4q34pJ6XRdw63ghKpKQeI8/edit?tab=t.0', 'y59wfsunde1xwa8cfjw0', 11, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l03801200-0000-4000-8000-000000000000', 'm03800000-0000-4000-8000-000000000000', 'Cómo hacer tu portafolio PARTE 1', '', 'miguj1nlr8eek8byjuvu', 12, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l03801300-0000-4000-8000-000000000000', 'm03800000-0000-4000-8000-000000000000', 'Cómo hacer tu portafolio PARTE 2', '', 'txt0mdcllskpql6pfhnw', 13, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l03801400-0000-4000-8000-000000000000', 'm03800000-0000-4000-8000-000000000000', 'Cómo hacer tu portafolio PARTE 3', '', 'omlhv4htaqixzxv5uzcz', 14, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l03801500-0000-4000-8000-000000000000', 'm03800000-0000-4000-8000-000000000000', 'Colaboraciones pagas vs Intercambios', '', 'j9kc4aiqydxu1ph0jefr', 15, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l03801600-0000-4000-8000-000000000000', 'm03800000-0000-4000-8000-000000000000', 'Aplicaciones para creadores UGC', '', 'p5g5zikct8gqe7n1xhe6', 16, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l03801700-0000-4000-8000-000000000000', 'm03800000-0000-4000-8000-000000000000', 'Cómo encontrar marcas', '', 'scnutqusuoe9s2bi8go7', 17, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l03801800-0000-4000-8000-000000000000', 'm03800000-0000-4000-8000-000000000000', 'Cómo crear tu correo', '', 'cxqg7ekrxqagm7z6dggb', 18, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l03801900-0000-4000-8000-000000000000', 'm03800000-0000-4000-8000-000000000000', 'Crea tu firma digital', '', 'qu7zldizbp4jdhb9gcp8', 19, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l03802000-0000-4000-8000-000000000000', 'm03800000-0000-4000-8000-000000000000', 'Cómo escribir correos', '[DESCARGA AQUI LISTA DE CORREOS](https://docs.google.com/document/d/1iWZVPpppLmEQtOaghtSNF2tTfbNmHr9h1Ews8KrbDRA/edit?usp=sharing "DESCARGA AQUI LISTA DE CORREOS")[RESPUESTAS FIRMES Y ELEGANTES](https://docs.google.com/document/d/1bozE0p6jmZv3ZprO2jjF8mPk3YYJTKRfbqDcTmd25mE/edit?usp=sharing "RESPUESTAS FIRMES Y ELEGANTES")

DESCARGA AQUI LISTA DE CORREOS: https://docs.google.com/document/d/1iWZVPpppLmEQtOaghtSNF2tTfbNmHr9h1Ews8KrbDRA/edit?usp=sharing "DESCARGA AQUI LISTA DE CORREOS" | RESPUESTAS', 'voswolhgmgnlrpjv8nsp', 20, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l03802100-0000-4000-8000-000000000000', 'm03800000-0000-4000-8000-000000000000', 'Cómo reconocer correos spam', '', 'obzzj8ldw8cw1jfhi9pj', 21, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l03802200-0000-4000-8000-000000000000', 'm03800000-0000-4000-8000-000000000000', 'Cómo cobrar tu contenido UGC', '', 'hdewadz0xezqezvltiot', 22, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l03802300-0000-4000-8000-000000000000', 'm03800000-0000-4000-8000-000000000000', 'Crea tu media kit', '', 'ujjwdrj4hzt5lzfaxpfx', 23, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l03802400-0000-4000-8000-000000000000', 'm03800000-0000-4000-8000-000000000000', 'Cómo negociar con las marcas', '', 'wz3bkbumaae881mfpztg', 24, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l03802500-0000-4000-8000-000000000000', 'm03800000-0000-4000-8000-000000000000', 'Cómo trabajar con una marca', '', 'is348dwztsivn3fz2wit', 25, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l03802600-0000-4000-8000-000000000000', 'm03800000-0000-4000-8000-000000000000', 'Ética en el mundo del UGC', '', 'a2u31spg8czi331ojfyr', 26, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l03802700-0000-4000-8000-000000000000', 'm03800000-0000-4000-8000-000000000000', 'Cómo recibir tus pagos', '', 'khevvcppsesbflxucf8m', 27, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l03802800-0000-4000-8000-000000000000', 'm03800000-0000-4000-8000-000000000000', 'UGC sin limites', '', 'wprjm0znvi2epk72im3g', 28, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l03802900-0000-4000-8000-000000000000', 'm03800000-0000-4000-8000-000000000000', 'CIERRE DEL MÓDULO', '', 'ie40pcbeqwcs35tb08ec', 29, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l03900100-0000-4000-8000-000000000000', 'm03900000-0000-4000-8000-000000000000', 'DESPEGA CON LA IA', '', 'ty3hgfgd9p0pnl5qa7d2', 1, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l03900200-0000-4000-8000-000000000000', 'm03900000-0000-4000-8000-000000000000', 'PRE-VUELO DE TU CLON', '', 'z5koyfsqj9wbvm4saaxs', 2, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l03900300-0000-4000-8000-000000000000', 'm03900000-0000-4000-8000-000000000000', 'SALA DE IDEAS', '', 'zdw89o9ifrllgqesnl5r', 3, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l03900400-0000-4000-8000-000000000000', 'm03900000-0000-4000-8000-000000000000', 'RADAR DE IDEAS', '', 'ovtsno7rcdtulx4rba9v', 4, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l03900500-0000-4000-8000-000000000000', 'm03900000-0000-4000-8000-000000000000', 'TE PRESENTO A AIRON', '', 'wd2papj0ysiogdljg8wh', 5, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l03900600-0000-4000-8000-000000000000', 'm03900000-0000-4000-8000-000000000000', '¿CÓMO FUNCIONA AIRON?', '[CLICK AQUÍ PARA HABLAR CON AIRON](https://chatgpt.com/g/g-692e76ae2f0481919c816b9e0e60d26d-airon-genero-prompts-para-fotos)[  
  
BONO: PROMTS LISTOS PARA USAR  
](https://www.canva.com/design/DAGpt6baRDM/D5F7ofF6r01kxLghz3vlVg/edit?utm_content=DAGpt6baRDM&utm_campaign=designshare&utm_medium=link2&utm_source=sharebutton)

CLICK AQUÍ PARA HABLAR CON AIRON: https://chatgpt.com/g/g-692e76ae2f0481919c816b9e0e60d26d-airon-genero-prompts-para-fotos |   
  
BONO: PROMTS LISTOS PARA USAR  
: https://ww', 'osvog4tyzi8ytwp40s97', 6, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l03900700-0000-4000-8000-000000000000', 'm03900000-0000-4000-8000-000000000000', 'VUELA MÁS ALTO CON FREEPIK', '', 'invpuonagea6svo2fo0g', 7, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l04000100-0000-4000-8000-000000000000', 'm04000000-0000-4000-8000-000000000000', 'INTRODUCCIÓN', 'DESCARGA EL DOCUMENTO CON EL NOMBRE DE TODAS LAS PAGINAS USADAS', 'pu5cx78jis8wqzg0h3rn', 1, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l04000200-0000-4000-8000-000000000000', 'm04000000-0000-4000-8000-000000000000', 'BUSCA EL AMBIENTE PARA TU CLON', '', 'vqqxwzmyk12uwnoeyb0o', 2, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l04000300-0000-4000-8000-000000000000', 'm04000000-0000-4000-8000-000000000000', 'CREA LA IMAGEN DE TU CLON ULTRA REAL', '', 'kvh5p43vydysbl2s3oz1', 3, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l04000400-0000-4000-8000-000000000000', 'm04000000-0000-4000-8000-000000000000', 'DAMOS VIDA A NUESTRO CLON', '', 'qehbvayj62t6nbboxboi', 4, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l04000500-0000-4000-8000-000000000000', 'm04000000-0000-4000-8000-000000000000', 'NUESTRO AVATAR SE MUEVE Y HABLA', '', 'zfyfc0c8jcxgyd0td3y9', 5, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l04000600-0000-4000-8000-000000000000', 'm04000000-0000-4000-8000-000000000000', 'VOZ PROFESIONAL PARA NUESTRO AVATAR', '', 'qgp43yd3uawqfelxnbqu', 6, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l04000700-0000-4000-8000-000000000000', 'm04000000-0000-4000-8000-000000000000', 'RESULTADO HIPER REALISTA', '', 'xvovmdkdarcotsvzxdk3', 7, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l04000800-0000-4000-8000-000000000000', 'm04000000-0000-4000-8000-000000000000', 'EMPIEZA A GENERAR', '', 'ejof3kd5xsdjvtov6z8d', 8, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l04100100-0000-4000-8000-000000000000', 'm04100000-0000-4000-8000-000000000000', 'Bienvenida al módulo', 'Bienvenida, mi nombre es Ana Osorio y estoy muy feliz de llevarte de la mano en este camino maravilloso de Hormart, puedes encontrarme en redes como [@soyanaosorio_](https://www.instagram.com/soyanaosorio_?igsh=Y3V2d3h2dTFzOWUz&utm_source=qr)

 

IMPORTANTE: Hotmart no está disponible en Venezuela, Cuba y Nicaragua, si eres de alguno de estos países no puedes hacer uso de esta plataforma a menos que sea habilitada en tu país.

@soyanaosorio_: https://www.instagram.com/soyanaosorio_?igsh=Y3V2d3h2', 'f9htnrsqkozdbfwjlwzs', 1, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l04100200-0000-4000-8000-000000000000', 'm04100000-0000-4000-8000-000000000000', '¿Qué es Hotmart?', '', 'iuvsqdoowvdthfjdyekv', 2, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l04100300-0000-4000-8000-000000000000', 'm04100000-0000-4000-8000-000000000000', 'Creación de cuenta y datos personales', '[LINK PARA CREAR CUENTA EN HOTMART](https://hotmart.com/es)

LINK PARA CREAR CUENTA EN HOTMART: https://hotmart.com/es | LINK PARA CREAR CUENTA EN HOTMART: https://hotmart.com/es', 'zoebtz50botzzk31zum2', 3, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l04100400-0000-4000-8000-000000000000', 'm04100000-0000-4000-8000-000000000000', 'Asi se ve la APP en tu celular', '[Sonido de notificaciones 🤑](https://youtube.com/shorts/JSE2nGw8Pbo?si=aheM8IcCtskLRz9M)

Sonido de notificaciones 🤑: https://youtube.com/shorts/JSE2nGw8Pbo?si=aheM8IcCtskLRz9M | Sonido de notificaciones 🤑: https://youtube.com/shorts/JSE2nGw8Pbo?si=aheM8IcCtskLRz9M', 'qkssn4j8akuth3n4cgbj', 4, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l04100500-0000-4000-8000-000000000000', 'm04100000-0000-4000-8000-000000000000', 'Conoce el mercado de afiliación, selección de productos y Hotlinks de divulgación', '', 'f5cmrni1xsvcgnxh9khh', 5, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l04100600-0000-4000-8000-000000000000', 'm04100000-0000-4000-8000-000000000000', 'Lista de productos validados', '[Click aquí para ver la lista de productos validados](https://docs.google.com/document/d/1McBJVLWZgTrdtWaxKeGow6wVvxttay8BXlbrRZRSEm4/edit?usp=sharing)

Click aquí para ver la lista de productos validados: https://docs.google.com/document/d/1McBJVLWZgTrdtWaxKeGow6wVvxttay8BXlbrRZRSEm4/edit?usp=sharing | Click aqu&iacute; para ver la lista de productos validados: https://docs.google.com/document/d/1McBJVLWZgTrdtWaxKeGow6wVvxttay8BXlbrRZRSEm4/edit?usp=sharing', 'naorsrb92wdi3usvehtw', 6, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l04100700-0000-4000-8000-000000000000', 'm04100000-0000-4000-8000-000000000000', 'Donde encontrar los productos a los que soy afiliado', '', 'piaudl4mikrtd5c3fz1t', 7, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l04100800-0000-4000-8000-000000000000', 'm04100000-0000-4000-8000-000000000000', 'Investigación de mercado', '', 'gkyezbdpc82wehifhqak', 8, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l04100900-0000-4000-8000-000000000000', 'm04100000-0000-4000-8000-000000000000', 'Creación de contenido', '[LINK PARA DESCARGAR VIDEOS DE TIKTOK  
](https://ssstik.io/es-1)[LINK PARA TRANSCRIBIR GUIÓN](https://turboscribe.ai/dashboard?ref=gad-self-2023-11-28&gad_source=1&gad_campaignid=20819382169&gbraid=0AAAAApQ31Ks5rRoxDDSFQnRa1_WCVRFv7&gclid=Cj0KCQiAhOfLBhCCARIsAJPiopMfLJje4grh2HMuNhgjFSrT9D11qG8n0V978Pw_S61R854LnCCb-oAaApOyEALw_wcB)

LINK PARA DESCARGAR VIDEOS DE TIKTOK  
: https://ssstik.io/es-1 | LINK PARA TRANSCRIBIR GUIÓN: https://turboscribe.ai/dashboard?ref=gad-self-2023-11-28&gad_source=1&', 'navhxjyv2zwcs0vjizat', 9, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l04101000-0000-4000-8000-000000000000', 'm04100000-0000-4000-8000-000000000000', 'Nicho y Subnicho', '', 'xrukejcc591pchrt6tdx', 10, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l04101100-0000-4000-8000-000000000000', 'm04100000-0000-4000-8000-000000000000', 'Cómo se genera la venta', '', 'wuxqsnszkg83gv1udlii', 11, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l04101200-0000-4000-8000-000000000000', 'm04100000-0000-4000-8000-000000000000', 'Cómo alojar Next Flight en Hotmart', 'Descripción Next Flight:

Next flight, Te da el plan, las herramientas y la mentalidad para convertir lo que sabes en ingresos, presencia y libertad, no importa donde estes hoy, lo importante es que decidas despegar. _En Next Flight Academy no necesitas ser experta para abordar , Este vuelos es para mujeres como tu , con historias reales , listas para despegar hacia una vida con prop ósito _

**[PLANTILLA PÁGINA WEB ](https://www.canva.com/design/DAHBz_-sAb8/ugK5H0__cqxvWYiR4VOKtA/edit?utm_conte', 'qzvk1xjqzcfdz4vlaqtb', 12, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l04200100-0000-4000-8000-000000000000', 'm04200000-0000-4000-8000-000000000000', 'BIENVENIDA', 'Bienvenid@, es hora de ganar, crear y recibir con Amazon   
[@taty_palacioss](https://www.instagram.com/taty_palacioss?igsh=MWtiOWd5MXRmcjRkYw%3D%3D&utm_source=qr)

@taty_palacioss: https://www.instagram.com/taty_palacioss?igsh=MWtiOWd5MXRmcjRkYw%3D%3D&utm_source=qr | @taty_palacioss: https://www.instagram.com/taty_palacioss?igsh=MWtiOWd5MXRmcjRkYw%3D%3D&amp;utm_source=qr', 'wmgngboc3dfjqcx30ynl', 1, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l04200200-0000-4000-8000-000000000000', 'm04200000-0000-4000-8000-000000000000', 'QUÉ ES AMAZON AFILIADOS / DIFERENCIAS', '', 't6qp1q9lpayfa14up8px', 2, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l04200300-0000-4000-8000-000000000000', 'm04200000-0000-4000-8000-000000000000', 'REGISTRATE COMO ASOCIADO AMAZON', '<https://affiliate-program.amazon.com >

https://affiliate-program.amazon.com: https://affiliate-program.amazon.com ', 'x3eeti4xrkhbperyzgfz', 3, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l04200400-0000-4000-8000-000000000000', 'm04200000-0000-4000-8000-000000000000', 'COMPLETA TU PERFIL DE ASOCIADO', '', 'gyhj7ckgmfkzmgqof68o', 4, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l04200500-0000-4000-8000-000000000000', 'm04200000-0000-4000-8000-000000000000', 'INFORMACIÓN FISCAL USA', '', 'fdqwfcyiovxkesh9kkid', 5, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l04200600-0000-4000-8000-000000000000', 'm04200000-0000-4000-8000-000000000000', 'MÉTODO DE PAGO USA', '', 'jzvslhpetwezlderp82j', 6, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l04200700-0000-4000-8000-000000000000', 'm04200000-0000-4000-8000-000000000000', 'INFORMACIÓN FISCAL LATINOAMÉRICA', 'Si estás en Estados Unidos y no tienes SS o Itin puedes utilizar esta información fiscal.', 'd7jucacmgnh49msfwaiy', 7, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l04200800-0000-4000-8000-000000000000', 'm04200000-0000-4000-8000-000000000000', 'PAYONEER / BANCO AMERICANO EN LATINOAMÉRICA', '<https://www.payoneer.com>

https://www.payoneer.com: https://www.payoneer.com', 'wdfhacm4tapmvbe8lxoi', 8, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l04200900-0000-4000-8000-000000000000', 'm04200000-0000-4000-8000-000000000000', 'INFORMACIÓN DE PAGO LATINOAMERICA', 'Utiliza tus datos bancarios de payooner.', 'ayp8opdb0tdzwiudsnb3', 9, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l04201000-0000-4000-8000-000000000000', 'm04200000-0000-4000-8000-000000000000', 'CONVIÉRTETE EN INFLUENCER DE AMAZON', '<https://affiliate-program.amazon.com/influencers>

 

Utiliza Tiktok para aplicar a Amazon Influencer (es el que yo recomiendo y el que todos mis estudiantes han aplicado)

Si eres rechazado no te preocupes, intenta en 2 semanas pero asegúrate de subir mínimo 1 video diario creando contenido sobre productos durante 1 semana y luego aplica.

https://affiliate-program.amazon.com/influencers: https://affiliate-program.amazon.com/influencers', 'jmivoakdnijpqf4drmf0', 10, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l04201100-0000-4000-8000-000000000000', 'm04200000-0000-4000-8000-000000000000', 'PERSONALIZA TU TIENDA DE INFLUENCER', '', 'sp9knm8xpyczgebmnflm', 11, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l04201200-0000-4000-8000-000000000000', 'm04200000-0000-4000-8000-000000000000', 'TUS FAVORTIOS DE AMAZON', '', 'rcm1kpfy0cqt6zpwrg30', 12, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l04201300-0000-4000-8000-000000000000', 'm04200000-0000-4000-8000-000000000000', 'LOS MÁS VENDIDOS DE AMAZON', 'Si tienes algunos de estos productos en casa puedes recomendárselos en tus redes sociales e incluso, si tienes productos en casa que están en la tienda de Amazon aunque no lo hayas comprado en Amazon puedes empezar por ahí para recomendar y ganar tus primeras comisiones.

**Importante**   
Tienes 180 días para hacer tus 3 primeras ventas, de lo contrario tu cuenta será cerrada.', 'q3joua5rohdfbymtpwsn', 13, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l04201400-0000-4000-8000-000000000000', 'm04200000-0000-4000-8000-000000000000', 'ACTIVA TUS GANANCIAS INTERNACIONALES', '', 'vqe9iu2fgm1wsnuq1wcu', 14, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l04201500-0000-4000-8000-000000000000', 'm04200000-0000-4000-8000-000000000000', 'COMPLETA TUS GANANCIAS INTERNACIONALES', 'Es importante que sepas que cualquier persona que compre a través de tu link de afiliado tiene que estar registrado desde Amazon USA o Amazon Canadá, de lo contrario la venta o comisión no será válida!

**S úper importante:**  
Auto compras - No comisión   
Compras desde otras cuentas de Amazon pero utilizando tu misma dirección o forma de pago - No comisión', 'nvmimxxzbr1sxmjbfwak', 15, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l04201600-0000-4000-8000-000000000000', 'm04200000-0000-4000-8000-000000000000', 'ON SITE COMMISSION DE AMAZON', 'Tus videos no monetizan solo por subirlos, tienes que hacer que el cliente compre a través de tu video.

•⁠ ⁠3 videos en inglés (importante)   
•⁠ ⁠⁠Buena calidad (muestra el producto en uso)   
•⁠ ⁠⁠No marcas de agua   
•⁠ ⁠⁠Si editas en tu teléfono súbelo desde tu teléfono (no traslades a menos que sea por AirDrop de lo contrario pierde calidad y tu video será rechazado)   
•⁠ ⁠⁠Asegúrate de limpiar tu cámara antes de grabar   
•⁠ ⁠Mínimo 30 segundos

Bono:   
GPT Personalizado para la creació', 'gkn7javvxh6jsqheero6', 16, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l04201700-0000-4000-8000-000000000000', 'm04200000-0000-4000-8000-000000000000', 'EDITA TUS VIDEOS EN INGLES CON IA', 'No te preocupes si no hablas inglés, esto te resolverá todo.   
Opción únicamente con CapCut PRO!', 'fzzraxn1r9bg8p2vugiw', 17, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l04201800-0000-4000-8000-000000000000', 'm04200000-0000-4000-8000-000000000000', 'ELIMINAR MARCA DE AGUA', 'Asegúrate de quitar toda marca de agua ya sea de IA o del editor que utilices.', 'l24p7jqhav2zxspfe7o2', 18, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l04201900-0000-4000-8000-000000000000', 'm04200000-0000-4000-8000-000000000000', 'SUBE TUS 3 PRIMEROS VIDEOS', 'Asegúrate de subir correctamente tus 3 primeros videos (al mismo tiempo, el mismo día) luego de subirlos asegúrate que estén los 3 videos y espera máximo 8 días para ser aprobada!

Una vez aprobada puedes subir hasta 15 videos diarios. La clase está en ser constante.', 'kuvj2kdpuqcyfy6jm84e', 19, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l04202000-0000-4000-8000-000000000000', 'm04200000-0000-4000-8000-000000000000', 'TUS VIDEOS EN LAS PÁGINAS DE AMAZON', '🚫 Palabras y frases prohibidas o que debes evitar en tus videos de Amazon (E-Recommissions / On-Site)

⸻

💵 1. Precios o promociones

Amazon no permite que menciones precios, descuentos ni ofertas.  
Esto incluye cualquier palabra relacionada con dinero, porcentajes o rebajas.

❌ No digas:  
• “Cuesta solo $9.99.”  
• “Está en descuento.”  
• “Tiene envío gratis.”  
• “Aprovecha la oferta.”  
• “Con mi código obtienes un 20% off.”

✅ En su lugar di:  
• “Tiene un excelente precio.”  
• “Es muy e', 'amzvtkl9scrwpkfxc3l0', 20, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l04202100-0000-4000-8000-000000000000', 'm04200000-0000-4000-8000-000000000000', 'CAMPAÑAS DE COLABORACIÓN CON LAS MARCAS', 'Puedes colaborar con marcas tanto con Amazon Asociados o Amazon Influencer después de tus primeras 3 ventas.

No todas las marcas contestan   
No todas te dicen que si   
Puedes buscar campañas de productos que tú ya tengas en casa.', 'mme0rrlzf4rfdsp7rd0t', 21, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l04202200-0000-4000-8000-000000000000', 'm04200000-0000-4000-8000-000000000000', 'COMO MANDAR TUS CAMPAÑAS COMPLETAS', '', 'yl8k0kz2mrzjti3pzsry', 22, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l04202300-0000-4000-8000-000000000000', 'm04200000-0000-4000-8000-000000000000', 'CIERRE DEL MÓDULO', '', 'qztotugqtxqjpdhvvyav', 23, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l04300100-0000-4000-8000-000000000000', 'm04300000-0000-4000-8000-000000000000', 'BIENVENIDA', '', 'ffkqkslkr077hxmyohzl', 1, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l04300200-0000-4000-8000-000000000000', 'm04300000-0000-4000-8000-000000000000', 'ENTENDIENDO TIKTOK LIVE', '', 'fdp3iwrfwq8is2pv3d91', 2, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l04300300-0000-4000-8000-000000000000', 'm04300000-0000-4000-8000-000000000000', 'CÓMO INICIAR EN TIKTOK LIVE', '', 'ljjn98kqroapb0krwsye', 3, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l04300400-0000-4000-8000-000000000000', 'm04300000-0000-4000-8000-000000000000', 'CÓMO MANTENER LA CONVERSACIÓN', '', 'sthwbvuoe3itbnaeuc2d', 4, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l04300500-0000-4000-8000-000000000000', 'm04300000-0000-4000-8000-000000000000', 'EL CAMINO DEL HÉROE', '', 'qxzau4ixxkoh7hjul0zk', 5, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l04300600-0000-4000-8000-000000000000', 'm04300000-0000-4000-8000-000000000000', 'PSICOLOGÍA DEL ESPECTADOR', '', 'xymgfey7frv8at44kek5', 6, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l04300700-0000-4000-8000-000000000000', 'm04300000-0000-4000-8000-000000000000', 'PRESENCIA FRENTE A CÁMARA', '', 'plvmsx50v90wu0dyjea4', 7, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l04300800-0000-4000-8000-000000000000', 'm04300000-0000-4000-8000-000000000000', 'CÓMO CERRAR UN LIVE', '', 'bqidndolymj7ogcu097b', 8, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l04300900-0000-4000-8000-000000000000', 'm04300000-0000-4000-8000-000000000000', 'HERRAMIENTAS DE TIKTOK LIVE', '', 'peipauooybvxs3e8axsg', 9, true, false, 'Daniela Peña', 'Fundadora NextFlight');

INSERT INTO course_lessons (id, module_id, title, description, video_storage_path, display_order, is_published, is_free, tutor_name, tutor_title)
VALUES ('l04301000-0000-4000-8000-000000000000', 'm04300000-0000-4000-8000-000000000000', 'CIERRE DEL MÓDULO', '', 'g5o7gyi0bgc86yivyy7n', 10, true, false, 'Daniela Peña', 'Fundadora NextFlight');
