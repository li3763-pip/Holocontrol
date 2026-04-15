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

  // M01–M15  Clase M1
  for(let i=1;i<=15;i++) cat.push({id:'M'+pad2(i),clase:'M1',serie:'M'});
  // C01–C15  Clase M1
  for(let i=1;i<=15;i++) cat.push({id:'C'+pad2(i),clase:'M1',serie:'C'});
  // D01–D15  Clase M1
  for(let i=1;i<=15;i++) cat.push({id:'D'+pad2(i),clase:'M1',serie:'D'});
  // V001–V600 Clase M1
  for(let i=1;i<=600;i++) cat.push({id:'V'+pad3(i),clase:'M1',serie:'V'});
  // MF01  Clase F2
  cat.push({id:'MF01',clase:'F2',serie:'MF'});
  // CF01  Clase F2
  cat.push({id:'CF01',clase:'F2',serie:'CF'});
  // DF01  Clase F2
  cat.push({id:'DF01',clase:'F2',serie:'DF'});
  // VF01–VF02  Clase F2
  cat.push({id:'VF01',clase:'F2',serie:'VF'});
  cat.push({id:'VF02',clase:'F2',serie:'VF'});

  window.EQUIPO_PATRON_CATALOG=cat;
})();

/* ── ASIGNACIONES ── */
/* { equipoId, verificadorId, verificadorNombre, socio, fecha } */
let asignacionesEquipo=[];

/* ── ESTADO PAGINACIÓN / FILTROS ── */
const epFilt={texto:'',clase:'',estado:''};
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
function renderEquipoPatron(){
  const texto=(epFilt.texto||'').toLowerCase();
  const clase=epFilt.clase;
  const estado=epFilt.estado;

  const lista=EQUIPO_PATRON_CATALOG.filter(e=>{
    if(clase&&e.clase!==clase) return false;
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

  const tbody=pagina.map(e=>{
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
    return`<tr>
      <td style="font-family:var(--mono);font-weight:500">${e.id}</td>
      <td>${claseChip}</td>
      <td>${estadoChip}</td>
      <td>${verNombre}<br>${fechaStr}</td>
      <td>${socioChip}</td>
      <td>${acciones}</td>
    </tr>`;
  }).join('');

  document.getElementById('ep-tbody').innerHTML=tbody||`<tr><td colspan="6" style="text-align:center;color:var(--text3);padding:20px">Sin resultados.</td></tr>`;

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

  asignacionesEquipo.push({equipoId,verificadorId:verId,verificadorNombre:ver.nombre,socio:ver.socio,fecha});
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
  renderEquipoPatron();
}

/* ── TÍTULOS Y NAVEGACIÓN ── */
titles['equipo-patron']='Catálogo de equipo patrón';
breadcrumbs['equipo-patron']='Catálogos';
