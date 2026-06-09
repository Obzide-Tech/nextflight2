/*
  # Set Telegram booking URL to @FLIGHTNEXTBOT

  1. Changes
    - Updates `telegram_booking_url` in `system_settings` from empty string to the live bot URL
    - This activates the "Agendar por Telegram" button in the Bitácora tab for all users

  2. Notes
    - Key was seeded in migration 023 with an empty value
    - No RLS changes — existing admin write / public read policies apply
    - Safe to re-run: UPDATE only touches the existing row
*/

UPDATE system_settings
SET value = '"https://t.me/FLIGHTNEXTBOT"',
    updated_at = now()
WHERE key = 'telegram_booking_url';
