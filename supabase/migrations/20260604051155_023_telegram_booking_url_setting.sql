/*
  # Add telegram_booking_url to system_settings

  1. Changes
    - Inserts a new row in `system_settings` with key `telegram_booking_url`
    - Default value is an empty string — admin sets the actual t.me link from the admin panel
    - When set, the Soporte tab in the app shows an active "Agendar por Telegram" button
    - When empty, the button shows as "Disponible pronto" (disabled state)

  2. Notes
    - Uses INSERT ... ON CONFLICT DO NOTHING so re-running is safe
    - No RLS changes needed — system_settings already has public read + admin write policies
*/

INSERT INTO system_settings (key, value, description, updated_at)
VALUES (
  'telegram_booking_url',
  '""',
  'URL del bot o grupo de Telegram para reservas (ej: https://t.me/nextflightbot). Dejar vacío para ocultar el botón.',
  now()
)
ON CONFLICT (key) DO NOTHING;
