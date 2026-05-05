/**
 * Holocontrol — Cloudflare Worker + D1 API
 *
 * Rutas:
 *   POST   /api/auth/login
 *   POST   /api/auth/logout
 *
 *   GET    /api/usuarios          (admin)
 *   POST   /api/usuarios          (admin)
 *   PUT    /api/usuarios/:id      (admin)
 *   DELETE /api/usuarios/:id      (admin)
 *
 *   GET    /api/verificadores     (admin/socio/personal)
 *   POST   /api/verificadores     (admin/personal)
 *   PUT    /api/verificadores/:id (admin/personal/socio-propio)
 *
 *   GET    /api/equipos           (admin/personal/socio)
 *   POST   /api/equipos           (admin/personal/socio)
 *   DELETE /api/equipos/:equipoId (admin/personal/socio)
 *
 *   GET    /api/proveedores
 *   PUT    /api/proveedores/:id   (admin/personal)
 *
 *   GET    /api/compras
 *   POST   /api/compras           (admin/personal)
 *
 *   GET    /api/recepciones
 *   POST   /api/recepciones       (admin/personal)
 *
 *   GET    /api/registros/:userId
 *   POST   /api/registros
 *   PUT    /api/registros/:id
 *
 *   GET    /api/inventario/:socio
 */

// ── Helpers de JWT ligero con Web Crypto ────────────────────────

const JWT_SECRET_NAME = 'HC_JWT_SECRET';

async function getJwtKey(env) {
  const secret = env.JWT_SECRET || 'holocontrol-dev-secret-change-in-production';
  const enc = new TextEncoder().encode(secret);
  return crypto.subtle.importKey('raw', enc, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}

function b64url(buf) {
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function b64urlDecode(str) {
  const s = str.replace(/-/g, '+').replace(/_/g, '/');
  return Uint8Array.from(atob(s), c => c.charCodeAt(0));
}

async function signJwt(payload, env) {
  const key = await getJwtKey(env);
  const header = b64url(new TextEncoder().encode(JSON.stringify({ alg: 'HS256', typ: 'JWT' })));
  const body = b64url(new TextEncoder().encode(JSON.stringify(payload)));
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${header}.${body}`));
  return `${header}.${body}.${b64url(sig)}`;
}

async function verifyJwt(token, env) {
  try {
    const [header, body, sig] = token.split('.');
    const key = await getJwtKey(env);
    const valid = await crypto.subtle.verify(
      'HMAC', key,
      b64urlDecode(sig),
      new TextEncoder().encode(`${header}.${body}`)
    );
    if (!valid) return null;
    const payload = JSON.parse(new TextDecoder().decode(b64urlDecode(body)));
    if (payload.exp && Date.now() / 1000 > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

// ── PBKDF2 password hashing ──────────────────────────────────────

async function hashPassword(password, saltHex) {
  const salt = hexToBytes(saltHex);
  const keyMaterial = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(password),
    { name: 'PBKDF2' }, false, ['deriveBits']
  );
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
    keyMaterial, 256
  );
  return bytesToHex(new Uint8Array(bits));
}

function bytesToHex(bytes) {
  return [...bytes].map(b => b.toString(16).padStart(2, '0')).join('');
}

function hexToBytes(hex) {
  const arr = [];
  for (let i = 0; i < hex.length; i += 2) arr.push(parseInt(hex.slice(i, i + 2), 16));
  return new Uint8Array(arr);
}

function randomHex(bytes = 16) {
  return bytesToHex(crypto.getRandomValues(new Uint8Array(bytes)));
}

/**
 * Verifica contraseña. Soporta el formato "plain:XXX" usado en seed.sql,
 * que migra automáticamente a PBKDF2 en el primer login.
 * Retorna { ok: bool, needsUpgrade: bool, hash, salt }
 */
async function checkPassword(plain, storedHash, storedSalt, DB) {
  if (storedHash.startsWith('plain:')) {
    const expected = storedHash.slice(6);
    if (plain !== expected) return { ok: false };
    // Generar hash real y actualizar DB
    const salt = randomHex(16);
    const hash = await hashPassword(plain, salt);
    return { ok: true, needsUpgrade: true, hash, salt };
  }
  const hash = await hashPassword(plain, storedSalt);
  return { ok: hash === storedHash };
}

// ── Auth middleware ──────────────────────────────────────────────

async function getSession(request, env) {
  const auth = request.headers.get('Authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return null;
  return verifyJwt(token, env);
}

function requireAuth(session) {
  if (!session) return json({ error: 'No autorizado' }, 401);
  return null;
}

function requireRole(session, ...roles) {
  const err = requireAuth(session);
  if (err) return err;
  if (!roles.includes(session.rol)) return json({ error: 'Sin permisos' }, 403);
  return null;
}

// ── Response helpers ─────────────────────────────────────────────

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
  });
}

function cors(methods = 'GET,POST,PUT,DELETE,OPTIONS') {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': methods,
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
}

// ── Router ───────────────────────────────────────────────────────

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    if (method === 'OPTIONS') return cors();

    // Solo interceptar rutas /api/*; el resto lo sirven los assets estáticos
    if (!path.startsWith('/api/')) return env.ASSETS ? env.ASSETS.fetch(request) : new Response('Not found', { status: 404 });

    const session = await getSession(request, env);
    const DB = env.DB;

    try {
      // ── AUTH ─────────────────────────────────────────────────
      if (path === '/api/auth/login' && method === 'POST') {
        return handleLogin(request, env, DB);
      }
      if (path === '/api/auth/logout' && method === 'POST') {
        return json({ ok: true });
      }

      // ── USUARIOS ─────────────────────────────────────────────
      if (path === '/api/usuarios') {
        if (method === 'GET') {
          const err = requireRole(session, 'admin'); if (err) return err;
          return handleGetUsuarios(DB);
        }
        if (method === 'POST') {
          const err = requireRole(session, 'admin'); if (err) return err;
          return handlePostUsuario(request, DB);
        }
      }
      const mUsuario = path.match(/^\/api\/usuarios\/(\d+)$/);
      if (mUsuario) {
        if (method === 'PUT') {
          const err = requireRole(session, 'admin'); if (err) return err;
          return handlePutUsuario(request, parseInt(mUsuario[1]), DB);
        }
        if (method === 'DELETE') {
          const err = requireRole(session, 'admin'); if (err) return err;
          return handleDeleteUsuario(parseInt(mUsuario[1]), session, DB);
        }
      }

      // ── VERIFICADORES ────────────────────────────────────────
      if (path === '/api/verificadores') {
        if (method === 'GET') {
          const err = requireAuth(session); if (err) return err;
          return handleGetVerificadores(session, DB);
        }
        if (method === 'POST') {
          const err = requireRole(session, 'admin', 'personal'); if (err) return err;
          return handlePostVerificador(request, DB);
        }
      }
      const mVer = path.match(/^\/api\/verificadores\/([^/]+)$/);
      if (mVer) {
        if (method === 'PUT') {
          const err = requireAuth(session); if (err) return err;
          return handlePutVerificador(request, mVer[1], session, DB);
        }
        if (method === 'DELETE') {
          const err = requireRole(session, 'admin', 'personal'); if (err) return err;
          return handleDeleteVerificador(mVer[1], DB);
        }
      }

      // ── EQUIPOS PATRÓN ───────────────────────────────────────
      if (path === '/api/equipos') {
        if (method === 'GET') {
          const err = requireAuth(session); if (err) return err;
          return handleGetEquipos(url, session, DB);
        }
        if (method === 'POST') {
          const err = requireAuth(session); if (err) return err;
          return handlePostEquipo(request, session, DB);
        }
      }
      const mEquipo = path.match(/^\/api\/equipos\/([^/]+)$/);
      if (mEquipo) {
        if (method === 'DELETE') {
          const err = requireAuth(session); if (err) return err;
          return handleDeleteEquipo(decodeURIComponent(mEquipo[1]), session, DB);
        }
      }

      // ── PROVEEDORES ──────────────────────────────────────────
      if (path === '/api/proveedores' && method === 'GET') {
        return handleGetProveedores(DB);
      }
      const mProv = path.match(/^\/api\/proveedores\/(\d+|uva)$/);
      if (mProv && method === 'PUT') {
        const err = requireRole(session, 'admin', 'personal'); if (err) return err;
        return handlePutProveedor(request, mProv[1], DB);
      }

      // ── COMPRAS ──────────────────────────────────────────────
      if (path === '/api/compras') {
        if (method === 'GET') {
          const err = requireAuth(session); if (err) return err;
          return handleGetCompras(DB);
        }
        if (method === 'POST') {
          const err = requireRole(session, 'admin', 'personal'); if (err) return err;
          return handlePostCompra(request, DB);
        }
      }

      // ── RECEPCIONES ──────────────────────────────────────────
      if (path === '/api/recepciones') {
        if (method === 'GET') {
          const err = requireAuth(session); if (err) return err;
          return handleGetRecepciones(DB);
        }
        if (method === 'POST') {
          const err = requireRole(session, 'admin', 'personal'); if (err) return err;
          return handlePostRecepcion(request, DB);
        }
      }

      // ── REGISTROS DE VERIFICACIÓN ────────────────────────────
      const mRegsUser = path.match(/^\/api\/registros\/(\d+)$/);
      if (mRegsUser && method === 'GET') {
        const err = requireAuth(session); if (err) return err;
        const uid = parseInt(mRegsUser[1]);
        if (session.rol === 'verificador' && session.id !== uid) return json({ error: 'Sin permisos' }, 403);
        return handleGetRegistros(uid, DB);
      }
      if (path === '/api/registros' && method === 'POST') {
        const err = requireAuth(session); if (err) return err;
        return handlePostRegistro(request, session, DB);
      }
      const mReg = path.match(/^\/api\/registros\/(\d+)$/) ;
      if (mReg && method === 'PUT') {
        const err = requireAuth(session); if (err) return err;
        return handlePutRegistro(request, parseInt(mReg[1]), session, DB);
      }

      // ── INVENTARIO ───────────────────────────────────────────
      const mInv = path.match(/^\/api\/inventario\/([^/]+)$/);
      if (mInv && method === 'GET') {
        const err = requireAuth(session); if (err) return err;
        return handleGetInventario(decodeURIComponent(mInv[1]), DB);
      }

      return json({ error: 'Ruta no encontrada' }, 404);
    } catch (e) {
      console.error(e);
      return json({ error: 'Error interno del servidor', detail: e.message }, 500);
    }
  }
};

// ═══════════════════════════════════════════════════════════════
// HANDLERS
// ═══════════════════════════════════════════════════════════════

// ── AUTH ─────────────────────────────────────────────────────────

async function handleLogin(request, env, DB) {
  const { user, pass } = await request.json();
  if (!user || !pass) return json({ error: 'Faltan credenciales' }, 400);

  const row = await DB.prepare('SELECT * FROM usuarios WHERE user = ? AND activo = 1').bind(user).first();
  if (!row) return json({ error: 'Usuario o contraseña incorrectos' }, 401);

  const check = await checkPassword(pass, row.pass_hash, row.pass_salt, DB);
  if (!check.ok) return json({ error: 'Usuario o contraseña incorrectos' }, 401);

  // Migrar contraseña plain→PBKDF2
  if (check.needsUpgrade) {
    await DB.prepare('UPDATE usuarios SET pass_hash = ?, pass_salt = ? WHERE id = ?')
      .bind(check.hash, check.salt, row.id).run();
  }

  const exp = Math.floor(Date.now() / 1000) + 60 * 60 * 12; // 12 horas
  const token = await signJwt({
    id: row.id, user: row.user, nombre: row.nombre,
    rol: row.rol, socio: row.socio_id, exp
  }, env);

  return json({
    token,
    user: { id: row.id, user: row.user, nombre: row.nombre, rol: row.rol, socio: row.socio_id }
  });
}

// ── USUARIOS ─────────────────────────────────────────────────────

async function handleGetUsuarios(DB) {
  const { results } = await DB.prepare(
    'SELECT id, nombre, user, rol, socio_id, activo FROM usuarios ORDER BY id'
  ).all();
  return json(results);
}

async function handlePostUsuario(request, DB) {
  const { nombre, user, pass, rol, socio } = await request.json();
  if (!nombre || !user || !pass || !rol) return json({ error: 'Faltan campos' }, 400);

  const exists = await DB.prepare('SELECT id FROM usuarios WHERE user = ?').bind(user).first();
  if (exists) return json({ error: 'Usuario ya existe' }, 409);

  const salt = randomHex(16);
  const hash = await hashPassword(pass, salt);
  const { meta } = await DB.prepare(
    'INSERT INTO usuarios (nombre, user, pass_hash, pass_salt, rol, socio_id) VALUES (?,?,?,?,?,?)'
  ).bind(nombre, user, hash, salt, rol, socio || null).run();

  return json({ id: meta.last_row_id, nombre, user, rol, socio_id: socio || null }, 201);
}

async function handlePutUsuario(request, id, DB) {
  const { nombre, user, pass, rol, socio, activo } = await request.json();
  const row = await DB.prepare('SELECT * FROM usuarios WHERE id = ?').bind(id).first();
  if (!row) return json({ error: 'No encontrado' }, 404);

  let hash = row.pass_hash, salt = row.pass_salt;
  if (pass) {
    if (pass.length < 6) return json({ error: 'Contraseña demasiado corta' }, 400);
    salt = randomHex(16);
    hash = await hashPassword(pass, salt);
  }

  const dupCheck = user && user !== row.user
    ? await DB.prepare('SELECT id FROM usuarios WHERE user = ? AND id != ?').bind(user, id).first()
    : null;
  if (dupCheck) return json({ error: 'Usuario ya existe' }, 409);

  await DB.prepare(
    'UPDATE usuarios SET nombre=?, user=?, pass_hash=?, pass_salt=?, rol=?, socio_id=?, activo=? WHERE id=?'
  ).bind(
    nombre || row.nombre,
    user || row.user,
    hash, salt,
    rol || row.rol,
    socio !== undefined ? (socio || null) : row.socio_id,
    activo !== undefined ? (activo ? 1 : 0) : row.activo,
    id
  ).run();

  return json({ ok: true });
}

async function handleDeleteUsuario(id, session, DB) {
  if (session.id === id) return json({ error: 'No puedes eliminarte a ti mismo' }, 400);
  const { meta } = await DB.prepare('DELETE FROM usuarios WHERE id = ?').bind(id).run();
  if (meta.changes === 0) return json({ error: 'No encontrado' }, 404);
  return json({ ok: true });
}

// ── VERIFICADORES ────────────────────────────────────────────────

async function handleGetVerificadores(session, DB) {
  let query = 'SELECT * FROM verificadores';
  const params = [];
  if (session.rol === 'socio') {
    query += ' WHERE socio_id = ?';
    params.push(session.socio);
  }
  query += ' ORDER BY id';
  const { results } = await DB.prepare(query).bind(...params).all();

  // Incluir asignaciones de folios por verificador
  const ids = results.map(v => v.id);
  let asignaciones = [];
  if (ids.length) {
    const placeholders = ids.map(() => '?').join(',');
    const res = await DB.prepare(
      `SELECT * FROM verificador_asignaciones WHERE ver_id IN (${placeholders})`
    ).bind(...ids).all();
    asignaciones = res.results;
  }

  const asigMap = {};
  asignaciones.forEach(a => {
    if (!asigMap[a.ver_id]) asigMap[a.ver_id] = [];
    asigMap[a.ver_id].push(a);
  });

  const data = results.map(v => ({ ...v, asignaciones: asigMap[v.id] || [] }));
  return json(data);
}

async function handlePostVerificador(request, DB) {
  const { id, nombre, socio, zona, tel, email, tipoUsuario } = await request.json();
  if (!nombre || !socio) return json({ error: 'Nombre y socio requeridos' }, 400);

  const newId = id || await nextVerificadorId(DB);
  await DB.prepare(
    'INSERT OR REPLACE INTO verificadores (id, nombre, socio_id, zona, tel, email, tipo_usuario, activo) VALUES (?,?,?,?,?,?,?,1)'
  ).bind(newId, nombre, socio, zona || '', tel || '', email || '', tipoUsuario || 'verificador').run();

  return json({ id: newId, nombre, socio_id: socio }, 201);
}

async function handlePutVerificador(request, id, session, DB) {
  const v = await DB.prepare('SELECT * FROM verificadores WHERE id = ?').bind(id).first();
  if (!v) return json({ error: 'No encontrado' }, 404);
  if (session.rol === 'socio' && v.socio_id !== session.socio) return json({ error: 'Sin permisos' }, 403);

  const body = await request.json();
  await DB.prepare(
    'UPDATE verificadores SET nombre=?, socio_id=?, zona=?, tel=?, email=?, tipo_usuario=?, activo=? WHERE id=?'
  ).bind(
    body.nombre ?? v.nombre,
    body.socio ?? v.socio_id,
    body.zona ?? v.zona,
    body.tel ?? v.tel,
    body.email ?? v.email,
    body.tipoUsuario ?? v.tipo_usuario,
    body.activo !== undefined ? (body.activo ? 1 : 0) : v.activo,
    id
  ).run();

  return json({ ok: true });
}

async function handleDeleteVerificador(id, DB) {
  const { meta } = await DB.prepare('DELETE FROM verificadores WHERE id = ?').bind(id).run();
  if (meta.changes === 0) return json({ error: 'No encontrado' }, 404);
  return json({ ok: true });
}

async function nextVerificadorId(DB) {
  const row = await DB.prepare("SELECT id FROM verificadores ORDER BY id DESC LIMIT 1").first();
  if (!row) return 'VER-001';
  const n = parseInt(row.id.replace('VER-', '')) + 1;
  return 'VER-' + String(n).padStart(3, '0');
}

// ── EQUIPOS PATRÓN ───────────────────────────────────────────────

async function handleGetEquipos(url, session, DB) {
  const verId = url.searchParams.get('verificadorId');
  let query = 'SELECT * FROM asignaciones_equipo';
  const params = [];

  if (verId) {
    query += ' WHERE verificador_id = ?';
    params.push(verId);
  } else if (session.rol === 'socio') {
    query += ' WHERE socio_id = ?';
    params.push(session.socio);
  }
  query += ' ORDER BY id';
  const { results } = await DB.prepare(query).bind(...params).all();
  return json(results.map(r => ({
    ...r,
    dias: r.dias ? JSON.parse(r.dias) : []
  })));
}

async function handlePostEquipo(request, session, DB) {
  const { equipoId, verificadorId, verificadorNombre, socio, fecha, dias } = await request.json();
  if (!equipoId || !verificadorId) return json({ error: 'equipoId y verificadorId requeridos' }, 400);

  // Verificar que no esté ya asignado
  const existing = await DB.prepare('SELECT id FROM asignaciones_equipo WHERE equipo_id = ?').bind(equipoId).first();
  if (existing) return json({ error: 'Equipo ya asignado' }, 409);

  // Permisos: socio solo puede asignar a sus verificadores
  if (session.rol === 'socio') {
    const v = await DB.prepare('SELECT socio_id FROM verificadores WHERE id = ?').bind(verificadorId).first();
    if (!v || v.socio_id !== session.socio) return json({ error: 'Sin permisos' }, 403);
  }

  await DB.prepare(
    'INSERT INTO asignaciones_equipo (equipo_id, verificador_id, verificador_nombre, socio_id, fecha, dias) VALUES (?,?,?,?,?,?)'
  ).bind(equipoId, verificadorId, verificadorNombre || '', socio || null, fecha || null, JSON.stringify(dias || [])).run();

  return json({ ok: true }, 201);
}

async function handleDeleteEquipo(equipoId, session, DB) {
  const row = await DB.prepare('SELECT * FROM asignaciones_equipo WHERE equipo_id = ?').bind(equipoId).first();
  if (!row) return json({ error: 'No encontrado' }, 404);

  if (session.rol === 'socio' && row.socio_id !== session.socio) return json({ error: 'Sin permisos' }, 403);

  await DB.prepare('DELETE FROM asignaciones_equipo WHERE equipo_id = ?').bind(equipoId).run();
  return json({ ok: true });
}

// ── PROVEEDORES ──────────────────────────────────────────────────

async function handleGetProveedores(DB) {
  const { results } = await DB.prepare('SELECT * FROM proveedores ORDER BY id').all();
  const uva = await DB.prepare('SELECT * FROM proveedor_uva WHERE id = 1').first();
  return json({ proveedores: results, proveedorUVA: uva || null });
}

async function handlePutProveedor(request, id, DB) {
  const body = await request.json();
  if (id === 'uva') {
    await DB.prepare(
      'INSERT INTO proveedor_uva (id, nombre, contacto, tel, precio, fecha_precio) VALUES (1,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET nombre=excluded.nombre, contacto=excluded.contacto, tel=excluded.tel, precio=excluded.precio, fecha_precio=excluded.fecha_precio'
    ).bind(body.nombre || 'Proveedor UVA', body.contacto || '', body.tel || '', body.precio || 0, body.fechaPrecio || '').run();
  } else {
    const row = await DB.prepare('SELECT * FROM proveedores WHERE id = ?').bind(parseInt(id)).first();
    if (!row) return json({ error: 'No encontrado' }, 404);
    await DB.prepare(
      'UPDATE proveedores SET nombre=?, contacto=?, tel=?, precio=?, fecha_precio=? WHERE id=?'
    ).bind(
      body.nombre ?? row.nombre,
      body.contacto ?? row.contacto,
      body.tel ?? row.tel,
      body.precio ?? row.precio,
      body.fechaPrecio ?? row.fecha_precio,
      parseInt(id)
    ).run();
  }
  return json({ ok: true });
}

// ── COMPRAS ──────────────────────────────────────────────────────

async function handleGetCompras(DB) {
  const { results: compras } = await DB.prepare('SELECT * FROM compras ORDER BY fecha DESC, folio DESC').all();
  const { results: partes } = await DB.prepare('SELECT * FROM compras_partes').all();

  const partesMap = {};
  partes.forEach(p => {
    if (!partesMap[p.folio]) partesMap[p.folio] = [];
    partesMap[p.folio].push(p);
  });

  const data = compras.map(c => {
    const ps = partesMap[c.folio] || [];
    // Agrupar por socio
    const sociosMap = {};
    ps.forEach(p => {
      if (!sociosMap[p.socio_id]) sociosMap[p.socio_id] = { socio: p.socio_id, tipos: [] };
      sociosMap[p.socio_id].tipos.push({ tipo: p.tipo, cant: p.cant });
    });
    return { ...c, prov: c.prov_id, partes: Object.values(sociosMap) };
  });
  return json(data);
}

async function handlePostCompra(request, DB) {
  const { folio, factura, fecha, prov, precio, partes, notas } = await request.json();
  if (!folio || !fecha || !prov) return json({ error: 'Faltan campos' }, 400);

  // Obtener id del proveedor
  const provRow = await DB.prepare('SELECT id FROM proveedores WHERE nombre = ?').bind(prov).first();
  const provId = provRow ? provRow.id : null;

  await DB.prepare('INSERT INTO compras (folio, factura, fecha, prov_id, precio, notas) VALUES (?,?,?,?,?,?)')
    .bind(folio, factura || '', fecha, provId, precio || 0, notas || '').run();

  if (partes && partes.length) {
    const stmt = DB.prepare('INSERT INTO compras_partes (folio, socio_id, tipo, cant) VALUES (?,?,?,?)');
    const ops = partes.flatMap(p => p.tipos.map(t => stmt.bind(folio, p.socio, t.tipo, t.cant)));
    await DB.batch(ops);
  }

  return json({ folio }, 201);
}

// ── RECEPCIONES ──────────────────────────────────────────────────

async function handleGetRecepciones(DB) {
  const { results } = await DB.prepare('SELECT * FROM recepciones ORDER BY fecha DESC, folio DESC').all();
  return json(results.map(r => ({
    ...r,
    asignacion: r.asignacion ? JSON.parse(r.asignacion) : null,
    porTipo: r.por_tipo ? JSON.parse(r.por_tipo) : {}
  })));
}

async function handlePostRecepcion(request, DB) {
  const { folio, orden, prov, fecha, hora, total, quien, notas, asignacion, porTipo } = await request.json();
  if (!folio || !fecha) return json({ error: 'Faltan campos' }, 400);

  await DB.prepare(
    'INSERT INTO recepciones (folio, orden, prov_nombre, fecha, hora, total, quien, notas, asignacion, por_tipo) VALUES (?,?,?,?,?,?,?,?,?,?)'
  ).bind(
    folio, orden || null, prov || '',
    fecha, hora || '', total || 0, quien || '', notas || '',
    asignacion ? JSON.stringify(asignacion) : null,
    porTipo ? JSON.stringify(porTipo) : null
  ).run();

  return json({ folio }, 201);
}

// ── REGISTROS VERIFICACIÓN ───────────────────────────────────────

async function handleGetRegistros(userId, DB) {
  const { results } = await DB.prepare(
    'SELECT * FROM registros_verificacion WHERE usuario_id = ? ORDER BY fecha DESC, id DESC'
  ).bind(userId).all();
  return json(results.map(r => ({
    ...r,
    datos: r.datos_json ? JSON.parse(r.datos_json) : null
  })));
}

async function handlePostRegistro(request, session, DB) {
  const body = await request.json();
  const userId = body.usuarioId || session.id;
  const { meta } = await DB.prepare(
    'INSERT INTO registros_verificacion (usuario_id, folio_dict, folio_holo, folio_uva, marca, modelo, tipo_instrumento, resultado, fecha, hora, notas, datos_json) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)'
  ).bind(
    userId,
    body.folioDict || null, body.folioHolo || null, body.folioUva || null,
    body.marca || null, body.modelo || null, body.tipoInstrumento || null,
    body.resultado || null, body.fecha || new Date().toISOString().slice(0, 10),
    body.hora || null, body.notas || null,
    body.datos ? JSON.stringify(body.datos) : null
  ).run();
  return json({ id: meta.last_row_id }, 201);
}

async function handlePutRegistro(request, id, session, DB) {
  const row = await DB.prepare('SELECT * FROM registros_verificacion WHERE id = ?').bind(id).first();
  if (!row) return json({ error: 'No encontrado' }, 404);
  if (session.rol === 'verificador' && row.usuario_id !== session.id) return json({ error: 'Sin permisos' }, 403);

  const body = await request.json();
  await DB.prepare(
    'UPDATE registros_verificacion SET folio_dict=?, folio_holo=?, folio_uva=?, marca=?, modelo=?, tipo_instrumento=?, resultado=?, fecha=?, hora=?, notas=?, datos_json=? WHERE id=?'
  ).bind(
    body.folioDict ?? row.folio_dict,
    body.folioHolo ?? row.folio_holo,
    body.folioUva ?? row.folio_uva,
    body.marca ?? row.marca,
    body.modelo ?? row.modelo,
    body.tipoInstrumento ?? row.tipo_instrumento,
    body.resultado ?? row.resultado,
    body.fecha ?? row.fecha,
    body.hora ?? row.hora,
    body.notas ?? row.notas,
    body.datos ? JSON.stringify(body.datos) : row.datos_json,
    id
  ).run();
  return json({ ok: true });
}

// ── INVENTARIO ───────────────────────────────────────────────────

async function handleGetInventario(socio, DB) {
  const { results: recepciones } = await DB.prepare(
    'SELECT por_tipo, asignacion FROM recepciones ORDER BY fecha'
  ).all();

  const inv = { '1er semestre': 0, '2do semestre': 0, 'Anual': 0 };

  recepciones.forEach(r => {
    const asig = r.asignacion ? JSON.parse(r.asignacion) : null;
    const porTipo = r.por_tipo ? JSON.parse(r.por_tipo) : {};

    if (asig && asig[socio]) {
      Object.entries(asig[socio]).forEach(([tipo, rangos]) => {
        const cant = Array.isArray(rangos)
          ? rangos.reduce((s, rng) => s + (rng.cant || 0), 0)
          : (typeof rangos === 'number' ? rangos : 0);
        inv[tipo] = (inv[tipo] || 0) + cant;
      });
    }
  });

  return json({ socio, inventario: inv });
}
