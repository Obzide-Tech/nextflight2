# NextFlight Academy — Handoff de demo al cliente

## URL pública (a hospedar)

El build web (`dist/`) está listo. Sube a Vercel/Netlify/Cloudflare Pages apuntando:

- Build command: `npm run build:web`
- Output directory: `dist`
- Variables de entorno:
  - `EXPO_PUBLIC_SUPABASE_URL` (mismo valor que `.env`)
  - `EXPO_PUBLIC_SUPABASE_ANON_KEY` (mismo valor que `.env`)

`vercel.json` ya está configurado con rewrites para `/.well-known/*` (AASA + assetlinks)
y SPA fallback. Solo conecta el repo y deploy.

## Tres entornos en una sola PWA

- `app.nextflight.app/` → estudiante / afiliada (mobile-first)
- `app.nextflight.app/(admin)/dashboard` → panel administrativo (web-first, gated por rol `admin_*`)

Cuando una persona con rol admin entra desde un navegador desktop, se redirige
automáticamente al dashboard administrativo. En mobile, los admins aterrizan en
La Terminal y pueden cambiar de rol manualmente.

## Cuentas demo (password universal: `NF_Demo2026!`)

| Email                       | Persona                | Vista                                  |
| --------------------------- | ---------------------- | -------------------------------------- |
| `admin@nextflight.demo`     | Capitán Admin          | Panel administrativo completo          |
| `maria@nextflight.demo`     | María (premium)        | LMS con progreso real al 67%           |
| `gabriela@nextflight.demo`  | Gabriela (top affiliate) | Wallet + red de 4 referidas + KYC    |
| `fernanda@nextflight.demo`  | Fernanda (híbrida)     | Estudiante premium + afiliada          |
| `carlos@nextflight.demo`    | Carlos (referido)      | Compra confirmada vía Gabriela         |
| `ana@nextflight.demo`       | Ana (referida)         | Compra confirmada                      |
| `luis@nextflight.demo`      | Luis (referido)        | Compra pendiente, ticket abierto       |
| `sofia@nextflight.demo`     | Sofía (churned)        | Suscripción expirada                   |
| `teresa@nextflight.demo`    | Teresa (tutora)        | Editor de contenido                    |

## Plantilla de mensaje al cliente

```
Hola [Cliente],

Te comparto el acceso a la primera demo end-to-end de NextFlight Academy.
Esta versión corre como PWA — la abres desde el navegador del teléfono y
se ve igual que la app nativa que publicaremos en App Store y Google Play.

Demo móvil (estudiantes y afiliadas):
  https://[TU-DEPLOY-URL]
  Tip iPhone: Safari → Compartir → "Añadir a pantalla de inicio".

Panel administrativo financiero (recomendado abrir en computadora):
  https://[TU-DEPLOY-URL]/(admin)/dashboard
  Acceso: admin@nextflight.demo / NF_Demo2026!

Cuentas para probar el flujo de estudiante y afiliada (mismo password):
  · maria@nextflight.demo     — estudiante premium con progreso al 67%
  · gabriela@nextflight.demo  — afiliada top con wallet, red y retiros
  · fernanda@nextflight.demo  — cuenta híbrida (estudiante + afiliada)

Qué vas a poder ver:
  1. Check-In premium con avión circular y "Bienvenida a bordo".
  2. La Terminal con tu progreso semanal real y meta mensual.
  3. En Vuelo: lecciones con video servido por URL firmada (TTL 60s).
  4. Bitácora de notas privadas con autosave.
  5. La Aduana con suscripción activa, métodos vinculados, restore y
     "Gestionar suscripción" hacia el SO.
  6. Sección de Copilotos con wallet (pending / available / retained / paid),
     red de referidas, solicitud de retiro y KYC con upload de documento.
  7. Panel admin con dashboard financiero por plataforma (Apple/Google),
     cola de payouts (aprobar / rechazar / marcar pagado), trazabilidad
     de transacciones, gestión de usuarios, contenido, notificaciones,
     bitácora de auditoría y feature flags.

Notas honestas para esta demo:
  · Los pagos Apple Pay / Google Pay están en modo simulado. El flujo
    visual y de estados es 1:1 con producción; cuando Apple y Google
    nos den las credenciales sandbox, conectamos los SDK reales sin
    cambiar la UX.
  · El reproductor de video funciona con `<video>` HTML5 en web. La
    app nativa con `expo-av` se compila en el siguiente sprint.
  · La app instalable (TestFlight iOS / APK Android) sale con el build
    EAS preview. Te aviso cuando esté para que la pruebes nativamente.

Cualquier feedback o cambio de copy / diseño me lo mandas directo y lo
iteramos sobre la marcha.

Un abrazo,
[Tu nombre]
```

## Smoke test antes de mandar el mensaje

1. `admin@nextflight.demo` → debe abrir `/(admin)/dashboard` con KPIs
   reales y cola de payouts no vacía.
2. `gabriela@nextflight.demo` → tab Copilotos muestra wallet con saldos,
   red con 4 referidas, 1 retiro pagado y 1 solicitado.
3. `maria@nextflight.demo` → La Terminal muestra hero "Continuar vuelo"
   con progreso 67%, gráfico semanal y meta mensual.
4. Aprueba un payout desde el admin con `admin@nextflight.demo` → entra a
   `/(admin)/audit` y verifica que aparece la línea correspondiente.
5. Envía una notificación de prueba desde `/(admin)/notifications` a la
   audiencia "Toda la comunidad" → confirma que llega `count` > 0.

## Pendiente fuera del alcance de esta demo

- Build EAS preview (TestFlight + APK) — requiere credenciales Expo.
- IAP real con `react-native-iap` — requiere productos sandbox de
  App Store Connect y Google Play Console.
- Apple Team ID + Android SHA-256 reales en `well-known` (placeholders).
- Hosting en `nextflight.app` con DNS apuntando al deploy.
- Video demo grabado siguiendo `docs/VIDEO_GUION.md`.
