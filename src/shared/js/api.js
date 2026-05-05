/**
 * Holocontrol — API client shared by admin and verificador apps.
 *
 * Usage:
 *   await api.login(user, pass)          → { token, user }
 *   await api.get('/api/verificadores')  → response data
 *   await api.post('/api/equipos', body) → response data
 *   await api.put('/api/usuarios/3', body)
 *   await api.del('/api/equipos/M01')
 */

const api = (() => {
  // Cuando la app corre desde file:// (APK Android) las rutas relativas no funcionan.
  // En ese caso se usa la URL absoluta del backend de Cloudflare Workers.
  const BASE_URL = location.protocol === 'file:'
    ? 'https://holocontrol.li3763.workers.dev'
    : '';

  // Token lives only in memory (not localStorage) for security
  let _token = null;

  function getToken() { return _token; }
  function setToken(t) { _token = t; }
  function clearToken() { _token = null; }

  function headers(extra = {}) {
    const h = { 'Content-Type': 'application/json', ...extra };
    if (_token) h['Authorization'] = 'Bearer ' + _token;
    return h;
  }

  async function request(method, path, body) {
    const opts = { method, headers: headers() };
    if (body !== undefined) opts.body = JSON.stringify(body);
    const res = await fetch(BASE_URL + path, opts);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = new Error(data.error || `HTTP ${res.status}`);
      err.status = res.status;
      err.data = data;
      throw err;
    }
    return data;
  }

  async function login(user, pass) {
    const data = await request('POST', '/api/auth/login', { user, pass });
    if (data.token) setToken(data.token);
    return data;
  }

  function logout() {
    clearToken();
    fetch(BASE_URL + '/api/auth/logout', { method: 'POST' }).catch(() => {});
  }

  return {
    login,
    logout,
    getToken,
    setToken,   // for restoring token from sessionStorage if desired
    clearToken,
    get:  (path)        => request('GET',    path),
    post: (path, body)  => request('POST',   path, body),
    put:  (path, body)  => request('PUT',    path, body),
    del:  (path)        => request('DELETE', path),
  };
})();
