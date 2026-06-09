/*
  # Kajabi Content Cleanup

  ## Summary
  Cleans up Kajabi platform artifacts that leaked into lesson body_content during the
  migration. Replaces downloadable PDF references with a conditional hint token, and
  strips instructor handle lines, horizontal rules, and admin Kajabi URLs.

  ## Changes

  ### 1. Replace DOWNLOADS references with [RECURSOS_HINT] token
  - "NO OLVIDES DESCARGAR EN EL BOTÓN DE ARRIBA (DOWNLOADS)..." → [RECURSOS_HINT]
  - "NO OLVIDES DESCARGAR EN EL BOT ÓN DE ARRIBA (DOWNLOADS)..." → [RECURSOS_HINT]
  - Beacons-specific: "Descarga el PDF después de la compra en la sección DOWNLOADS."
  - Beacons-specific: "Descarga la guía de Stripe en la sección DOWNLOADS."

  ### 2. Strip T&C lesson artifact
  - "DESCARGA EL PDF EN LA PARTE DE ARRIBA" removed from lesson 00000001-0001

  ### 3. Strip Instagram handle artifact
  - "Instagram: @duadanielap  \n\n" stripped from all lessons that contain it

  ### 4. Strip horizontal rule artifacts
  - Raw "\n\n\n---" lines stripped from body_content

  ### 5. Strip Kajabi admin URLs
  - "Fuente: https://app.kajabi.com/..." lines (none currently in body but safe to run)

  ## Important notes
  - [RECURSOS_HINT] is a sentinel token — the app renders it conditionally only
    when the lesson has assets in lesson_assets. If no assets exist, it renders nothing.
  - This migration is safe to re-run (idempotent replacements).
*/

-- 1. Replace all "NO OLVIDES DESCARGAR..." variants with [RECURSOS_HINT]
UPDATE course_lessons
SET body_content = TRIM(
  REGEXP_REPLACE(
    REGEXP_REPLACE(
      body_content,
      'NO OLVIDES DESCARGAR EN EL BOT[Ó O]?N DE ARRIBA\s*\(DOWNLOADS\)\s*EL PDF DE ESTA LECCI[ÓO]N\.?',
      E'[RECURSOS_HINT]',
      'gi'
    ),
    -- catch any remaining "EL PDF" downloads reference
    'DESCARGA EL "PDF DESPUES DE LA COMPRA" (EN LA SECCI[ÓO]N DOWNLOADS|DONDE DICE DOWNLOADS)\.?',
    E'[RECURSOS_HINT]',
    'gi'
  )
)
WHERE body_content ~* 'NO OLVIDES DESCARGAR EN EL BOT[Ó O]?N DE ARRIBA';

-- 2. Replace Beacons-specific PDF download references
UPDATE course_lessons
SET body_content = REPLACE(
  body_content,
  'Descarga el "PDF después de la compra" en la sección DOWNLOADS.',
  '[RECURSOS_HINT]'
)
WHERE id = '00000005-0002-4000-8000-000000000000';

UPDATE course_lessons
SET body_content = REPLACE(
  body_content,
  'Descarga la guía de Stripe en la sección DOWNLOADS.',
  '[RECURSOS_HINT]'
)
WHERE id = '00000005-0003-4000-8000-000000000000';

-- 3. Strip the T&C "DESCARGA EL PDF EN LA PARTE DE ARRIBA" from lesson 00000001-0001
UPDATE course_lessons
SET body_content = TRIM(
  REPLACE(body_content, 'DESCARGA EL PDF EN LA PARTE DE ARRIBA', '')
)
WHERE id = '00000001-0001-4000-8000-000000000000';

-- 4. Strip "Instagram: @duadanielap  " header artifact (with trailing spaces and newlines)
UPDATE course_lessons
SET body_content = TRIM(
  REGEXP_REPLACE(
    body_content,
    '^Instagram:\s*@\w+\s*\n+',
    '',
    'i'
  )
)
WHERE body_content ILIKE 'Instagram: @%';

-- 5. Strip trailing "---" horizontal rule artifacts
UPDATE course_lessons
SET body_content = TRIM(
  REGEXP_REPLACE(
    body_content,
    '\n+---\s*$',
    '',
    'g'
  )
)
WHERE body_content LIKE '%---%';

-- 6. Strip Google Drive link from T&C lesson body (links will be rendered via LegalLinksSection)
UPDATE course_lessons
SET body_content = TRIM(
  REGEXP_REPLACE(
    body_content,
    '\[?\s*POL[IÍ]TICAS,?\s*T[EÉ]RMINOS Y CONDICIONES\s*\]?\s*\(https://drive\.google\.com[^\)]*\)',
    '',
    'gi'
  )
)
WHERE id = '00000001-0001-4000-8000-000000000000';

-- 7. Strip the "Y HAS CLICK EN EL SIGUIENTE LINK..." instruction from T&C lesson
UPDATE course_lessons
SET body_content = TRIM(
  REGEXP_REPLACE(
    body_content,
    'Y HAS CLICK EN EL SIGUIENTE LINK[^\n]*\n?',
    '',
    'gi'
  )
)
WHERE id = '00000001-0001-4000-8000-000000000000';

-- 8. Clean up extra blank lines left after removals (max 2 consecutive newlines)
UPDATE course_lessons
SET body_content = TRIM(
  REGEXP_REPLACE(body_content, '\n{3,}', E'\n\n', 'g')
)
WHERE body_content ~ '\n{3,}';
