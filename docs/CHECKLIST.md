# NextFlight Academy — Checklist de aceptación

Marcado contra la sección 17 del brief maestro.

## Visual

- [x] Respeta branding premium (burgundy + dorado + cream).
- [x] Respeta naming editorial: Check-In, La Terminal, En Vuelo, La Aduana, Sección de Copilotos, Bitácora de Cabina.
- [x] Wordmark "NextFlight" tipográfico (CRONDERegular fallback Playfair), nunca asset bitmap.
- [x] No template SaaS: cards limpias, headers serif, microcopy editorial, sin sombras pesadas.
- [x] Tipografías del sistema sin mezclar fuera de Cronde / Poppins / Glancyr / Satoshi.
- [x] Sin azules, verdes, gradientes ajenos al sistema.
- [x] Iconografía fina (lucide-react-native) consistente.

## Funcional — Auth

- [x] Login (Check-In) con avión circular y "Bienvenida a bordo".
- [x] Registro con auto-perfil + auto-rol student_free + auto-enrollment Starter.
- [x] Recuperar contraseña.
- [x] Mantener sesión iniciada.
- [x] Onboarding 2-3 slides editorial post-signup.
- [x] Cierre de sesión desde perfil.
- [x] Guardia de rutas por sesión.

## Funcional — LMS Estudiante

- [x] La Terminal: avatar, saludo, hero del próximo vuelo con CTA continuar.
- [x] La Terminal: gráfico de "Mi progreso · últimos 7 días" + barra meta mensual con %.
- [x] En Vuelo: lista de programas + módulos + lecciones.
- [x] Player con URL firmada via Edge Function `sign-lesson-url` (TTL 60s, valida enrollment + suscripción).
- [x] Player web con `<video>` HTML5; placeholder nativo listo para `expo-av`.
- [x] Marcar como visto persiste a `lesson_progress`.
- [x] Bitácora de notas privada con autosave debounced 1.2s.
- [x] Recursos descargables listados por módulo.
- [x] Lecciones premium muestran CTA "Activa tu suscripción" si no hay enrollment ni sub activa.

## Funcional — Aduana / Pagos

- [x] Suscripción activa con plataforma + fecha de expiración.
- [x] Métodos vinculados al Apple ID / Google Account (no almacenamos PAN).
- [x] CTA Apple Pay / Google Pay nativa (mock vía hook `useStorePurchase` hasta credenciales reales).
- [x] Restore Purchases.
- [x] Deep link al gestor de suscripciones del SO.
- [x] Edge Functions `validate-apple-receipt`, `validate-google-receipt`, `apple-server-notifications-v2`, `google-rtdn` desplegadas.
- [x] Trigger `nf_subscriptions_sync_role` mantiene `student_premium` al día.

## Funcional — Copilotos / Afiliados

- [x] Activación de perfil de afiliada con T&C.
- [x] Enlace único con código corto + Share/copy nativo.
- [x] Mi red: cards de referidos con sales + estado.
- [x] Wallet: pending / available / retained / paid desde `wallet_balances`.
- [x] Solicitud de retiro con validación de saldo mínimo + gate KYC.
- [x] KYC con upload real (web file picker + nativo via `expo-image-picker`).
- [x] `request-payout` y `admin-process-payout` Edge Functions desplegadas.
- [x] `capture-attribution` pública para `?ref=CODE` (TTL 30d configurable).
- [x] Universal Links iOS + App Links Android: dominio + AASA/assetlinks servidos por `well-known` Edge Function.
- [x] Aislamiento RLS: ningún afiliado ve red/ventas/comisiones de otro.

## Funcional — Notificaciones

- [x] Tabla `push_tokens` poblada al login (Expo Push token, vía `lib/push.ts`).
- [x] Edge Function `send-notification` (admin) hace fan-out por Expo Push + escribe `app_notifications`.

## Funcional — Datos

- [x] 28+ tablas con RLS estricto.
- [x] Triggers ledger: `nf_recompute_wallet`, `nf_ledger_after_change`, `nf_accrue_commission`, `nf_capture_attribution`.
- [x] Wallet balances derivados de ledger inmutable, nunca calculados al vuelo.
- [x] `system_settings` sembrado: comisión 30%, atribución 30d, mínimo $50 USD.
- [x] Audit log automático en cambios sensibles (`admin_audit_log`).

## Demo

- [x] 9 cuentas demo con password `NF_Demo2026!` (ver `docs/DEMO_ACCOUNTS.md`).
- [x] Programa Starter (3 módulos × 4 lecciones, 1 free, recursos por módulo).
- [x] Programa Premium Method (5 módulos premium con afiliación habilitada).
- [x] María Rodríguez al 67% de progreso.
- [x] Gabriela Pinto con 4 referidas (Andrea inactiva, Juan activo, +2), 2 ventas confirmadas, 1 pendiente, 1 retenida, 1 payout pagado, 1 pendiente.
- [x] Fernanda híbrida sin duplicar usuario.
- [x] Teresa Rincón visible como tutora.
- [x] 2 tickets de soporte demo, 3 FAQs, 1 novedad del mes.

## Pendiente (siguiente sesión)

- [ ] Admin Web Next.js — spec completo en `docs/ADMIN_PLAN.md`.
- [ ] Reemplazar mocks de IAP por `react-native-iap` cuando lleguen credenciales sandbox de App Store Connect / Google Play Console.
- [ ] Capturar SHA-256 real de la firma Android y Team ID Apple en `well-known` Edge Function (placeholders ahora).
- [ ] Grabar video demo siguiendo `docs/VIDEO_GUION.md`.
- [ ] Build EAS (APK Android + TestFlight iOS) con `eas build`.

## Lo que NO se debe hacer (sección 18 brief)

- [x] No usamos logo inventado.
- [x] No reemplazamos wordmark por serif random.
- [x] No usamos colores fuera del sistema.
- [x] Módulo afiliado completamente funcional, no maqueta.
- [x] Sin duplicar usuario al sumar rol afiliada.
- [x] Pagos con estados claros (`confirmed`, `pending`, `refunded`, `failed`, `expired`, `grace_period`, `on_hold`).
- [x] Player nunca sirve archivo público — siempre URL firmada con TTL 60s + validación de acceso.
- [x] Soporte funcional (tickets + FAQs + novedades).
- [x] Admin con reportes + auditoría documentada (queda implementación web pendiente).
