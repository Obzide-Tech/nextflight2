/*
  # Seed Demo Content — NextFlight Academy

  1. Programs
    - NextFlight Starter (free tier intro program, 3 modules x 4 lessons, lesson 1 free)
    - NextFlight Premium Method (premium tier, 5 modules)
  2. Courses, Modules, Lessons, Assets
    - Starter: 3 modules ("Tu primer despegue", "Altitud de crucero", "Aterrizaje"), 4 lessons each
    - Premium: 5 premium modules
  3. Announcements + FAQs (public read)

  Notes:
    - All content is published.
    - Demo lessons use external placeholder video URLs.
    - Idempotent via slug/title unique guards using ON CONFLICT.
*/

-- Programs ------------------------------------------------------------------
INSERT INTO products_programs (slug, title, subtitle, description, cover_url, tier, affiliate_enabled, default_commission_rate, apple_product_id, google_product_id, price_usd, is_published, display_order)
VALUES
  ('nextflight-starter',
   'NextFlight Starter',
   'Tu primer vuelo con nosotros',
   'Un programa introductorio de 3 módulos para que despegues con confianza. La primera lección es gratuita.',
   'https://images.pexels.com/photos/2422588/pexels-photo-2422588.jpeg?auto=compress&cs=tinysrgb&w=1200',
   'free',
   true, 0.30,
   '', '', 0, true, 1),
  ('nextflight-premium-method',
   'NextFlight Premium Method',
   'Vuela en primera clase',
   'Cinco módulos premium con mentoría, recursos avanzados y bitácoras editoriales.',
   'https://images.pexels.com/photos/1308940/pexels-photo-1308940.jpeg?auto=compress&cs=tinysrgb&w=1200',
   'premium',
   true, 0.30,
   'com.nextflight.academy.premium.monthly',
   'nf_premium_monthly',
   29.99, true, 2)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  subtitle = EXCLUDED.subtitle,
  description = EXCLUDED.description,
  cover_url = EXCLUDED.cover_url,
  tier = EXCLUDED.tier,
  price_usd = EXCLUDED.price_usd,
  is_published = EXCLUDED.is_published;

-- Courses, modules, lessons -----------------------------------------------
DO $$
DECLARE
  starter_id uuid;
  premium_id uuid;
  starter_course uuid;
  premium_course uuid;
  m_id uuid;
  l_id uuid;
  starter_modules text[][] := ARRAY[
    ARRAY['Tu primer despegue', 'Bienvenida a tu cabina y mapa de vuelo'],
    ARRAY['Altitud de crucero', 'Mantén el rumbo y administra tu energía'],
    ARRAY['Aterrizaje', 'Aproximación final y celebración']
  ];
  starter_lessons text[][][] := ARRAY[
    ARRAY[
      ARRAY['Bienvenida a tu cabina', '384', 'true'],
      ARRAY['Define tu destino', '728', 'false'],
      ARRAY['Cómo leer tus instrumentos', '585', 'false'],
      ARRAY['Lista de pre-vuelo', '450', 'false']
    ],
    ARRAY[
      ARRAY['Mantén tu rumbo', '660', 'false'],
      ARRAY['Turbulencias suaves', '530', 'false'],
      ARRAY['Comunicación con la torre', '615', 'false'],
      ARRAY['Reabastecimiento', '405', 'false']
    ],
    ARRAY[
      ARRAY['Aproximación final', '560', 'false'],
      ARRAY['Touchdown', '475', 'false'],
      ARRAY['Después del vuelo', '330', 'false'],
      ARRAY['Tu próxima ruta', '490', 'false']
    ]
  ];
  premium_modules text[][] := ARRAY[
    ARRAY['Mindset de Comandante', 'Reescribe tus creencias de vuelo'],
    ARRAY['Posicionamiento Editorial', 'Construye una marca que despegue'],
    ARRAY['Rutas de Monetización', 'Diseña tu plan de vuelo financiero'],
    ARRAY['Sistemas y Tripulación', 'Delegar para volar más alto'],
    ARRAY['Visibilidad y Vuelo Internacional', 'Escala tu mensaje al mundo']
  ];
  i int;
  j int;
BEGIN
  SELECT id INTO starter_id FROM products_programs WHERE slug = 'nextflight-starter';
  SELECT id INTO premium_id FROM products_programs WHERE slug = 'nextflight-premium-method';

  -- Starter course
  IF NOT EXISTS (SELECT 1 FROM courses WHERE program_id = starter_id) THEN
    INSERT INTO courses (program_id, title, description, cover_url, display_order, is_published)
    VALUES (starter_id, 'Curso Starter', 'Curso principal del programa Starter', '', 1, true)
    RETURNING id INTO starter_course;

    FOR i IN 1..array_length(starter_modules, 1) LOOP
      INSERT INTO course_modules (course_id, title, description, display_order, is_published)
      VALUES (starter_course, starter_modules[i][1], starter_modules[i][2], i, true)
      RETURNING id INTO m_id;

      FOR j IN 1..4 LOOP
        INSERT INTO course_lessons (
          module_id, title, description,
          video_external_url, duration_seconds,
          is_free, tutor_name, tutor_title, tutor_avatar_url,
          display_order, is_published
        ) VALUES (
          m_id,
          starter_lessons[i][j][1],
          'Lección ' || j || ' del módulo "' || starter_modules[i][1] || '". Explora con calma y toma notas en tu Bitácora.',
          'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
          starter_lessons[i][j][2]::int,
          (starter_lessons[i][j][3] = 'true'),
          'Teresa Rincón', 'Comandante NextFlight',
          'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=400',
          j, true
        ) RETURNING id INTO l_id;
      END LOOP;

      INSERT INTO lesson_assets (module_id, title, asset_type, external_url, is_premium_only)
      VALUES
        (m_id, 'Plan de vuelo (PDF)', 'pdf', 'https://www.africau.edu/images/default/sample.pdf', false),
        (m_id, 'Plantilla de bitácora', 'template', 'https://www.africau.edu/images/default/sample.pdf', false);
    END LOOP;
  END IF;

  -- Premium course
  IF NOT EXISTS (SELECT 1 FROM courses WHERE program_id = premium_id) THEN
    INSERT INTO courses (program_id, title, description, cover_url, display_order, is_published)
    VALUES (premium_id, 'Método Premium', 'Curso completo del Método Premium', '', 1, true)
    RETURNING id INTO premium_course;

    FOR i IN 1..array_length(premium_modules, 1) LOOP
      INSERT INTO course_modules (course_id, title, description, display_order, is_published)
      VALUES (premium_course, premium_modules[i][1], premium_modules[i][2], i, true)
      RETURNING id INTO m_id;

      FOR j IN 1..4 LOOP
        INSERT INTO course_lessons (
          module_id, title, description,
          video_external_url, duration_seconds,
          is_free, tutor_name, tutor_title, tutor_avatar_url,
          display_order, is_published
        ) VALUES (
          m_id,
          'Lección ' || j || ' · ' || premium_modules[i][1],
          'Contenido editorial del Método Premium. Toma notas y revisa los recursos.',
          'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
          (480 + j*60),
          false,
          'Teresa Rincón', 'Comandante NextFlight',
          'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=400',
          j, true
        );
      END LOOP;

      INSERT INTO lesson_assets (module_id, title, asset_type, external_url, is_premium_only)
      VALUES
        (m_id, 'Workbook ' || premium_modules[i][1], 'pdf', 'https://www.africau.edu/images/default/sample.pdf', true),
        (m_id, 'Plantilla editorial', 'template', 'https://www.africau.edu/images/default/sample.pdf', true);
    END LOOP;
  END IF;
END $$;

-- Announcements --------------------------------------------------------------
INSERT INTO announcements (title, body, cover_url, is_published)
SELECT * FROM (VALUES
  ('Bienvenida a NextFlight Academy',
   'Estamos felices de tenerte en cabina. Aquí encontrarás los anuncios oficiales del comandante.',
   'https://images.pexels.com/photos/1308940/pexels-photo-1308940.jpeg?auto=compress&cs=tinysrgb&w=1200',
   true),
  ('Mentoría grupal este mes',
   'El próximo encuentro de cabina abierta será el 30 de abril a las 19:00 hrs. Reserva tu asiento en el grupo de Telegram.',
   'https://images.pexels.com/photos/2422588/pexels-photo-2422588.jpeg?auto=compress&cs=tinysrgb&w=1200',
   true)
) AS v(title, body, cover_url, is_published)
WHERE NOT EXISTS (SELECT 1 FROM announcements WHERE announcements.title = v.title);

-- FAQs -----------------------------------------------------------------------
INSERT INTO faq_items (question, answer, category, display_order, is_published)
SELECT * FROM (VALUES
  ('¿Cómo cancelo mi suscripción?',
   'Puedes cancelar tu suscripción en cualquier momento desde los ajustes de suscripciones de tu Apple ID o Google Account. Conservas el acceso hasta el final del período pagado.',
   'pagos', 1, true),
  ('¿Puedo descargar las lecciones?',
   'Las lecciones están disponibles para reproducción dentro de la app. Los recursos PDF y plantillas sí pueden descargarse.',
   'cursos', 2, true),
  ('¿Cómo recupero mi contraseña?',
   'En la pantalla de Check-In presiona "¿Olvidaste tu contraseña?" e ingresa tu correo. Recibirás un enlace seguro para restablecerla.',
   'cuenta', 3, true),
  ('¿Cómo solicito un retiro como Copiloto?',
   'Una vez tu saldo disponible supere los $50 USD, ve a Copilotos → Retiros y solicita el pago. Si es tu primer retiro completaremos tu KYC.',
   'afiliados', 4, true)
) AS v(question, answer, category, display_order, is_published)
WHERE NOT EXISTS (SELECT 1 FROM faq_items WHERE faq_items.question = v.question);
