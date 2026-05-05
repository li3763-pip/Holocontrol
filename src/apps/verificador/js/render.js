/* ══════════════════════════════════════════════
   BÚSQUEDA POR DGN — dato principal

══════════════════════════════════════════════ */
let _dgnMatch = null; // resultado actual del DGN encontrado

function buscarPorDGN(val){
  const res  = document.getElementById('dgn-result');
  const body = document.getElementById('dgn-result-body');
  const notf = document.getElementById('dgn-notfound');
  _dgnMatch = null;
  res.style.display = 'none';
  notf.style.display = 'none';

  const q = val.trim().toUpperCase();
  if(q.length < 4) return;

  // Busca coincidencias parciales en todas las claves DGN
  const matches = Object.entries(DGN_CATALOG)
    .filter(([dgn]) => dgn.toUpperCase().includes(q));

  if(!matches.length){ notf.style.display='block'; return; }

  // Agrupar por DGN exacto (puede venir duplicado del PDF)
  const [dgn, data] = matches[0];
  _dgnMatch = { marca: data.marca, modelos: (data.modelos||[]).map(mo=>mo.m||mo), dgn, tipo: data.tipo||'' };

  const modelos = data.modelos || [];
  const modelNames = modelos.map(mo => mo.m || mo);
  body.innerHTML = `
    <div class="irow"><div class="irow-l">Marca</div>
      <div class="irow-v" style="color:var(--text);font-weight:600">${data.marca}</div></div>
    ${data.tipo?`<div class="irow"><div class="irow-l">Tipo</div><div class="irow-v" style="font-size:10px;color:var(--blue)">${data.tipo}</div></div>`:''}
    <div class="irow"><div class="irow-l">DGN</div>
      <div class="irow-v mono" style="color:var(--green);font-size:10px">${dgn}</div></div>
    <div class="irow" style="border:none"><div class="irow-l">Modelos (${modelNames.length})</div>
      <div class="irow-v" style="font-size:10px;color:var(--text2);text-align:right">
        ${modelNames.length
          ? modelNames.slice(0,8).join('<br>') + (modelNames.length>8 ? `<br><span style="color:var(--text3)">+ ${modelNames.length-8} más</span>` : '')
          : '—'}
      </div>
    </div>
    ${matches.length > 1 ? `<div style="font-size:9px;color:var(--amber);margin-top:6px">⚠ ${matches.length} coincidencias — mostrando la primera</div>` : ''}`;
  res.style.display = 'block';
}

function aplicarDGN(){
  if(!_dgnMatch) return;
  document.getElementById('if-marca').value = _dgnMatch.marca;
  if(_dgnMatch.tipo){
    const tipoSel = document.getElementById('if-tipo');
    if(tipoSel && !tipoSel.value){
      const tl = _dgnMatch.tipo.toLowerCase();
      if(tl.includes('electr')) tipoSel.value='E';
      else if(tl.includes('mecán') || tl.includes('mecanica')) tipoSel.value='M';
      else if(tl.includes('híbrid') || tl.includes('hibrida')) tipoSel.value='H';
    }
  }
  if(_dgnMatch.modelos.length === 1){
    document.getElementById('if-modelo').value = _dgnMatch.modelos[0];
  } else {
    document.getElementById('if-modelo').value = '';
    document.getElementById('if-modelo').placeholder = `${_dgnMatch.modelos.length} modelos disponibles...`;
  }
  document.getElementById('dgn-result').style.display = 'none';
  setTimeout(()=>{ const mInput=document.getElementById('if-modelo'); mInput.focus(); filtrarModelos(''); }, 100);
  toast('✓ Datos del catálogo NOM-010 aplicados', 'ok');
}

/* ══════════════════════════════════════════════
   AUTOCOMPLETE — MARCA
══════════════════════════════════════════════ */
function filtrarMarcas(q){
  const drop = document.getElementById('marca-drop');
  const val = q.trim().toLowerCase();
  const marcas = val
    ? MARCAS_NOM010.filter(m => m.toLowerCase().includes(val))
    : MARCAS_NOM010;
  if(!marcas.length){ drop.style.display='none'; return; }
  drop.innerHTML = marcas.slice(0,10).map(m=>`
    <div onclick="seleccionarMarca('${m.replace(/'/g,"\'")}')"
      style="padding:10px 14px;font-size:13px;cursor:pointer;border-bottom:1px solid var(--border)"
      onmousedown="event.preventDefault()"
      onmouseover="this.style.background='var(--surface2)'"
      onmouseout="this.style.background=''">
      ${m}
      <span style="font-size:10px;color:var(--text3);float:right">${getModelosDeMarca(m).length} modelos</span>
    </div>`).join('');
  drop.style.display = 'block';
}

function seleccionarMarca(marca){
  document.getElementById('if-marca').value = marca;
  document.getElementById('marca-drop').style.display = 'none';
  document.getElementById('if-modelo').value = '';
  document.getElementById('if-modelo').placeholder = 'Escribe o selecciona modelo...';
  document.getElementById('if-modelo').focus();
}

function cerrarMarcas(){
  document.getElementById('marca-drop').style.display='none';
}

/* ══════════════════════════════════════════════
   AUTOCOMPLETE — MODELO (con autorelleno DGN)
══════════════════════════════════════════════ */
function filtrarModelos(q){
  const drop = document.getElementById('modelo-drop');
  const marca = document.getElementById('if-marca').value.trim();
  const lista = getModelosDeMarca(marca);
  const val = q.trim().toLowerCase();
  const filtrados = val ? lista.filter(e => e.m.toLowerCase().includes(val)) : lista;
  if(!filtrados.length){ drop.style.display='none'; return; }
  drop.innerHTML = filtrados.slice(0,12).map(e=>{
    const ms = e.m.replace(/\\/g,'\\\\').replace(/'/g,'\\x27');
    const ds = e.d.replace(/'/g,'\\x27');
    const ts = (e.t||'').replace(/'/g,'\\x27');
    const mx = (e.max||'').replace(/'/g,'\\x27');
    const ev = (e.e||'').replace(/'/g,'\\x27');
    return `<div onclick="seleccionarModelo('${ms}','${ds}','${ts}','${mx}','${ev}')"
      style="padding:9px 14px;cursor:pointer;border-bottom:1px solid var(--border)"
      onmousedown="event.preventDefault()"
      onmouseover="this.style.background='var(--surface2)'"
      onmouseout="this.style.background=''">
      <div style="font-family:var(--mono);font-size:12px">${e.m}</div>
      <div style="font-size:9px;color:var(--text3);margin-top:2px">
        ${e.max?'<span style=\"color:var(--green)\">Max '+e.max+' · e '+e.e+'</span> · ':''}${e.d.split('.').pop()}
      </div>
    </div>`;
  }).join('');
  drop.style.display = 'block';
}

function seleccionarModelo(modelo, dgn, tipo, maxVal, eVal){
  document.getElementById('if-modelo').value = modelo;
  document.getElementById('modelo-drop').style.display = 'none';
  const dgnField = document.getElementById('if-dgn-search');
  if(dgnField && !dgnField.value) dgnField.value = dgn;
  if(tipo){
    const tipoSel = document.getElementById('if-tipo');
    if(tipoSel && !tipoSel.value){
      const tl = tipo.toLowerCase();
      if(tl.includes('electr')) tipoSel.value='E';
      else if(tl.includes('mecán') || tl.includes('mecanica')) tipoSel.value='M';
      else if(tl.includes('híbrid') || tl.includes('hibrida')) tipoSel.value='H';
    }
  }
  if(maxVal){ const mf=document.getElementById('if-max'); if(mf&&!mf.value) mf.value=maxVal; }
  if(eVal){ const ef=document.getElementById('if-e'); if(ef&&!ef.value) ef.value=eVal; }
  document.getElementById('if-serie').focus();
}

function cerrarModelos(){
  document.getElementById('modelo-drop').style.display='none';
}

function showProtoBadge(){ /* no-op */ }

/* ══════════════════════════════════════════════
   DATOS Y ESTADO
══════════════════════════════════════════════ */
const TODAY = new Date().toISOString().split('T')[0];
let SESSION = null;
let registros = [];
let ndStep = 1;
let NUM_INSTR = 1; // cuántos instrumentos en la inspección actual

/* ══════════════════════════════════════════════
   LOGIN / LOGOUT — definidos en js/auth.js
══════════════════════════════════════════════ */
document.getElementById('l-pass').addEventListener('keydown', e=>{ if(e.key==='Enter') doLogin(); });
document.getElementById('l-user').addEventListener('keydown', e=>{ if(e.key==='Enter') document.getElementById('l-pass').focus(); });

/* ══════════════════════════════════════════════
   INIT
══════════════════════════════════════════════ */
function initApp(){
  document.getElementById('sc-login').classList.remove('active');
  document.getElementById('sc-app').classList.add('active');
  document.getElementById('tb-name').textContent = SESSION.nombre;
  document.getElementById('tb-sub').textContent = SESSION.zona + ' · ' + SESSION.socio;
  document.getElementById('p-av').textContent = SESSION.nombre[0];
  document.getElementById('p-name').textContent = SESSION.nombre;
  document.getElementById('p-socio').textContent = SESSION.socio + ' · ' + SESSION.zona;
  renderHome(); renderHist(); renderPerf();
}

/* ══════════════════════════════════════════════
   TABS
══════════════════════════════════════════════ */
function goTab(t){
  ['home','hist','perf'].forEach(id=>document.getElementById('tab-'+id).style.display=id===t?'block':'none');
  ['bn-home','bn-hist'].forEach(id=>document.getElementById(id).classList.remove('on'));
  if(t==='home') document.getElementById('bn-home').classList.add('on');
  if(t==='hist') document.getElementById('bn-hist').classList.add('on');
}

/* ══════════════════════════════════════════════
   RENDER HOME
══════════════════════════════════════════════ */
function renderHome(){
  const inv = SESSION.inv;
  const hoy = registros.filter(r=>r.fechaDict===TODAY).length;
  const pend = registros.filter(r=>r.status==='ok').length;
  document.getElementById('st-hoy').textContent=hoy;
  document.getElementById('st-pend').textContent=pend;
  document.getElementById('st-tot').textContent=registros.length;
  document.getElementById('inv-dict').textContent=inv.dict;
  document.getElementById('inv-s1').textContent=inv.s1;
  document.getElementById('inv-s2').textContent=inv.s2;
  document.getElementById('inv-an').textContent=inv.an;
  document.getElementById('inv-uva').textContent=inv.uva;
  const el = document.getElementById('home-list');
  const rec = registros.slice(0,6);
  el.innerHTML = rec.length ? rec.map(r=>dictCard(r)).join('') : `<div class="empty">
    <svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
    <div class="empty-t">Sin registros</div><div class="empty-s">Usa el botón + para capturar un dictamen</div></div>`;
}

function dictCard(r){
  const sc = r.status==='sync'?'sync':r.status==='ok'?'ok':'pend';
  const bl = r.status==='sync'?'SINCRONIZADO':r.status==='ok'?'GUARDADO':'PENDIENTE';
  const bc = r.status==='sync'?'badge-sync':r.status==='ok'?'badge-ok':'badge-pend';
  const cumple = r.instrumentos && r.instrumentos.some(i=>i.cumpleNom==='NC') ? '⚠ Tiene NC' : r.instrumentos && r.instrumentos.length ? '✓ Cumple' : '';
  return `<div class="di ${sc}" onclick="openDetail('${r.id}')">
    <div class="di-folio">Folio: ${r.folioDict||'—'} · ${r.fechaDict||'—'}</div>
    <div class="di-cliente">${r.razonSocial||'—'}</div>
    <div class="di-meta">
      <span>${r.entidad||'—'}</span>
      <span>${r.municipio||'—'}</span>
      ${r.instrumentos?`<span>${r.instrumentos.length} instrumento(s)</span>`:''}
      ${cumple?`<span>${cumple}</span>`:''}
    </div>
    <div class="di-badge ${bc}">${bl}</div>
  </div>`;
}

/* ══════════════════════════════════════════════
   RENDER HISTORIAL
══════════════════════════════════════════════ */
function renderHist(){
  const q=(document.getElementById('hist-q')||{}).value||'';
  const f=(document.getElementById('hist-f')||{}).value||'';
  let list=[...registros];
  if(q) list=list.filter(r=>JSON.stringify(r).toLowerCase().includes(q.toLowerCase()));
  if(f) list=list.filter(r=>r.status===f);
  const el=document.getElementById('hist-list');
  if(!el) return;
  el.innerHTML=list.length?list.map(r=>dictCard(r)).join(''):
    `<div class="empty"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg><div class="empty-t">Sin resultados</div></div>`;
}

/* ══════════════════════════════════════════════
   RENDER PERFIL
══════════════════════════════════════════════ */
function renderPerf(){
  const hoy=registros.filter(r=>r.fechaDict===TODAY).length;
  const sem=registros.filter(r=>{ const d=new Date(r.fechaDict),n=new Date(); return (n-d)/(864e5)<=7; }).length;
  document.getElementById('p-stats').innerHTML=`
    <div class="irow"><div class="irow-l">Dictámenes hoy</div><div class="irow-v g">${hoy}</div></div>
    <div class="irow"><div class="irow-l">Última semana</div><div class="irow-v">${sem}</div></div>
    <div class="irow"><div class="irow-l">Total registros</div><div class="irow-v b">${registros.length}</div></div>
    <div class="irow"><div class="irow-l">Socio</div><div class="irow-v">${SESSION.socio}</div></div>
    <div class="irow"><div class="irow-l">Zona</div><div class="irow-v">${SESSION.zona}</div></div>`;
  document.getElementById('p-folios').innerHTML=`
    <div class="irow"><div class="irow-l">Dictámenes</div><div class="irow-v mono">${SESSION.fdIni.toString().padStart(5,'0')} → ${SESSION.fdFin.toString().padStart(5,'0')}</div></div>
    <div class="irow"><div class="irow-l">Hologr. S1</div><div class="irow-v mono" style="font-size:10px">${SESSION.fs1||'—'}</div></div>
    <div class="irow"><div class="irow-l">Hologr. S2</div><div class="irow-v mono" style="font-size:10px">${SESSION.fs2||'—'}</div></div>
    <div class="irow"><div class="irow-l">Hologr. AN</div><div class="irow-v mono" style="font-size:10px">${SESSION.fan||'—'}</div></div>`;
  document.getElementById('p-sync').textContent=new Date().toLocaleTimeString('es-MX',{hour:'2-digit',minute:'2-digit'});
  document.getElementById('p-local').textContent=registros.length;
}

/* ══════════════════════════════════════════════
   MODAL NUEVO DICTAMEN
══════════════════════════════════════════════ */
/* Estado de modo rango por tipo de equipo patrón */
const epRangoMode={m:false,c:false,d:false,v:false};

/* Alterna entre modo único y modo rango para el tipo k (m|c|d|v).
   Al activar el rango pre-selecciona el primer y último equipo asignado
   como valores predeterminados de "desde" y "hasta". */
function epToggleRango(k){
  epRangoMode[k]=!epRangoMode[k];
  const sel=document.getElementById('ep-'+k);
  const rngDiv=document.getElementById('ep-rng-'+k);
  if(sel) sel.style.display=epRangoMode[k]?'none':'';
  if(rngDiv) rngDiv.style.display=epRangoMode[k]?'block':'none';
  const btn=document.getElementById('ep-lbl-'+k)?.querySelector('.ep-rng-toggle');
  if(btn) btn.textContent=epRangoMode[k]?'↩ Único':'↔ Rango';
  // Al activar modo rango, pre-llenar desde=primero y hasta=último si aún no se han elegido
  if(epRangoMode[k]){
    const desdeEl=document.getElementById('ep-'+k+'-desde');
    const hastaEl=document.getElementById('ep-'+k+'-hasta');
    if(desdeEl&&hastaEl){
      const opts=Array.from(desdeEl.options, o=>o.value).filter(Boolean);
      if(opts.length>0){
        if(!desdeEl.value) desdeEl.value=opts[0];
        if(!hastaEl.value) hastaEl.value=opts[opts.length-1];
      }
    }
  }
}

/* Devuelve el valor efectivo del equipo patrón para el tipo k:
   en modo rango retorna "DESDE–HASTA", en modo único retorna el ID seleccionado.
   Valida que 'desde' no sea posterior a 'hasta' en la lista de opciones. */
function getEpValue(k){
  if(epRangoMode[k]){
    const desdeEl=document.getElementById('ep-'+k+'-desde');
    const hastaEl=document.getElementById('ep-'+k+'-hasta');
    const desde=desdeEl?.value||'';
    const hasta=hastaEl?.value||'';
    if(desde&&hasta){
      // Verificar orden: desde debe aparecer antes o igual que hasta en la lista
      const opts=Array.from(desdeEl?.options||[]).map(o=>o.value).filter(Boolean);
      const iDesde=opts.indexOf(desde);
      const iHasta=opts.indexOf(hasta);
      if(iDesde>iHasta){
        // Intercambiar silenciosamente para garantizar orden correcto
        return hasta+'–'+desde;
      }
      if(desde!==hasta) return desde+'–'+hasta;
      return desde;
    }
    return desde||hasta;
  }
  return document.getElementById('ep-'+k)?.value||'';
}

/* Reinicia la UI de equipo patrón al estado inicial (modo único, selects vacíos). */
function resetEquipoPatronFields(){
  ['m','c','d','v'].forEach(k=>{
    // Volver a modo único si estaba en rango
    if(epRangoMode[k]){
      epRangoMode[k]=false;
      const sel=document.getElementById('ep-'+k);
      const rngDiv=document.getElementById('ep-rng-'+k);
      if(sel) sel.style.display='';
      if(rngDiv) rngDiv.style.display='none';
      const btn=document.getElementById('ep-lbl-'+k)?.querySelector('.ep-rng-toggle');
      if(btn) btn.textContent='↔ Rango';
    }
  });
  const nota=document.getElementById('ep-nota');
  if(nota) nota.style.display='none';
}

/* Rellena los selects de equipo patrón con los equipos asignados al verificador.
   Si el tipo tiene un solo equipo lo preselecciona; si tiene varios muestra el
   botón "↔ Rango" para alternar entre selección única y selección por rango. */
function fillEquipoPatron(){
  if(!SESSION) return;
  const ea=SESSION.equiposAsignados||{m:[],c:[],d:[],v:[]};
  let anyAssigned=false;
  ['m','c','d','v'].forEach(k=>{
    const sel=document.getElementById('ep-'+k);
    const desde=document.getElementById('ep-'+k+'-desde');
    const hasta=document.getElementById('ep-'+k+'-hasta');
    const lbl=document.getElementById('ep-lbl-'+k);
    if(!sel) return;

    const opciones=ea[k]||[];

    // Asegurar modo único al abrir
    epRangoMode[k]=false;
    sel.style.display='';
    const rngDiv=document.getElementById('ep-rng-'+k);
    if(rngDiv) rngDiv.style.display='none';

    // Poblar select único
    sel.innerHTML='';
    if(opciones.length===0){
      sel.innerHTML='<option value="">— Sin asignación —</option>';
      sel.disabled=true;
    } else {
      sel.disabled=false;
      if(opciones.length>1) sel.innerHTML='<option value="">Seleccionar...</option>';
      opciones.forEach(id=>{
        const opt=document.createElement('option');
        opt.value=id; opt.textContent=id;
        sel.appendChild(opt);
      });
      if(opciones.length===1) sel.value=opciones[0];
      anyAssigned=true;
    }

    // Poblar selects de rango
    if(desde&&hasta){
      [desde,hasta].forEach((s,i)=>{
        s.innerHTML=`<option value="">${i===0?'Desde…':'Hasta…'}</option>`;
        opciones.forEach(id=>{
          const opt=document.createElement('option');
          opt.value=id; opt.textContent=id;
          s.appendChild(opt);
        });
      });
    }

    // Botón toggle rango: solo se muestra cuando hay más de una opción
    if(lbl){
      let btn=lbl.querySelector('.ep-rng-toggle');
      if(opciones.length>1){
        if(!btn){
          btn=document.createElement('span');
          btn.className='ep-rng-toggle';
          btn.onclick=()=>epToggleRango(k);
          lbl.appendChild(btn);
        }
        btn.textContent='↔ Rango';
        btn.style.display='';
      } else if(btn){
        btn.style.display='none';
      }
    }
  });
  const nota=document.getElementById('ep-nota');
  if(nota) nota.style.display=anyAssigned?'block':'none';
}

function openNuevo(){
  ndStep=1;
  NUM_INSTR=1;
  document.getElementById('nd-folio-lbl').textContent='DICT-'+String(registros.length+1).padStart(4,'0');
  const fSol = document.getElementById('nd-fecha-sol');
  fSol.value = TODAY; fSol.max = TODAY;
  const fDict = document.getElementById('nd-fecha-dict');
  fDict.value = TODAY; fDict.max = TODAY;
  document.getElementById('nd-prev').style.display='none';
  document.getElementById('nd-next').textContent='Siguiente →';
  buildNomRows();
  buildDictRows();
  buildHoloRows();
  buildPagoRows();
  goStep(1);
  document.getElementById('mf-nuevo').classList.add('open');
  initGPSonFormOpen();
  fillEquipoPatron();
  autoAsignarFolioDict(); // ← AUTO-ASIGNA el menor folio de dictamen disponible
}

function closeNuevo(){
  document.getElementById('mf-nuevo').classList.remove('open');
  resetNuevo();
}

function onGiroChange(val){
  const otro=document.getElementById('nd-giro-otro');
  if(!otro) return;
  otro.style.display = val==='Otro' ? '' : 'none';
  if(val!=='Otro') otro.value='';
}

function resetNuevo(){
  instrBuffer=[];
  // Reiniciar UI de equipo patrón (modo rango → único) antes de limpiar valores
  resetEquipoPatronFields();
  ['nd-razon','nd-calle','nd-muni','nd-cp','nd-utm','nd-obs','nd-folio-dict',
   'ep-m','ep-c','ep-d','ep-v','nd-apoyo','pago-sub','pago-iva','pago-total',
   'if-marca','if-modelo','if-serie','if-max','if-e','if-dgn-search'].forEach(id=>{
    const e=document.getElementById(id); if(e) e.value='';
  });
  ['nd-giro','nd-entidad','if-tipo','if-periodo','if-clase','if-ipe'].forEach(id=>{
    const e=document.getElementById(id); if(e) e.value='';
  });
  onGiroChange('');
  ['marca-drop','modelo-drop'].forEach(id=>{
    const e=document.getElementById(id); if(e) e.style.display='none';
  });
  document.getElementById('nd-imparcialidad').value='';
  document.querySelectorAll('.check-opt').forEach(e=>e.classList.remove('sel-c','sel-nc','sel-na'));
  const fi=document.getElementById('instr-form');
  const ab=document.querySelector('.add-instr-btn');
  if(fi) fi.style.display='none';
  if(ab) ab.style.display='flex';
  if(document.getElementById('instr-list')) renderInstrList();
  resetPhotos();
}

function goStep(s){
  ndStep=s;
  [1,2,3,4].forEach(i=>{
    document.getElementById('nd-s'+i).style.display=i===s?'block':'none';
    const dot=document.getElementById('sd'+i);
    dot.classList.remove('on','done');
    if(i<s) dot.classList.add('done');
    else if(i===s) dot.classList.add('on');
  });
  document.getElementById('nd-prog').style.width=(s/4*100)+'%';
  document.getElementById('nd-prev').style.display=s>1?'block':'none';
  document.getElementById('nd-next').textContent=s<4?'Siguiente →':'✓ Guardar dictamen';
  document.getElementById('nd-body').scrollTop=0;
  if(s===4) syncFotasRows();
}

function ndNext(){
  if(!validStep()) return;
  if(ndStep<4){ goStep(ndStep+1); syncDictRows(); syncHoloRows(); }
  else guardarRegistro();
}

function ndPrev(){ if(ndStep>1) goStep(ndStep-1); }

function validStep(){
  if(ndStep===1){
    if(!document.getElementById('nd-razon').value.trim()){ toast('Ingresa el nombre o razón social','err'); return false; }
    const giro=document.getElementById('nd-giro').value;
    if(!giro){ toast('Selecciona el giro del establecimiento','err'); return false; }
    if(giro==='Otro' && !document.getElementById('nd-giro-otro').value.trim()){ toast('Especifica el giro del establecimiento','err'); return false; }
    if(!document.getElementById('nd-fecha-sol').value){ toast('Ingresa la fecha de solicitud','err'); return false; }
    if(document.getElementById('nd-fecha-sol').value > TODAY){ toast('La fecha de solicitud no puede ser futura','err'); return false; }
    if(!document.getElementById('nd-cp').value.trim()){ toast('Ingresa el código postal','err'); return false; }
    const coloniaEl=document.getElementById('nd-colonia');
    if(coloniaEl && !coloniaEl.disabled && !coloniaEl.value){ toast('Selecciona la colonia','err'); return false; }
    if(!document.getElementById('nd-calle').value.trim()){ toast('Ingresa la calle y número','err'); return false; }
    if(!document.getElementById('nd-entidad').value && !document.getElementById('nd-entidad-txt').value){
      toast('Ingresa el C.P. para obtener la entidad federativa','err'); return false;
    }
    return true;
  }
  if(ndStep===2){
    if(!instrBuffer.length){ toast('Agrega al menos un instrumento','err'); return false; }
    return true;
  }
  if(ndStep===3){
    const fd=document.getElementById('nd-folio-dict').value.trim();
    if(!fd){ toast('Ingresa el folio del dictamen','err'); return false; }
    const n=parseInt(fd);
    if(n<SESSION.fdIni||n>SESSION.fdFin){ toast('Folio fuera de tu rango asignado','err'); return false; }
    if(registros.some(r=>parseInt(r.folioDict)===n)){ toast('Ese folio ya fue utilizado','err'); return false; }
    if(!document.getElementById('nd-fecha-dict').value){ toast('Ingresa la fecha del dictamen','err'); return false; }
    if(document.getElementById('nd-fecha-dict').value > TODAY){ toast('La fecha del dictamen no puede ser futura','err'); return false; }
    for(let i=0;i<instrBuffer.length;i++){
      if(!document.getElementById('dv-'+i)?.value){ toast(`Instrumento ${i+1}: selecciona resultado de Insp. Visual`,'err'); return false; }
      if(!document.getElementById('de-'+i)?.value){ toast(`Instrumento ${i+1}: selecciona resultado de Exactitud`,'err'); return false; }
      if(!document.getElementById('dr-'+i)?.value){ toast(`Instrumento ${i+1}: selecciona resultado de Repetibilidad`,'err'); return false; }
      if(!document.getElementById('dx-'+i)?.value){ toast(`Instrumento ${i+1}: selecciona resultado de Excentricidad`,'err'); return false; }
      if(!document.getElementById('dc-'+i)?.value){ toast(`Instrumento ${i+1}: selecciona si Cumple NOM-010`,'err'); return false; }
      if(!document.getElementById('ht-'+i)?.value){ toast(`Instrumento ${i+1}: selecciona el tipo de holograma`,'err'); return false; }
    }
    return true;
  }
  if(ndStep===4){
    if(!document.getElementById('pago-sub').value.trim()){ toast('Ingresa el subtotal del recibo de pago','err'); return false; }
    if(!document.getElementById('nd-imparcialidad').value){ toast('Selecciona la identificación de riesgos de imparcialidad','err'); return false; }
    return true;
  }
  return true;
}

/* ══ INSTRUMENTOS: array local mientras se llena el formulario ══ */
let instrBuffer = []; // instrumentos capturados en el paso 2

function buildNomRows(){ instrBuffer=[]; renderInstrList(); }
function buildDictRows(){ syncDictRows(); }
function buildHoloRows(){ syncHoloRows(); }

/* ══ FOLIO AUTO-ASIGNACIÓN ══ */
function _parseRange(rangeStr){
  if(!rangeStr||rangeStr==='—') return null;
  const [a]=rangeStr.split('→');
  const m=a.trim().match(/^([A-Za-z]+)(\d+)$/);
  if(!m) return null;
  return {prefix:m[1], start:parseInt(m[2]), padLen:m[2].length};
}

function _countUsedInRegistros(tipo){
  return registros.reduce((acc,reg)=>acc+(reg.instrumentos||[]).filter(i=>i.holoTipo===tipo).length,0);
}

function _countUVAInRegistros(){
  return registros.reduce((acc,reg)=>acc+(reg.instrumentos||[]).filter(i=>!!i.holoU).length,0);
}

/* Recomputa y rellena los campos de folio PROFECO y UVA para todas las filas visibles */
function computeHoloFolios(){
  const n=instrBuffer.length;
  if(!n) return;
  const usedS1=_countUsedInRegistros('S1');
  const usedS2=_countUsedInRegistros('S2');
  const usedAN=_countUsedInRegistros('AN');
  const usedUVA=_countUVAInRegistros();
  const rS1=SESSION?_parseRange(SESSION.fs1):null;
  const rS2=SESSION?_parseRange(SESSION.fs2):null;
  const rAN=SESSION?_parseRange(SESSION.fan):null;
  const rUVA=SESSION?_parseRange(SESSION.fuva):null;
  let batchS1=0, batchS2=0, batchAN=0, batchUVA=0;
  for(let i=0;i<n;i++){
    const tipoEl=document.getElementById('ht-'+i);
    const profEl=document.getElementById('hf-p-'+i);
    const uvaEl=document.getElementById('hf-u-'+i);
    if(!tipoEl||!profEl||!uvaEl) continue;
    const tipo=tipoEl.value;
    // PROFECO folio
    if(tipo==='S1'&&rS1){
      profEl.value=rS1.prefix+String(rS1.start+usedS1+batchS1).padStart(rS1.padLen,'0');
      batchS1++;
    } else if(tipo==='S2'&&rS2){
      profEl.value=rS2.prefix+String(rS2.start+usedS2+batchS2).padStart(rS2.padLen,'0');
      batchS2++;
    } else if(tipo==='AN'&&rAN){
      profEl.value=rAN.prefix+String(rAN.start+usedAN+batchAN).padStart(rAN.padLen,'0');
      batchAN++;
    } else {
      profEl.value='';
    }
    // UVA folio — se asigna cuando hay tipo válido (S1, S2 o AN)
    if((tipo==='S1'||tipo==='S2'||tipo==='AN')&&rUVA){
      uvaEl.value=rUVA.prefix+String(rUVA.start+usedUVA+batchUVA).padStart(rUVA.padLen,'0');
      batchUVA++;
    } else {
      uvaEl.value='';
    }
  }
}

/* ── Render lista de instrumentos ya agregados ── */
function renderInstrList(){
  const c=document.getElementById('instr-list');
  if(!instrBuffer.length){
    c.innerHTML=`<div style="text-align:center;padding:18px 0;color:var(--text3);font-size:12px;margin-bottom:8px">
      Sin instrumentos — agrega al menos uno</div>`;
    return;
  }
  const tipoLabel={M:'Mecánico',E:'Electrónico',H:'Híbrido'};
  const perLabel={A:'Anual',S:'Semestral'};
  const ipeLabel={I:'Inicial',P:'Periódica',E:'Extraordinaria'};
  c.innerHTML=instrBuffer.map((ins,idx)=>{
    const enNom = MARCAS_NOM010.includes(ins.marca);
    return `
    <div class="instr-card">
      <div class="instr-card-hd">
        <div class="instr-num">${idx+1}</div>
        <div style="flex:1">
          <div class="instr-card-title">
            ${ins.marca}
            ${enNom?`<span class="nom-badge">NOM-010 ✓</span>`:''}
          </div>
          <div style="font-size:11px;color:var(--text2)">${ins.modelo||'Sin modelo'} &nbsp;·&nbsp; <span style="font-family:var(--mono);font-size:10px;color:var(--text3)">${ins.serie||'S/N'}</span></div>
        </div>
        <button class="instr-rm" onclick="eliminarInstr(${idx})">
          <svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg>
        </button>
      </div>
      <div class="instr-pills">
        <span class="instr-pill tp">${ins.tipo} · ${tipoLabel[ins.tipo]||ins.tipo}</span>
        ${ins.max?`<span class="instr-pill mx">Máx ${ins.max} kg · e ${ins.e||'?'} g</span>`:''}
        ${ins.periodo?`<span class="instr-pill pr">${perLabel[ins.periodo]||ins.periodo}</span>`:''}
        ${ins.ipe?`<span class="instr-pill ip">${ipeLabel[ins.ipe]||ins.ipe}</span>`:''}
        ${ins.clase?`<span class="instr-pill ip">Clase ${ins.clase}</span>`:''}
      </div>
    </div>`}).join('');
  NUM_INSTR=instrBuffer.length;
  syncDictRows(); syncHoloRows(); syncPagoRows();
}

/* ── Abrir / cerrar mini-form ── */
function abrirFormInstr(){
  if(instrBuffer.length>=10){ toast('Máximo 10 instrumentos por inspección','err'); return; }
  ['if-tipo','if-periodo','if-clase','if-ipe'].forEach(id=>{ const e=document.getElementById(id); if(e) e.value=''; });
  ['if-marca','if-modelo','if-serie','if-max','if-e','if-dgn-search'].forEach(id=>{ const e=document.getElementById(id); if(e) e.value=''; });
  // Ocultar paneles DGN
  document.getElementById('dgn-result').style.display='none';
  document.getElementById('dgn-notfound').style.display='none';
  document.getElementById('instr-form-err').style.display='none';
  document.getElementById('instr-form-title').textContent='Instrumento #'+(instrBuffer.length+1);
  document.getElementById('instr-form').style.display='block';
  document.querySelector('.add-instr-btn').style.display='none';
  setTimeout(()=>document.getElementById('if-dgn-search').scrollIntoView({behavior:'smooth',block:'nearest'}),100);
}

function cancelarFormInstr(){
  document.getElementById('instr-form').style.display='none';
  document.querySelector('.add-instr-btn').style.display='flex';
}

/* ── Guardar instrumento al buffer ── */
function guardarInstr(){
  const err=document.getElementById('instr-form-err');
  const tipo=document.getElementById('if-tipo').value;
  const marca=document.getElementById('if-marca').value.trim();
  const modelo=document.getElementById('if-modelo').value.trim();
  if(!tipo){ err.textContent='Selecciona el tipo de instrumento'; err.style.display='block'; return; }
  if(!marca){ err.textContent='Ingresa la marca del instrumento'; err.style.display='block'; return; }
  err.style.display='none';
  instrBuffer.push({
    no: instrBuffer.length+1,
    tipo,
    marca,
    modelo,
    serie: document.getElementById('if-serie').value.trim(),
    max:   document.getElementById('if-max').value.trim(),
    e:     document.getElementById('if-e').value.trim(),
    clase: document.getElementById('if-clase').value,
    ipe:   document.getElementById('if-ipe').value,
    proto: document.getElementById('if-dgn-search') ? document.getElementById('if-dgn-search').value.trim() : '',
    cert:  document.getElementById('if-cert') ? document.getElementById('if-cert').value.trim() : '',
    periodo: document.getElementById('if-periodo').value,
    // campos de dictamen — se llenan en paso 3
    inspecVisual:'', exactitud:'', repetibilidad:'', excentricidad:'', cumpleNom:'',
    holoTipo:'', holoProfeco:'', holoU:'',
    fotos:[],
  });
  document.getElementById('instr-form').style.display='none';
  document.querySelector('.add-instr-btn').style.display='flex';
  renderInstrList();
  toast('✓ Instrumento agregado','ok');
}

function eliminarInstr(idx){
  instrBuffer.splice(idx,1);
  // Renumerar
  instrBuffer.forEach((ins,i)=>ins.no=i+1);
  renderInstrList();
}

/* ══ DICTAMEN: cards por instrumento en paso 3 ══ */
function tipoStr(t){ return t==='M'?'Mecánico':t==='E'?'Electrónico':t==='H'?'Híbrido':t; }

function syncDictRows(){
  const container=document.getElementById('dict-cards-container');
  if(!container) return;
  if(!instrBuffer.length){
    container.innerHTML=`<div style="text-align:center;padding:16px;color:var(--text3);font-size:11px;background:var(--surface2);border-radius:8px;border:1px dashed var(--border)">Sin instrumentos registrados</div>`;
    return;
  }
  const checkFields=[
    {id:'dv',lbl:'Insp. Visual'},
    {id:'de',lbl:'Exactitud'},
    {id:'dr',lbl:'Repetibilidad'},
    {id:'dx',lbl:'Excentricidad'},
  ];
  const opts=`<option value="">—</option><option value="C">C — Cumple</option><option value="NC">NC — No cumple</option><option value="NA">NA — No aplica</option>`;
  container.innerHTML=instrBuffer.map((ins,i)=>`
    <div class="dict-card">
      <div class="dict-card-hd">
        <div class="instr-num">${i+1}</div>
        <div class="dict-card-name">${ins.marca||'—'}${ins.modelo?' '+ins.modelo:''}</div>
        ${ins.tipo?`<div class="dict-card-sub">${tipoStr(ins.tipo)}</div>`:''}
      </div>
      <div class="dict-checks-grid">
        ${checkFields.map(f=>`
          <div class="dict-fld">
            <label>${f.lbl}</label>
            <select class="fi" id="${f.id}-${i}" onchange="onDictChange('${f.id}',${i})">${opts}</select>
          </div>
        `).join('')}
      </div>
      <div class="dict-result-fld">
        <label class="dict-check-lbl">Cumple NOM-010</label>
        <select class="fi dict-result-sel" id="dc-${i}" onchange="dictResultColor(this)">
          <option value="">— Seleccionar —</option>
          <option value="C">✓ Cumple</option>
          <option value="NC">✗ No Cumple</option>
          <option value="NA">NA — No aplica</option>
        </select>
      </div>
    </div>
  `).join('');
}

function onDictChange(fieldId, instrIdx){
  setDictVal(fieldId+'-'+instrIdx, document.getElementById(fieldId+'-'+instrIdx).value);
}

function setDictVal(id, val){
  const el=document.getElementById(id);
  if(!el) return;
  el.value=val;
  // autoNC: Insp. Visual NC → Cumple NOM-010 = NC
  if(id.startsWith('dv-') && val==='NC'){
    const idx=id.split('-')[1];
    const dc=document.getElementById('dc-'+idx);
    if(dc && !dc.value){ dc.value='NC'; dictResultColor(dc); }
  }
}

function dictResultColor(sel){
  sel.classList.remove('val-c','val-nc','val-na');
  if(sel.value==='C') sel.classList.add('val-c');
  else if(sel.value==='NC') sel.classList.add('val-nc');
  else if(sel.value==='NA') sel.classList.add('val-na');
}

/* ══ HOLOGRAMAS: uno por instrumento ══ */
function syncHoloRows(){
  const c=document.getElementById('holo-rows-container');
  if(!c) return;
  if(!instrBuffer.length){
    c.innerHTML=`<div style="font-size:11px;color:var(--text3);text-align:center;padding:10px">Sin instrumentos</div>`;
    return;
  }
  c.innerHTML=instrBuffer.map((ins,i)=>`
    <div style="margin-bottom:12px">
      <div style="font-size:10px;font-weight:700;color:var(--text2);margin-bottom:6px;display:flex;align-items:center;gap:6px">
        <div class="instr-num" style="width:18px;height:18px;font-size:9px">${i+1}</div>
        ${ins.marca} ${ins.modelo}
      </div>
      <div class="fgrid" style="margin-bottom:6px">
        <div class="fld" style="margin-bottom:0">
          <label>Tipo holograma</label>
          <select class="fi" id="ht-${i}" onchange="computeHoloFolios()" style="padding:9px 10px;font-size:12px">
            <option value="">Tipo</option>
            <option value="S1">S1 — 1er Semestre</option>
            <option value="S2">S2 — 2do Semestre</option>
            <option value="AN">AN — Anual</option>
          </select>
        </div>
        <div class="fld" style="margin-bottom:0">
          <label>Holograma PROFECO <span style="color:var(--green);font-size:9px;font-weight:600">· auto</span></label>
          <input class="fi mono" id="hf-p-${i}" readonly placeholder="—" style="padding:9px 10px;font-size:12px;opacity:.8;cursor:default">
        </div>
      </div>
      <div class="fld" style="margin-bottom:0">
        <label>Folio etiqueta UVA <span style="color:var(--green);font-size:9px;font-weight:600">· auto</span></label>
        <input class="fi mono" id="hf-u-${i}" readonly placeholder="—" style="padding:9px 10px;font-size:12px;opacity:.8;cursor:default">
      </div>
    </div>`).join('');
  // Auto-asignar folios después de renderizar
  computeHoloFolios();
}

/* ══ RECIBO DE PAGO ══ */
function buildPagoRows(){ document.getElementById('pago-rows-container').innerHTML=''; syncPagoRows(); }

function syncPagoRows(){
  const c=document.getElementById('pago-rows-container');
  const rangos=[{lbl:'Hasta 100 kg'},{lbl:'De 101 a 200 kg'},{lbl:'De 201 a 500 kg'}];
  let html='';
  rangos.forEach((r,i)=>{
    html+=`<div style="display:grid;grid-template-columns:60px 1fr 1fr 1fr;gap:6px;margin-bottom:8px;align-items:center">
      <div style="font-size:10px;color:var(--text3);font-weight:600">${i+1}</div>
      <div style="font-size:11px;color:var(--text2)">${r.lbl}</div>
      <div class="fld" style="margin:0"><label style="font-size:9px">Costo unit. $</label>
        <input class="fi mono" id="pu-${i}" placeholder="0.00" inputmode="decimal" style="padding:8px;font-size:12px" oninput="calcTotales()"></div>
      <div class="fld" style="margin:0"><label style="font-size:9px">Cant.</label>
        <input class="fi" id="pc-${i}" placeholder="0" inputmode="numeric" style="padding:8px;font-size:12px;text-align:center" oninput="calcTotales()"></div>
    </div>`;
  });
  c.innerHTML=html;
}

function calcTotales(){
  let sub=0;
  [0,1,2].forEach(i=>{
    const pu=parseFloat((document.getElementById('pu-'+i)||{}).value)||0;
    const pc=parseInt((document.getElementById('pc-'+i)||{}).value)||0;
    sub+=pu*pc;
  });
  // Sumar manual
  const manSub=parseFloat(document.getElementById('pago-sub').value)||0;
  const total_sub = manSub||sub;
  const iva=total_sub*16/116;           // IVA extraído del total (total ya incluye IVA)
  const tot=total_sub;                  // el valor ingresado ES el total con IVA
  document.getElementById('pago-sub').value=total_sub?total_sub.toFixed(2):'';
  document.getElementById('pago-iva').value=iva?iva.toFixed(2):'';
  document.getElementById('pago-total').value=tot?tot.toFixed(2):'';
}

/* ══ AUTO-ASIGNAR FOLIO DICTAMEN ══ */
function autoAsignarFolioDict(){
  const ini=SESSION.fdIni, fin=SESSION.fdFin;
  if(!ini||!fin) return;
  const usados=new Set(registros.map(r=>parseInt(r.folioDict)).filter(n=>!isNaN(n)));
  for(let n=ini;n<=fin;n++){
    if(!usados.has(n)){
      const el=document.getElementById('nd-folio-dict');
      if(el) el.value=String(n);
      validFolioDict();
      return;
    }
  }
}

/* ══ VALIDAR FOLIO ══ */
function validFolioDict(){
  const v=document.getElementById('nd-folio-dict').value.trim();
  const err=document.getElementById('nd-fdict-err');
  if(!v){ err.style.display='none'; return; }
  const n=parseInt(v);
  const usado=registros.some(r=>parseInt(r.folioDict)===n);
  if(n<SESSION.fdIni||n>SESSION.fdFin){
    err.textContent=`Fuera de rango asignado (${SESSION.fdIni}–${SESSION.fdFin})`;
    err.style.display='block';
  } else if(usado){
    err.textContent='Este folio ya fue utilizado';
    err.style.display='block';
  } else {
    err.style.display='none';
  }
}

/* ══ IMPARCIALIDAD ══ */
function togImp(el,val){
  document.querySelectorAll('.check-opt').forEach(e=>{ e.classList.remove('sel-c','sel-nc','sel-na'); });
  el.classList.add('sel-c');
  document.getElementById('nd-imparcialidad').value=val;
}

/* ══ FOTOS DE EVIDENCIA — hasta 6 por báscula ══ */

/**
 * addPhoto(input, instrIdx)
 * El instrIdx se pasa directamente desde el onchange del <input>,
 * sin necesitar variable global. Esto es necesario porque en Android
 * WebView el método más fiable de abrir el selector es <label for="input-id">,
 * que no pasa por JavaScript hasta el evento onchange.
 */
function addPhoto(input, instrIdx){
  if(!input.files || !input.files[0]) return;
  if(!instrBuffer[instrIdx]) return;
  if(!instrBuffer[instrIdx].fotos) instrBuffer[instrIdx].fotos = [];
  if(instrBuffer[instrIdx].fotos.length >= 6){ toast('Máximo 6 fotos por báscula','err'); input.value=''; return; }
  const file = input.files[0];
  input.value = '';
  const url = URL.createObjectURL(file);
  const img = new Image();
  img.onload = () => {
    URL.revokeObjectURL(url);
    const MAX = 1024;
    let w = img.width, h = img.height;
    if(w > MAX || h > MAX){
      if(w >= h){ h = Math.round(h * MAX / w); w = MAX; }
      else       { w = Math.round(w * MAX / h); h = MAX; }
    }
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    c.getContext('2d').drawImage(img, 0, 0, w, h);
    instrBuffer[instrIdx].fotos.push(c.toDataURL('image/jpeg', 0.68));
    renderFotosInstr(instrIdx);
    toast('✓ Foto ' + instrBuffer[instrIdx].fotos.length + '/6 · báscula ' + (instrIdx+1), 'ok');
  };
  img.onerror = () => { URL.revokeObjectURL(url); toast('No se pudo cargar la imagen','err'); };
  img.src = url;
}

/** Elimina la foto photoIdx del instrumento instrIdx */
function rmPhoto(instrIdx, photoIdx){
  if(!instrBuffer[instrIdx]?.fotos) return;
  instrBuffer[instrIdx].fotos.splice(photoIdx, 1);
  renderFotosInstr(instrIdx);
}

/** Sincroniza el grid de miniaturas del instrumento instrIdx */
function renderFotosInstr(instrIdx){
  const grid = document.getElementById('foto-grid-' + instrIdx);
  const lbl  = document.getElementById('foto-lbl-' + instrIdx);
  const wrap = document.getElementById('foto-add-wrap-' + instrIdx);
  if(!grid) return;
  const fotos = instrBuffer[instrIdx]?.fotos || [];
  if(lbl) lbl.textContent = fotos.length + '/6';
  grid.innerHTML = fotos.map((src, i) => `
    <div class="photo-thumb">
      <img src="${src}" alt="foto ${i+1}" loading="lazy">
      <button class="photo-thumb-rm" onclick="rmPhoto(${instrIdx},${i})" type="button" title="Eliminar foto">
        <svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>`).join('');
  // Ocultar el botón de agregar si ya hay 6
  if(wrap) wrap.style.display = fotos.length >= 6 ? 'none' : '';
}

/** Renderiza la sección de fotos del paso 4 — un bloque por instrumento */
function syncFotasRows(){
  const container = document.getElementById('fotos-por-instrumento');
  if(!container) return;
  if(!instrBuffer.length){
    container.innerHTML = '<div style="text-align:center;font-size:12px;color:var(--text3);padding:14px">Sin básulas registradas — agrega instrumentos en el paso 2</div>';
    return;
  }
  /*
   * Cada instrumento tiene:
   *   - Un <input type="file"> con id único (nd-photo-{i})
   *   - Un <label for="nd-photo-{i}"> que actúa como botón → fiable en Android WebView
   *     porque es la forma nativa sin necesidad de input.click() via JS
   */
  container.innerHTML = instrBuffer.map((ins, i) => `
    <div style="margin-bottom:14px;background:var(--surface2);border:1px solid var(--border);border-radius:var(--r);padding:12px">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">
        <div class="instr-num" style="width:22px;height:22px;font-size:10px;flex-shrink:0">${i+1}</div>
        <div style="flex:1;min-width:0">
          <div style="font-size:12px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${ins.marca||'—'} ${ins.modelo||''}</div>
          <div style="font-size:10px;color:var(--text3)">${ins.serie ? 'S/N: ' + ins.serie : 'Sin número de serie'}</div>
        </div>
        <span id="foto-lbl-${i}" style="font-size:10px;font-weight:700;color:var(--text3);flex-shrink:0">${(ins.fotos||[]).length}/6</span>
      </div>
      <div id="foto-grid-${i}" class="photo-grid"></div>
      <div id="foto-add-wrap-${i}">
        <!-- input oculto propio del instrumento; onchange recibe el índice -->
        <input type="file"
               id="nd-photo-${i}"
               accept="image/*"
               style="position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden"
               onchange="addPhoto(this,${i})">
        <!-- label actúa como botón y activa el input de forma nativa -->
        <label for="nd-photo-${i}"
               style="width:100%;border:2px dashed var(--border2);border-radius:var(--rsm);
                      background:var(--surface);padding:12px;
                      display:flex;align-items:center;justify-content:center;gap:8px;
                      font-size:11px;color:var(--text3);font-weight:600;
                      font-family:var(--sans);cursor:pointer;box-sizing:border-box">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
            <circle cx="12" cy="13" r="4"/>
          </svg>
          Agregar foto · báscula ${i+1}
        </label>
      </div>
    </div>`).join('');
  // Renderizar miniaturas de fotos ya cargadas (si el usuario regresó al paso)
  instrBuffer.forEach((_, i) => renderFotosInstr(i));
}

/** Limpia las fotos de todos los instrumentos y resetea el contenedor */
function resetPhotos(){
  instrBuffer.forEach(ins => { if(ins) ins.fotos = []; });
  const container = document.getElementById('fotos-por-instrumento');
  if(container) container.innerHTML = '';
}

/* ══ GUARDAR ══ */
function guardarRegistro(){
  // Enriquecer instrBuffer con datos del dictamen (paso 3) y hologramas
  const instrumentos = instrBuffer.map((ins,i)=>({
    ...ins,
    inspecVisual: document.getElementById('dv-'+i)?.value||'',
    exactitud:    document.getElementById('de-'+i)?.value||'',
    repetibilidad:document.getElementById('dr-'+i)?.value||'',
    excentricidad:document.getElementById('dx-'+i)?.value||'',
    cumpleNom:    document.getElementById('dc-'+i)?.value||'',
    holoTipo:     document.getElementById('ht-'+i)?.value||'',
    holoProfeco:  document.getElementById('hf-p-'+i)?.value||'',
    holoU:        document.getElementById('hf-u-'+i)?.value||'',
  }));

  const nuevo={
    id:'R'+Date.now(),
    razonSocial:document.getElementById('nd-razon').value.trim(),
    giro:(()=>{ const g=document.getElementById('nd-giro').value; return g==='Otro'?(document.getElementById('nd-giro-otro')?.value.trim()||'Otro'):g; })(),
    fechaSol:document.getElementById('nd-fecha-sol').value,
    calle:document.getElementById('nd-calle').value,
    municipio:document.getElementById('nd-muni').value,
    entidad:document.getElementById('nd-entidad').value,
    cp:document.getElementById('nd-cp').value,
    utm:document.getElementById('nd-utm').value,
    observaciones:document.getElementById('nd-obs').value,
    folioDict:document.getElementById('nd-folio-dict').value.trim(),
    fechaDict:document.getElementById('nd-fecha-dict').value,
    instrumentos,
    equipoPatron:{
      m:getEpValue('m'),
      c:getEpValue('c'),
      d:getEpValue('d'),
      v:getEpValue('v'),
    },
    pago:{
      sub:document.getElementById('pago-sub').value,
      iva:document.getElementById('pago-iva').value,
      total:document.getElementById('pago-total').value,
    },
    imparcialidad:document.getElementById('nd-imparcialidad').value,
    apoyo:document.getElementById('nd-apoyo').value,
    verificador:SESSION.nombre,
    socio:SESSION.socio,
    zona:SESSION.zona,
    status:'ok',
    createdAt:new Date().toISOString(),
  };

  // Reducir inventario
  SESSION.inv.dict=Math.max(0,SESSION.inv.dict-1);
  instrumentos.forEach(inst=>{
    if(inst.holoTipo==='S1') SESSION.inv.s1=Math.max(0,SESSION.inv.s1-1);
    if(inst.holoTipo==='S2') SESSION.inv.s2=Math.max(0,SESSION.inv.s2-1);
    if(inst.holoTipo==='AN') SESSION.inv.an=Math.max(0,SESSION.inv.an-1);
    if(inst.holoU) SESSION.inv.uva=Math.max(0,SESSION.inv.uva-1);
  });

  registros.unshift(nuevo);
  localStorage.setItem('reg_'+SESSION.user, JSON.stringify(registros));
  // Guardar también en la API (sin bloquear el flujo)
  if(SESSION.id) {
    api.post('/api/registros', {
      usuarioId: SESSION.id,
      fecha: nuevo.fecha || new Date().toISOString().slice(0,10),
      hora: nuevo.hora || '',
      notas: nuevo.notas || '',
      resultado: nuevo.resultado || '',
      datos: nuevo
    }).catch(e => console.warn('sync registro API:', e.message));
  }
  closeNuevo();
  renderHome();
  renderHist();
  renderPerf();
  toast('✓ Dictamen guardado correctamente','ok');
}

/* ══════════════════════════════════════════════
   DETALLE
══════════════════════════════════════════════ */
function openDetail(id){
  const r=registros.find(x=>x.id===id);
  if(!r) return;
  document.getElementById('det-folio').textContent='Nº '+r.folioDict;
  const cumpleGlobal = r.instrumentos&&r.instrumentos.length
    ? (r.instrumentos.some(i=>i.cumpleNom==='NC')?'NC – No Cumple':'C – Cumple')
    : '—';
  const colorCumple = cumpleGlobal.startsWith('NC')?'r':cumpleGlobal.startsWith('C')?'g':'';
  
  let instrHTML='';
  (r.instrumentos||[]).forEach((inst,i)=>{
    instrHTML+=`<div style="background:var(--surface3);border-radius:8px;padding:10px;margin-bottom:8px">
      <div style="font-size:11px;font-weight:700;color:var(--text2);margin-bottom:8px">Instrumento ${inst.no} · ${inst.tipo==='M'?'Mecánico':inst.tipo==='E'?'Electrónico':inst.tipo==='H'?'Híbrido':inst.tipo}</div>
      <div class="irow"><div class="irow-l">Marca / Modelo</div><div class="irow-v">${inst.marca} ${inst.modelo}</div></div>
      <div class="irow"><div class="irow-l">N° Serie</div><div class="irow-v mono">${inst.serie||'—'}</div></div>
      <div class="irow"><div class="irow-l">Máx / e(g)</div><div class="irow-v">${inst.max||'—'} kg / ${inst.e||'—'} g</div></div>
      <div class="irow"><div class="irow-l">Período / I/P/E</div><div class="irow-v">${inst.periodo||'—'} / ${inst.ipe||'—'}</div></div>
      <div style="height:1px;background:var(--border);margin:8px 0"></div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;font-size:10px">
        ${['inspecVisual:Insp. Visual','exactitud:Exactitud','repetibilidad:Repetibilidad','excentricidad:Excentricidad'].map(p=>{
          const [k,l]=p.split(':');
          const v=inst[k]||'—';
          const c=v==='C'?'g':v==='NC'?'r':v==='NA'?'a':'';
          return `<div style="background:var(--surface);border-radius:5px;padding:5px 8px"><div style="color:var(--text3);margin-bottom:2px">${l}</div><div class="irow-v ${c}" style="text-align:left;font-weight:700">${v}</div></div>`;
        }).join('')}
      </div>
      <div class="irow" style="margin-top:6px"><div class="irow-l" style="font-weight:700">Cumple NOM-010</div><div class="irow-v ${inst.cumpleNom==='C'?'g':inst.cumpleNom==='NC'?'r':'a'}" style="font-weight:700">${inst.cumpleNom||'—'}</div></div>
      ${inst.holoProfeco?`<div class="irow"><div class="irow-l">Holograma</div><div class="irow-v mono" style="font-size:10px">${inst.holoTipo||''} · PROFECO: ${inst.holoProfeco||'—'}${inst.holoU?' · UVA: '+inst.holoU:''}</div></div>`:''}
      ${inst.fotos&&inst.fotos.length?`
        <div style="margin-top:8px">
          <div style="font-size:9px;font-weight:700;color:var(--text3);letter-spacing:.07em;text-transform:uppercase;margin-bottom:6px">Evidencia fotográfica (${inst.fotos.length})</div>
          <div class="photo-grid">
            ${inst.fotos.map((src,pi)=>`<div class="photo-thumb"><img src="${src}" alt="foto ${pi+1}" loading="lazy"></div>`).join('')}
          </div>
        </div>`:''}
    </div>`;
  });

  document.getElementById('det-body').innerHTML=`
    <div class="card" style="margin-bottom:10px">
      <div class="card-hd">Solicitud de inspección</div>
      <div class="irow"><div class="irow-l">Razón social</div><div class="irow-v">${r.razonSocial}</div></div>
      <div class="irow"><div class="irow-l">Giro</div><div class="irow-v">${r.giro||'—'}</div></div>
      <div class="irow"><div class="irow-l">Domicilio</div><div class="irow-v">${r.calle||'—'}</div></div>
      <div class="irow"><div class="irow-l">Municipio</div><div class="irow-v">${r.municipio||'—'}</div></div>
      <div class="irow"><div class="irow-l">Entidad</div><div class="irow-v">${r.entidad||'—'}</div></div>
      <div class="irow"><div class="irow-l">C.P.</div><div class="irow-v mono">${r.cp||'—'}</div></div>
      <div class="irow"><div class="irow-l">Fecha solicitud</div><div class="irow-v">${r.fechaSol||'—'}</div></div>
    </div>
    <div class="card" style="margin-bottom:10px">
      <div class="card-hd">Dictamen de inspección · NOM-010-SCFI-1994</div>
      <div class="irow"><div class="irow-l">Folio dictamen</div><div class="irow-v mono b">Nº ${r.folioDict}</div></div>
      <div class="irow"><div class="irow-l">Fecha dictamen</div><div class="irow-v">${r.fechaDict||'—'}</div></div>
      <div class="irow"><div class="irow-l">Resultado global</div><div class="irow-v ${colorCumple}" style="font-weight:700">${cumpleGlobal}</div></div>
      <hr class="dv">
      ${instrHTML||'<div style="color:var(--text3);font-size:12px;text-align:center;padding:10px">Sin instrumentos registrados</div>'}
    </div>
    <div class="card" style="margin-bottom:10px">
      <div class="card-hd">Equipo patrón</div>
      ${['m:M (Marco)','c:C (Cinco)','d:D (Diez)','v:V (Veinte)'].map(p=>{
        const [k,l]=p.split(':');
        return `<div class="irow"><div class="irow-l">${l}</div><div class="irow-v mono">${r.equipoPatron?.[k]||'—'}</div></div>`;
      }).join('')}
    </div>
    ${r.pago?.total?`<div class="card" style="margin-bottom:10px">
      <div class="card-hd">Recibo de pago</div>
      <div class="irow"><div class="irow-l">Subtotal</div><div class="irow-v">$${r.pago.sub}</div></div>
      <div class="irow"><div class="irow-l">IVA</div><div class="irow-v">$${r.pago.iva}</div></div>
      <div class="irow"><div class="irow-l">Total</div><div class="irow-v g" style="font-weight:700">$${r.pago.total}</div></div>
    </div>`:''}
    ${r.observaciones?`<div class="card" style="margin-bottom:10px"><div class="card-hd">Observaciones</div><p style="font-size:12px;color:var(--text2)">${r.observaciones}</p></div>`:''}
    <div style="font-size:10px;color:var(--text3);text-align:center;padding:8px 0">
      Verificador: ${r.verificador} · ${new Date(r.createdAt).toLocaleString('es-MX')}
    </div>`;
  document.getElementById('mf-detail').classList.add('open');
}

function closeDetail(){ document.getElementById('mf-detail').classList.remove('open'); }

/* ══════════════════════════════════════════════
   GPS → CONVERSIÓN UTM (WGS84 → UTM zona 14N/ITRF)
   Algoritmo: Transverse Mercator sin dependencias externas
   Cubre todo México (zonas UTM 11–16, hemisferio Norte)
══════════════════════════════════════════════ */

/**
 * Convierte latitud/longitud (WGS84) a coordenadas UTM
 * Retorna { zona, easting, northing, huso }
 */
function wgs84ToUTM(lat, lng){
  const a  = 6378137.0;          // semieje mayor WGS84
  const f  = 1 / 298.257223563;  // achatamiento
  const b  = a * (1 - f);
  const e2 = 2*f - f*f;          // excentricidad cuadrada
  const e  = Math.sqrt(e2);
  const k0 = 0.9996;             // factor de escala UTM
  const E0 = 500000;             // falso este

  const latR = lat * Math.PI / 180;
  const lngR = lng * Math.PI / 180;

  // Zona UTM
  const huso = Math.floor((lng + 180) / 6) + 1;
  const lngCentral = ((huso - 1) * 6 - 180 + 3) * Math.PI / 180;

  const N  = a / Math.sqrt(1 - e2 * Math.sin(latR)**2);
  const T  = Math.tan(latR)**2;
  const C  = (e2 / (1 - e2)) * Math.cos(latR)**2;
  const A  = Math.cos(latR) * (lngR - lngCentral);

  // Meridional arc
  const e4 = e2*e2, e6 = e4*e2;
  const M = a * (
    (1 - e2/4 - 3*e4/64 - 5*e6/256) * latR
    - (3*e2/8 + 3*e4/32 + 45*e6/1024) * Math.sin(2*latR)
    + (15*e4/256 + 45*e6/1024) * Math.sin(4*latR)
    - (35*e6/3072) * Math.sin(6*latR)
  );

  const easting = k0 * N * (
    A + (1-T+C)*A**3/6 + (5-18*T+T**2+72*C-58*(e2/(1-e2)))*A**5/120
  ) + E0;

  const northing = k0 * (
    M + N*Math.tan(latR)*(
      A**2/2 + (5-T+9*C+4*C**2)*A**4/24
      + (61-58*T+T**2+600*C-330*(e2/(1-e2)))*A**6/720
    )
  );

  // México está en hemisferio Norte → N0 = 0
  return {
    huso,
    zona: `${huso}N`,
    easting:  Math.round(easting),
    northing: Math.round(northing)
  };
}

/* ── Estado GPS ── */
let _gpsModalOpen = false;

function setGPSbtnState(state, btn){
  // state: 'loading' | 'ok' | 'error' | 'idle'
  const icons = {
    loading: `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="animation:spin .8s linear infinite"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4"/></svg>`,
    idle:    `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/></svg>`
  };
  const labels = { loading:'Localizando...', ok:'Actualizar', error:'Reintentar', idle:'Obtener ubicación' };
  btn.disabled = state === 'loading';
  btn.style.opacity = state === 'loading' ? '0.6' : '1';
  btn.innerHTML = (icons[state]||icons.idle) + ' ' + labels[state];
}

function setUTMfromCoords(lat, lng, acc){
  const utm = wgs84ToUTM(lat, lng);
  const utmInput  = document.getElementById('nd-utm');
  const statusEl  = document.getElementById('utm-status');
  const rawDiv    = document.getElementById('utm-coords-raw');

  utmInput.value = `${utm.zona} ${utm.easting} ${utm.northing}`;
  utmInput.removeAttribute('readonly');
  rawDiv.style.display = 'block';

  const accStr = acc != null ? ` · ±${Math.round(acc)} m` : '';
  rawDiv.innerHTML = `📍 ${lat.toFixed(6)}, ${lng.toFixed(6)}${accStr} · Huso ${utm.huso}`;

  let calidad, color;
  if(acc == null)       { calidad='● Por IP';         color='var(--amber)'; }
  else if(acc <= 15)    { calidad='● GPS preciso';    color='var(--green)'; }
  else if(acc <= 50)    { calidad='● GPS bueno';      color='var(--green)'; }
  else if(acc <= 150)   { calidad='◐ Señal media';    color='var(--amber)'; }
  else                  { calidad='○ Señal baja';     color='var(--red)';   }

  statusEl.textContent = calidad;
  statusEl.style.color = color;
  return utm;
}

/* ── Fallback: geolocalización por IP (funciona en file://) ── */
async function ubicarPorIP(){
  // ipapi.co — gratuito, sin token, ~50k req/día
  try {
    const r = await fetch('https://ipapi.co/json/', {signal: AbortSignal.timeout(6000)});
    if(!r.ok) throw new Error('ipapi error');
    const d = await r.json();
    if(d.latitude && d.longitude){
      return { lat: d.latitude, lng: d.longitude, acc: null, fuente: 'IP' };
    }
  } catch(_){}
  // Segundo fallback: ip-api.com
  try {
    const r = await fetch('https://ip-api.com/json/?fields=lat,lon,status', {signal: AbortSignal.timeout(6000)});
    const d = await r.json();
    if(d.status === 'success'){
      return { lat: d.lat, lng: d.lon, acc: null, fuente: 'IP' };
    }
  } catch(_){}
  return null;
}

/* ── Intento GPS nativo → fallback IP ── */
function obtenerUTM(){
  const btn      = document.getElementById('btn-gps');
  const statusEl = document.getElementById('utm-status');

  setGPSbtnState('loading', btn);
  statusEl.textContent = '⏳'; statusEl.style.color = 'var(--amber)';

  // En Android WebView (file://) el GPS nativo sí funciona siempre que
  // el WebChromeClient apruebe el permiso y ACCESS_FINE_LOCATION esté en el Manifest.
  if(!navigator.geolocation){
    _intentarPorIP(btn);
    return;
  }

  // Intentar GPS nativo (funciona en https:// y en file:// dentro de WebView Android)
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const {latitude: lat, longitude: lng, accuracy: acc} = pos.coords;
      const utm = setUTMfromCoords(lat, lng, acc);
      setGPSbtnState('ok', btn);
      toast(`✓ GPS: UTM ${utm.zona} ${utm.easting} ${utm.northing} (±${Math.round(acc)}m)`, 'ok');
    },
    (err) => {
      // GPS falló → intentar por IP como fallback
      console.warn('GPS error:', err.code, err.message);
      _intentarPorIP(btn);
    },
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
  );
}

async function _intentarPorIP(btn){
  const statusEl = document.getElementById('utm-status');
  statusEl.textContent = '⏳ Via IP...'; statusEl.style.color = 'var(--amber)';

  const pos = await ubicarPorIP();
  if(pos){
    const utm = setUTMfromCoords(pos.lat, pos.lng, null);
    setGPSbtnState('ok', btn);
    toast(`✓ Ubicación por IP: UTM ${utm.zona} ${utm.easting} ${utm.northing}`, 'ok');
    // Aviso de precisión
    setTimeout(()=> toast('⚠ Ubicación aproximada por IP — verifica en campo',''), 2500);
  } else {
    // Todo falló → modo manual
    statusEl.textContent = '✕ Sin ubicación'; statusEl.style.color = 'var(--red)';
    const utmInput = document.getElementById('nd-utm');
    utmInput.removeAttribute('readonly');
    utmInput.placeholder = 'Captura manual';
    setGPSbtnState('error', btn);
    toast('Sin conexión para geolocalizar — captura UTM manualmente', 'err');
  }
}

/* ── Auto-ejecutar al abrir el formulario ── */
function initGPSonFormOpen(){
  if(!document.getElementById('nd-utm')?.value){
    setTimeout(obtenerUTM, 600);
  }
}

/* ══════════════════════════════════════════════
   POSTALIA API — Autocompletado por Código Postal
   NOTA: Reemplaza el token con el tuyo propio.
   No compartas este archivo con el token incluido.
   Considera cargarlo desde una variable de entorno
   o un archivo de configuración no versionado.
══════════════════════════════════════════════ */
const POSTALIA_TOKEN = '42|MRCWikuGyaJzCr703hwXzViXOliNVSKDlH5v7xnvd7840827';
const POSTALIA_BASE  = 'https://postalia.com.mx/api';

let _cpTimer = null;

function onCPInput(val){
  clearTimeout(_cpTimer);
  const cp = val.trim();
  const status = document.getElementById('cp-status');
  // Reset UTM
  const utmEl = document.getElementById('nd-utm'); if(utmEl){ utmEl.value=''; utmEl.setAttribute('readonly',''); }
  const utmStatus = document.getElementById('utm-status'); if(utmStatus){ utmStatus.textContent=''; }
  const utmRaw = document.getElementById('utm-coords-raw'); if(utmRaw){ utmRaw.style.display='none'; utmRaw.textContent=''; }
  const btnGps = document.getElementById('btn-gps');
  if(btnGps){ btnGps.disabled=false; btnGps.style.opacity='1';
    btnGps.innerHTML=`<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/></svg> Obtener ubicación`; }
  const colSel = document.getElementById('nd-colonia');

  if(cp.length < 5){
    status.textContent = '';
    colSel.innerHTML = '<option value="">Ingresa C.P. primero...</option>';
    colSel.disabled = true;
    document.getElementById('nd-muni').value = '';
    document.getElementById('nd-entidad-txt').value = '';
    document.getElementById('nd-entidad').value = '';
    return;
  }
  // Esperar 400ms después de que el usuario deja de teclear
  _cpTimer = setTimeout(() => buscarCP(cp), 400);
}

async function buscarCP(cp){
  const status  = document.getElementById('cp-status');
  const colSel  = document.getElementById('nd-colonia');
  const muniEl  = document.getElementById('nd-muni');
  const entTxt  = document.getElementById('nd-entidad-txt');
  const entHid  = document.getElementById('nd-entidad');

  status.textContent = '⏳ Buscando...';
  status.style.color = 'var(--amber)';
  colSel.disabled = true;
  colSel.innerHTML = '<option value="">Cargando...</option>';

  // Intentar endpoints típicos de Postalia (Laravel)
  const endpoints = [
    `${POSTALIA_BASE}/cp/${cp}`,
    `${POSTALIA_BASE}/codigo-postal/${cp}`,
    `${POSTALIA_BASE}/codigos-postales/${cp}`,
    `${POSTALIA_BASE}/v1/cp/${cp}`,
    `${POSTALIA_BASE}/postal/${cp}`,
  ];

  let data = null;
  let lastErr = '';

  for(const url of endpoints){
    try{
      const res = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${POSTALIA_TOKEN}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      if(res.ok){
        const json = await res.json();
        // Detectar estructura de respuesta
        data = parsePostatiaResponse(json, cp);
        if(data) break;
      }
    } catch(e){ lastErr = e.message; }
  }

  if(!data){
    status.textContent = '⚠ No encontrado';
    status.style.color = 'var(--amber)';
    colSel.innerHTML = '<option value="">C.P. no encontrado — captura manual</option>';
    colSel.disabled = false;
    muniEl.removeAttribute('readonly'); muniEl.style.background=''; muniEl.style.color='';
    entTxt.removeAttribute('readonly'); entTxt.style.background=''; entTxt.style.color='';
    return;
  }

  // Llenar municipio y estado
  muniEl.value = data.municipio || '';
  entTxt.value = data.estado || '';
  entHid.value = data.estado || '';

  // Llenar dropdown de colonias
  const colonias = data.colonias || [];
  if(colonias.length){
    colSel.innerHTML = colonias.map(c =>
      `<option value="${c}">${c}</option>`
    ).join('');
    colSel.disabled = false;
    // Auto-seleccionar si solo hay una
    if(colonias.length === 1){
      colSel.value = colonias[0];
      appendColoniaACalle(colonias[0]);
    }
    status.textContent = `✓ ${colonias.length} colonia${colonias.length>1?'s':''}`;
    status.style.color = 'var(--green)';
  } else {
    colSel.innerHTML = '<option value="">Sin colonias — captura manual</option>';
    colSel.disabled = false;
    status.textContent = '✓ Encontrado';
    status.style.color = 'var(--green)';
  }

  // Hacer campos readonly solo si se llenaron automáticamente
  if(data.municipio){ muniEl.setAttribute('readonly',''); muniEl.style.background='var(--surface3)'; muniEl.style.color='var(--text2)'; }
  if(data.estado){ entTxt.setAttribute('readonly',''); entTxt.style.background='var(--surface3)'; entTxt.style.color='var(--text2)'; }

  toast(`✓ C.P. ${cp} · ${data.municipio}, ${data.estado}`, 'ok');
}

function parsePostatiaResponse(json, cp){
  // Estructura 1: {estado, municipio, colonias:[...]}
  if(json.estado && json.municipio){
    return {
      estado: normalizeEstado(json.estado),
      municipio: json.municipio,
      colonias: extractColonias(json.colonias || json.asentamientos || [])
    };
  }
  // Estructura 2: {data: {estado, municipio, colonias}}
  if(json.data && json.data.estado){
    return {
      estado: normalizeEstado(json.data.estado),
      municipio: json.data.municipio,
      colonias: extractColonias(json.data.colonias || json.data.asentamientos || [])
    };
  }
  // Estructura 3: array de resultados
  if(Array.isArray(json) && json.length){
    const first = json[0];
    const colonias = json.map(r => r.colonia || r.asentamiento || r.nombre).filter(Boolean);
    return {
      estado: normalizeEstado(first.estado || first.entidad || ''),
      municipio: first.municipio || first.ciudad || '',
      colonias
    };
  }
  // Estructura 4: {codigo_postal: {estado, municipio, colonias}}
  if(json.codigo_postal){
    const d = json.codigo_postal;
    return {
      estado: normalizeEstado(d.estado || ''),
      municipio: d.municipio || '',
      colonias: extractColonias(d.colonias || [])
    };
  }
  return null;
}

function extractColonias(arr){
  if(!arr || !arr.length) return [];
  // Si es array de strings
  if(typeof arr[0] === 'string') return arr;
  // Si es array de objetos con colonia/nombre/asentamiento
  return arr.map(c => c.colonia || c.nombre || c.asentamiento || c.name || '').filter(Boolean);
}

// Normalizar nombres de estado a los valores del sistema
const ESTADOS_MAP = {
  'AGUASCALIENTES':'Aguascalientes','BAJA CALIFORNIA':'Baja California',
  'BAJA CALIFORNIA SUR':'Baja California Sur','CAMPECHE':'Campeche',
  'CHIAPAS':'Chiapas','CHIHUAHUA':'Chihuahua',
  'CIUDAD DE MEXICO':'Ciudad de México','CIUDAD DE MÉXICO':'Ciudad de México',
  'CDMX':'Ciudad de México','COAHUILA':'Coahuila',
  'COAHUILA DE ZARAGOZA':'Coahuila','COLIMA':'Colima','DURANGO':'Durango',
  'GUANAJUATO':'Guanajuato','GUERRERO':'Guerrero','HIDALGO':'Hidalgo',
  'JALISCO':'Jalisco','MEXICO':'México','MÉXICO':'México',
  'ESTADO DE MEXICO':'México','ESTADO DE MÉXICO':'México',
  'MICHOACAN':'Michoacán','MICHOACÁN':'Michoacán',
  'MICHOACAN DE OCAMPO':'Michoacán','MORELOS':'Morelos','NAYARIT':'Nayarit',
  'NUEVO LEON':'Nuevo León','NUEVO LEÓN':'Nuevo León',
  'OAXACA':'Oaxaca','PUEBLA':'Puebla','QUERETARO':'Querétaro',
  'QUERÉTARO':'Querétaro','QUINTANA ROO':'Quintana Roo',
  'SAN LUIS POTOSI':'San Luis Potosí','SAN LUIS POTOSÍ':'San Luis Potosí',
  'SINALOA':'Sinaloa','SONORA':'Sonora','TABASCO':'Tabasco',
  'TAMAULIPAS':'Tamaulipas','TLAXCALA':'Tlaxcala',
  'VERACRUZ':'Veracruz','VERACRUZ DE IGNACIO DE LA LLAVE':'Veracruz',
  'YUCATAN':'Yucatán','YUCATÁN':'Yucatán','ZACATECAS':'Zacatecas'
};
function normalizeEstado(raw){
  if(!raw) return '';
  const up = raw.toUpperCase().trim();
  return ESTADOS_MAP[up] || raw;
}

// Cuando se selecciona una colonia del dropdown, se puede agregar al campo calle
document.addEventListener('change', function(e){
  if(e.target && e.target.id === 'nd-colonia'){
    // Opcionalmente agregar la colonia al campo calle si está vacío
    const col = e.target.value;
    const calleEl = document.getElementById('nd-calle');
    if(calleEl && col && !calleEl.value.includes(col)){
      // No forzar, solo sugerir via placeholder
      calleEl.placeholder = `Ej: Av. Principal 123, Col. ${col}`;
    }
  }
});

function appendColoniaACalle(col){
  const calleEl = document.getElementById('nd-calle');
  if(calleEl) calleEl.placeholder = `Ej: Av. Principal 123, Col. ${col}`;
}

/* ══════════════════════════════════════════════
   SYNC
══════════════════════════════════════════════ */
function doSync(){
  const ic=document.getElementById('sync-icon');
  ic.classList.add('spin');

  const finish = (ok) => {
    ic.classList.remove('spin');
    if (ok) {
      registros.forEach(r=>{ if(r.status==='ok') r.status='sync'; });
      localStorage.setItem('reg_'+SESSION.user, JSON.stringify(registros));
      renderHome(); renderHist();
      document.getElementById('p-sync').textContent=new Date().toLocaleTimeString('es-MX',{hour:'2-digit',minute:'2-digit'});
      toast('✓ Sincronizado con el sistema administrativo','ok');
    } else {
      toast('⚠ Sin conexión — registros guardados localmente','err');
    }
  };

  // Si SESSION.id no está en memoria, intentar restaurarlo desde localStorage
  if (SESSION && !SESSION.id) {
    try {
      const lastSession = JSON.parse(localStorage.getItem('hc_last_uid'));
      if (lastSession && lastSession.id && SESSION.user && lastSession.user === SESSION.user) {
        SESSION.id = lastSession.id;
      }
    } catch(e){ console.warn('doSync: no se pudo restaurar sesión desde localStorage', e); }
  }

  if(SESSION && SESSION.id) {
    // Sincronizar registros pendientes con la API
    const pending = registros.filter(r => r.status === 'ok');
    if (!pending.length) {
      setTimeout(() => finish(true), 800);
      return;
    }
    let anyOk = false;
    Promise.all(
      pending.map(r =>
        api.post('/api/registros', {
          usuarioId: SESSION.id,
          fecha:     r.fechaDict || new Date().toISOString().slice(0, 10),
          hora:      r.hora || '',
          notas:     r.observaciones || '',
          resultado: r.instrumentos && r.instrumentos.some(i => i.cumpleNom === 'C') ? 'aprobado' : (r.resultado || 'rechazado'),
          datos:     r
        }).then(() => { anyOk = true; }).catch(() => {})
      )
    ).finally(() => setTimeout(() => finish(anyOk), 500));
  } else {
    // Sin sesión de API disponible: registros quedan pendientes hasta el próximo login online
    setTimeout(() => finish(false), 500);
  }
}

/* ══════════════════════════════════════════════
   TOAST — definida en ../../shared/js/utils.js
══════════════════════════════════════════════ */

/* ══════════════════════════════════════════════
   DEMO DATA
══════════════════════════════════════════════ */
function demoDicts(){
  return [
    { id:'R1', razonSocial:'Mercado La Merced', giro:'Comercio', fechaSol:TODAY,
      calle:'Rosario 182, Col. Merced Balbuena', municipio:'Venustiano Carranza',
      entidad:'Ciudad de México', cp:'15810', utm:'', observaciones:'',
      folioDict:'00101', fechaDict:TODAY,
      instrumentos:[
        { no:1,tipo:'E',marca:'OHAUS',modelo:'Defender 3000',serie:'B234556',max:'300',e:'100',
          clasExact:'III',prototipo:'',dgn:'',periodo:'S',ipe:'P',
          inspecVisual:'C',exactitud:'C',repetibilidad:'C',excentricidad:'NC',cumpleNom:'NC',
          holoTipo:'S1',holoProfeco:'S10000100',holoU:'UVA26001' }
      ],
      equipoPatron:{m:'MP-01',c:'',d:'',v:'VI-2024'},
      pago:{sub:'850.00',iva:'136.00',total:'986.00'},
      imparcialidad:'ninguna',apoyo:'',
      verificador:'Carlos Ramírez',socio:'Socio A',zona:'Zona Norte',
      status:'sync', createdAt:new Date(Date.now()-3600000).toISOString() },
    { id:'R2', razonSocial:'Báscula Industrial Nápoles S.A. de C.V.', giro:'Industria', fechaSol:TODAY,
      calle:'Insurgentes Sur 543, Col. Nápoles', municipio:'Benito Juárez',
      entidad:'Ciudad de México', cp:'03810', utm:'', observaciones:'Equipo con desgaste en plataforma',
      folioDict:'00102', fechaDict:TODAY,
      instrumentos:[
        { no:1,tipo:'M',marca:'FAIRBANKS',modelo:'FM-200',serie:'FM20019001',max:'2000',e:'500',
          clasExact:'IIII',prototipo:'',dgn:'',periodo:'A',ipe:'P',
          inspecVisual:'C',exactitud:'C',repetibilidad:'C',excentricidad:'C',cumpleNom:'C',
          holoTipo:'S2',holoProfeco:'S20000050',holoU:'UVA26002' }
      ],
      equipoPatron:{m:'MP-01',c:'C-007',d:'',v:'VI-2024'},
      pago:{sub:'1200.00',iva:'192.00',total:'1392.00'},
      imparcialidad:'ninguna',apoyo:'',
      verificador:'Carlos Ramírez',socio:'Socio A',zona:'Zona Norte',
      status:'ok', createdAt:new Date(Date.now()-7200000).toISOString() },
  ];
}

// ── Teclado suave: evitar salto al abrir el teclado ──
(function(){
  // Fija --app-h al alto del viewport de layout una sola vez.
  // No se actualiza en cada resize para evitar el salto cuando la barra
  // de direcciones aparece/desaparece (ese salto era el "brincado").
  function setAppH(){ document.documentElement.style.setProperty('--app-h', window.innerHeight + 'px'); }
  setAppH();
  // Solo actualizar en cambios grandes (rotación de pantalla), no en los
  // pequeños que produce la barra de navegación del navegador.
  var _lastH = window.innerHeight;
  window.addEventListener('resize', function(){
    var h = window.innerHeight;
    if (Math.abs(h - _lastH) > 100) { _lastH = h; setAppH(); }
  });

  if (!window.visualViewport) return;
  var kbdOpen = false;
  var rafId = null;
  function onVVResize(){
    if (rafId) cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(function(){
      var kh = Math.max(0, window.innerHeight - window.visualViewport.height - window.visualViewport.offsetTop);
      var scrollEls = document.querySelectorAll('.scroll, .mf-body');
      if (kh > 80) {
        document.documentElement.style.setProperty('--kbd-h', kh + 'px');
        scrollEls.forEach(function(el){ el.style.paddingBottom = kh + 'px'; });
        if (!kbdOpen) {
          kbdOpen = true;
          var focused = document.activeElement;
          if (focused && focused !== document.body) {
            setTimeout(function(){ focused.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }, 350);
          }
        }
      } else {
        document.documentElement.style.setProperty('--kbd-h', '0px');
        scrollEls.forEach(function(el){ el.style.paddingBottom = ''; });
        kbdOpen = false;
      }
    });
  }
  window.visualViewport.addEventListener('resize', onVVResize);
  window.visualViewport.addEventListener('scroll', onVVResize);
})();
