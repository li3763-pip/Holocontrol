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

/* Clave de localStorage compartida con la app del verificador (fallback offline) */
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

/* Guarda en API (con fallback a localStorage) */
async function epSave(){
  epSaveToStorage();
}

/* Elimina asignación de equipo en API */
async function epDeleteRemote(equipoId){
  try { await api.del('/api/equipos/'+encodeURIComponent(equipoId)); } catch(e) { console.warn('epDeleteRemote:', e.message); }
}

/* Agrega asignación de equipo en API */
async function epPostRemote(asig){
  try {
    await api.post('/api/equipos', {
      equipoId: asig.equipoId,
      verificadorId: asig.verificadorId,
      verificadorNombre: asig.verificadorNombre,
      socio: asig.socio,
      fecha: asig.fecha,
      dias: asig.dias
    });
  } catch(e) { console.warn('epPostRemote:', e.message); }
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
  // Acepta formatos: V001, V-001, VF01, M01, etc.
  const normalizado=idStr.replace(/-/g,'');
  const m=normalizado.match(/^([A-Za-z]+)(\d+)$/);
  if(!m) return null;
  return {serie:m[1].toUpperCase(), num:parseInt(m[2],10)};
}

/* ── HELPERS ── */
function getAsigEquipo(equipoId){
  return asignacionesEquipo.find(a=>a.equipoId===equipoId)||null;
}

function equipoLibre(equipoId){
  return !getAsigEquipo(equipoId);
}

/* ── METADATA DE SERIES ── */
const EP_SERIES_META=[
  {serie:'M',  nombre:'Marco',     clase:'M1'},
  {serie:'C',  nombre:'Cinco',     clase:'M1'},
  {serie:'D',  nombre:'Diez',      clase:'M1'},
  {serie:'V',  nombre:'Veinte',    clase:'M1'},
  {serie:'MF', nombre:'Marco F2',  clase:'F2'},
  {serie:'CF', nombre:'Cinco F2',  clase:'F2'},
  {serie:'DF', nombre:'Diez F2',   clase:'F2'},
  {serie:'VF', nombre:'Veinte F2', clase:'F2'},
];

/* ── RENDER ── */
function renderEquipoPatron(){
  // Métricas globales
  const total=EQUIPO_PATRON_CATALOG.length;
  const asignados=asignacionesEquipo.length;
  const libres=total-asignados;
  document.getElementById('ep-metric-total').textContent=total.toLocaleString();
  document.getElementById('ep-metric-asignados').textContent=asignados.toLocaleString();
  document.getElementById('ep-metric-libres').textContent=libres.toLocaleString();

  const canEdit=SESSION.rol==='admin'||SESSION.rol==='personal'||SESSION.rol==='socio';
  const btnRango=document.getElementById('ep-btn-rango');
  if(btnRango) btnRango.style.display=canEdit?'':'none';

  // Resumen por serie
  let tbody='';
  EP_SERIES_META.forEach(meta=>{
    const items=EQUIPO_PATRON_CATALOG.filter(e=>e.serie===meta.serie);
    if(!items.length) return;
    const itemLibres=items.filter(e=>equipoLibre(e.id));
    const itemAsig=items.length-itemLibres.length;
    const claseChip=meta.clase==='M1'
      ?`<span class="tipo-badge t-s1">M1</span>`
      :`<span class="tipo-badge t-s2">F2</span>`;
    const primerItemId=items[0].id;
    const ultimoItemId=items[items.length-1].id;
    const rangoStr=items.length===1?primerItemId:`${primerItemId} – ${ultimoItemId}`;
    const libresColor=itemLibres.length===0?'var(--red)':itemLibres.length<items.length?'var(--amber)':'var(--green)';
    let btnAsig='—';
    if(canEdit){
      if(itemLibres.length===0){
        btnAsig=`<button class="btn sm ghost" disabled aria-disabled="true" title="Sin equipos disponibles">Sin disponibles</button>`;
      } else {
        btnAsig=`<button class="btn sm primary" onclick="abrirAsigPorTipo('${meta.serie}')">Asignar</button>`;
      }
    }
    tbody+=`<tr>
      <td style="font-family:var(--mono);font-weight:700;font-size:13px">${meta.serie}</td>
      <td>${meta.nombre}</td>
      <td>${claseChip}</td>
      <td style="font-family:var(--mono);font-size:11px;color:var(--text2)">${rangoStr}</td>
      <td style="text-align:center">${items.length}</td>
      <td style="text-align:center;color:var(--blue)">${itemAsig}</td>
      <td style="text-align:center;font-weight:700;color:${libresColor}">${itemLibres.length}</td>
      <td>${btnAsig}</td>
    </tr>`;
  });

  document.getElementById('ep-resumen-tbody').innerHTML=tbody||`<tr><td colspan="8" style="text-align:center;color:var(--text3);padding:20px">Sin datos.</td></tr>`;

  renderEquiposAsignados();
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

  document.getElementById('epa-fecha').value=getTodayMX();
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

  const nuevaAsig={equipoId,verificadorId:verId,verificadorNombre:ver.nombre,socio:ver.socio,fecha,dias};
  asignacionesEquipo.push(nuevaAsig);
  await epPostRemote(nuevaAsig);
  epSaveToStorage();
  closeModal('modal-equipo-patron-asig');
  renderEquipoPatron();
}

/* ── LIBERAR EQUIPO ── */
function confirmarLiberarEquipo(equipoId){
  const asig=getAsigEquipo(equipoId);
  if(!asig)return;
  // Permiso: socio solo puede liberar equipos de sus propios verificadores
  if(SESSION.rol==='socio'&&asig.socio!==SESSION.socio){
    alert('Solo puedes desasignar equipos de tus propios verificadores.');return;
  }
  if(!confirm(`¿Desasignar equipo ${equipoId} de ${asig.verificadorNombre}?`))return;
  liberarEquipo(equipoId);
}

async function liberarEquipo(equipoId){
  asignacionesEquipo=asignacionesEquipo.filter(a=>a.equipoId!==equipoId);
  await epDeleteRemote(equipoId);
  epSaveToStorage();
  renderEquipoPatron();
}

/* ── RENDER EQUIPOS ASIGNADOS ── */
function renderEquiposAsignados(){
  const tbody=document.getElementById('ep-asignados-tbody');
  if(!tbody) return;

  // socio solo ve sus propios equipos asignados
  const asigs=SESSION.rol==='socio'
    ? asignacionesEquipo.filter(a=>a.socio===SESSION.socio)
    : asignacionesEquipo.slice();

  if(asigs.length===0){
    tbody.innerHTML=`<tr><td colspan="8" style="text-align:center;color:var(--text3);padding:16px">Sin equipos asignados actualmente.</td></tr>`;
    return;
  }

  tbody.innerHTML=asigs.map(a=>{
    const eq=EQUIPO_PATRON_CATALOG.find(e=>e.id===a.equipoId);
    const claseChip=eq?(eq.clase==='M1'?`<span class="tipo-badge t-s1">M1</span>`:`<span class="tipo-badge t-s2">F2</span>`):'';
    const canLiberate=SESSION.rol==='admin'||SESSION.rol==='personal'||(SESSION.rol==='socio'&&a.socio===SESSION.socio);
    const btnDesasig=canLiberate
      ?`<button class="btn sm ghost" style="color:var(--red)" onclick="confirmarLiberarEquipo('${a.equipoId}')">Desasignar</button>`
      :'—';
    return`<tr>
      <td style="font-family:var(--mono);font-weight:700;font-size:12px">${a.equipoId}</td>
      <td style="font-family:var(--mono);font-size:11px">${eq?eq.serie:''}</td>
      <td>${claseChip}</td>
      <td>${a.verificadorNombre}</td>
      <td><span class="chip ${scls(a.socio)}">${a.socio}</span></td>
      <td style="font-size:11px;color:var(--text2)">${a.fecha||'—'}</td>
      <td>${epDiasLabel(a.dias)}</td>
      <td>${btnDesasig}</td>
    </tr>`;
  }).join('');
}

/* ── ASIGNAR POR RANGO (múltiples rangos) ── */
let epraRowCount=0;
let epraActiveRows=[];

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
  // Limpiar y reiniciar filas de rangos
  epraRowCount=0;
  epraActiveRows=[];
  document.getElementById('epra-rangos-container').innerHTML='';
  epraAgregarRango();
  document.getElementById('epra-fecha').value=getTodayMX();
  document.getElementById('epra-preview').style.display='none';
  document.getElementById('epra-preview').innerHTML='';
  document.getElementById('epra-err').style.display='none';
  EP_DIAS.forEach(d=>{const cb=document.getElementById('epra-dia-'+d.id);if(cb)cb.checked=false;});
  openModal('modal-equipo-patron-rango');
}

function epraAgregarRango(desdeVal,hastaVal){
  const idx=epraRowCount++;
  epraActiveRows.push(idx);
  const container=document.getElementById('epra-rangos-container');
  const row=document.createElement('div');
  row.id='epra-row-'+idx;
  row.style.cssText='border:1px solid var(--border);border-radius:6px;padding:8px 10px;margin-bottom:8px;background:var(--surface2)';
  row.innerHTML=`<div style="display:flex;gap:6px;align-items:flex-end;flex-wrap:wrap">
    <div class="fg" style="flex:1;min-width:110px">
      <label class="fl">Desde</label>
      <input class="fi" type="text" id="epra-desde-${idx}" placeholder="Ej: M01" value="${desdeVal||''}" oninput="epraPreview()">
    </div>
    <div class="fg" style="flex:1;min-width:110px">
      <label class="fl">Hasta</label>
      <input class="fi" type="text" id="epra-hasta-${idx}" placeholder="Ej: M15" value="${hastaVal||''}" oninput="epraPreview()">
    </div>
    <button type="button" class="btn sm ghost" style="height:34px;padding:0 10px;flex-shrink:0;margin-bottom:0" onclick="epraEliminarRango(${idx})" title="Quitar este rango" aria-label="Quitar rango">✕</button>
  </div>
  <div id="epra-row-info-${idx}" style="font-size:10px;color:var(--text2);margin-top:4px;display:none"></div>`;
  container.appendChild(row);
  if(desdeVal&&hastaVal) epraPreview();
}

function epraEliminarRango(idx){
  epraActiveRows=epraActiveRows.filter(i=>i!==idx);
  const row=document.getElementById('epra-row-'+idx);
  if(row) row.remove();
  epraPreview();
}

function epraPreview(){
  const preview=document.getElementById('epra-preview');
  const err=document.getElementById('epra-err');
  err.style.display='none';
  let totalEq=0,totalLibres=0,totalOcupados=0,hasValid=false;
  epraActiveRows.forEach(idx=>{
    const desdeEl=document.getElementById('epra-desde-'+idx);
    const hastaEl=document.getElementById('epra-hasta-'+idx);
    const info=document.getElementById('epra-row-info-'+idx);
    if(!desdeEl||!hastaEl) return;
    const desde=(desdeEl.value||'').trim().toUpperCase();
    const hasta=(hastaEl.value||'').trim().toUpperCase();
    if(!desde||!hasta){if(info)info.style.display='none';return;}
    const r=epRangoCatalogo(desde,hasta,null);
    if(!r||r.length===0){
      if(info){info.style.display='block';info.style.color='var(--red)';info.textContent='Rango inválido o no encontrado.';}
      return;
    }
    const libres=r.filter(e=>equipoLibre(e.id));
    const ocupados=r.length-libres.length;
    totalEq+=r.length;totalLibres+=libres.length;totalOcupados+=ocupados;hasValid=true;
    if(info){
      info.style.display='block';info.style.color='var(--text2)';
      info.innerHTML=`Rango <strong>${r[0].id}–${r[r.length-1].id}</strong>: <strong>${r.length}</strong> equipo(s) · <strong style="color:var(--green)">${libres.length}</strong> libres · <span style="color:var(--amber)">${ocupados} ya asignados</span>`;
    }
  });
  if(!hasValid){preview.style.display='none';return;}
  preview.style.display='block';
  preview.innerHTML=`<strong>Total: ${totalEq}</strong> equipo(s) en todos los rangos · <strong style="color:var(--green)">${totalLibres}</strong> se asignarán · <span style="color:var(--amber)">${totalOcupados} ya asignados (se omitirán)</span>`;
}

function epShowErr(errEl,msg){if(errEl){errEl.style.display='block';errEl.textContent=msg;}}

function epRangoCatalogo(desdeId,hastaId,errEl){
  const a=epParsearId(desdeId);
  const b=epParsearId(hastaId);
  if(!a||!b){epShowErr(errEl,'Formato de No. inventario inválido (ej: V-001 o V001).');return null;}
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
  const fecha=document.getElementById('epra-fecha').value;
  const err=document.getElementById('epra-err');
  err.style.display='none';

  if(!verId){err.style.display='block';err.textContent='Selecciona un verificador.';return;}
  if(!fecha){err.style.display='block';err.textContent='Indica la fecha de asignación.';return;}

  const ver=verificadores.find(v=>v.id===verId);
  if(!ver){err.style.display='block';err.textContent='Verificador no encontrado.';return;}
  if(SESSION.rol==='socio'&&ver.socio!==SESSION.socio){
    err.style.display='block';err.textContent='Solo puedes asignar equipos a tus propios verificadores.';return;
  }

  // Recopilar y validar todos los rangos
  let allItems=[];
  for(const idx of epraActiveRows){
    const desdeEl=document.getElementById('epra-desde-'+idx);
    const hastaEl=document.getElementById('epra-hasta-'+idx);
    if(!desdeEl||!hastaEl) continue;
    const desde=(desdeEl.value||'').trim().toUpperCase();
    const hasta=(hastaEl.value||'').trim().toUpperCase();
    if(!desde&&!hasta) continue; // fila vacía, se omite
    if(!desde||!hasta){
      err.style.display='block';
      err.textContent='Rango incompleto: completa los campos "Desde" y "Hasta" en cada rango, o quita los rangos vacíos.';
      return;
    }
    const items=epRangoCatalogo(desde,hasta,err);
    if(!items) return;
    allItems=allItems.concat(items);
  }

  if(allItems.length===0){
    err.style.display='block';
    err.textContent='Agrega al menos un rango de equipos.';
    return;
  }

  const dias=EP_DIAS.map(d=>d.id).filter(d=>{const cb=document.getElementById('epra-dia-'+d);return cb&&cb.checked;});
  let asignados=0;
  const seen=new Set();
  const nuevas=[];
  allItems.forEach(e=>{
    if(!seen.has(e.id)&&equipoLibre(e.id)){
      seen.add(e.id);
      const a={equipoId:e.id,verificadorId:verId,verificadorNombre:ver.nombre,socio:ver.socio,fecha,dias};
      asignacionesEquipo.push(a);
      nuevas.push(a);
      asignados++;
    }
  });
  closeModal('modal-equipo-patron-rango');
  // Persistir en API y localStorage
  Promise.all(nuevas.map(a=>epPostRemote(a))).catch(()=>{});
  epSaveToStorage();
  renderEquipoPatron();
  if(asignados>0) alert(`${asignados} equipo(s) asignados correctamente a ${ver.nombre}.`);
  else alert('No se asignó ningún equipo (todos del rango ya estaban ocupados).');
}

/* ── ASIGNAR POR TIPO ── */
function abrirAsigPorTipo(serie){
  const items=EQUIPO_PATRON_CATALOG.filter(e=>e.serie===serie);
  if(!items.length) return;
  // Serie con un solo equipo: usar modal de asignación individual
  if(items.length===1){
    abrirAsigEquipo(items[0].id);
    return;
  }
  // Serie con varios equipos: abrir modal de múltiples rangos pre-cargado con el rango completo
  abrirAsigRangoEquipo();
  const desdeEl=document.getElementById('epra-desde-0');
  const hastaEl=document.getElementById('epra-hasta-0');
  if(desdeEl) desdeEl.value=items[0].id;
  if(hastaEl) hastaEl.value=items[items.length-1].id;
  epraPreview();
}

/* ── ASIGNAR EQUIPO PATRÓN DESDE VERIFICADOR ── */
function abrirAsigEquipoPatronVer(verId){
  abrirAsigRangoEquipo();
  const sel=document.getElementById('epra-verificador');
  if(sel) sel.value=verId;
}

/* ── TÍTULOS Y NAVEGACIÓN ── */
titles['equipo-patron']='Catálogo de equipo patrón';
breadcrumbs['equipo-patron']='Catálogos';
