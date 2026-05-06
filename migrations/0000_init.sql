-- ================================================================
-- Holocontrol — Migration 0000: Schema inicial
-- Ejecutar ANTES que cualquier otra migración:
--   wrangler d1 execute holocontrol --file=migrations/0000_init.sql
-- ================================================================

-- ── SOCIOS ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS socios (
  id   TEXT PRIMARY KEY,
  nombre TEXT NOT NULL
);

-- ── USUARIOS (admin panel) ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS usuarios (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre    TEXT NOT NULL,
  user      TEXT NOT NULL UNIQUE,
  pass_hash TEXT NOT NULL,
  pass_salt TEXT NOT NULL,
  pin_hash  TEXT,
  pin_salt  TEXT,
  rol       TEXT NOT NULL DEFAULT 'personal',
  socio_id  TEXT REFERENCES socios(id),
  activo    INTEGER NOT NULL DEFAULT 1
);

-- ── PROVEEDORES ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS proveedores (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre      TEXT NOT NULL UNIQUE,
  contacto    TEXT,
  tel         TEXT,
  precio      REAL NOT NULL DEFAULT 0,
  fecha_precio TEXT
);

-- Proveedor especial para UVA/dictámenes
CREATE TABLE IF NOT EXISTS proveedor_uva (
  id          INTEGER PRIMARY KEY CHECK(id = 1),
  nombre      TEXT NOT NULL DEFAULT 'Proveedor UVA',
  contacto    TEXT,
  tel         TEXT,
  precio      REAL NOT NULL DEFAULT 3.50,
  fecha_precio TEXT
);

-- ── VERIFICADORES ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS verificadores (
  id           TEXT PRIMARY KEY,
  nombre       TEXT NOT NULL,
  socio_id     TEXT REFERENCES socios(id),
  zona         TEXT,
  tel          TEXT,
  email        TEXT,
  tipo_usuario TEXT NOT NULL DEFAULT 'verificador',
  activo       INTEGER NOT NULL DEFAULT 1
);

-- Folios asignados por el socio al verificador
CREATE TABLE IF NOT EXISTS verificador_asignaciones (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  ver_id    TEXT NOT NULL REFERENCES verificadores(id) ON DELETE CASCADE,
  tipo      TEXT NOT NULL,
  subtipo   TEXT,
  folio_ini TEXT NOT NULL,
  folio_fin TEXT NOT NULL,
  cant      INTEGER NOT NULL,
  notas     TEXT
);

-- ── EQUIPO PATRÓN ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS asignaciones_equipo (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  equipo_id           TEXT NOT NULL,
  verificador_id      TEXT REFERENCES verificadores(id) ON DELETE SET NULL,
  verificador_nombre  TEXT,
  socio_id            TEXT REFERENCES socios(id),
  fecha               TEXT,
  dias                TEXT
);

-- ── COMPRAS ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS compras (
  folio    TEXT PRIMARY KEY,
  factura  TEXT,
  fecha    TEXT NOT NULL,
  prov_id  INTEGER REFERENCES proveedores(id),
  precio   REAL NOT NULL DEFAULT 0,
  notas    TEXT
);

CREATE TABLE IF NOT EXISTS compras_partes (
  id       INTEGER PRIMARY KEY AUTOINCREMENT,
  folio    TEXT NOT NULL REFERENCES compras(folio) ON DELETE CASCADE,
  socio_id TEXT NOT NULL REFERENCES socios(id),
  tipo     TEXT NOT NULL,
  cant     INTEGER NOT NULL DEFAULT 0
);

-- ── RECEPCIONES ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS recepciones (
  folio        TEXT PRIMARY KEY,
  orden        TEXT REFERENCES compras(folio),
  prov_nombre  TEXT,
  fecha        TEXT NOT NULL,
  hora         TEXT,
  total        INTEGER NOT NULL DEFAULT 0,
  quien        TEXT,
  notas        TEXT,
  asignacion   TEXT,
  por_tipo     TEXT
);

-- ── DICTÁMENES ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS dictamenes (
  folio      TEXT PRIMARY KEY,
  factura    TEXT,
  fecha      TEXT NOT NULL,
  socio_id   TEXT REFERENCES socios(id),
  folio_ini  TEXT NOT NULL,
  folio_fin  TEXT NOT NULL,
  cant       INTEGER NOT NULL DEFAULT 0,
  precio     REAL NOT NULL DEFAULT 0,
  notas      TEXT
);

-- ── COMPRAS UVA ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS uva_compras (
  folio      TEXT PRIMARY KEY,
  factura    TEXT,
  fecha      TEXT NOT NULL,
  socio_id   TEXT REFERENCES socios(id),
  tipo_uva   TEXT NOT NULL,
  folio_ini  TEXT NOT NULL,
  folio_fin  TEXT NOT NULL,
  cant       INTEGER NOT NULL DEFAULT 0,
  precio     REAL NOT NULL DEFAULT 0,
  notas      TEXT
);

-- ── TRANSFERENCIAS ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS transferencias (
  folio              TEXT PRIMARY KEY,
  tipo               TEXT NOT NULL,
  subtipo            TEXT,
  de                 TEXT NOT NULL,
  a                  TEXT NOT NULL,
  fecha              TEXT NOT NULL,
  folio_ini          TEXT,
  folio_fin          TEXT,
  cant               INTEGER NOT NULL DEFAULT 0,
  notas              TEXT,
  estado             TEXT NOT NULL DEFAULT 'pendiente',
  socio_emisor       TEXT,
  socio_receptor     TEXT,
  fecha_confirm      TEXT,
  confirmada_por     TEXT,
  autorizada_por     TEXT,
  fecha_autorizacion TEXT,
  aprob_socio_emisor  TEXT,
  aprob_socio_receptor TEXT
);

-- ── REGISTROS VERIFICACIÓN ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS registros_verificacion (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  usuario_id      INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  folio_dict      TEXT,
  folio_holo      TEXT,
  folio_uva       TEXT,
  marca           TEXT,
  modelo          TEXT,
  tipo_instrumento TEXT,
  resultado       TEXT,
  fecha           TEXT NOT NULL,
  hora            TEXT,
  notas           TEXT,
  datos_json      TEXT
);

-- ── ÍNDICES ─────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_usuarios_user              ON usuarios(user);
CREATE INDEX IF NOT EXISTS idx_verificadores_socio        ON verificadores(socio_id);
CREATE INDEX IF NOT EXISTS idx_asignaciones_equipo_verif  ON asignaciones_equipo(verificador_id);
CREATE INDEX IF NOT EXISTS idx_compras_partes_folio       ON compras_partes(folio);
CREATE INDEX IF NOT EXISTS idx_recepciones_orden          ON recepciones(orden);
CREATE INDEX IF NOT EXISTS idx_registros_usuario          ON registros_verificacion(usuario_id);
CREATE INDEX IF NOT EXISTS idx_transferencias_de          ON transferencias(de);
CREATE INDEX IF NOT EXISTS idx_transferencias_a           ON transferencias(a);
CREATE INDEX IF NOT EXISTS idx_ver_asig_ver_id            ON verificador_asignaciones(ver_id);
-- Nota: el índice UNIQUE sobre datos_json->$.id lo crea la migración 0001
