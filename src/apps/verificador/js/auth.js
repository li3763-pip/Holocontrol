// Autenticación — App Verificador

const USUARIOS = [
  { user:'verif1', pass:'campo123', nombre:'Carlos Ramírez', socio:'Socio A', zona:'Zona Norte',
    inv:{ dict:48, s1:25, s2:10, an:8, uva:30 },
    fdIni:100, fdFin:147, fs1:'S10000100→S10000124', fs2:'S20000050→S20000059', fan:'AN0000010→AN0000017',
    fuva:'UVA26001→UVA26030',
    equipoPatron:{ m:'M01', c:'C01', d:'D01', v:['V001','V002','V003','V004','V005','V006','V007','V008','V009','V010'] } },
  { user:'verif2', pass:'campo123', nombre:'Laura Mendoza', socio:'Socio B', zona:'Zona Sur',
    inv:{ dict:62, s1:40, s2:0, an:0, uva:15 },
    fdIni:200, fdFin:261, fs1:'S10000200→S10000239', fs2:'—', fan:'—',
    fuva:'UVA26101→UVA26115',
    equipoPatron:{ m:'M02', c:'', d:'D02', v:'V100' } },
  { user:'verif3', pass:'campo123', nombre:'Héctor Sosa', socio:'Socio A', zona:'Zona Centro',
    inv:{ dict:15, s1:8, s2:5, an:3, uva:0 },
    fdIni:400, fdFin:414, fs1:'S10000300→S10000307', fs2:'S20000100→S20000104', fan:'AN0000050→AN0000052',
    fuva:'—',
    equipoPatron:{ m:'M03', c:'C02', d:'', v:'V200' } },
];

/* Normaliza un objeto equipoPatron {m,c,d,v} de valores únicos a arrays por tipo. */
function normalizarEquiposAsignados(ep){
  const out={m:[],c:[],d:[],v:[]};
  ['m','c','d','v'].forEach(k=>{
    if(Array.isArray(ep[k])) out[k]=ep[k].filter(Boolean);
    else if(ep[k]) out[k]=[ep[k]];
  });
  return out;
}

/* Construye la lista completa de equipos patrón asignados al verificador.
   Primero intenta la API (asignaciones cargadas tras login),
   si no, usa localStorage escrito por equipo_patron.js del panel admin,
   y como último recurso usa fallbackSingle hardcodeado. */
function buildEquiposAsignadosFromStorage(nombre, fallbackSingle, apiAsignaciones){
  // Prioridad 1: datos recién cargados de la API
  if(apiAsignaciones && apiAsignaciones.length > 0){
    const ep = {m:[],c:[],d:[],v:[]};
    apiAsignaciones.filter(a=>a.verificador_nombre===nombre).forEach(a=>{
      const seriesMatch = a.equipo_id.match(/^([A-Za-z]+)\d/);
      if(!seriesMatch) return;
      const serie = seriesMatch[1].toUpperCase();
      const key = serie==='M'||serie==='MF' ? 'm'
                : serie==='C'||serie==='CF' ? 'c'
                : serie==='D'||serie==='DF' ? 'd'
                : serie==='V'||serie==='VF' ? 'v' : null;
      if(key && !ep[key].includes(a.equipo_id)) ep[key].push(a.equipo_id);
    });
    const hasAny = Object.values(ep).some(arr=>arr.length>0);
    if(hasAny) return ep;
  }
  // Prioridad 2: localStorage (sincronizado por equipo_patron.js)
  try {
    const raw = localStorage.getItem('hc_asignaciones_equipo');
    if(raw){
      const asigs = JSON.parse(raw);
      const ep = {m:[],c:[],d:[],v:[]};
      let found = false;
      asigs.filter(a=>a.verificadorNombre===nombre).forEach(a=>{
        const seriesMatch = a.equipoId.match(/^([A-Za-z]+)\d/);
        if(!seriesMatch) return;
        const serie = seriesMatch[1].toUpperCase();
        const key = serie==='M'||serie==='MF' ? 'm'
                  : serie==='C'||serie==='CF' ? 'c'
                  : serie==='D'||serie==='DF' ? 'd'
                  : serie==='V'||serie==='VF' ? 'v' : null;
        if(key && !ep[key].includes(a.equipoId)){ ep[key].push(a.equipoId); found=true; }
      });
      if(found) return ep;
    }
  } catch(e){}
  // Prioridad 3: fallback hardcodeado
  return normalizarEquiposAsignados(fallbackSingle);
}

async function doLogin(){
  const u = document.getElementById('l-user').value.trim().toLowerCase();
  const p = document.getElementById('l-pass').value;
  const errEl = document.getElementById('l-err');
  errEl.style.display='none';

  // Intentar autenticación contra el backend D1
  try {
    const res = await api.login(u, p);
    const apiUser = res.user;
    if(apiUser.rol !== 'verificador'){
      errEl.style.display='block';
      errEl.textContent='Este usuario no tiene acceso como verificador.';
      document.getElementById('l-pass').value='';
      return;
    }
    // Buscar datos adicionales del verificador
    let asignaciones = [];
    let verObj = null;
    try {
      const verifList = await api.get('/api/verificadores');
      verObj = verifList.find(v => v.nombre === apiUser.nombre) || null;
      if(verObj) asignaciones = verObj.asignaciones || [];
    } catch(e){}

    // Cargar registros desde API
    let regsApi = [];
    try {
      const regsData = await api.get('/api/registros/' + apiUser.id);
      regsApi = regsData;
    } catch(e){}

    // Buscar usuario local como base de datos de inventario (puede diferir)
    const localUser = USUARIOS.find(v=>v.user===u) || {};

    SESSION = {
      ...localUser,
      user: apiUser.user,
      id: apiUser.id,
      nombre: apiUser.nombre,
      socio: apiUser.socio,
      zona: (verObj && verObj.zona) ? verObj.zona : (localUser.zona || ''),
      pass: undefined,
      // Priorizar datos de la API; fallback al array hardcodeado si la API no los tiene aún
      inv:   (verObj && verObj.inv)                              ? verObj.inv   : (localUser.inv  || { dict:0, s1:0, s2:0, an:0, uva:0 }),
      fdIni: (verObj && verObj.fdIni != null && verObj.fdIni)   ? verObj.fdIni : (localUser.fdIni || 0),
      fdFin: (verObj && verObj.fdFin != null && verObj.fdFin)   ? verObj.fdFin : (localUser.fdFin || 0),
      fs1:   (verObj && verObj.fs1  && verObj.fs1  !== '—')     ? verObj.fs1   : (localUser.fs1  || '—'),
      fs2:   (verObj && verObj.fs2  && verObj.fs2  !== '—')     ? verObj.fs2   : (localUser.fs2  || '—'),
      fan:   (verObj && verObj.fan  && verObj.fan  !== '—')     ? verObj.fan   : (localUser.fan  || '—'),
      fuva:  (verObj && verObj.fuva && verObj.fuva !== '—')     ? verObj.fuva  : (localUser.fuva || '—'),
    };
    SESSION.equiposAsignados = buildEquiposAsignadosFromStorage(SESSION.nombre, SESSION.equipoPatron||{m:'',c:'',d:'',v:''}, asignaciones);
    SESSION.equipoPatron = {
      m: SESSION.equiposAsignados.m[0]||'',
      c: SESSION.equiposAsignados.c[0]||'',
      d: SESSION.equiposAsignados.d[0]||'',
      v: SESSION.equiposAsignados.v[0]||'',
    };

    // Combinar registros de la API con los locales (localStorage)
    const savedLocal = localStorage.getItem('reg_'+u);
    const localRegs = savedLocal ? JSON.parse(savedLocal) : [];

    if (regsApi.length > 0) {
      const apiRecords = regsApi.map(r => r.datos || r);
      // Incluir registros que sólo existen en localStorage (guardados offline o con fallo de red)
      const apiIds = new Set(apiRecords.map(r => r.id).filter(Boolean));
      const localOnly = localRegs.filter(r => r.id && !apiIds.has(r.id));
      registros = [...apiRecords, ...localOnly];
      registros.sort((a, b) => ((b.createdAt||'') > (a.createdAt||'') ? 1 : -1));
    } else if (localRegs.length > 0) {
      registros = localRegs;
    } else {
      registros = demoDicts();
    }

    // Auto-sincronizar registros pendientes al estar online (evita que datos offline queden sólo en localStorage).
    // La condición (regsApi > 0 || localRegs > 0) garantiza que esta lógica no aplica cuando
    // sólo hay datos demo (caso en que ambas fuentes están vacías).
    if (SESSION.id && (regsApi.length > 0 || localRegs.length > 0)) {
      const pending = registros.filter(r => r.status === 'ok');
      if (pending.length > 0) {
        Promise.all(pending.map(r =>
          api.post('/api/registros', {
            usuarioId: SESSION.id,
            fecha: r.fechaDict || new Date().toISOString().slice(0, 10),
            hora: r.hora || '',
            notas: r.observaciones || '',
            resultado: r.instrumentos && r.instrumentos.some(i => i.cumpleNom === 'C') ? 'aprobado' : (r.resultado || 'rechazado'),
            datos: r
          }).then(() => { r.status = 'sync'; }).catch(e => console.warn('auto-sync registro:', e.message))
        )).then(() => {
          localStorage.setItem('reg_'+u, JSON.stringify(registros));
        });
      }
    }

    errEl.style.display='none';
    initApp();

  } catch(e) {
    // Fallback offline: buscar en array USUARIOS hardcodeado
    const localUsers = (() => {
      try {
        const raw = localStorage.getItem('hc_usuarios_verificador');
        if(raw){ const a=JSON.parse(raw); if(Array.isArray(a)&&a.length) return a; }
      } catch(err){}
      return USUARIOS;
    })();
    const f = localUsers.find(v=>v.user===u && v.pass===p);
    if(!f){ errEl.style.display='block'; errEl.textContent='Usuario o contraseña incorrectos.'; document.getElementById('l-pass').value=''; return; }
    errEl.style.display='none';
    SESSION = JSON.parse(JSON.stringify(f));
    SESSION.equiposAsignados = buildEquiposAsignadosFromStorage(SESSION.nombre, SESSION.equipoPatron||{m:'',c:'',d:'',v:''}, []);
    SESSION.equipoPatron = {
      m: SESSION.equiposAsignados.m[0]||'',
      c: SESSION.equiposAsignados.c[0]||'',
      d: SESSION.equiposAsignados.d[0]||'',
      v: SESSION.equiposAsignados.v[0]||'',
    };
    const saved = localStorage.getItem('reg_'+u);
    registros = saved ? JSON.parse(saved) : demoDicts();
    initApp();
  }
}

function doLogout(){
  api.logout();
  SESSION=null; registros=[];
  document.getElementById('sc-login').classList.add('active');
  document.getElementById('sc-app').classList.remove('active');
  document.getElementById('l-user').value='';
  document.getElementById('l-pass').value='';
}
