/*
  # Fix Cloudinary PDF URLs — revert raw + add fl_attachment flag

  Two problems fixed in one migration:
  1. Revert the incorrect /raw/upload/ path back to /image/upload/
  2. Add fl_attachment transformation flag so Cloudinary serves the PDF
     as a direct file download instead of trying to process it as an image
     (which causes 401 Unauthorized on accounts without PDF transformations).

  Final URL format:
  https://res.cloudinary.com/dwp64dtwa/image/upload/fl_attachment/v.../FILE.pdf
*/

UPDATE lesson_assets
SET external_url = REPLACE(external_url, '/raw/upload/', '/image/upload/fl_attachment/')
WHERE asset_type = 'pdf'
  AND external_url LIKE 'https://res.cloudinary.com/dwp64dtwa/raw/upload/%';
