/* ═══════════════════════════════════════════════════
   EQUIPO PATRÓN — Catálogo y asignaciones
   Rangos según NOM-010 / imagen de referencia:
     M01–M15   Clase M1
     C01–C15   Clase M1
     D01–D15   Clase M1
     V001–V600 Clase M1
     MF01      Clase F2
     CF01      Clase F2
     DF01      Clase F2
     VF01–VF02 Clase F2
═══════════════════════════════════════════════════ */

/* ── GENERACIÓN DEL CATÁLOGO ── */
(function(){
  if(window.EQUIPO_PATRON_CATALOG) return; // ya inicializado

  const cat=[];

  function pad2(n){return String(n).padStart(2,'0');}
  function pad3(n){return String(n).padStart(3,'0');}

  // Tipos: M=Marco, C=Cinco, D=Diez, V=Veinte
  const TIPO_LABEL={M:'Marco',C:'Cinco',D:'Diez',V:'Veinte'};
  function getTipo(serie){return TIPO_LABEL[serie[0].toUpperCase()]||serie;}

  // M01–M15  Clase M1
  for(let i=1;i<=15;i++) cat.push({id:'M'+pad2(i),clase:'M1',serie:'M',tipo:'M'});
  // C01–C15  Clase M1
  for(let i=1;i<=15;i++) cat.push({id:'C'+pad2(i),clase:'M1',serie:'C',tipo:'C'});
  // D01–D15  Clase M1
  for(let i=1;i<=15;i++) cat.push({id:'D'+pad2(i),clase:'M1',serie:'D',tipo:'D'});
  // V001–V600 Clase M1
  for(let i=1;i<=600;i++) cat.push({id:'V'+pad3(i),clase:'M1',serie:'V',tipo:'V'});
  // MF01  Clase F2
  cat.push({id:'MF01',clase:'F2',serie:'MF',tipo:'M'});
  // CF01  Clase F2
  cat.push({id:'CF01',clase:'F2',serie:'CF',tipo:'C'});
  // DF01  Clase F2
  cat.push({id:'DF01',clase:'F2',serie:'DF',tipo:'D'});
  // VF01–VF02  Clase F2
  cat.push({id:'VF01',clase:'F2',serie:'VF',tipo:'V'});
  cat.push({id:'VF02',clase:'F2',serie:'VF',tipo:'V'});

  window.EQUIPO_PATRON_TIPO_LABEL=TIPO_LABEL;

  window.EQUIPO_PATRON_CATALOG=cat;
})();

/* ── ASIGNACIONES ── */
/* { equipoId, verificadorId, verificadorNombre, socio, fecha, dias } */
/* dias: array de strings, e.g. ['lun','mie','vie'] — vacío = todos los días */
let asignacionesEquipo=[];

/* Clave de localStorage compartida con la app del verificador */
const EP_LS_KEY='hc_asignaciones_equipo';

function epSaveToStorage(){
  try{ localStorage.setItem(EP_LS_KEY,JSON.stringify(asignacionesEquipo)); }catch(e){}
}

function epLoadFromStorage(){
  try{
    const raw=localStorage.getItem(EP_LS_KEY);
    if(raw) asignacionesEquipo=JSON.parse(raw);
  }catch(e){}
}

epLoadFromStorage();

/* ── CONSTANTES DÍAS ── */
const EP_DIAS=[
  {id:'lun',label:'Lun'},
  {id:'mar',label:'Mar'},
  {id:'mie',label:'Mié'},
  {id:'jue',label:'Jue'},
  {id:'vie',label:'Vie'},
  {id:'sab',label:'Sáb'},
  {id:'dom',label:'Dom'},
];

function epDiasLabel(dias){
  if(!dias||dias.length===0) return '<span style="color:var(--text3);font-size:10px">Todos</span>';
  return dias.map(d=>{
    const found=EP_DIAS.find(x=>x.id===d);
    if(!found) return '';
    return`<span class="chip p3" style="font-size:9px;padding:1px 5px;margin:1px">${found.label}</span>`;
  }).join('');
}

function epParsearId(idStr){
  // Retorna {serie, num} o null si no coincide
  const m=idStr.match(/^([A-Za-z]+)(\d+)$/);
  if(!m) return null;
  return {serie:m[1].toUpperCase(), num:parseInt(m[2],10)};
}

/* ── ESTADO PAGINACIÓN / FILTROS ── */
const epFilt={texto:'',clase:'',estado:'',tipo:''};
let epPage=1;
const EP_PAGE_SIZE=50;

/* ── HELPERS ── */
function getAsigEquipo(equipoId){
  return asignacionesEquipo.find(a=>a.equipoId===equipoId)||null;
}

function equipoLibre(equipoId){
  return !getAsigEquipo(equipoId);
}

/* ── RENDER ── */
const EP_TIPO_ORDER=['M','C','D','V'];
const EP_TIPO_NAMES={M:'Marco',C:'Cinco',D:'Diez',V:'Veinte'};

function renderEquipoPatron(){
  const texto=(epFilt.texto||'').toLowerCase();
  const clase=epFilt.clase;
  const estado=epFilt.estado;
  const tipo=epFilt.tipo;

  const lista=EQUIPO_PATRON_CATALOG.filter(e=>{
    if(clase&&e.clase!==clase) return false;
    if(tipo&&e.tipo!==tipo) return false;
    const asig=getAsigEquipo(e.id);
    if(estado==='libre'&&asig) return false;
    if(estado==='asignado'&&!asig) return false;
    if(texto&&!(e.id.toLowerCase().includes(texto)||(asig&&asig.verificadorNombre.toLowerCase().includes(texto))||(asig&&asig.socio.toLowerCase().includes(texto)))) return false;
    return true;
  });

  // Métricas
  const total=EQUIPO_PATRON_CATALOG.length;
  const asignados=asignacionesEquipo.length;
  const libres=total-asignados;
  document.getElementById('ep-metric-total').textContent=total.toLocaleString();
  document.getElementById('ep-metric-asignados').textContent=asignados.toLocaleString();
  document.getElementById('ep-metric-libres').textContent=libres.toLocaleString();

  // Paginación
  const totalPag=Math.ceil(lista.length/EP_PAGE_SIZE)||1;
  if(epPage>totalPag) epPage=totalPag;
  const desde=(epPage-1)*EP_PAGE_SIZE;
  const pagina=lista.slice(desde,desde+EP_PAGE_SIZE);

  const canEdit=SESSION.rol==='admin'||SESSION.rol==='personal'||SESSION.rol==='socio';
  const btnRango=document.getElementById('ep-btn-rango');
  if(btnRango) btnRango.style.display=canEdit?'':'none';

  // Agrupar por tipo manteniendo el orden M→C→D→V
  const grupos={};
  EP_TIPO_ORDER.forEach(t=>{grupos[t]=[];});
  pagina.forEach(e=>{if(grupos[e.tipo]) grupos[e.tipo].push(e);});

  let tbody='';
  EP_TIPO_ORDER.forEach(t=>{
    const items=grupos[t];
    if(!items||items.length===0) return;
    tbody+=`<tr><td colspan="7" style="background:var(--surface2,#f4f4f5);padding:4px 10px;font-size:11px;font-weight:700;color:var(--text2);border-top:2px solid var(--border,#e4e4e7);letter-spacing:.5px">${t} — ${EP_TIPO_NAMES[t]} <span style="font-weight:400;color:var(--text3)">(${items.length})</span></td></tr>`;
    items.forEach(e=>{
      const asig=getAsigEquipo(e.id);
      const estadoChip=asig
        ?`<span class="chip parcial">Asignado</span>`
        :`<span class="chip completo">Libre</span>`;
      const verNombre=asig?`<span style="font-size:12px">${asig.verificadorNombre}</span>`:`<span style="color:var(--text3)">—</span>`;
      const socioChip=asig?`<span class="chip ${scls(asig.socio)||'p3'}">${INITIALS[asig.socio]||asig.socio}</span>`:`<span style="color:var(--text3)">—</span>`;
      const claseChip=e.clase==='M1'
        ?`<span class="tipo-badge t-s1">M1</span>`
        :`<span class="tipo-badge t-s2">F2</span>`;
      const fechaStr=asig?`<span style="font-size:10px;color:var(--text3)">${asig.fecha}</span>`:``;
      const diasHtml=asig?epDiasLabel(asig.dias):`<span style="color:var(--text3)">—</span>`;
      let acciones='—';
      if(canEdit){
        if(asig){
          // Socio solo puede liberar equipos de sus propios verificadores
          const puedeLiberar=SESSION.rol==='admin'||SESSION.rol==='personal'||(SESSION.rol==='socio'&&asig.socio===SESSION.socio);
          acciones=puedeLiberar?`<button class="btn sm ghost" style="color:var(--red)" onclick="confirmarLiberarEquipo('${e.id}')">Liberar</button>`:'—';
        } else {
          acciones=`<button class="btn sm primary" onclick="abrirAsigEquipo('${e.id}')">Asignar</button>`;
        }
      }
      tbody+=`<tr>
        <td style="font-family:var(--mono);font-weight:500">${e.id}</td>
        <td>${claseChip}</td>
        <td>${estadoChip}</td>
        <td>${verNombre}<br>${fechaStr}</td>
        <td>${socioChip}</td>
        <td style="white-space:normal">${diasHtml}</td>
        <td>${acciones}</td>
      </tr>`;
    });
  });

  document.getElementById('ep-tbody').innerHTML=tbody||`<tr><td colspan="7" style="text-align:center;color:var(--text3);padding:20px">Sin resultados.</td></tr>`;

  // Info paginación
  document.getElementById('ep-pag-info').textContent=`${desde+1}–${Math.min(desde+EP_PAGE_SIZE,lista.length)} de ${lista.length}`;
  document.getElementById('ep-pag-prev').disabled=epPage<=1;
  document.getElementById('ep-pag-next').disabled=epPage>=totalPag;
}

function epPrev(){if(epPage>1){epPage--;renderEquipoPatron();}}
function epNext(){epPage++;renderEquipoPatron();}

function epFiltrar(){
  epFilt.texto=document.getElementById('ep-filt-texto').value||'';
  epFilt.clase=document.getElementById('ep-filt-clase').value||'';
  epFilt.estado=document.getElementById('ep-filt-estado').value||'';
  epFilt.tipo=document.getElementById('ep-filt-tipo').value||'';
  epPage=1;
  renderEquipoPatron();
}

/* ── ASIGNAR EQUIPO ── */
function abrirAsigEquipo(equipoId){
  if(!equipoLibre(equipoId)){alert('Este equipo ya está asignado.');return;}
  const e=EQUIPO_PATRON_CATALOG.find(x=>x.id===equipoId);
  if(!e)return;

  document.getElementById('epa-equipo-id').value=equipoId;
  document.getElementById('epa-equipo-info').textContent=`${equipoId} — Clase de exactitud ${e.clase}`;

  // Poblar select de verificadores
  const sel=document.getElementById('epa-verificador');
  sel.innerHTML='<option value="">Seleccionar verificador...</option>';

  const lista=SESSION.rol==='socio'
    ? verificadores.filter(v=>v.socio===SESSION.socio&&v.activo)
    : verificadores.filter(v=>v.activo);

  lista.forEach(v=>{
    const opt=document.createElement('option');
    opt.value=v.id;
    opt.textContent=`${v.nombre} (${v.socio})`;
    sel.appendChild(opt);
  });

  document.getElementById('epa-fecha').value=TODAY;
  document.getElementById('epa-err').style.display='none';
  EP_DIAS.forEach(d=>{const cb=document.getElementById('epa-dia-'+d.id);if(cb)cb.checked=false;});
  openModal('modal-equipo-patron-asig');
}

function guardarAsigEquipo(){
  const equipoId=document.getElementById('epa-equipo-id').value;
  const verId=document.getElementById('epa-verificador').value;
  const fecha=document.getElementById('epa-fecha').value;
  const err=document.getElementById('epa-err');

  if(!verId){err.style.display='block';err.textContent='Selecciona un verificador.';return;}
  if(!fecha){err.style.display='block';err.textContent='Indica la fecha de asignación.';return;}
  if(!equipoLibre(equipoId)){err.style.display='block';err.textContent='Este equipo ya está asignado a otro verificador.';return;}

  const ver=verificadores.find(v=>v.id===verId);
  if(!ver){err.style.display='block';err.textContent='Verificador no encontrado.';return;}

  // Permiso: socio solo puede asignar a sus verificadores
  if(SESSION.rol==='socio'&&ver.socio!==SESSION.socio){
    err.style.display='block';err.textContent='Solo puedes asignar equipos a tus propios verificadores.';return;
  }

  const dias=EP_DIAS.map(d=>d.id).filter(d=>{const cb=document.getElementById('epa-dia-'+d);return cb&&cb.checked;});

  asignacionesEquipo.push({equipoId,verificadorId:verId,verificadorNombre:ver.nombre,socio:ver.socio,fecha,dias});
  epSaveToStorage();
  closeModal('modal-equipo-patron-asig');
  renderEquipoPatron();
}

/* ── LIBERAR EQUIPO ── */
function confirmarLiberarEquipo(equipoId){
  const asig=getAsigEquipo(equipoId);
  if(!asig)return;
  if(!confirm(`¿Liberar equipo ${equipoId} asignado a ${asig.verificadorNombre}?`))return;
  liberarEquipo(equipoId);
}

function liberarEquipo(equipoId){
  asignacionesEquipo=asignacionesEquipo.filter(a=>a.equipoId!==equipoId);
  epSaveToStorage();
  renderEquipoPatron();
}

/* ── ASIGNAR POR RANGO ── */
function abrirAsigRangoEquipo(){
  const sel=document.getElementById('epra-verificador');
  sel.innerHTML='<option value="">Seleccionar verificador...</option>';
  const lista=SESSION.rol==='socio'
    ? verificadores.filter(v=>v.socio===SESSION.socio&&v.activo)
    : verificadores.filter(v=>v.activo);
  lista.forEach(v=>{
    const opt=document.createElement('option');
    opt.value=v.id;
    opt.textContent=`${v.nombre} (${v.socio})`;
    sel.appendChild(opt);
  });
  document.getElementById('epra-desde').value='';
  document.getElementById('epra-hasta').value='';
  document.getElementById('epra-fecha').value=TODAY;
  document.getElementById('epra-preview').style.display='none';
  document.getElementById('epra-err').style.display='none';
  EP_DIAS.forEach(d=>{const cb=document.getElementById('epra-dia-'+d.id);if(cb)cb.checked=false;});
  openModal('modal-equipo-patron-rango');
}

function epraPreview(){
  const desde=(document.getElementById('epra-desde').value||'').trim().toUpperCase();
  const hasta=(document.getElementById('epra-hasta').value||'').trim().toUpperCase();
  const preview=document.getElementById('epra-preview');
  const err=document.getElementById('epra-err');
  err.style.display='none';
  preview.style.display='none';
  if(!desde||!hasta) return;
  const r=epRangoCatalogo(desde,hasta,err);
  if(!r||r.length===0) return;
  const libres=r.filter(e=>equipoLibre(e.id));
  const ocupados=r.length-libres.length;
  preview.style.display='block';
  preview.innerHTML=`<strong>${r.length}</strong> equipo(s) en rango: <strong>${libres.length}</strong> libres, <span style="color:var(--amber)">${ocupados} ya asignados (se omitirán)</span>. Rango: ${r[0].id} – ${r[r.length-1].id}`;
}

function epShowErr(errEl,msg){if(errEl){errEl.style.display='block';errEl.textContent=msg;}}

function epRangoCatalogo(desdeId,hastaId,errEl){
  const a=epParsearId(desdeId);
  const b=epParsearId(hastaId);
  if(!a||!b){epShowErr(errEl,'Formato de No. inventario inválido (ej: V233).');return null;}
  if(a.serie!==b.serie){epShowErr(errEl,'Los dos equipos deben ser de la misma serie (ej: V).');return null;}
  const numMin=Math.min(a.num,b.num);
  const numMax=Math.max(a.num,b.num);
  const items=EQUIPO_PATRON_CATALOG.filter(e=>{
    const p=epParsearId(e.id);
    return p&&p.serie===a.serie&&p.num>=numMin&&p.num<=numMax;
  });
  if(items.length===0){epShowErr(errEl,'No se encontraron equipos en ese rango.');return null;}
  return items;
}

function guardarAsigRangoEquipo(){
  const verId=document.getElementById('epra-verificador').value;
  const desde=(document.getElementById('epra-desde').value||'').trim().toUpperCase();
  const hasta=(document.getElementById('epra-hasta').value||'').trim().toUpperCase();
  const fecha=document.getElementById('epra-fecha').value;
  const err=document.getElementById('epra-err');
  err.style.display='none';

  if(!verId){err.style.display='block';err.textContent='Selecciona un verificador.';return;}
  if(!desde||!hasta){err.style.display='block';err.textContent='Indica el rango de equipos.';return;}
  if(!fecha){err.style.display='block';err.textContent='Indica la fecha de asignación.';return;}

  const ver=verificadores.find(v=>v.id===verId);
  if(!ver){err.style.display='block';err.textContent='Verificador no encontrado.';return;}
  if(SESSION.rol==='socio'&&ver.socio!==SESSION.socio){
    err.style.display='block';err.textContent='Solo puedes asignar equipos a tus propios verificadores.';return;
  }

  const items=epRangoCatalogo(desde,hasta,err);
  if(!items) return;

  const dias=EP_DIAS.map(d=>d.id).filter(d=>{const cb=document.getElementById('epra-dia-'+d);return cb&&cb.checked;});
  let asignados=0;
  items.forEach(e=>{
    if(equipoLibre(e.id)){
      asignacionesEquipo.push({equipoId:e.id,verificadorId:verId,verificadorNombre:ver.nombre,socio:ver.socio,fecha,dias});
      asignados++;
    }
  });
  closeModal('modal-equipo-patron-rango');
  epSaveToStorage();
  renderEquipoPatron();
  if(asignados>0) alert(`${asignados} equipo(s) asignados correctamente a ${ver.nombre}.`);
  else alert('No se asignó ningún equipo (todos del rango ya estaban ocupados).');
}

/* ── TÍTULOS Y NAVEGACIÓN ── */
titles['equipo-patron']='Catálogo de equipo patrón';
breadcrumbs['equipo-patron']='Catálogos';
