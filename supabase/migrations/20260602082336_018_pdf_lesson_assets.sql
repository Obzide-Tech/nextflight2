/*
  # PDF Lesson Assets — Batch Insert

  Inserts 34 PDF resources into lesson_assets, each linked to its corresponding
  course lesson via lesson_id. PDFs are hosted on Cloudinary.

  ## Lessons covered
  - Module 01: L5, L6, L7 (tripulacion, pasos al vender, 10 maneras monetizar)
  - Module 03: L4 (maneja tu mente)
  - Module 04: L4, L6 (habitos dia a dia, organizacion semanal)
  - Module 05: L2, L3 (beacons tienda, stripe pagos)
  - Module 08: L5 (IA prompts)
  - Module 15: L1, L4, L5 (imagen estrategica, maquillaje, skincare)
  - Module 16: L8 (encontrar tu nicho)
  - Module 20: L1, L3, L4, L5, L7 (mentalidad vendedora, vende sin vender, torre control, cierre, historias)
  - Module 21: L5, L9 (cierre psicologico, objeciones)
  - Module 27: L8 (email marketing fin modulo)
  - Module 32: L2, L6, L8 (bio ig, algoritmo, mensajes)
  - Module 33: L2 (plan vuelo diario — 10 guias de reto)

  ## Notes
  - module_id populated via subselect from course_lessons for referential completeness
  - is_premium_only = true for all assets (content is premium)
  - POLITICAS PDF intentionally excluded (lesson already has legal page link)
*/

INSERT INTO lesson_assets (lesson_id, module_id, title, asset_type, external_url, is_premium_only)
VALUES

-- Module 01 — Bienvenidos a Bordo
(
  '00000001-0005-4000-8000-000000000000',
  (SELECT module_id FROM course_lessons WHERE id = '00000001-0005-4000-8000-000000000000'),
  'Conviértete en Parte de la Tripulación (Afiliados)',
  'pdf',
  'https://res.cloudinary.com/dwp64dtwa/image/upload/v1780387967/CONVIERTETE_EN_PARTE_DE_LA_TRIPULACIO_N_qfsbd8.pdf',
  true
),
(
  '00000001-0006-4000-8000-000000000000',
  (SELECT module_id FROM course_lessons WHERE id = '00000001-0006-4000-8000-000000000000'),
  'Pasos a Seguir al Vender',
  'pdf',
  'https://res.cloudinary.com/dwp64dtwa/image/upload/v1780387996/PASOS_A_SEGUIR_AL_VENDER_vfa6jg.pdf',
  true
),
(
  '00000001-0007-4000-8000-000000000000',
  (SELECT module_id FROM course_lessons WHERE id = '00000001-0007-4000-8000-000000000000'),
  'Más de 10 Maneras de Monetizar con Next Flight',
  'pdf',
  'https://res.cloudinary.com/dwp64dtwa/image/upload/v1780387996/MAS_DE_10_MANERAS_DE_MOTENIZAR_CON_NEXT_FLIGTH_k0yq1q.pdf',
  true
),

-- Module 03 — Ruta de GPS Interno
(
  '00000003-0004-4000-8000-000000000000',
  (SELECT module_id FROM course_lessons WHERE id = '00000003-0004-4000-8000-000000000000'),
  'Torre de Mando Mental',
  'pdf',
  'https://res.cloudinary.com/dwp64dtwa/image/upload/v1780387643/TORRE_DE_MANDO_MENTAL_xrkm9n.pdf',
  true
),

-- Module 04 — Cabina de Hábitos Poderosos
(
  '00000004-0004-4000-8000-000000000000',
  (SELECT module_id FROM course_lessons WHERE id = '00000004-0004-4000-8000-000000000000'),
  'Hábitos del Día a Día',
  'pdf',
  'https://res.cloudinary.com/dwp64dtwa/image/upload/v1780387650/H_BITOS_DEL_D_A_A_D_A_vitxiy.pdf',
  true
),
(
  '00000004-0006-4000-8000-000000000000',
  (SELECT module_id FROM course_lessons WHERE id = '00000004-0006-4000-8000-000000000000'),
  'Claves para una Organización Eficaz',
  'pdf',
  'https://res.cloudinary.com/dwp64dtwa/image/upload/v1780387645/CLAVES_PARA_UNA_ORGANIZACI_N_EFICAZ_yn8zqa.pdf',
  true
),

-- Module 05 — Ruta de Beacons
(
  '00000005-0002-4000-8000-000000000000',
  (SELECT module_id FROM course_lessons WHERE id = '00000005-0002-4000-8000-000000000000'),
  'PDF Después de la Compra',
  'pdf',
  'https://res.cloudinary.com/dwp64dtwa/image/upload/v1780387652/PDF_DESPUE_S_DE_LA_COMPRA_1__krymmr.pdf',
  true
),
(
  '00000005-0003-4000-8000-000000000000',
  (SELECT module_id FROM course_lessons WHERE id = '00000005-0003-4000-8000-000000000000'),
  'Guía Stripe — Cómo Recibir Pagos',
  'pdf',
  'https://res.cloudinary.com/dwp64dtwa/image/upload/v1780387655/GUIA_STRIPE_ee44xf.pdf',
  true
),

-- Module 08 — Vuela Más Rápido con IA
(
  '00000008-0005-4000-8000-000000000000',
  (SELECT module_id FROM course_lessons WHERE id = '00000008-0005-4000-8000-000000000000'),
  '150 Prompts de ChatGPT (Ebook)',
  'pdf',
  'https://res.cloudinary.com/dwp64dtwa/image/upload/v1780387660/150_PROMPTS_CHATGPT_EBOOK_unvxio.pdf',
  true
),

-- Module 15 — Cabina de Imagen Estratégica
(
  '00000015-0001-4000-8000-000000000000',
  (SELECT module_id FROM course_lessons WHERE id = '00000015-0001-4000-8000-000000000000'),
  'Links para tus Outfits',
  'pdf',
  'https://res.cloudinary.com/dwp64dtwa/image/upload/v1780387670/links_para_tus_outfits__wsphif.pdf',
  true
),
(
  '00000015-0004-4000-8000-000000000000',
  (SELECT module_id FROM course_lessons WHERE id = '00000015-0004-4000-8000-000000000000'),
  'Guía de Maquillaje — Karem Reyes',
  'pdf',
  'https://res.cloudinary.com/dwp64dtwa/image/upload/v1780387651/GUIA_MAKEUP_KAREM_REYES_aad0ue.pdf',
  true
),
(
  '00000015-0005-4000-8000-000000000000',
  (SELECT module_id FROM course_lessons WHERE id = '00000015-0005-4000-8000-000000000000'),
  'Guía de Skincare — Karem Reyes',
  'pdf',
  'https://res.cloudinary.com/dwp64dtwa/image/upload/v1780387665/GUIA_SKINCARE_KAREM_REYES_knjtl2.pdf',
  true
),

-- Module 16 — Puerta de Embarque de tu Marca
(
  '00000016-0008-4000-8000-000000000000',
  (SELECT module_id FROM course_lessons WHERE id = '00000016-0008-4000-8000-000000000000'),
  'Cómo Encontrar tu Nicho',
  'pdf',
  'https://res.cloudinary.com/dwp64dtwa/image/upload/v1780387644/_COMO_ENCONTRAR_TU_NICHO_vzabd3.pdf',
  true
),

-- Module 20 — Sala VIP de las Ventas Estratégicas
(
  '00000020-0001-4000-8000-000000000000',
  (SELECT module_id FROM course_lessons WHERE id = '00000020-0001-4000-8000-000000000000'),
  'Pasos a Seguir al Vender (v.2)',
  'pdf',
  'https://res.cloudinary.com/dwp64dtwa/image/upload/v1780387995/PASOS_A_SEGUIR_AL_VENDER_1_uwi3ld.pdf',
  true
),
(
  '00000020-0003-4000-8000-000000000000',
  (SELECT module_id FROM course_lessons WHERE id = '00000020-0003-4000-8000-000000000000'),
  'Vende sin Vender en Primera Clase',
  'pdf',
  'https://res.cloudinary.com/dwp64dtwa/image/upload/v1780387643/VENDE_SIN_VENDER_EN_PRIMERA_CLASE_w6ykez.pdf',
  true
),
(
  '00000020-0004-4000-8000-000000000000',
  (SELECT module_id FROM course_lessons WHERE id = '00000020-0004-4000-8000-000000000000'),
  'Torre de Control Mental',
  'pdf',
  'https://res.cloudinary.com/dwp64dtwa/image/upload/v1780387644/TORRE_DE_CONTROL_MENTAL_azzlad.pdf',
  true
),
(
  '00000020-0005-4000-8000-000000000000',
  (SELECT module_id FROM course_lessons WHERE id = '00000020-0005-4000-8000-000000000000'),
  'Estrategias de Cierre',
  'pdf',
  'https://res.cloudinary.com/dwp64dtwa/image/upload/v1780387645/ESTRATEGIAS_DE_CIERRE_tgyixy.pdf',
  true
),
(
  '00000020-0007-4000-8000-000000000000',
  (SELECT module_id FROM course_lessons WHERE id = '00000020-0007-4000-8000-000000000000'),
  '12 Días de Contenido para Stories que Conectan y Venden',
  'pdf',
  'https://res.cloudinary.com/dwp64dtwa/image/upload/v1780387644/12_d_as_de_contenido_para_stories_que_conectan_y_venden_ffodgp.pdf',
  true
),

-- Module 21 — Torre Estratégica de la Venta Profesional
(
  '00000021-0005-4000-8000-000000000000',
  (SELECT module_id FROM course_lessons WHERE id = '00000021-0005-4000-8000-000000000000'),
  'Cierres de Venta',
  'pdf',
  'https://res.cloudinary.com/dwp64dtwa/image/upload/v1780387644/CIERRES_DE_VENTA_iasn2z.pdf',
  true
),
(
  '00000021-0009-4000-8000-000000000000',
  (SELECT module_id FROM course_lessons WHERE id = '00000021-0009-4000-8000-000000000000'),
  'Guía Dorada de Objeciones',
  'pdf',
  'https://res.cloudinary.com/dwp64dtwa/image/upload/v1780387645/GUIA_DORADA_DE_OBJECIONES_wrmle6.pdf',
  true
),

-- Module 27 — Torre de Control de Email Marketing
(
  '00000027-0008-4000-8000-000000000000',
  (SELECT module_id FROM course_lessons WHERE id = '00000027-0008-4000-8000-000000000000'),
  'Email Marketing — Guía Completa',
  'pdf',
  'https://res.cloudinary.com/dwp64dtwa/image/upload/v1780387646/EMAIL_MARKETING_szmopk.pdf',
  true
),

-- Module 32 — Torre de Control de tu Marca en Instagram
(
  '00000032-0002-4000-8000-000000000000',
  (SELECT module_id FROM course_lessons WHERE id = '00000032-0002-4000-8000-000000000000'),
  'Prompt para tu Bio de Instagram',
  'pdf',
  'https://res.cloudinary.com/dwp64dtwa/image/upload/v1780387653/PROMT_PARA_TU_BIO_DE_IG_xh7bw2.pdf',
  true
),
(
  '00000032-0006-4000-8000-000000000000',
  (SELECT module_id FROM course_lessons WHERE id = '00000032-0006-4000-8000-000000000000'),
  'Torre de Control de tu Marca en Instagram',
  'pdf',
  'https://res.cloudinary.com/dwp64dtwa/image/upload/v1780387644/TORRE_DE_CONTROL_DE_TU_MARCA_EN_INSTAGRAM_uas3w6.pdf',
  true
),
(
  '00000032-0008-4000-8000-000000000000',
  (SELECT module_id FROM course_lessons WHERE id = '00000032-0008-4000-8000-000000000000'),
  'Mensajes que Venden',
  'pdf',
  'https://res.cloudinary.com/dwp64dtwa/image/upload/v1780387652/MENSAJES_QUE_VENDEN_hczlqo.pdf',
  true
),

-- Module 33 — Puerta de Embarque a la Facturación con Retos (10 guías)
(
  '00000033-0002-4000-8000-000000000000',
  (SELECT module_id FROM course_lessons WHERE id = '00000033-0002-4000-8000-000000000000'),
  'Guía Reto 1',
  'pdf',
  'https://res.cloudinary.com/dwp64dtwa/image/upload/v1780387645/GUIA_RETO_1_rjrt0y.pdf',
  true
),
(
  '00000033-0002-4000-8000-000000000000',
  (SELECT module_id FROM course_lessons WHERE id = '00000033-0002-4000-8000-000000000000'),
  'Guía Reto 2',
  'pdf',
  'https://res.cloudinary.com/dwp64dtwa/image/upload/v1780387646/GUIA_RETO_2_erkvdy.pdf',
  true
),
(
  '00000033-0002-4000-8000-000000000000',
  (SELECT module_id FROM course_lessons WHERE id = '00000033-0002-4000-8000-000000000000'),
  'Guía Reto 3',
  'pdf',
  'https://res.cloudinary.com/dwp64dtwa/image/upload/v1780387646/GUIA_RETO_3_cpsjlh.pdf',
  true
),
(
  '00000033-0002-4000-8000-000000000000',
  (SELECT module_id FROM course_lessons WHERE id = '00000033-0002-4000-8000-000000000000'),
  'Guía Reto 4',
  'pdf',
  'https://res.cloudinary.com/dwp64dtwa/image/upload/v1780387646/GUIA_RETO_4_iifpjm.pdf',
  true
),
(
  '00000033-0002-4000-8000-000000000000',
  (SELECT module_id FROM course_lessons WHERE id = '00000033-0002-4000-8000-000000000000'),
  'Guía Reto 5',
  'pdf',
  'https://res.cloudinary.com/dwp64dtwa/image/upload/v1780387647/GUIA_RETO_5_dy11gl.pdf',
  true
),
(
  '00000033-0002-4000-8000-000000000000',
  (SELECT module_id FROM course_lessons WHERE id = '00000033-0002-4000-8000-000000000000'),
  'Guía Reto 6',
  'pdf',
  'https://res.cloudinary.com/dwp64dtwa/image/upload/v1780387647/GUIA_RETO_6_puhpai.pdf',
  true
),
(
  '00000033-0002-4000-8000-000000000000',
  (SELECT module_id FROM course_lessons WHERE id = '00000033-0002-4000-8000-000000000000'),
  'Guía Reto 7',
  'pdf',
  'https://res.cloudinary.com/dwp64dtwa/image/upload/v1780387647/GUIA_RETO_7_abwvvl.pdf',
  true
),
(
  '00000033-0002-4000-8000-000000000000',
  (SELECT module_id FROM course_lessons WHERE id = '00000033-0002-4000-8000-000000000000'),
  'Guía Reto 8',
  'pdf',
  'https://res.cloudinary.com/dwp64dtwa/image/upload/v1780387647/GUIA_RETO_8_fnkowg.pdf',
  true
),
(
  '00000033-0002-4000-8000-000000000000',
  (SELECT module_id FROM course_lessons WHERE id = '00000033-0002-4000-8000-000000000000'),
  'Guía Reto 9',
  'pdf',
  'https://res.cloudinary.com/dwp64dtwa/image/upload/v1780387648/GUIA_RETO_9_f1iwcs.pdf',
  true
),
(
  '00000033-0002-4000-8000-000000000000',
  (SELECT module_id FROM course_lessons WHERE id = '00000033-0002-4000-8000-000000000000'),
  'Guía Reto 10',
  'pdf',
  'https://res.cloudinary.com/dwp64dtwa/image/upload/v1780387648/GUIA_RETO_10_udmstx.pdf',
  true
);
