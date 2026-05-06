-- Migration 0001: Deduplicate registros_verificacion and enforce unique local IDs
--
-- Run against the live D1 database:
--   wrangler d1 execute holocontrol --file=migrations/0001_unique_local_id.sql
--
-- 1. Remove duplicate rows, keeping only the row with the lowest id for each
--    (usuario_id, local record id) pair.  Rows with NULL local id are left
--    untouched because a UNIQUE index on an expression that returns NULL does
--    not conflict (SQLite treats each NULL as distinct).
DELETE FROM registros_verificacion
WHERE json_extract(datos_json, '$.id') IS NOT NULL
  AND id NOT IN (
    SELECT MIN(id)
    FROM registros_verificacion
    WHERE json_extract(datos_json, '$.id') IS NOT NULL
    GROUP BY usuario_id, json_extract(datos_json, '$.id')
  );

-- 2. Drop the old non-unique index.
DROP INDEX IF EXISTS idx_registros_local_id;

-- 3. Create the new unique index that prevents future concurrent duplicates.
CREATE UNIQUE INDEX IF NOT EXISTS idx_registros_local_id
  ON registros_verificacion(usuario_id, json_extract(datos_json, '$.id'));
