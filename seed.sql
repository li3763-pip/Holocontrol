-- ================================================================
-- Holocontrol — Datos de demostración (seed)
-- Ejecutar DESPUÉS de schema.sql
-- ================================================================

-- ── SOCIOS ──────────────────────────────────────────────────────
INSERT OR IGNORE INTO socios (id, nombre) VALUES
  ('Socio A', 'Socio A'),
  ('Socio B', 'Socio B'),
  ('Socio C', 'Socio C');

-- ── PROVEEDOR UVA ───────────────────────────────────────────────
INSERT OR IGNORE INTO proveedor_uva (id, nombre, contacto, tel, precio, fecha_precio)
VALUES (1, 'Proveedor UVA', '', '', 3.50, '2025-01-01');

-- ── PROVEEDORES ─────────────────────────────────────────────────
INSERT OR IGNORE INTO proveedores (nombre, contacto, tel, precio, fecha_precio) VALUES
  ('Proveedor 1', 'Juan Torres',  '55 1234-5678', 4.80, '2025-01-10'),
  ('Proveedor 2', 'María Soto',   '55 8765-4321', 5.20, '2025-02-01'),
  ('Proveedor 3', 'Pedro Ruiz',   '55 5555-0000', 4.50, '2024-12-15');

-- ── USUARIOS (contraseñas en texto plano para seed; el worker las hashea al primer login
--   o usa la función seedHash que genera salt/hash estáticos)
--
--   Para el seed usamos hash pre-calculados con PBKDF2-SHA256 (iterations=100000).
--   Contraseñas de demo:
--     admin        → admin123
--     socioa       → socio123
--     sociob       → socio123
--     socioc       → socio123
--     personal     → personal123
--     verif1       → campo123
--     verif2       → campo123
--     verif3       → campo123
--
--   Como D1 no puede ejecutar código JS en seed, almacenamos la contraseña con
--   un algoritmo trivial marcado "plain" que el Worker detecta y reemplaza con
--   PBKDF2 en el primer login exitoso.
-- ──────────────────────────────────────────────────────────────────
INSERT OR IGNORE INTO usuarios (nombre, user, pass_hash, pass_salt, pin_hash, pin_salt, rol, socio_id, activo) VALUES
  ('Administrador',   'admin',    'plain:admin123',    'seed', 'plain:1234', 'seed', 'admin',    NULL,      1),
  ('Socio A',         'socioa',   'plain:socio123',    'seed', 'plain:1234', 'seed', 'socio',    'Socio A', 1),
  ('Socio B',         'sociob',   'plain:socio123',    'seed', 'plain:1234', 'seed', 'socio',    'Socio B', 1),
  ('Socio C',         'socioc',   'plain:socio123',    'seed', 'plain:1234', 'seed', 'socio',    'Socio C', 1),
  ('Personal Admin',  'personal', 'plain:personal123', 'seed', 'plain:1234', 'seed', 'personal', NULL,      1),
  ('Carlos Ramírez',  'verif1',   'plain:campo123',    'seed', NULL,         NULL,   'verificador', 'Socio A', 1),
  ('Laura Mendoza',   'verif2',   'plain:campo123',    'seed', NULL,         NULL,   'verificador', 'Socio B', 1),
  ('Héctor Sosa',     'verif3',   'plain:campo123',    'seed', NULL,         NULL,   'verificador', 'Socio A', 1);

-- ── VERIFICADORES ───────────────────────────────────────────────
INSERT OR IGNORE INTO verificadores (id, nombre, socio_id, zona, tel, email, tipo_usuario, activo) VALUES
  ('VER-001', 'Carlos Ramírez', 'Socio A', 'Zona Norte',  '', '', 'verificador', 1),
  ('VER-002', 'Laura Mendoza',  'Socio B', 'Zona Sur',    '', '', 'verificador', 1),
  ('VER-003', 'Héctor Sosa',    'Socio A', 'Zona Centro', '', '', 'verificador', 1);

-- ── COMPRAS ─────────────────────────────────────────────────────
INSERT OR IGNORE INTO compras (folio, factura, fecha, prov_id, precio, notas) VALUES
  ('P1-0001', 'FAC-2024-010', '2024-11-05', 1, 4.80, ''),
  ('P2-0001', 'FAC-2024-022', '2024-11-12', 2, 5.20, ''),
  ('P3-0001', 'FAC-2024-033', '2024-11-28', 3, 4.50, ''),
  ('P1-0002', 'FAC-2025-003', '2025-01-08', 1, 4.80, '');

-- ── COMPRAS PARTES ───────────────────────────────────────────────
INSERT OR IGNORE INTO compras_partes (folio, socio_id, tipo, cant) VALUES
  -- P1-0001
  ('P1-0001', 'Socio A', '1er semestre', 300),
  ('P1-0001', 'Socio A', 'Anual',        200),
  ('P1-0001', 'Socio B', '1er semestre', 200),
  -- P2-0001
  ('P2-0001', 'Socio B', '2do semestre', 400),
  -- P3-0001
  ('P3-0001', 'Socio C', '1er semestre', 150),
  ('P3-0001', 'Socio C', '2do semestre', 150),
  -- P1-0002
  ('P1-0002', 'Socio A', '2do semestre', 300),
  ('P1-0002', 'Socio B', 'Anual',        500),
  ('P1-0002', 'Socio C', 'Anual',        300);

-- ── RECEPCIONES ─────────────────────────────────────────────────
INSERT OR IGNORE INTO recepciones (folio, orden, prov_nombre, fecha, hora, total, quien, notas, asignacion, por_tipo) VALUES
  ('REC-0001', 'P1-0001', 'Proveedor 1', '2024-11-10', '10:30', 420, 'Carlos M.', '',
   '{"Socio A":{"1er semestre":[{"ini":"10000001","fin":"10000180","cant":180}],"Anual":[{"ini":"30000001","fin":"30000120","cant":120}]},"Socio B":{"1er semestre":[{"ini":"10000181","fin":"10000300","cant":120}]}}',
   '{"1er semestre":300,"Anual":120}'),
  ('REC-0002', 'P2-0001', 'Proveedor 2', '2024-11-15', '09:00', 200, 'Luisa R.', '',
   '{"Socio B":{"2do semestre":[{"ini":"20000001","fin":"20000200","cant":200}]}}',
   '{"2do semestre":200}');
