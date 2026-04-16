// Autenticación — App Verificador

const USUARIOS = [
  { user:'verif1', pass:'campo123', nombre:'Carlos Ramírez', socio:'Socio A', zona:'Zona Norte',
    inv:{ dict:48, s1:25, s2:10, an:8, uva:30 },
    fdIni:100, fdFin:147, fs1:'S10000100→S10000124', fs2:'S20000050→S20000059', fan:'AN0000010→AN0000017',
    fuva:'UVA26001→UVA26030',
    equipoPatron:{ m:'M01', c:'C01', d:'D01', v:'V001' } },
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

/* Construye la lista completa de equipos patrón asignados al verificador desde el
   localStorage escrito por el panel admin (equipo_patron.js).
   Retorna { m:[…], c:[…], d:[…], v:[…] } con TODOS los equipos asignados por tipo.
   Si no hay datos en localStorage usa fallbackSingle (objeto {m,c,d,v} de valores únicos). */
function buildEquiposAsignadosFromStorage(nombre, fallbackSingle){
  try {
    const raw = localStorage.getItem('hc_asignaciones_equipo');
    if(!raw) return normalizarEquiposAsignados(fallbackSingle);
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
    return found ? ep : normalizarEquiposAsignados(fallbackSingle);
  } catch(e){ return normalizarEquiposAsignados(fallbackSingle); }
}

function doLogin(){
  const u = document.getElementById('l-user').value.trim().toLowerCase();
  const p = document.getElementById('l-pass').value;
  const f = USUARIOS.find(v=>v.user===u && v.pass===p);
  if(!f){ document.getElementById('l-err').style.display='block'; document.getElementById('l-pass').value=''; return; }
  document.getElementById('l-err').style.display='none';
  SESSION = JSON.parse(JSON.stringify(f)); // copia profunda para mutar inventario sin afectar USUARIOS
  // Obtener todos los equipos patrón asignados (panel admin) o normalizar los predeterminados
  SESSION.equiposAsignados = buildEquiposAsignadosFromStorage(SESSION.nombre, SESSION.equipoPatron||{m:'',c:'',d:'',v:''});
  // Mantener equipoPatron (primer equipo de cada tipo) para compatibilidad con la vista de detalle
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

function doLogout(){
  SESSION=null; registros=[];
  document.getElementById('sc-login').classList.add('active');
  document.getElementById('sc-app').classList.remove('active');
  document.getElementById('l-user').value='';
  document.getElementById('l-pass').value='';
}
