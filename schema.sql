-- ================================================================
-- Holocontrol — Cloudflare D1 Schema
-- ================================================================

-- ── SOCIOS ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS socios (
  id   TEXT PRIMARY KEY,   -- 'Socio A', 'Socio B', 'Socio C'
  nombre TEXT NOT NULL
);

-- ── USUARIOS (admin panel) ───────────────────────────────────────
-- roles: admin | socio | personal | verificador
CREATE TABLE IF NOT EXISTS usuarios (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre    TEXT NOT NULL,
  user      TEXT NOT NULL UNIQUE,
  pass_hash TEXT NOT NULL,         -- PBKDF2-SHA256 hex
  pass_salt TEXT NOT NULL,         -- hex
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

-- ── VERIFICADORES (equipo de trabajo) ───────────────────────────
CREATE TABLE IF NOT EXISTS verificadores (
  id           TEXT PRIMARY KEY,   -- 'VER-001'
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
  tipo      TEXT NOT NULL,    -- 'holograma' | 'uva' | 'dictamen'
  subtipo   TEXT,             -- '1er semestre' | '2do semestre' | 'Anual' | tipo UVA
  folio_ini TEXT NOT NULL,
  folio_fin TEXT NOT NULL,
  cant      INTEGER NOT NULL,
  notas     TEXT
);

-- ── EQUIPO PATRÓN ───────────────────────────────────────────────
-- Asignaciones de equipos físicos (balanzas, pesas, etc.) a verificadores
CREATE TABLE IF NOT EXISTS asignaciones_equipo (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  equipo_id           TEXT NOT NULL,         -- 'M01', 'V001', etc.
  verificador_id      TEXT REFERENCES verificadores(id) ON DELETE SET NULL,
  verificador_nombre  TEXT,
  socio_id            TEXT REFERENCES socios(id),
  fecha               TEXT,
  dias                TEXT                   -- JSON array, e.g. '["lun","mie"]'
);

-- ── COMPRAS ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS compras (
  folio    TEXT PRIMARY KEY,   -- 'P1-0001'
  factura  TEXT,
  fecha    TEXT NOT NULL,
  prov_id  INTEGER REFERENCES proveedores(id),
  precio   REAL NOT NULL DEFAULT 0,
  notas    TEXT
);

-- Detalle de socios y tipos dentro de cada compra
CREATE TABLE IF NOT EXISTS compras_partes (
  id       INTEGER PRIMARY KEY AUTOINCREMENT,
  folio    TEXT NOT NULL REFERENCES compras(folio) ON DELETE CASCADE,
  socio_id TEXT NOT NULL REFERENCES socios(id),
  tipo     TEXT NOT NULL,   -- '1er semestre' | '2do semestre' | 'Anual'
  cant     INTEGER NOT NULL DEFAULT 0
);

-- ── RECEPCIONES ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS recepciones (
  folio        TEXT PRIMARY KEY,   -- 'REC-0001'
  orden        TEXT REFERENCES compras(folio),
  prov_nombre  TEXT,               -- desnormalizado para facilitar consultas
  fecha        TEXT NOT NULL,
  hora         TEXT,
  total        INTEGER NOT NULL DEFAULT 0,
  quien        TEXT,
  notas        TEXT,
  asignacion   TEXT,               -- JSON blob completo del objeto asignacion{}
  por_tipo     TEXT                -- JSON blob {'1er semestre':N, ...}
);

-- ── DICTÁMENES (compras de papelería) ───────────────────────────
CREATE TABLE IF NOT EXISTS dictamenes (
  folio      TEXT PRIMARY KEY,   -- 'DICT-0001'
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
  folio      TEXT PRIMARY KEY,   -- 'PUVA-0001'
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
  tipo               TEXT NOT NULL,    -- 'holograma' | 'uva' | 'dictamen'
  subtipo            TEXT,
  de                 TEXT NOT NULL,    -- nombre entidad origen
  a                  TEXT NOT NULL,    -- nombre entidad destino
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

-- ── REGISTROS VERIFICACIÓN (dictámenes de campo) ────────────────
-- Tabla donde se guardan las verificaciones realizadas por los verificadores
CREATE TABLE IF NOT EXISTS registros_verificacion (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  usuario_id      INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  folio_dict      TEXT,
  folio_holo      TEXT,
  folio_uva       TEXT,
  marca           TEXT,
  modelo          TEXT,
  tipo_instrumento TEXT,
  resultado       TEXT,            -- 'aprobado' | 'rechazado'
  fecha           TEXT NOT NULL,
  hora            TEXT,
  notas           TEXT,
  datos_json      TEXT             -- JSON completo del registro para compatibilidad
);

-- ── ÍNDICES ─────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_usuarios_user ON usuarios(user);
CREATE INDEX IF NOT EXISTS idx_verificadores_socio ON verificadores(socio_id);
CREATE INDEX IF NOT EXISTS idx_asignaciones_equipo_verif ON asignaciones_equipo(verificador_id);
CREATE INDEX IF NOT EXISTS idx_compras_partes_folio ON compras_partes(folio);
CREATE INDEX IF NOT EXISTS idx_recepciones_orden ON recepciones(orden);
CREATE INDEX IF NOT EXISTS idx_registros_usuario ON registros_verificacion(usuario_id);
CREATE INDEX IF NOT EXISTS idx_transferencias_de ON transferencias(de);
CREATE INDEX IF NOT EXISTS idx_transferencias_a ON transferencias(a);
CREATE INDEX IF NOT EXISTS idx_ver_asig_ver_id ON verificador_asignaciones(ver_id);
