/*
  # Fix Cloudinary PDF URLs — image/upload → raw/upload

  PDFs uploaded to Cloudinary must be served via /raw/upload/ (not /image/upload/).
  Using /image/upload/ for PDFs returns HTTP 401 Unauthorized.
  This migration corrects all lesson_assets PDF external_url values.
*/

UPDATE lesson_assets
SET external_url = REPLACE(external_url, '/image/upload/', '/raw/upload/')
WHERE asset_type = 'pdf'
  AND external_url LIKE 'https://res.cloudinary.com/dwp64dtwa/image/upload/%';
