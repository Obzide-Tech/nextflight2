# Guion del video demo — NextFlight Academy

Duración estimada: 8-10 minutos. Grabar en build TestFlight (iOS) o APK preview (Android) con
las cuentas demo del archivo `DEMO_ACCOUNTS.md` (password universal `NF_Demo2026!`).

## Pre-requisitos

1. Build EAS preview corriendo en dispositivo físico.
2. Sesiones cerradas para empezar limpio.
3. Notificaciones permitidas en el dispositivo de grabación.
4. `system_settings.iap_mock_mode = true` (default).

---

## 1. Splash + Check-In premium (00:00 — 00:30)
- Mostrar splash con wordmark Cronde + degradado burdeos.
- Pantalla CHECK-IN: avión circular + "Bienvenida a bordo".
- Login con `maria@nextflight.demo`.

## 2. La Terminal con progreso real (00:30 — 01:15)
- Hero del próximo vuelo con CTA "Continuar vuelo" (María a 67%).
- Gráfico semanal con barras y meta mensual con %.
- Mostrar "Bitácora reciente" con la novedad del mes.

## 3. En Vuelo — entrar a una lección (01:15 — 02:30)
- Tab Cursos → módulo NextFlight Starter.
- Abrir lección "Mentalidad de despegue".
- Tap "Reproducir": Edge Function `sign-lesson-url` devuelve URL firmada (TTL 60s).
- Player web reproduce video; en mobile placeholder con duración.
- Marcar como vista → CTA cambia a "Lección completada".

## 4. Bitácora de notas privadas (02:30 — 03:00)
- Tab "Mis notas".
- Escribir un párrafo, ver "Guardando..." → "Guardado · solo tú puedes ver esto".
- Cambiar de lección y volver: la nota persiste.

## 5. Recursos descargables (03:00 — 03:20)
- Tab "Recursos".
- Lista PDFs y plantillas del módulo.

## 6. La Aduana — suscripción y métodos (03:20 — 04:10)
- Tab Aduana.
- Card de suscripción activa con punto verde + fecha de renovación.
- Lista de métodos vinculados (Apple ID / Google Account).
- Botón "Restaurar compras".
- Botón "Gestionar suscripción" abre el deep link al gestor del SO.

## 7. Sección de Copilotos — abrir como Gabriela (04:10 — 06:00)
- Cerrar sesión, entrar como `gabriela@nextflight.demo`.
- Resumen wallet (pending / available / retained / paid).
- Tarjeta "Mi enlace": copiar y disparar Share nativo.
- Tab Mi red: cards de Andrea (inactiva), Juan (activo), 2 más.
- Tab Ventas / Comisiones.

## 8. Solicitud de retiro + KYC (06:00 — 07:00)
- Tap "Solicitar retiro" → form con monto.
- Si Gabriela aún no tiene KYC aprobado, modal redirige a KYC.
- Subir frente del documento (web file picker / nativo image picker).
- Submit → estado pasa a "En revisión".

## 9. Cuenta híbrida sin duplicar (07:00 — 07:30)
- Cerrar sesión, entrar como `fernanda@nextflight.demo`.
- Verificar que tiene roles `student_premium` + `affiliate` en perfil.
- Tabs Cursos y Copilotos accesibles desde la misma cuenta.

## 10. Admin financiero (próxima sesión — Next.js admin)
- Por ahora se muestra el plan en `docs/ADMIN_PLAN.md`.
- Cubre: dashboard consolidado por plataforma (Apple / Google), trazabilidad por afiliada,
  payout queue, gestión de programas, soporte, auditoría.

## 11. Cierre (07:30 — 08:00)
- Volver al wordmark NextFlight.
- Mostrar `PROGRESS.md` y `CHECKLIST.md` confirmando entregables.

---

## Toma técnica

- Grabar a 60fps si el dispositivo lo permite.
- Resolución 1080p o superior.
- Sin notificaciones de terceros visibles (modo no molestar).
- Voz en off opcional siguiendo el tono editorial: empoderamiento, profesionalismo, cercanía,
  innovación, claridad (ver `COPY_TONE.md`).
