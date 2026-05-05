function getTodayMX(){return new Intl.DateTimeFormat('en-CA',{timeZone:'America/Mexico_City'}).format(new Date());}
function getNowTimeMX(){return new Intl.DateTimeFormat('es-MX',{timeZone:'America/Mexico_City',hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date());}
const TODAY=getTodayMX();
const SOCIOS=['Socio A','Socio B','Socio C'];
const TIPOS=['1er semestre','2do semestre','Anual'];
const TIPO_MAP={'1':'1er semestre','2':'2do semestre','3':'Anual'};
const TIPO_CLASS={'1er semestre':'t-s1','2do semestre':'t-s2','Anual':'t-an'};
const TIPO_SHORT={'1er semestre':'1er Sem','2do semestre':'2do Sem','Anual':'Anual'};
const TIPO_DIGIT={'1er semestre':'1','2do semestre':'2','Anual':'3'};
const AV_CLASS={'Socio A':'av-a','Socio B':'av-b','Socio C':'av-c'};
const SEL_CLASS={'Socio A':'sel-a','Socio B':'sel-b','Socio C':'sel-c'};
const INITIALS={'Socio A':'SA','Socio B':'SB','Socio C':'SC'};
const COLORS={'Socio A':'var(--blue)','Socio B':'var(--purple)','Socio C':'var(--green)'};
const COLORS_BG={'Socio A':'var(--blue-bg)','Socio B':'var(--purple-bg)','Socio C':'var(--green-bg)'};
const COLORS_HEX={'Socio A':'#1B4F8A','Socio B':'#4A2D8B','Socio C':'#166B47'};
function scls(s){return{'Socio A':'sa','Socio B':'sb','Socio C':'sc'}[s]||'';}
function pcls(p){return{'Proveedor 1':'p1','Proveedor 2':'p2','Proveedor 3':'p3'}[p]||'';}

/* ── DATOS ── */
let FOLIOS_REG=new Set();

let proveedores=[
  {nombre:'Proveedor 1',contacto:'Juan Torres',tel:'55 1234-5678',precio:4.80,fechaPrecio:'2025-01-10'},
  {nombre:'Proveedor 2',contacto:'María Soto',tel:'55 8765-4321',precio:5.20,fechaPrecio:'2025-02-01'},
  {nombre:'Proveedor 3',contacto:'Pedro Ruiz',tel:'55 5555-0000',precio:4.50,fechaPrecio:'2024-12-15'},
];
let proveedorUVA={nombre:'Proveedor UVA',contacto:'',tel:'',precio:3.50,fechaPrecio:'2025-01-01'};

let compras=[
  {folio:'P1-0001',factura:'FAC-2024-010',fecha:'2024-11-05',prov:'Proveedor 1',precio:4.80,
   partes:[{socio:'Socio A',tipos:[{tipo:'1er semestre',cant:300},{tipo:'Anual',cant:200}]},{socio:'Socio B',tipos:[{tipo:'1er semestre',cant:200}]}],notas:''},
  {folio:'P2-0001',factura:'FAC-2024-022',fecha:'2024-11-12',prov:'Proveedor 2',precio:5.20,
   partes:[{socio:'Socio B',tipos:[{tipo:'2do semestre',cant:400}]}],notas:''},
  {folio:'P3-0001',factura:'FAC-2024-033',fecha:'2024-11-28',prov:'Proveedor 3',precio:4.50,
   partes:[{socio:'Socio C',tipos:[{tipo:'1er semestre',cant:150},{tipo:'2do semestre',cant:150}]}],notas:''},
  {folio:'P1-0002',factura:'FAC-2025-003',fecha:'2025-01-08',prov:'Proveedor 1',precio:4.80,
   partes:[{socio:'Socio A',tipos:[{tipo:'2do semestre',cant:300}]},{socio:'Socio B',tipos:[{tipo:'Anual',cant:500}]},{socio:'Socio C',tipos:[{tipo:'Anual',cant:300}]}],notas:''},
];

let recepciones=[
  {folio:'REC-0001',orden:'P1-0001',prov:'Proveedor 1',fecha:'2024-11-10',hora:'10:30',
   asignacion:{
     'Socio A':{'1er semestre':[{ini:'10000001',fin:'10000180',cant:180}],'Anual':[{ini:'30000001',fin:'30000120',cant:120}]},
     'Socio B':{'1er semestre':[{ini:'10000181',fin:'10000300',cant:120}]}
   },
   porTipo:{'1er semestre':300,'Anual':120},total:420,quien:'Carlos M.',notas:''},
  {folio:'REC-0002',orden:'P2-0001',prov:'Proveedor 2',fecha:'2024-11-15',hora:'09:00',
   asignacion:{
     'Socio B':{'2do semestre':[{ini:'20000001',fin:'20000200',cant:200}]}
   },
   porTipo:{'2do semestre':200},total:200,quien:'Luisa R.',notas:''},
];
// Registrar folios de muestra
['10000001','10000002','10000003','20000001','20000002','30000001','30000002','30000003'].forEach(f=>FOLIOS_REG.add(f));

/* ── HELPERS ── */
function totalPorOrden(f){return compras.find(c=>c.folio===f)?.partes.reduce((s,p)=>s+p.tipos.reduce((ss,t)=>ss+t.cant,0),0)||0;}
function recibidosPorOrden(f){return recepciones.filter(r=>r.orden===f).reduce((s,r)=>s+r.total,0);}
function pendientePorOrden(f){return totalPorOrden(f)-recibidosPorOrden(f);}
function estadoOrden(c){const p=totalPorOrden(c.folio),r=recibidosPorOrden(c.folio);return r===0?'Pendiente':r>=p?'Completo':'Parcial';}
function getPrecio(prov){return proveedores.find(p=>p.nombre===prov)?.precio||0;}

/* Genera el siguiente folio consecutivo para un proveedor: P1-0003, P2-0002, etc. */
function nextFolioProveedor(prov){
  const idx=proveedores.findIndex(p=>p.nombre===prov)+1; // 1-based
  if(!idx)return'???';
  const prev=compras.filter(c=>c.prov===prov).length;
  return'P'+idx+'-'+String(prev+1).padStart(4,'0');
}

function getPctPorTipo(ordenId){
  const res={};
  compras.find(c=>c.folio===ordenId)?.partes.forEach(p=>{
    p.tipos.forEach(t=>{
      if(!res[t.tipo])res[t.tipo]=[];
      res[t.tipo].push({socio:p.socio,cant:t.cant});
    });
  });
  Object.values(res).forEach(arr=>{const tot=arr.reduce((s,x)=>s+x.cant,0);arr.forEach(x=>x.pct=x.cant/tot);});
  return res;
}

function tiposEnOrden(ordenId){
  const set=new Set();
  compras.find(c=>c.folio===ordenId)?.partes.forEach(p=>p.tipos.forEach(t=>set.add(t.tipo)));
  return[...set];
}

/* ── PARSE FOLIO ── */
function parseFolioHolo(s){
  const c=(s||'').replace(/\s/g,'');
  if(!/^\d{8}$/.test(c))return null;
  const tipo=TIPO_MAP[c[0]];if(!tipo)return null;
  return{raw:c,tipoDigit:c[0],tipo,numero:c.slice(1),numInt:parseInt(c.slice(1))};
}
function generarFoliosDeEntry(e){
  const arr=[];
  if(e.tipo==='suelto'){const p=parseFolioHolo(e.folio);if(p)arr.push(p.raw);}
  else{
    const ini=parseFolioHolo(e.ini),fin=parseFolioHolo(e.fin);
    if(!ini||!fin||ini.tipoDigit!==fin.tipoDigit||fin.numInt<ini.numInt)return arr;
    const lim=Math.min(fin.numInt-ini.numInt+1,5000);
    for(let n=ini.numInt;n<ini.numInt+lim;n++)arr.push(ini.tipoDigit+String(n).padStart(7,'0'));
  }
  return arr;
}
function getFoliosValidosPorTipo(){
  const visto=new Set(),porTipo={};
  for(const e of rEntries){
    for(const f of generarFoliosDeEntry(e)){
      if(FOLIOS_REG.has(f)||visto.has(f))continue;
      visto.add(f);
      const p=parseFolioHolo(f);if(!p)continue;
      if(!porTipo[p.tipo])porTipo[p.tipo]=[];
      porTipo[p.tipo].push(f);
    }
  }
  return porTipo;
}

/* ── FILTROS ── */
const filtC={text:'',prov:'',est:''};
const filtR={text:'',prov:''};

/* ── SORTING ── */
const stC={col:'fecha',dir:'desc'};
const stR={col:'fecha',dir:'desc'};

function sortC(col){
  if(stC.col===col)stC.dir=stC.dir==='asc'?'desc':'asc';
  else{stC.col=col;stC.dir='asc';}
  renderCompras();
}
function sortR(col){
  if(stR.col===col)stR.dir=stR.dir==='asc'?'desc':'asc';
  else{stR.col=col;stR.dir='asc';}
  renderRec();
}
function updSortHeaders(prefix,state,cols){
  cols.forEach(c=>{
    const el=document.getElementById(prefix+c);
    if(!el)return;
    el.className='sortable';
    if(state.col===c)el.className+=' sort-'+state.dir;
  });
}
function cmpVal(a,b,dir){
  const d=dir==='asc'?1:-1;
  if(a<b)return-d;if(a>b)return d;return 0;
}

/* ── RENDER COMPRAS ── */
function renderCompras(){
  let tot=0,ped=0,rec=0,pend=0;
  compras.forEach(c=>{const p=totalPorOrden(c.folio),r=recibidosPorOrden(c.folio);tot++;ped+=p;rec+=r;pend+=p-r;});
  document.getElementById('m-ord').textContent=tot;
  document.getElementById('m-ped').textContent=ped.toLocaleString();
  document.getElementById('m-rec').textContent=rec.toLocaleString();
  document.getElementById('m-pend').textContent=pend.toLocaleString();
  const rows=compras.filter(c=>(!filtC.text||(c.folio+c.factura).toLowerCase().includes(filtC.text.toLowerCase()))&&(!filtC.prov||c.prov===filtC.prov)&&(!filtC.est||estadoOrden(c)===filtC.est))
    .sort((a,b)=>cmpVal(a[stC.col]||'',b[stC.col]||'',stC.dir));
  updSortHeaders('thC-',stC,['folio','factura','fecha']);
  document.getElementById('tbody-compras').innerHTML=rows.map(c=>{
    const p=totalPorOrden(c.folio),r=recibidosPorOrden(c.folio),pct=Math.min(100,p?Math.round(r/p*100):0);
    const est=estadoOrden(c),ec=est==='Completo'?'completo':est==='Parcial'?'parcial':'pend';
    const bc=est==='Completo'?'var(--green)':est==='Parcial'?'var(--blue)':'var(--amber)';
    const ss=c.partes.map(p=>`<span class="chip ${scls(p.socio)}">${INITIALS[p.socio]}</span>`).join(' ');
    return`<tr class="row" onclick="verDetalle('${c.folio}')">
      <td><span class="mono" style="color:var(--blue)">${c.folio}</span></td>
      <td style="font-size:11px;color:var(--text3)">${c.factura}</td><td style="font-size:11px">${c.fecha}</td>
      <td><span class="chip ${pcls(c.prov)}">${c.prov}</span></td><td>${ss}</td>
      <td style="font-weight:500">${p.toLocaleString()}</td>
      <td style="font-weight:500;color:var(--green)">${r.toLocaleString()}</td>
      <td><div style="display:flex;align-items:center;gap:6px"><div class="prog" style="flex:1"><div class="prog-fill" style="width:${pct}%;background:${bc}"></div></div><span style="font-size:10px;color:var(--text3)">${pct}%</span></div></td>
      <td style="color:var(--green);font-weight:500;font-size:11px">$${(p*c.precio).toLocaleString('es-MX',{maximumFractionDigits:0})}</td>
      <td><span class="chip ${ec}">${est}</span></td>
    </tr>`;
  }).join('');
}

/* ── RENDER RECEPCIONES ── */
function renderRec(){
  const tot=recepciones.reduce((s,r)=>s+r.total,0);
  document.getElementById('m-nrec').textContent=recepciones.length;
  document.getElementById('m-hrec').textContent=tot.toLocaleString();
  document.getElementById('m-ocomp').textContent=compras.filter(c=>estadoOrden(c)==='Completo').length;
  document.getElementById('m-opend').textContent=compras.filter(c=>estadoOrden(c)!=='Completo').length;
  const rows=recepciones.filter(r=>(!filtR.text||(r.folio+r.orden).toLowerCase().includes(filtR.text.toLowerCase()))&&(!filtR.prov||r.prov===filtR.prov))
    .sort((a,b)=>cmpVal(a[stR.col]||'',b[stR.col]||'',stR.dir));
  updSortHeaders('thR-',stR,['folio','orden','fecha']);
  document.getElementById('tbody-rec').innerHTML=rows.map(r=>{
    const tiposOrd=tiposEnOrden(r.orden);
    const disc=Object.keys(r.porTipo).some(t=>tiposOrd.length>0&&!tiposOrd.includes(t));
    return`<tr>
      <td><span class="mono" style="color:var(--green)">${r.folio}</span></td>
      <td><span class="mono" style="color:var(--blue)">${r.orden}</span></td>
      <td><span class="chip ${pcls(r.prov)}">${r.prov}</span></td>
      <td style="font-size:11px">${r.fecha} ${r.hora}</td>
      <td style="font-weight:500">${r.total.toLocaleString()}</td>
      <td style="color:var(--blue)">${r.porTipo['1er semestre']?.toLocaleString()||'—'}</td>
      <td style="color:var(--purple)">${r.porTipo['2do semestre']?.toLocaleString()||'—'}</td>
      <td style="color:var(--amber)">${r.porTipo['Anual']?.toLocaleString()||'—'}</td>
      <td style="font-size:11px">${r.quien}</td>
      <td>${disc?'<span class="chip disc">Disc.</span>':'<span class="chip completo">OK</span>'}</td>
    </tr>`;
  }).join('');
}

/* ── RENDER INVENTARIO ── */
function renderInv(){
  let tot=0,s1=0,s2=0,an=0;
  recepciones.forEach(r=>{tot+=r.total;s1+=r.porTipo['1er semestre']||0;s2+=r.porTipo['2do semestre']||0;an+=r.porTipo['Anual']||0;});
  document.getElementById('inv-tot').textContent=tot.toLocaleString();
  document.getElementById('inv-s1').textContent=s1.toLocaleString();
  document.getElementById('inv-s2').textContent=s2.toLocaleString();
  document.getElementById('inv-an').textContent=an.toLocaleString();
  // Por socio
  const porSocio={};
  recepciones.forEach(r=>{
    if(r.asignacion){Object.entries(r.asignacion).forEach(([socio,tipos])=>{
      if(!porSocio[socio])porSocio[socio]={total:0,tipos:{}};
      Object.entries(tipos).forEach(([t,v])=>{const c=asigCant(v);porSocio[socio].tipos[t]=(porSocio[socio].tipos[t]||0)+c;porSocio[socio].total+=c;});
    });}
  });
  document.getElementById('tbody-inv').innerHTML=recepciones.map(r=>{
    const asigStr=r.asignacion?Object.entries(r.asignacion).map(([s,tipos])=>`<span class="chip ${scls(s)}" style="margin-right:3px">${INITIALS[s]}</span>`).join(''):'—';
    // Mostrar rangos de folios si existen
    const muestraFolios=r.asignacion
      ?Object.entries(r.asignacion).map(([s,tipos])=>
          Object.entries(tipos).map(([t,rangos])=>
            Array.isArray(rangos)?rangos.map(rng=>`${rng.ini}→${rng.fin}(${rng.cant})`).join(' '):''
          ).join(' ')
        ).join(' ')
      :Object.entries(r.porTipo).map(([t,c])=>`${TIPO_DIGIT[t]}xxxxxxx(${c})`).join(' ');
    return`<tr>
      <td>${asigStr}</td>
      <td><span class="mono" style="color:var(--green)">${r.folio}</span></td>
      <td><span class="mono" style="color:var(--blue)">${r.orden}</span></td>
      <td style="font-weight:500">${r.total}</td>
      <td style="color:var(--blue)">${r.porTipo['1er semestre']||'—'}</td>
      <td style="color:var(--purple)">${r.porTipo['2do semestre']||'—'}</td>
      <td style="color:var(--amber)">${r.porTipo['Anual']||'—'}</td>
      <td style="font-size:11px">${r.fecha}</td>
      <td style="font-size:10px;color:var(--text3);font-family:var(--mono)">${muestraFolios}</td>
    </tr>`;
  }).join('');
}

/* ── RENDER DASHBOARD ── */
function renderDash(){
  let ord=0,ped=0,rec=0,pend=0;
  compras.forEach(c=>{const p=totalPorOrden(c.folio),r=recibidosPorOrden(c.folio);if(estadoOrden(c)!=='Completo')ord++;ped+=p;rec+=r;pend+=p-r;});
  document.getElementById('dash-ord').textContent=ord;
  document.getElementById('dash-ped').textContent=ped.toLocaleString();
  document.getElementById('dash-rec').textContent=rec.toLocaleString();
  document.getElementById('dash-pend').textContent=pend.toLocaleString();
  document.getElementById('dash-compras-tbody').innerHTML=compras.slice(0,5).map(c=>{
    const p=totalPorOrden(c.folio),r=recibidosPorOrden(c.folio),pct=Math.min(100,p?Math.round(r/p*100):0);
    const est=estadoOrden(c),ec=est==='Completo'?'completo':est==='Parcial'?'parcial':'pend';
    const ss=c.partes.map(p=>`<span class="chip ${scls(p.socio)}" style="font-size:9px;padding:1px 5px">${INITIALS[p.socio]}</span>`).join(' ');
    return`<tr><td><span class="mono" style="color:var(--blue);font-size:11px">${c.folio}</span></td><td>${ss}</td>
      <td><div class="prog"><div class="prog-fill" style="width:${pct}%;background:var(--blue)"></div></div></td>
      <td><span class="chip ${ec}">${est}</span></td></tr>`;
  }).join('');
  document.getElementById('dash-rec-tbody').innerHTML=recepciones.slice(0,5).map(r=>
    `<tr><td><span class="mono" style="color:var(--green);font-size:11px">${r.folio}</span></td>
    <td><span class="mono" style="color:var(--blue);font-size:11px">${r.orden}</span></td>
    <td style="font-weight:500">${r.total.toLocaleString()}</td>
    <td style="font-size:11px;color:var(--text3)">${r.fecha}</td></tr>`).join('');
  // inv por socio
  const porSocio={};
  recepciones.forEach(r=>{if(r.asignacion)Object.entries(r.asignacion).forEach(([s,tipos])=>{
    if(!porSocio[s])porSocio[s]={total:0,s1:0,s2:0,an:0};
    porSocio[s].s1+=asigCant(tipos['1er semestre']);porSocio[s].s2+=asigCant(tipos['2do semestre']);porSocio[s].an+=asigCant(tipos['Anual']);
    porSocio[s].total+=asigCant(tipos['1er semestre'])+asigCant(tipos['2do semestre'])+asigCant(tipos['Anual']);
  });});
  const totalRec=recepciones.reduce((s,r)=>s+r.total,0)||1;
  document.getElementById('dash-inv-tbody').innerHTML=SOCIOS.map(s=>{
    const d=porSocio[s]||{total:0,s1:0,s2:0,an:0};
    const pct=Math.round(d.total/totalRec*100);
    return`<tr><td><span class="chip ${scls(s)}">${s}</span></td><td style="font-weight:500">${d.total.toLocaleString()}</td>
      <td style="color:var(--blue)">${d.s1||'—'}</td><td style="color:var(--purple)">${d.s2||'—'}</td><td style="color:var(--amber)">${d.an||'—'}</td>
      <td><div style="display:flex;align-items:center;gap:6px"><div class="prog" style="flex:1"><div class="prog-fill" style="width:${pct}%;background:${COLORS_HEX[s]}"></div></div><span style="font-size:10px;color:var(--text3)">${pct}%</span></div></td>
    </tr>`;
  }).join('');
}

/* ── PESTAÑAS DASHBOARD ── */
function switchDashTab(tab){
  document.querySelectorAll('.dash-tab').forEach((el,i)=>{
    el.classList.toggle('active', (i===0&&tab==='resumen')||(i===1&&tab==='inventario'));
  });
  document.getElementById('dash-panel-resumen').classList.toggle('active', tab==='resumen');
  document.getElementById('dash-panel-inventario').classList.toggle('active', tab==='inventario');
  if(tab==='inventario') renderInvPersonal();
}

function renderInvPersonal(){
  const cont=document.getElementById('dash-inv-personal-content');
  if(!cont)return;
  const socio=SESSION.socio;

  // Si no es socio, mostrar selector de socios (admin/personal ven a quien quieran)
  if(!socio){
    cont.innerHTML=`<div style="padding:20px;text-align:center;color:var(--text3);font-size:12px">Esta vista está disponible para usuarios con rol Socio.</div>`;
    return;
  }

  const invH=inventarioHoloSocio(socio);
  const invU=inventarioUvaSocio(socio);
  const dictCant=inventarioDictSocio(socio);
  const totalHolo=Object.values(invH).reduce((a,b)=>a+b,0);
  const totalUva=Object.values(invU).reduce((a,b)=>a+b,0);

  // — Métricas resumen —
  let html=`
  <div class="metrics" style="margin-bottom:14px">
    <div class="metric">
      <div class="metric-lbl">Hologramas disponibles</div>
      <div class="metric-val" style="color:var(--blue)">${totalHolo.toLocaleString()}</div>
    </div>
    <div class="metric">
      <div class="metric-lbl">Etiquetas UVA</div>
      <div class="metric-val" style="color:var(--green)">${totalUva.toLocaleString()}</div>
    </div>
    <div class="metric">
      <div class="metric-lbl">Dictámenes</div>
      <div class="metric-val" style="color:var(--amber)">${dictCant.toLocaleString()}</div>
    </div>
    <div class="metric">
      <div class="metric-lbl">Socio</div>
      <div style="margin-top:6px"><span class="chip ${scls(socio)}" style="font-size:13px;padding:4px 12px">${socio}</span></div>
    </div>
  </div>
  <div class="two-col">`;

  // — Bloque hologramas —
  html+=`<div>`;
  if(totalHolo===0){
    html+=`<div class="inv-type-card"><div class="inv-empty">Sin hologramas disponibles.</div></div>`;
  } else {
    TIPOS.forEach(tipo=>{
      const cant=invH[tipo]||0;
      if(cant===0)return;
      const set=foliosLibresSocioHolo(socio,tipo);
      const rangos=setToRangos(set,7,TIPO_DIGIT[tipo]);
      html+=`<div class="inv-type-card">
        <div class="inv-type-hd">
          <div class="inv-type-title">
            <span class="tipo-badge ${TIPO_CLASS[tipo]}">${tipo}</span>
            <span style="font-size:11px;color:var(--text3)">Hologramas</span>
          </div>
          <div class="inv-type-total" style="color:var(--green)">${cant.toLocaleString()}</div>
        </div>
        ${rangos.length===0?`<div class="inv-empty">Sin folios libres (todos asignados a verificadores).</div>`:
          rangos.map(r=>`
          <div class="inv-folio-row">
            <span style="font-family:var(--mono);color:var(--text2)">${r.ini} → ${r.fin}</span>
            <span style="font-weight:600;color:var(--green)">${r.cant.toLocaleString()} folios</span>
          </div>`).join('')
        }
      </div>`;
    });
  }
  html+=`</div>`;

  // — Bloque UVA + dictámenes —
  html+=`<div>`;
  if(totalUva===0){
    html+=`<div class="inv-type-card"><div class="inv-empty">Sin etiquetas UVA disponibles.</div></div>`;
  } else {
    UVA_TIPOS.forEach(tipo=>{
      const cant=invU[tipo]||0;
      if(cant===0)return;
      const set=foliosLibresSocioUva(socio,tipo);
      const rangos=setToRangos(set,5,'');
      html+=`<div class="inv-type-card">
        <div class="inv-type-hd">
          <div class="inv-type-title">
            <span class="tipo-badge t-s1">${tipo}</span>
            <span style="font-size:11px;color:var(--text3)">UVA</span>
          </div>
          <div class="inv-type-total" style="color:var(--green)">${cant.toLocaleString()}</div>
        </div>
        ${rangos.length===0?`<div class="inv-empty">Sin folios libres.</div>`:
          rangos.map(r=>`
          <div class="inv-folio-row">
            <span style="font-family:var(--mono);color:var(--text2)">${r.ini} → ${r.fin}</span>
            <span style="font-weight:600;color:var(--green)">${r.cant.toLocaleString()} folios</span>
          </div>`).join('')
        }
      </div>`;
    });
  }

  // Dictámenes
  html+=`<div class="inv-type-card">
    <div class="inv-type-hd">
      <div class="inv-type-title">
        <span class="tipo-badge t-an">Dictámenes</span>
        <span style="font-size:11px;color:var(--text3)">Papelería</span>
      </div>
      <div class="inv-type-total" style="color:var(--amber)">${dictCant.toLocaleString()}</div>
    </div>`;
  if(dictCant>0){
    const setD=foliosLibresSocioDict(socio);
    const rangosD=setToRangos(setD,5,'');
    html+=rangosD.length===0?`<div class="inv-empty">Sin folios libres.</div>`:
      rangosD.map(r=>`
      <div class="inv-folio-row">
        <span style="font-family:var(--mono);color:var(--text2)">${r.ini} → ${r.fin}</span>
        <span style="font-weight:600;color:var(--amber)">${r.cant.toLocaleString()} folios</span>
      </div>`).join('');
  } else {
    html+=`<div class="inv-empty">Sin dictámenes disponibles.</div>`;
  }
  html+=`</div></div></div>`;

  cont.innerHTML=html;
}


function renderSocios(){
  document.getElementById('socios-cards').innerHTML=SOCIOS.map(s=>{
    const ords=compras.filter(c=>c.partes.some(p=>p.socio===s));
    const ordsUva=uvaCompras.filter(c=>c.socio===s);
    const verifs=getVerificadoresDeSocio(s);
    const invH=inventarioHoloSocio(s);
    const invU=inventarioUvaSocio(s);
    const totalHolo=Object.values(invH).reduce((a,b)=>a+b,0);
    const totalUva=Object.values(invU).reduce((a,b)=>a+b,0);

    // Filas de hologramas por tipo con rangos
    const holoRows=TIPOS.filter(t=>(invH[t]||0)>0).map(t=>{
      const set=foliosHoloDisponibles(s,t);
      const digit=TIPO_DIGIT[t];
      const rangos=setToRangos(set,7,digit);
      const rangosStr=rangos.map(r=>
        `<div style="display:flex;justify-content:space-between;padding:2px 0 2px 16px;font-size:10px;color:var(--text3);border-bottom:1px dashed var(--border)">
          <span style="font-family:var(--mono)">${r.ini} → ${r.fin}</span>
          <span style="color:var(--green);font-weight:500">${r.cant.toLocaleString()}</span>
        </div>`
      ).join('');
      return`<div>
        <div style="display:flex;justify-content:space-between;align-items:center;padding:4px 0 4px 8px;border-bottom:1px solid var(--border);font-size:11px">
          <span class="tipo-badge ${TIPO_CLASS[t]}">${TIPO_SHORT[t]}</span>
          <span style="font-weight:600;color:var(--green)">${(invH[t]).toLocaleString()}</span>
        </div>
        ${rangosStr}
      </div>`;
    }).join('');

    // Filas de UVA por tipo con rangos
    const uvaRows=UVA_TIPOS.filter(t=>(invU[t]||0)>0).map(t=>{
      const set=foliosUvaDisponibles(s,t);
      const rangos=setToRangos(set,5,'');
      const rangosStr=rangos.map(r=>
        `<div style="display:flex;justify-content:space-between;padding:2px 0 2px 16px;font-size:10px;color:var(--text3);border-bottom:1px dashed var(--border)">
          <span style="font-family:var(--mono)">${r.ini} → ${r.fin}</span>
          <span style="color:var(--purple);font-weight:500">${r.cant.toLocaleString()}</span>
        </div>`
      ).join('');
      return`<div>
        <div style="display:flex;justify-content:space-between;align-items:center;padding:4px 0 4px 8px;border-bottom:1px solid var(--border);font-size:11px">
          <span class="tipo-badge t-s1">${t}</span>
          <span style="font-weight:600;color:var(--purple)">${(invU[t]).toLocaleString()}</span>
        </div>
        ${rangosStr}
      </div>`;
    }).join('');

    return`<div class="card" style="margin:0">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px">
        <div style="width:36px;height:36px;border-radius:50%;background:${COLORS_BG[s]};display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:600;color:${COLORS[s]}">${INITIALS[s]}</div>
        <div><div style="font-size:13px;font-weight:600">${s}</div></div>
      </div>

      <div class="det-row"><span class="dl">Órdenes hologramas</span><span class="dv">${ords.length}</span></div>
      <div class="det-row"><span class="dl">Verificadores</span><span class="dv" style="color:var(--green)">${verifs.length>0?verifs.map(v=>`<span style='font-size:11px;background:var(--surface2);border-radius:4px;padding:1px 6px;margin-left:3px'>${v.nombre}</span>`).join(''):'—'}</span></div>
      <div class="det-row"><span class="dl">Órdenes UVA</span><span class="dv">${ordsUva.length}</span></div>

      <!-- HOLOGRAMAS -->
      <div style="font-size:10px;font-weight:600;color:var(--text3);text-transform:uppercase;letter-spacing:.05em;margin:10px 0 4px">
        Hologramas disponibles
        <span style="float:right;color:var(--green)">${totalHolo.toLocaleString()}</span>
      </div>
      ${holoRows||`<div style="font-size:11px;color:var(--text3);padding:4px 0 4px 8px;font-style:italic">Sin hologramas</div>`}

      <!-- UVA -->
      <div style="font-size:10px;font-weight:600;color:var(--text3);text-transform:uppercase;letter-spacing:.05em;margin:10px 0 4px">
        Etiquetas UVA disponibles
        <span style="float:right;color:var(--purple)">${totalUva.toLocaleString()}</span>
      </div>
      ${uvaRows||`<div style="font-size:11px;color:var(--text3);padding:4px 0 4px 8px;font-style:italic">Sin etiquetas UVA</div>`}

      <!-- DICTÁMENES -->
      <div style="font-size:10px;font-weight:600;color:var(--text3);text-transform:uppercase;letter-spacing:.05em;margin:10px 0 4px">
        Dictámenes disponibles
        <span style="float:right;color:var(--amber)">${inventarioDictSocio(s).toLocaleString()}</span>
      </div>
      ${(()=>{
        const set=foliosDictDisponibles(s);
        if(set.size===0) return`<div style="font-size:11px;color:var(--text3);padding:4px 0 4px 8px;font-style:italic">Sin dictámenes</div>`;
        const rangos=setToRangos(set, [...set][0]?String([...set].sort((a,b)=>a-b)[0]).length:5,'');
        return rangos.map(r=>
          `<div style="display:flex;justify-content:space-between;padding:2px 0 2px 8px;font-size:10px;color:var(--text3);border-bottom:1px dashed var(--border)">
            <span style="font-family:var(--mono)">${r.ini} → ${r.fin}</span>
            <span style="color:var(--amber);font-weight:500">${r.cant.toLocaleString()}</span>
          </div>`
        ).join('');
      })()}
    </div>`;
  }).join('');
}

/* ── RENDER PROVEEDORES ── */
function renderProveedores(){
  renderProveedorUVA();
  document.getElementById('prov-cards').innerHTML=proveedores.map((p,i)=>`
    <div class="prov-card">
      <div class="prov-card-hd">
        <div style="display:flex;align-items:center;gap:10px">
          <div style="width:36px;height:36px;border-radius:8px;background:var(--amber-bg);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:600;color:var(--amber)">P${i+1}</div>
          <div><div style="font-size:13px;font-weight:600">${p.nombre}</div><div style="font-size:11px;color:var(--text3)">${p.contacto} · ${p.tel}</div></div>
        </div>
        <div style="text-align:right">
          <div id="pdisp-${i}" class="prov-precio-display">$${p.precio.toFixed(2)}</div>
          <div id="pedit-${i}" class="prov-precio-edit"><input style="width:80px;padding:5px 8px;font-size:13px;font-family:var(--mono);border:1px solid var(--border);border-radius:6px;background:var(--surface2)" id="pinput-${i}" value="${p.precio.toFixed(2)}" type="number" step="0.01"><button class="btn sm primary" onclick="savePrecio(${i})">Guardar</button><button class="btn sm ghost" onclick="cancelPrecio(${i})">✕</button></div>
          <div style="font-size:10px;color:var(--text3);margin-top:3px">por holograma · actualizado ${p.fechaPrecio}</div>
        </div>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center;padding-top:10px;border-top:1px solid var(--border)">
        <div style="display:flex;gap:16px;font-size:12px"><span style="color:var(--text3)">Órdenes: <strong>${compras.filter(c=>c.prov===p.nombre).length}</strong></span></div>
        <button class="btn sm warn" onclick="editPrecio(${i})">Actualizar precio</button>
      </div>
    </div>`).join('');
}
function renderProveedorUVA(){
  const p=proveedorUVA;
  const el=document.getElementById('prov-uva-card');
  if(!el)return;
  el.innerHTML=`<div class="prov-card">
    <div class="prov-card-hd">
      <div style="display:flex;align-items:center;gap:10px">
        <div style="width:36px;height:36px;border-radius:8px;background:var(--purple-bg);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:600;color:var(--purple)">UVA</div>
        <div><div style="font-size:13px;font-weight:600">${p.nombre}</div><div style="font-size:11px;color:var(--text3)">${p.contacto||'Sin contacto'} ${p.tel?'· '+p.tel:''}</div></div>
      </div>
      <div style="text-align:right">
        <div id="pdisp-uva" class="prov-precio-display">$${p.precio.toFixed(2)}</div>
        <div id="pedit-uva" class="prov-precio-edit"><input style="width:80px;padding:5px 8px;font-size:13px;font-family:var(--mono);border:1px solid var(--border);border-radius:6px;background:var(--surface2)" id="pinput-uva" value="${p.precio.toFixed(2)}" type="number" step="0.01"><button class="btn sm primary" onclick="savePrecioUVA()">Guardar</button><button class="btn sm ghost" onclick="cancelPrecioUVA()">✕</button></div>
        <div style="font-size:10px;color:var(--text3);margin-top:3px">por etiqueta · actualizado ${p.fechaPrecio}</div>
      </div>
    </div>
    <div style="display:flex;justify-content:space-between;align-items:center;padding-top:10px;border-top:1px solid var(--border)">
      <div style="display:flex;gap:16px;font-size:12px"><span style="color:var(--text3)">Órdenes UVA: <strong>${uvaCompras.length}</strong></span></div>
      <button class="btn sm warn" onclick="editPrecioUVA()">Actualizar precio</button>
    </div>
  </div>`;
}
function editPrecioUVA(){document.getElementById('pdisp-uva').style.display='none';document.getElementById('pedit-uva').style.display='flex';}
function cancelPrecioUVA(){document.getElementById('pdisp-uva').style.display='block';document.getElementById('pedit-uva').style.display='none';}
function savePrecioUVA(){const v=parseFloat(document.getElementById('pinput-uva').value)||0;if(!v){alert('Ingresa un precio válido.');return;}proveedorUVA.precio=v;proveedorUVA.fechaPrecio=getTodayMX();renderProveedores();}

function editPrecio(i){document.getElementById('pdisp-'+i).style.display='none';document.getElementById('pedit-'+i).style.display='flex';}
function cancelPrecio(i){document.getElementById('pdisp-'+i).style.display='block';document.getElementById('pedit-'+i).style.display='none';}
function savePrecio(i){const v=parseFloat(document.getElementById('pinput-'+i).value)||0;if(!v){alert('Ingresa un precio válido.');return;}proveedores[i].precio=v;proveedores[i].fechaPrecio=getTodayMX();renderProveedores();}

/* ── DETALLE COMPRA ── */
function verDetalle(folio){
  const c=compras.find(x=>x.folio===folio);if(!c)return;
  const ped=totalPorOrden(c.folio),rec=recibidosPorOrden(c.folio);
  const est=estadoOrden(c),ec=est==='Completo'?'completo':est==='Parcial'?'parcial':'pend';
  document.getElementById('det-titulo').textContent='Orden '+c.folio;
  const recs=recepciones.filter(r=>r.orden===folio);
  document.getElementById('det-body').innerHTML=`<div class="det-box">
    <div class="det-row"><span class="dl">Factura</span><span class="dv mono">${c.factura}</span></div>
    <div class="det-row"><span class="dl">Fecha</span><span class="dv">${c.fecha}</span></div>
    <div class="det-row"><span class="dl">Proveedor</span><span class="dv"><span class="chip ${pcls(c.prov)}">${c.prov}</span></span></div>
    <div class="det-row"><span class="dl">Precio c/u</span><span class="dv mono" style="color:var(--green)">$${c.precio.toFixed(2)}</span></div>
    <div class="det-row"><span class="dl">Pedido</span><span class="dv">${ped.toLocaleString()}</span></div>
    <div class="det-row"><span class="dl">Recibido</span><span class="dv" style="color:var(--green)">${rec.toLocaleString()}</span></div>
    <div class="det-row"><span class="dl">Pendiente</span><span class="dv" style="color:var(--amber)">${(ped-rec).toLocaleString()}</span></div>
    <div class="det-row"><span class="dl">Estado</span><span class="dv"><span class="chip ${ec}">${est}</span></span></div>
    <div class="det-row"><span class="dl">Total</span><span class="dv" style="color:var(--green)">$${(ped*c.precio).toLocaleString('es-MX',{minimumFractionDigits:2})}</span></div>
  </div>
  ${c.partes.map(p=>`<div style="margin-bottom:8px;padding:8px 12px;background:var(--surface2);border-radius:6px;border:1px solid var(--border)">
    <div style="display:flex;align-items:center;gap:6px;margin-bottom:5px"><div class="avatar ${AV_CLASS[p.socio]}">${INITIALS[p.socio]}</div><span style="font-size:12px;font-weight:600">${p.socio}</span></div>
    ${p.tipos.map(t=>`<div style="display:flex;justify-content:space-between;font-size:11px;padding:2px 0 2px 28px"><span class="tipo-badge ${TIPO_CLASS[t.tipo]}">${TIPO_SHORT[t.tipo]}</span><span style="font-weight:500">${t.cant.toLocaleString()} pzas</span></div>`).join('')}
  </div>`).join('')}
  <div style="font-size:11px;font-weight:600;margin:10px 0 6px">Recepciones (${recs.length})</div>
  ${recs.length?recs.map(r=>`<div style="border:1px solid var(--border);border-radius:6px;padding:8px 10px;margin-bottom:6px;background:var(--surface)">
    <div style="display:flex;justify-content:space-between;margin-bottom:4px"><span class="mono" style="color:var(--green)">${r.folio}</span><span class="chip completo">${r.total} pzas</span></div>
    <div style="font-size:10px;color:var(--text3)">${r.fecha} ${r.hora} · Recibió: ${r.quien}</div>
    <div style="display:flex;gap:4px;margin-top:4px;flex-wrap:wrap">${Object.entries(r.porTipo).map(([t,c])=>`<span class="tipo-badge ${TIPO_CLASS[t]}">${TIPO_SHORT[t]}: ${c}</span>`).join('')}</div>
    ${r.asignacion?`<div style="font-size:10px;color:var(--text3);margin-top:5px">Asignado: ${Object.entries(r.asignacion).map(([s,tipos])=>`<strong style="color:${COLORS[s]}">${s}</strong> ${Object.entries(tipos).map(([t,v])=>`${TIPO_SHORT[t]}:${asigCant(v)}`).join('/')}`).join(' · ')}</div>`:''}
  </div>`).join(''):'<div style="font-size:12px;color:var(--text3);padding:6px 0">Sin recepciones.</div>'}`;
  openModal('modal-det');
}

/* ══════════════════════════════════════════════
   COMPRA FORM
══════════════════════════════════════════════ */
let cSocios=[],cNextSocio=1,cNextTipo=1;

function validarFechaC(){const v=document.getElementById('c-fecha').value,err=document.getElementById('c-fecha-err'),fi=document.getElementById('c-fecha');if(v&&v>getTodayMX()){fi.classList.add('date-invalid');err.style.display='block';return false;}fi.classList.remove('date-invalid');err.style.display='none';return true;}

function selProv(){
  const prov=document.getElementById('c-prov').value,precio=getPrecio(prov);
  const box=document.getElementById('c-precio-box'),warn=document.getElementById('c-warn-prov');
  // Actualizar folio preview según proveedor seleccionado
  document.getElementById('fn-compra').textContent=prov?nextFolioProveedor(prov):'—';
  if(prov&&precio>0){box.style.display='flex';warn.style.display='none';document.getElementById('c-precio-val').textContent='$'+precio.toFixed(2);const p=proveedores.find(x=>x.nombre===prov);document.getElementById('c-precio-sub').textContent='Actualizado '+p.fechaPrecio;}
  else if(prov){box.style.display='none';warn.style.display='block';}
  else{box.style.display='none';warn.style.display='none';}
  cActResumen();
}

function cSociosUsados(excId){return cSocios.filter(s=>s.id!==excId).map(s=>s.socio).filter(Boolean);}
function cTiposUsados(sid,excTid){const s=cSocios.find(x=>x.id===sid);return s?s.tipos.filter(t=>t.id!==excTid).map(t=>t.tipo).filter(Boolean):[];}
function cAddSocio(){if(cSociosUsados(null).length>=SOCIOS.length){alert('Ya agregaste todos los socios.');return;}const id=cNextSocio++;cSocios.push({id,socio:'',tipos:[]});cRenderSocios();}
function cDelSocio(id){cSocios=cSocios.filter(s=>s.id!==id);cRenderSocios();cActResumen();}
function cAddTipo(sid){const s=cSocios.find(x=>x.id===sid);if(!s)return;if(cTiposUsados(sid,null).length>=TIPOS.length){alert('Ya agregaste todos los tipos.');return;}const id=cNextTipo++;s.tipos.push({id,tipo:'',cant:''});cRenderTipos(sid);cActResumen();}
function cDelTipo(sid,tid){const s=cSocios.find(x=>x.id===sid);if(s){s.tipos=s.tipos.filter(t=>t.id!==tid);cRenderTipos(sid);cActResumen();}}

function cRenderSocios(){
  const cont=document.getElementById('c-socios-cont');
  if(cSocios.length===0){cont.innerHTML='<div class="empty-msg">Agrega al menos un socio.</div>';cActResumen();return;}
  cSocios.forEach(s=>{
    let el=document.getElementById('csb-'+s.id);
    if(!el){
      el=document.createElement('div');el.id='csb-'+s.id;el.className='socio-block';
      el.innerHTML=`<div class="socio-block-hd"><div class="socio-block-hd-left"><div class="avatar ${s.socio?AV_CLASS[s.socio]:'av-a'}" id="cav-${s.id}">${s.socio?INITIALS[s.socio]:'?'}</div><select class="tipo-sel" id="cssel-${s.id}" style="width:150px"><option value="">Seleccionar socio...</option></select></div><div style="display:flex;align-items:center;gap:8px"><span class="socio-total-chip" id="cchip-${s.id}"></span><button class="del-btn" onclick="cDelSocio(${s.id})">×</button></div></div>
      <div class="socio-block-body"><div style="font-size:9px;font-weight:600;color:var(--text3);text-transform:uppercase;letter-spacing:.06em;margin-bottom:6px">Tipos de holograma</div><div id="ctipos-${s.id}"></div><button class="add-tipo-btn" onclick="cAddTipo(${s.id})"><svg viewBox="0 0 12 12"><path d="M1 6h10M6 1v10"/></svg>Agregar tipo</button></div>`;
      cont.appendChild(el);
      el.querySelector('#cssel-'+s.id).addEventListener('change',function(){const sx=cSocios.find(x=>x.id===s.id);if(sx)sx.socio=this.value;const av=document.getElementById('cav-'+s.id);if(av){av.className='avatar '+(this.value?AV_CLASS[this.value]:'av-a');av.textContent=this.value?INITIALS[this.value]:'?';}cRenderSocios();cActResumen();});
    }
    const sel=document.getElementById('cssel-'+s.id);const usados=cSociosUsados(s.id);
    sel.innerHTML='<option value="">Seleccionar socio...</option>'+SOCIOS.map(x=>`<option value="${x}" ${x===s.socio?'selected':''} ${usados.includes(x)?'disabled':''}>${x}</option>`).join('');
    cRenderTipos(s.id);cUpdChip(s.id);
  });
  const ids=cSocios.map(s=>s.id);cont.querySelectorAll('.socio-block').forEach(el=>{const id=parseInt(el.id.replace('csb-',''));if(!ids.includes(id))el.remove();});
  document.getElementById('c-lbl-socios').textContent=cSocios.length+' de '+SOCIOS.length+' socios';
}

function cRenderTipos(sid){
  const s=cSocios.find(x=>x.id===sid);if(!s)return;
  const cont=document.getElementById('ctipos-'+sid);if(!cont)return;
  if(s.tipos.length===0){cont.innerHTML='<div style="font-size:11px;color:var(--text3);padding:2px 0 6px;font-style:italic">Sin tipos agregados.</div>';return;}
  s.tipos.forEach(t=>{
    let el=document.getElementById('ctr-'+t.id);
    if(!el){
      el=document.createElement('div');el.id='ctr-'+t.id;el.className='tipo-row';
      el.innerHTML=`<select class="tipo-sel" id="ctsel-${t.id}"><option value="">Tipo...</option></select><input class="tipo-input" id="ctcant-${t.id}" type="number" placeholder="0" min="1"><button class="del-btn" onclick="cDelTipo(${sid},${t.id})">×</button>`;
      cont.appendChild(el);
      el.querySelector('#ctsel-'+t.id).addEventListener('change',function(){const tx=s.tipos.find(x=>x.id===t.id);if(tx)tx.tipo=this.value;cRenderTipos(sid);cActResumen();});
      el.querySelector('#ctcant-'+t.id).addEventListener('input',function(){const tx=s.tipos.find(x=>x.id===t.id);if(tx)tx.cant=this.value;cUpdChip(sid);cActResumen();});
    }
    const tsel=document.getElementById('ctsel-'+t.id);if(tsel){const usados=cTiposUsados(sid,t.id);tsel.innerHTML='<option value="">Tipo...</option>'+TIPOS.map(x=>`<option value="${x}" ${x===t.tipo?'selected':''} ${usados.includes(x)?'disabled':''}>${x}</option>`).join('');}
    const tc=document.getElementById('ctcant-'+t.id);if(tc&&document.activeElement!==tc)tc.value=t.cant||'';
  });
  const tids=s.tipos.map(t=>t.id);cont.querySelectorAll('.tipo-row').forEach(el=>{const id=parseInt(el.id.replace('ctr-',''));if(!tids.includes(id))el.remove();});
}

function cUpdChip(sid){const s=cSocios.find(x=>x.id===sid);if(!s)return;const tot=s.tipos.reduce((sum,t)=>sum+(parseInt(t.cant)||0),0);const chip=document.getElementById('cchip-'+sid);if(chip){chip.textContent=tot>0?tot.toLocaleString()+' holo.':'';chip.style.display=tot>0?'inline-block':'none';}}

function cActResumen(){
  const precio=getPrecio(document.getElementById('c-prov').value)||0;
  const validos=cSocios.filter(s=>s.socio&&s.tipos.some(t=>t.tipo&&parseInt(t.cant)>0));
  const res=document.getElementById('c-resumen');
  if(validos.length===0){res.style.display='none';return;}res.style.display='block';
  let totalG=0;
  document.getElementById('c-res-body').innerHTML=validos.map(s=>{
    const tv=s.tipos.filter(t=>t.tipo&&parseInt(t.cant)>0);const ts=tv.reduce((sum,t)=>sum+(parseInt(t.cant)||0),0);totalG+=ts;
    return`<div class="res-socio-blk"><div class="res-socio-hd"><div style="display:flex;align-items:center;gap:8px"><div class="avatar ${AV_CLASS[s.socio]}">${INITIALS[s.socio]}</div><span style="font-size:12px;font-weight:600">${s.socio}</span></div><div style="text-align:right"><div style="font-size:12px;font-weight:600">${ts.toLocaleString()}</div>${precio>0?`<div style="font-size:10px;color:var(--text3)">$${(ts*precio).toLocaleString('es-MX',{minimumFractionDigits:2})}</div>`:''}</div></div>
    ${tv.map(t=>`<div class="res-tipo-row"><span class="tipo-badge ${TIPO_CLASS[t.tipo]}">${TIPO_SHORT[t.tipo]}</span><span style="font-weight:500">${parseInt(t.cant).toLocaleString()} pzas</span></div>`).join('')}</div>`;
  }).join('');
  document.getElementById('c-res-total').textContent=precio>0?'$'+(totalG*precio).toLocaleString('es-MX',{minimumFractionDigits:2}):'—';
  document.getElementById('c-res-cant').textContent=totalG.toLocaleString()+' hologramas';
  document.getElementById('c-res-sub').textContent=validos.length+' socio'+(validos.length>1?'s':'')+(precio>0?' · $'+precio.toFixed(2)+' c/u':'');
}

function guardarCompra(){
  if(!validarFechaC())return;
  const prov=document.getElementById('c-prov').value,factura=document.getElementById('c-factura').value,fecha=document.getElementById('c-fecha').value;
  const precio=getPrecio(prov);
  if(!prov){alert('Selecciona el proveedor.');return;}
  if(!precio){alert('Este proveedor no tiene precio registrado.');return;}
  if(!factura||!fecha){alert('Completa factura y fecha.');return;}
  const validos=cSocios.filter(s=>s.socio&&s.tipos.some(t=>t.tipo&&parseInt(t.cant)>0));
  if(validos.length===0){alert('Agrega al menos un socio con tipo y cantidad.');return;}
  const folio=nextFolioProveedor(prov);
  compras.unshift({folio,factura,fecha,prov,precio,
    partes:validos.map(s=>({socio:s.socio,tipos:s.tipos.filter(t=>t.tipo&&parseInt(t.cant)>0).map(t=>({tipo:t.tipo,cant:parseInt(t.cant)}))})),
    notas:document.getElementById('c-notas').value});
  closeModal('modal-compra');renderAll();
}

/* ══════════════════════════════════════════════
   RECEPCION FORM
══════════════════════════════════════════════ */
let rEntries=[],rNextId=1;
let manualesDecision={};

function validarFechaR(){const v=document.getElementById('r-fecha').value,err=document.getElementById('r-fecha-err'),fi=document.getElementById('r-fecha');if(v&&v>getTodayMX()){fi.classList.add('date-invalid');err.style.display='block';return false;}fi.classList.remove('date-invalid');err.style.display='none';const horaEl=document.getElementById('r-hora');if(horaEl){horaEl.max=(v===getTodayMX())?getNowTimeMX():'';}return true;}

/* ── FALTANTE POR SOCIO Y TIPO ── */
/* Extrae cantidad de un valor de asignacion (número o [{ini,fin,cant}]) */
function asigCant(v){
  if(!v)return 0;
  if(Array.isArray(v))return v.reduce((s,r)=>s+(r.cant||0),0);
  return typeof v==='number'?v:0;
}
function renderFaltantes(ordenId){
  const panel=document.getElementById('r-faltante-panel');
  const body=document.getElementById('r-faltante-body');
  const totalEl=document.getElementById('r-pend-total-global');
  if(!ordenId){panel.style.display='none';return;}
  const ord=compras.find(c=>c.folio===ordenId);
  if(!ord){panel.style.display='none';return;}
  panel.style.display='block';

  // Calcular recibido por socio y tipo usando las asignaciones de recepciones anteriores
  const recibidoPorSocioTipo={};
  recepciones.filter(r=>r.orden===ordenId).forEach(r=>{
    if(r.asignacion){
      Object.entries(r.asignacion).forEach(([socio,tipos])=>{
        if(!recibidoPorSocioTipo[socio])recibidoPorSocioTipo[socio]={};
        Object.entries(tipos).forEach(([tipo,v])=>{
          recibidoPorSocioTipo[socio][tipo]=(recibidoPorSocioTipo[socio][tipo]||0)+asigCant(v);
        });
      });
    }
  });

  let faltanteGlobal=0;
  let html='';

  ord.partes.forEach(p=>{
    let compS=0,recS=0,faltS=0;
    const recSocio=recibidoPorSocioTipo[p.socio]||{};
    p.tipos.forEach(t=>{
      const rec=recSocio[t.tipo]||0;
      const falt=Math.max(0,t.cant-rec);
      compS+=t.cant;recS+=rec;faltS+=falt;faltanteGlobal+=falt;
    });
    const pctS=compS>0?Math.round(recS/compS*100):0;
    const faltColor=faltS===0?'var(--green)':recS===0?'var(--red)':'var(--amber)';

    html+=`<div class="falt-socio-blk">
      <div class="falt-socio-hd">
        <div class="falt-socio-hd-left">
          <div class="avatar ${AV_CLASS[p.socio]}">${INITIALS[p.socio]}</div>
          <span style="font-size:12px;font-weight:600;color:${COLORS[p.socio]}">${p.socio}</span>
        </div>
        <div style="display:flex;align-items:center;gap:12px">
          <div style="text-align:right">
            <div style="font-size:9px;color:var(--text3);text-transform:uppercase;letter-spacing:.04em">Faltante</div>
            <div style="font-size:12px;font-weight:700;color:${faltColor}">${faltS===0?'✓ Completo':faltS.toLocaleString()}</div>
          </div>
          <div style="text-align:right">
            <div style="font-size:9px;color:var(--text3);text-transform:uppercase;letter-spacing:.04em">Avance</div>
            <div style="font-size:12px;font-weight:700;color:${COLORS[p.socio]}">${pctS}%</div>
          </div>
        </div>
      </div>
      <div class="falt-tipo-rows">
        <div class="falt-hd-row">
          <span>Tipo</span>
          <span class="tv">Comprado</span>
          <span class="tv">Recibido</span>
          <span class="tv">Faltante</span>
          <span class="tr">Avance</span>
        </div>`;

    p.tipos.forEach(t=>{
      const rec=recSocio[t.tipo]||0;
      const falt=Math.max(0,t.cant-rec);
      const pct=t.cant>0?Math.round(rec/t.cant*100):0;
      const fc=falt===0?'var(--green)':rec===0?'var(--red)':'var(--amber)';
      const barCol=falt===0?'var(--green)':COLORS[p.socio];
      html+=`<div class="falt-tipo-row">
        <span><span class="tipo-badge ${TIPO_CLASS[t.tipo]}">${t.tipo}</span></span>
        <span class="tv">${t.cant.toLocaleString()}</span>
        <span class="tg">${rec.toLocaleString()}</span>
        <span class="ta" style="color:${fc}">${falt===0?'✓ 0':falt.toLocaleString()}</span>
        <div style="display:flex;align-items:center;gap:5px;justify-content:flex-end">
          <div class="falt-pct-bar"><div style="height:100%;border-radius:2px;background:${barCol};width:${pct}%"></div></div>
          <span style="font-size:10px;color:var(--text3);min-width:28px;text-align:right">${pct}%</span>
        </div>
      </div>`;
    });

    html+=`</div>
      <div class="falt-total-row">
        <span style="color:var(--text3)">Total ${p.socio}</span>
        <span class="tv">${compS.toLocaleString()}</span>
        <span class="tg">${recS.toLocaleString()}</span>
        <span class="ta" style="color:${faltColor}">${faltS===0?'✓ 0':faltS.toLocaleString()}</span>
        <div style="display:flex;align-items:center;gap:5px;justify-content:flex-end">
          <div class="falt-pct-bar"><div style="height:100%;border-radius:2px;background:${COLORS[p.socio]};width:${pctS}%"></div></div>
          <span style="font-size:10px;color:var(--text3);min-width:28px;text-align:right">${pctS}%</span>
        </div>
      </div>
    </div>`;
  });

  body.innerHTML=html;
  totalEl.textContent=faltanteGlobal.toLocaleString()+' hologramas';
  totalEl.style.color=faltanteGlobal===0?'var(--green)':'var(--amber)';
}

function poblarOrdenes(){
  const sel=document.getElementById('r-orden');
  sel.innerHTML='<option value="">Seleccionar...</option>'+
    compras.map(c=>{const p=pendientePorOrden(c.folio);return p>0?`<option value="${c.folio}">${c.folio} — ${c.prov} (pend: ${p})</option>`:''}).join('');
}

function selOrden(){
  const val=document.getElementById('r-orden').value,ord=compras.find(c=>c.folio===val);
  document.getElementById('r-prov').value=ord?ord.prov:'';
  renderFaltantes(val);
  document.getElementById('asig-section').style.display='none';
  manualesDecision={};
  updBadge();
}

function addEntry(tipo){
  const id=rNextId++;rEntries.push({id,tipo,ini:'',fin:'',folio:''});
  const cont=document.getElementById('r-entries');
  const emp=cont.querySelector('.empty-msg');if(emp)emp.remove();
  const n=rEntries.length;
  const block=document.createElement('div');block.id='eb-'+id;block.className='entry-block';
  if(tipo==='rango'){
    block.innerHTML=`<div class="entry-block-hd"><div class="entry-block-hd-left"><span class="entry-num">#${n}</span><span style="font-size:11px;font-weight:600;color:var(--blue)">Rango</span><span id="ehd-${id}" style="display:none"></span></div><div style="display:flex;align-items:center;gap:7px"><span id="ecnt-${id}" style="font-size:11px;font-weight:600;color:var(--green);display:none"></span><button class="del-btn" onclick="delEntry(${id})">×</button></div></div>
    <div class="entry-block-body"><div class="fgrid" style="gap:0 12px">
      <div><div class="campo-lbl">Folio inicial</div><input class="efi" id="ei-${id}" placeholder="10047000" maxlength="8" autocomplete="off"><div class="field-feedback" id="fbi-${id}"><span class="fb-hint">8 dígitos</span></div></div>
      <div><div class="campo-lbl">Folio final</div><input class="efi" id="ef-${id}" placeholder="10047099" maxlength="8" autocomplete="off"><div class="field-feedback" id="fbf-${id}"><span class="fb-hint">8 dígitos</span></div></div>
    </div><div id="einfo-${id}" class="tipo-det"></div><div id="edup-${id}" style="margin-top:5px;display:none"></div></div>`;
    cont.appendChild(block);
    block.querySelector('#ei-'+id).addEventListener('input',function(){this.value=this.value.replace(/\D/g,'').slice(0,8);rEntries.find(x=>x.id===id).ini=this.value;updRangoUI(id);updBadge();});
    block.querySelector('#ef-'+id).addEventListener('input',function(){this.value=this.value.replace(/\D/g,'').slice(0,8);rEntries.find(x=>x.id===id).fin=this.value;updRangoUI(id);updBadge();});
  } else {
    block.innerHTML=`<div class="entry-block-hd"><div class="entry-block-hd-left"><span class="entry-num">#${n}</span><span style="font-size:11px;font-weight:600;color:var(--purple)">Folio suelto</span><span id="ehd-${id}" style="display:none"></span></div><button class="del-btn" onclick="delEntry(${id})">×</button></div>
    <div class="entry-block-body"><div class="campo-lbl">Número de folio</div><input class="efi" id="es-${id}" placeholder="30047477" maxlength="8" autocomplete="off" style="max-width:200px"><div class="field-feedback" id="fbs-${id}"><span class="fb-hint">8 dígitos</span></div></div>`;
    cont.appendChild(block);
    block.querySelector('#es-'+id).addEventListener('input',function(){this.value=this.value.replace(/\D/g,'').slice(0,8);rEntries.find(x=>x.id===id).folio=this.value;updSueltoUI(id);updBadge();});
  }
}

function updSueltoUI(id){
  const e=rEntries.find(x=>x.id===id);if(!e)return;
  const inp=document.getElementById('es-'+id),fb=document.getElementById('fbs-'+id),hd=document.getElementById('ehd-'+id);
  const v=e.folio||'';
  if(!v||v.length<8){inp.className='efi';fb.innerHTML=v?`<span class="fb-hint">${v.length}/8 dígitos</span>`:'<span class="fb-hint">8 dígitos</span>';hd.style.display='none';return;}
  const p=parseFolioHolo(v);
  if(!p){inp.className='efi invalid';fb.innerHTML='<span class="fb-err">✗ Primer dígito inválido (1, 2 o 3)</span>';hd.style.display='none';return;}
  if(FOLIOS_REG.has(p.raw)){inp.className='efi invalid';fb.innerHTML='<span class="fb-err">✗ Folio ya registrado</span>';hd.style.display='none';return;}
  const dupEn=rEntries.find(oe=>oe.id!==id&&generarFoliosDeEntry(oe).includes(p.raw));
  if(dupEn){inp.className='efi invalid';fb.innerHTML='<span class="fb-err">✗ Duplicado en otra entrada</span>';hd.style.display='none';return;}
  inp.className='efi valid';
  fb.innerHTML=`<span class="fb-ok">✓</span> <span class="tipo-badge ${TIPO_CLASS[p.tipo]}">${p.tipo}</span> <span class="fb-hint">· #${p.numero}</span>`;
  hd.innerHTML=`<span class="tipo-badge ${TIPO_CLASS[p.tipo]}">${TIPO_SHORT[p.tipo]}</span>`;hd.style.display='inline-block';
}

function updRangoUI(id){
  const e=rEntries.find(x=>x.id===id);if(!e)return;
  const iniEl=document.getElementById('ei-'+id),finEl=document.getElementById('ef-'+id);
  const fbi=document.getElementById('fbi-'+id),fbf=document.getElementById('fbf-'+id);
  const einfo=document.getElementById('einfo-'+id),edup=document.getElementById('edup-'+id);
  const hd=document.getElementById('ehd-'+id),cnt=document.getElementById('ecnt-'+id);
  const ini=parseFolioHolo(e.ini),fin=parseFolioHolo(e.fin);
  const fbu=(el,fb,p,v)=>{if(!v){el.className='efi';fb.innerHTML='<span class="fb-hint">8 dígitos</span>';}else if(v.length<8){el.className='efi';fb.innerHTML=`<span class="fb-hint">${v.length}/8</span>`;}else if(!p){el.className='efi invalid';fb.innerHTML='<span class="fb-err">✗ Primer dígito inválido</span>';}else{el.className='efi valid';fb.innerHTML=`<span class="fb-ok">✓</span> <span class="tipo-badge ${TIPO_CLASS[p.tipo]}">${TIPO_SHORT[p.tipo]}</span> <span class="fb-hint">· #${p.numero}</span>`;}};
  fbu(iniEl,fbi,ini,e.ini);fbu(finEl,fbf,fin,e.fin);
  einfo.style.display='none';edup.style.display='none';hd.style.display='none';cnt.style.display='none';
  if(!ini||!fin||e.ini.length<8||e.fin.length<8)return;
  if(ini.tipoDigit!==fin.tipoDigit){einfo.style.display='block';einfo.style.background='var(--red-bg)';einfo.style.borderColor='#F09595';einfo.innerHTML=`<span style="color:var(--red);font-weight:500">✗ Tipos distintos: inicio ${ini.tipo} / fin ${fin.tipo}</span>`;finEl.className='efi invalid';return;}
  if(fin.numInt<ini.numInt){einfo.style.display='block';einfo.style.background='var(--red-bg)';einfo.style.borderColor='#F09595';einfo.innerHTML='<span style="color:var(--red);font-weight:500">✗ Folio final debe ser mayor al inicial</span>';finEl.className='efi invalid';return;}
  const cant=fin.numInt-ini.numInt+1;
  const dups=[];const lim=Math.min(cant,5000);
  for(let n=ini.numInt;n<ini.numInt+lim;n++){
    const f=ini.tipoDigit+String(n).padStart(7,'0');
    if(FOLIOS_REG.has(f))dups.push(f);
    else{const dup=rEntries.find(oe=>oe.id!==id&&generarFoliosDeEntry(oe).includes(f));if(dup)dups.push(f);}
  }
  const validos=cant-dups.length;
  einfo.style.display='block';einfo.style.background=dups.length?'var(--amber-bg)':'var(--green-bg)';einfo.style.borderColor=dups.length?'#E8C97A':'#A8D8C0';
  einfo.innerHTML=`<div style="display:flex;justify-content:space-between;align-items:center"><span><span class="tipo-badge ${TIPO_CLASS[ini.tipo]}">${ini.tipo}</span> · <strong>${cant.toLocaleString()}</strong> en rango${dups.length?` · <span style="color:var(--green);font-weight:600">${validos.toLocaleString()} válidos</span> · <span style="color:var(--red)">${dups.length} dup.</span>`:''}</span><span style="font-family:var(--mono);font-size:11px;color:var(--text3)">${ini.raw}–${fin.raw}</span></div>`;
  if(dups.length){edup.style.display='block';edup.innerHTML=`<div style="font-size:10px;color:var(--amber);font-weight:500;margin-bottom:3px">⚠ ${dups.length} duplicado(s) excluidos</div><div class="folio-chips">${dups.slice(0,8).map(f=>`<span class="fchip">${f}</span>`).join('')}${dups.length>8?`<span style="font-size:10px;color:var(--red)"> +${dups.length-8} más</span>`:''}</div>`;}
  hd.innerHTML=`<span class="tipo-badge ${TIPO_CLASS[ini.tipo]}">${TIPO_SHORT[ini.tipo]}</span>`;hd.style.display='inline-block';
  cnt.textContent=validos.toLocaleString()+' válidos';cnt.style.display='inline-block';cnt.style.color=dups.length?'var(--amber)':'var(--green)';
}

function delEntry(id){
  rEntries=rEntries.filter(e=>e.id!==id);
  const el=document.getElementById('eb-'+id);if(el)el.remove();
  if(rEntries.length===0)document.getElementById('r-entries').innerHTML='<div class="empty-msg">Agrega entradas con los botones de abajo.</div>';
  rEntries.forEach(e=>{if(e.tipo==='suelto')updSueltoUI(e.id);else updRangoUI(e.id);});
  updBadge();
}

function updBadge(){
  const fpt=getFoliosValidosPorTipo();
  const total=Object.values(fpt).reduce((s,a)=>s+a.length,0);
  const badge=document.getElementById('r-badge');
  badge.style.display=rEntries.length>0?'inline-block':'none';
  badge.textContent=total.toLocaleString()+' folios válidos';
  badge.style.background=total>0?'var(--green-bg)':'var(--amber-bg)';
  badge.style.color=total>0?'var(--green)':'var(--amber)';

  const orden=document.getElementById('r-orden').value;
  const pend=orden?pendientePorOrden(orden):Infinity;
  const exErr=document.getElementById('r-excede-err');
  if(total>pend&&pend!==Infinity){exErr.style.display='block';exErr.textContent=`⚠ Total válido (${total.toLocaleString()}) supera el pendiente (${pend.toLocaleString()}) de esta orden.`;}
  else exErr.style.display='none';

  if(total>0&&orden&&total<=pend)calcularAsignacion(fpt,orden);
  else if(total===0||total>pend)document.getElementById('asig-section').style.display='none';
}

function calcularAsignacion(fpt,ordenId){
  const ord=compras.find(c=>c.folio===ordenId);if(!ord)return;
  const pctPT=getPctPorTipo(ordenId);
  document.getElementById('asig-section').style.display='block';
  document.getElementById('step1-num').className='step-num done';
  let html='';const manualesNecesarios=[];

  Object.entries(fpt).forEach(([tipo,folios])=>{
    const compradores=pctPT[tipo]||[];
    const noCompraron=ord.partes.filter(p=>!compradores.find(x=>x.socio===p.socio)).map(p=>p.socio);
    const esDisc=compradores.length===0;
    const total=folios.length;
    let cursor=0;
    const bloques=compradores.map(x=>{const cant=Math.floor(total*x.pct);const fs=folios.slice(cursor,cursor+cant);cursor+=cant;return{socio:x.socio,pct:x.pct,cant,folios:fs};});
    const sobrantes=folios.slice(cursor);
    sobrantes.forEach(f=>manualesNecesarios.push({tipoKey:esDisc?'DISC_'+tipo:tipo,tipo,folio:f,compradores:esDisc?ord.partes.map(p=>p.socio):compradores.map(x=>x.socio)}));

    html+=`<div class="tipo-group"><div class="tipo-group-hd"><div style="display:flex;align-items:center;gap:8px"><span class="tipo-badge ${TIPO_CLASS[tipo]}">${tipo}</span><span style="font-size:12px;font-weight:600">${total.toLocaleString()} folios</span></div>${esDisc?'<span style="font-size:10px;padding:2px 8px;border-radius:4px;background:var(--amber-bg);color:var(--amber);font-weight:500">Ningún socio compró este tipo</span>':''}</div>
    <div class="tipo-group-body">`;
    if(esDisc){html+=`<div style="font-size:11px;color:var(--amber);padding:10px 0;font-style:italic">Tipo no comprado — requiere asignación manual.</div>`;}
    else{
      bloques.forEach(b=>{
        const pctEx=(b.pct*100).toFixed(2);const ini=b.folios[0],fin=b.folios[b.folios.length-1];
        html+=`<div class="socio-asig-row"><div class="socio-left"><div class="avatar ${AV_CLASS[b.socio]}">${INITIALS[b.socio]}</div><div><div style="font-size:12px;font-weight:600;color:${COLORS[b.socio]}">${b.socio}</div><div style="display:flex;align-items:center;gap:6px;margin-top:2px"><span style="font-size:13px;font-weight:700;color:${COLORS[b.socio]}">${pctEx}%</span><span style="font-size:10px;color:var(--text3)">de ${TIPO_SHORT[tipo]}</span></div><div class="pct-bar-bg"><div style="height:100%;border-radius:2px;background:${COLORS_HEX[b.socio]};width:${Math.round(b.pct*100)}%"></div></div></div></div>
        <div style="text-align:right">${b.cant===0?'<span style="font-size:11px;color:var(--text3);font-style:italic">0 folios</span>':`<div style="font-weight:700;font-size:15px;color:${COLORS[b.socio]}">${b.cant.toLocaleString()} folios</div><div class="folio-range" style="margin-top:4px">${ini} → ${fin}</div>`}</div></div>`;
      });
      if(noCompraron.length>0)html+=`<div class="no-aplica-row"><span style="font-size:10px;color:var(--text3)">No aplica:</span>${noCompraron.map(s=>`<div style="display:flex;align-items:center;gap:3px"><div class="avatar ${AV_CLASS[s]}" style="width:18px;height:18px;font-size:8px;opacity:.4">${INITIALS[s]}</div><span style="font-size:10px;color:var(--text3)">${s}</span></div>`).join('')}</div>`;
    }
    html+='</div></div>';
  });
  document.getElementById('asig-body').innerHTML=html;
  renderManuales(manualesNecesarios);
  validarGuardarR(manualesNecesarios);
}

function renderManuales(mn){
  const cont=document.getElementById('manuales-container');
  if(mn.length===0){cont.innerHTML='';return;}
  const grupos={};mn.forEach(m=>{if(!grupos[m.tipoKey])grupos[m.tipoKey]={tipo:m.tipo,folios:[],compradores:m.compradores,disc:m.tipoKey.startsWith('DISC_')};grupos[m.tipoKey].folios.push(m.folio);});
  cont.innerHTML=Object.entries(grupos).map(([tk,g])=>`
    <div class="sobrante-blk" ${g.disc?'style="border-color:#C04828;background:var(--red-bg)"':''}>
      <div style="font-size:11px;font-weight:600;color:${g.disc?'var(--red)':'var(--amber)'};margin-bottom:8px">${g.disc?'⚠ Discrepancia — ':'⚠ Sobrante — '}<span class="tipo-badge ${TIPO_CLASS[g.tipo]}">${g.tipo}</span></div>
      <div style="margin-bottom:10px">${g.folios.map(f=>`<span class="sobrante-folio">${f}</span>`).join('')}</div>
      <div style="font-size:10px;font-weight:600;color:var(--text3);text-transform:uppercase;letter-spacing:.05em;margin-bottom:7px">Asignar a:</div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">${g.compradores.map(s=>`<button class="socio-pick-btn" id="mpick-${tk}-${s.replace(/\s/g,'')}" onclick="selManual('${tk}','${s}')">${s}</button>`).join('')}</div>
    </div>`).join('');
}

function selManual(tk,socio){
  manualesDecision[tk]=socio;
  document.querySelectorAll(`[id^="mpick-${tk}-"]`).forEach(btn=>{const ks=btn.id.replace(`mpick-${tk}-`,'');btn.className='socio-pick-btn'+(ks===socio.replace(/\s/g,'')?` ${SEL_CLASS[socio]}`:'');});
  const orden=document.getElementById('r-orden').value;
  const fpt=getFoliosValidosPorTipo();
  const pctPT=getPctPorTipo(orden);
  const ord=compras.find(c=>c.folio===orden);if(!ord)return;
  const mn=[];
  Object.entries(fpt).forEach(([tipo,folios])=>{
    const compradores=pctPT[tipo]||[];const esDisc=compradores.length===0;
    let cursor=0;compradores.forEach(x=>{cursor+=Math.floor(folios.length*x.pct);});
    folios.slice(cursor).forEach(f=>mn.push({tipoKey:esDisc?'DISC_'+tipo:tipo,tipo,folio:f,compradores:esDisc?ord.partes.map(p=>p.socio):compradores.map(x=>x.socio)}));
  });
  validarGuardarR(mn);
}

function validarGuardarR(mn){
  const grupos=new Set((mn||[]).map(m=>m.tipoKey));
  const falta=[...grupos].some(tk=>!manualesDecision[tk]);
  const err=document.getElementById('asig-err'),btn=document.getElementById('r-guardar-btn');
  if(falta){err.style.display='block';err.textContent='Hay folios sobrantes o discrepantes sin asignar.';btn.disabled=true;}
  else{err.style.display='none';btn.disabled=false;}
}

function guardarRecepcion(){
  if(!validarFechaR())return;
  const orden=document.getElementById('r-orden').value,fecha=document.getElementById('r-fecha').value,quien=document.getElementById('r-quien').value;
  if(!orden||!fecha||!quien.trim()){alert('Completa todos los datos.');return;}
  const todayMX=getTodayMX(),nowTimeMX=getNowTimeMX();
  if(fecha>todayMX){alert('La fecha no puede ser futura.');return;}
  const hora=document.getElementById('r-hora').value;
  if(fecha===todayMX&&hora&&hora>nowTimeMX){alert('La hora no puede ser futura.');return;}
  const fpt=getFoliosValidosPorTipo();
  const total=Object.values(fpt).reduce((s,a)=>s+a.length,0);
  if(total===0){alert('No hay folios válidos para registrar.');return;}
  const ord=compras.find(c=>c.folio===orden);
  const pctPT=getPctPorTipo(orden);
  const asignacion={};const porTipo={};
  ord.partes.forEach(p=>{asignacion[p.socio]={};});
  Object.entries(fpt).forEach(([tipo,folios])=>{
    porTipo[tipo]=(porTipo[tipo]||0)+folios.length;
    const compradores=pctPT[tipo]||[];const esDisc=compradores.length===0;
    let cursor=0;
    compradores.forEach(x=>{
      const cant=Math.floor(folios.length*x.pct);
      const fs=folios.slice(cursor,cursor+cant);
      cursor+=cant;
      if(!asignacion[x.socio])asignacion[x.socio]={};
      if(!asignacion[x.socio][tipo])asignacion[x.socio][tipo]=[];
      if(fs.length>0) asignacion[x.socio][tipo].push({ini:fs[0],fin:fs[fs.length-1],cant:fs.length});
    });
    const sob=folios.slice(cursor);const tk=esDisc?'DISC_'+tipo:tipo;
    if(sob.length>0&&manualesDecision[tk]){
      const s=manualesDecision[tk];
      if(!asignacion[s])asignacion[s]={};
      if(!asignacion[s][tipo])asignacion[s][tipo]=[];
      asignacion[s][tipo].push({ini:sob[0],fin:sob[sob.length-1],cant:sob.length});
    }
  });
  // Limpiar socios sin folios
  Object.keys(asignacion).forEach(s=>{if(Object.keys(asignacion[s]).length===0)delete asignacion[s];});
  const n=recepciones.length+1;
  Object.values(fpt).forEach(arr=>arr.forEach(f=>FOLIOS_REG.add(f)));
  recepciones.unshift({folio:'REC-'+String(n).padStart(4,'0'),orden,prov:ord.prov,fecha,hora:document.getElementById('r-hora').value,asignacion,porTipo,total,quien,notas:document.getElementById('r-notas').value});
  closeModal('modal-recepcion');renderAll();
}

/* ── NAV ── */
const titles={
  dashboard:'Dashboard',compras:'Órdenes de compra',recepciones:'Recepciones',
  inventario:'Inventario de hologramas',socios:'Socios',proveedores:'Proveedores',
  'uva-compras':'Compras UVA'
};
const breadcrumbs={
  dashboard:'Panel',compras:'Compras',recepciones:'Compras',
  inventario:'Inventario',socios:'Catálogos',proveedores:'Catálogos',
  'uva-compras':'Etiquetas UVA'
};

function go(id){
  // Activar sección
  document.querySelectorAll('.section').forEach(s=>s.classList.remove('active'));
  const sec=document.getElementById('sec-'+id);
  if(sec)sec.classList.add('active');

  // Activar nav por data-section en lugar de índice numérico
  document.querySelectorAll('.nav').forEach(n=>{
    n.classList.toggle('active', n.dataset.section===id);
  });

  document.getElementById('page-title').textContent=titles[id]||id;
  document.getElementById('breadcrumb').textContent=breadcrumbs[id]||'';

  if(id==='proveedores')renderProveedores();
  if(id==='socios')renderSocios();
  if(id==='uva-compras')renderUvaCompras();
  if(id==='dashboard') switchDashTab('resumen');
  if(id==='verificadores'){
    // Pre-filtrar por el socio del usuario logueado
    const filtSocioEl=document.getElementById('filtV-socio');
    if(filtSocioEl&&SESSION.socio){
      filtSocioEl.value=SESSION.socio;
    }
    renderVerificadores();
  }
  if(id==='equipo-patron') renderEquipoPatron();
  if(window.innerWidth<=700)closeSidebar();
}

function openModal(id){
  if(id==='modal-recepcion'){
    poblarOrdenes();
    document.getElementById('r-fecha').value=getTodayMX();document.getElementById('r-fecha').max=getTodayMX();
    document.getElementById('r-hora').value=getNowTimeMX();document.getElementById('r-hora').max=getNowTimeMX();
    document.getElementById('fd-rec').textContent=new Date().toLocaleDateString('es-MX',{timeZone:'America/Mexico_City',day:'2-digit',month:'short',year:'numeric'});
    document.getElementById('fn-rec').textContent='REC-'+String(recepciones.length+1).padStart(4,'0');
    document.getElementById('r-guardar-btn').disabled=true;
    document.getElementById('r-faltante-panel').style.display='none';
    document.getElementById('r-excede-err').style.display='none';
    document.getElementById('asig-section').style.display='none';
    document.getElementById('step1-num').className='step-num';
    document.getElementById('r-entries').innerHTML='<div class="empty-msg">Agrega entradas con los botones de abajo.</div>';
    rEntries=[];rNextId=1;manualesDecision={};
    ['r-orden','r-prov','r-quien','r-notas'].forEach(i=>{const el=document.getElementById(i);if(el)el.value='';});
    document.getElementById('r-badge').style.display='none';
  }
  if(id==='modal-verificador'){
    document.getElementById('mv-title').textContent='Nuevo verificador';
    document.getElementById('mv-id').value='';
    ['mv-nombre','mv-tel','mv-email','mv-zona'].forEach(i=>{const el=document.getElementById(i);if(el)el.value='';});
    document.getElementById('mv-tipo-usuario').value='verificador';
    document.getElementById('mv-socio').value=SESSION.rol==='socio'?SESSION.socio:'';
    document.getElementById('mv-socio').disabled=SESSION.rol==='socio';
  }
  if(id==='modal-usuario'){
    document.getElementById('modal-usuario-title').textContent='Nuevo usuario';
    document.getElementById('u-edit-idx').value='';
    ['u-nombre','u-user','u-pass','u-pass2'].forEach(i=>{const el=document.getElementById(i);if(el)el.value='';});
    document.getElementById('u-rol').value='';
    document.getElementById('u-socio').value='';
    document.getElementById('u-socio-row').style.display='none';
  }
  if(id==='modal-dictamen'){
    document.getElementById('fn-dict').textContent=nextFolioDict();
    document.getElementById('fd-dict').textContent=new Date().toLocaleDateString('es-MX',{timeZone:'America/Mexico_City',day:'2-digit',month:'short',year:'numeric'});
    document.getElementById('d-fecha').value=getTodayMX();document.getElementById('d-fecha').max=getTodayMX();
    document.getElementById('d-fecha-err').style.display='none';
    document.getElementById('d-fecha').classList.remove('date-invalid');
    document.getElementById('dict-precio-val').textContent='$'+proveedorUVA.precio.toFixed(2);
    document.getElementById('dict-precio-sub').textContent='Actualizado '+proveedorUVA.fechaPrecio;
    document.getElementById('d-resumen').style.display='none';
    document.getElementById('d-dup-err').style.display='none';
    ['d-factura','d-socio','d-notas','d-ini','d-fin'].forEach(i=>{const el=document.getElementById(i);if(el)el.value='';});
  }
  if(id==='modal-transferencia'){
    document.getElementById('fn-trans').textContent=nextFolioTrans();
    document.getElementById('fd-trans').textContent=new Date().toLocaleDateString('es-MX',{timeZone:'America/Mexico_City',day:'2-digit',month:'short',year:'numeric'});
    document.getElementById('tr-fecha').value=getTodayMX();document.getElementById('tr-fecha').max=getTodayMX();
    document.getElementById('tr-fecha-err').style.display='none';
    document.getElementById('tr-fecha').classList.remove('date-invalid');
    document.getElementById('tr-tipo').value='';
    poblarSelectsTransferencia();
    const trDe=document.getElementById('tr-de');
    const trA=document.getElementById('tr-a');
    // Si hay un origen pre-configurado (ej. desde verificador), usarlo; si no, aplicar lógica de rol
    if(window._transOrigen){
      trDe.value=window._transOrigen; trDe.disabled=true;
      trDe.style.background='var(--surface2)'; trDe.style.color='var(--text3)';
      window._transOrigen=null;
    } else if(SESSION.rol==='socio'){
      trDe.value=SESSION.socio; trDe.disabled=true;
      trDe.style.background='var(--surface2)'; trDe.style.color='var(--text3)';
      poblarSelectsTransferencia(); trDe.value=SESSION.socio;
    } else {
      trDe.value=''; trDe.disabled=false;
      trDe.style.background=''; trDe.style.color='';
    }
    trA.value='';
    if(window._transDestino){
      trA.value=window._transDestino; trA.disabled=true;
      trA.style.background='var(--surface2)'; trA.style.color='var(--text3)';
      window._transDestino=null;
    } else {
      trA.disabled=false; trA.style.background=''; trA.style.color='';
    }
    document.getElementById('tr-subtipo-uva').value='';
    document.getElementById('tr-folio-ini').value='';document.getElementById('tr-folio-fin').value='';
    document.getElementById('tr-notas').value='';
    document.getElementById('tr-subtipo-uva-row').style.display='none';
    document.getElementById('tr-folios-row').style.display='none';
    document.getElementById('tr-resumen').style.display='none';
    document.getElementById('tr-err').style.display='none';
    document.getElementById('tr-mismo-socio-err').style.display='none';
    const dai=document.getElementById('tr-doble-auth-info');if(dai)dai.style.display='none';
    const tgb=document.getElementById('tr-guardar-btn');if(tgb)tgb.textContent='Registrar transferencia';
    document.getElementById('tr-inv-panel').style.display='none';
    document.getElementById('tr-folio-ini-fb').innerHTML='<span class="fb-hint">—</span>';
    document.getElementById('tr-folio-fin-fb').innerHTML='<span class="fb-hint">—</span>';
    updTransSocios();
    updTransInventario();
  }
  if(id==='modal-uva-compra'){
    document.getElementById('fn-uva-compra').textContent=nextUvaFolioCompra();
    document.getElementById('fd-uva-compra').textContent=new Date().toLocaleDateString('es-MX',{timeZone:'America/Mexico_City',day:'2-digit',month:'short',year:'numeric'});
    document.getElementById('uc-fecha').value=getTodayMX();document.getElementById('uc-fecha').max=getTodayMX();
    document.getElementById('uc-fecha-err').style.display='none';
    document.getElementById('uc-fecha').classList.remove('date-invalid');
    document.getElementById('uc-precio-val').textContent='$'+proveedorUVA.precio.toFixed(2);
    document.getElementById('uc-precio-sub').textContent='Actualizado '+proveedorUVA.fechaPrecio;
    document.getElementById('uc-resumen').style.display='none';
    ['uc-factura','uc-socio','uc-notas'].forEach(i=>{const el=document.getElementById(i);if(el)el.value='';});
    ['uc-f1-ini','uc-f1-fin','uc-f2-ini','uc-f2-fin','uc-f3-ini','uc-f3-fin','uc-f4-ini','uc-f4-fin','uc-f5-ini','uc-f5-fin'].forEach(i=>{const el=document.getElementById(i);if(el)el.value='';});
  }
  if(id==='modal-compra'){
    document.getElementById('c-fecha').value=getTodayMX();document.getElementById('c-fecha').max=getTodayMX();
    document.getElementById('fd-compra').textContent=new Date().toLocaleDateString('es-MX',{timeZone:'America/Mexico_City',day:'2-digit',month:'short',year:'numeric'});
    document.getElementById('fn-compra').textContent='— elige proveedor —';
    document.getElementById('c-socios-cont').innerHTML='<div class="empty-msg">Agrega al menos un socio.</div>';
    document.getElementById('c-precio-box').style.display='none';document.getElementById('c-warn-prov').style.display='none';
    document.getElementById('c-resumen').style.display='none';
    cSocios=[];cNextSocio=1;cNextTipo=1;
    ['c-prov','c-factura','c-notas'].forEach(i=>{const el=document.getElementById(i);if(el)el.value='';});
  }
  document.getElementById(id).style.display='flex';
}
function closeModal(id){document.getElementById(id).style.display='none';}
document.querySelectorAll('.modal-bg').forEach(m=>m.addEventListener('click',function(e){if(e.target===this)this.style.display='none';}));



/* ══════════════════════════════════════════════
   MÓDULO ETIQUETAS UVA
══════════════════════════════════════════════ */
const UVA_TIPOS=['1er semestre','2do semestre','Anual','Inspección pagada','Global'];
const UVA_SHORT={'1er semestre':'1er Sem','2do semestre':'2do Sem','Anual':'Anual','Inspección pagada':'Insp.Pag.','Global':'Global'};
const UVA_TIPO_CLASS={'1er semestre':'t-s1','2do semestre':'t-s2','Anual':'t-an','Inspección pagada':'chip p1','Global':'chip p3'};
const UVA_TIPO_IDS=['t1','t2','t3','t4','t5'];

// Folios UVA registrados por tipo: {tipo: Set de números usados}
let verificadores=[
  // {id, socio, nombre, tel, email, zona, activo, tipoUsuario, asignaciones:[]}
  {id:'VER-001',socio:'Socio A',nombre:'Carlos Ramírez',tel:'55 1234-5678',email:'carlos@ejemplo.com',zona:'Zona Norte',activo:true,tipoUsuario:'verificador',asignaciones:[]},
  {id:'VER-002',socio:'Socio B',nombre:'Laura Mendoza',tel:'55 8765-4321',email:'laura@ejemplo.com',zona:'Zona Sur',activo:true,tipoUsuario:'verificador',asignaciones:[]},
  {id:'VER-003',socio:'Socio A',nombre:'Héctor Sosa',tel:'55 5555-1234',email:'hector@ejemplo.com',zona:'Zona Centro',activo:true,tipoUsuario:'verificador',asignaciones:[]},
];
let dictamenes=[];
const DICT_FOLIOS_REG=new Set(); // folios de dictámenes ya registrados

const UVA_FOLIOS_REG={
  '1er semestre':new Set(),
  '2do semestre':new Set(),
  'Anual':new Set(),
  'Inspección pagada':new Set(),
  'Global':new Set(),
};

let uvaCompras=[
  {folio:'UVAC-0001',factura:'FAC-UVA-001',fecha:'2024-11-10',socio:'Socio A',precio:3.50,
   tipos:{'1er semestre':200,'2do semestre':0,'Anual':100,'Inspección pagada':50,'Global':0},
   folios:{'1er semestre':{ini:'00001',fin:'00200'},'2do semestre':{ini:'',fin:''},'Anual':{ini:'00001',fin:'00100'},'Inspección pagada':{ini:'00001',fin:'00050'},'Global':{ini:'',fin:''}},notas:'',entregaInmediata:true},
  {folio:'UVAC-0002',factura:'FAC-UVA-002',fecha:'2025-01-15',socio:'Socio B',precio:3.50,
   tipos:{'1er semestre':0,'2do semestre':150,'Anual':0,'Inspección pagada':0,'Global':0},
   folios:{'1er semestre':{ini:'',fin:''},'2do semestre':{ini:'00001',fin:'00150'},'Anual':{ini:'',fin:''},'Inspección pagada':{ini:'',fin:''},'Global':{ini:'',fin:''}},notas:'',entregaInmediata:true},
];
let uvaRecepciones=[
  {folio:'UVAR-0001',orden:'UVAC-0001',socio:'Socio A',fecha:'2024-11-20',hora:'10:00',
   tipos:{'1er semestre':{ini:'00001',fin:'00150',cant:150},'Anual':{ini:'00001',fin:'00050',cant:50},'Inspección pagada':{ini:'',fin:'',cant:0},'2do semestre':{ini:'',fin:'',cant:0},'Global':{ini:'',fin:'',cant:0}},
   total:200,quien:'Carlos M.',notas:''},
];

const filtUC={text:'',est:''};
const stUC={col:'fecha',dir:'desc'};
const stUR={col:'fecha',dir:'desc'};

function sortUC(col){if(stUC.col===col)stUC.dir=stUC.dir==='asc'?'desc':'asc';else{stUC.col=col;stUC.dir='asc';}renderUvaCompras();}
function sortUR(col){if(stUR.col===col)stUR.dir=stUR.dir==='asc'?'desc':'asc';else{stUR.col=col;stUR.dir='asc';}}

function uvaTotalOrden(folio){const c=uvaCompras.find(x=>x.folio===folio);return c?Object.values(c.tipos).reduce((s,v)=>s+v,0):0;}
function uvaRecibidoOrden(folio){return uvaRecepciones.filter(r=>r.orden===folio).reduce((s,r)=>s+r.total,0);}
function uvaRecibidoPorTipoOrden(folio){
  const res={};UVA_TIPOS.forEach(t=>res[t]=0);
  uvaRecepciones.filter(r=>r.orden===folio).forEach(r=>{UVA_TIPOS.forEach(t=>{res[t]+=(r.tipos[t]?.cant||0);});});
  return res;
}
function uvaPendienteOrden(folio){return uvaTotalOrden(folio)-uvaRecibidoOrden(folio);}
function uvaEstadoOrden(c){const p=uvaTotalOrden(c.folio),r=uvaRecibidoOrden(c.folio);return r===0?'Pendiente':r>=p?'Completo':'Parcial';}
function nextUvaFolioCompra(){return'UVAC-'+String(uvaCompras.length+1).padStart(4,'0');}
function nextUvaFolioRec(){return'UVAR-'+String(uvaRecepciones.length+1).padStart(4,'0');}

function renderUvaCompras(){
  let tot=0,ped=0,rec=0,pend=0;
  uvaCompras.forEach(c=>{const p=uvaTotalOrden(c.folio),r=uvaRecibidoOrden(c.folio);tot++;ped+=p;rec+=r;pend+=p-r;});
  document.getElementById('um-ord').textContent=tot;
  document.getElementById('um-ped').textContent=ped.toLocaleString();
  document.getElementById('um-rec').textContent=rec.toLocaleString();
  const rows=uvaCompras.filter(c=>(!filtUC.text||(c.folio+c.factura).toLowerCase().includes(filtUC.text.toLowerCase()))&&(!filtUC.est||uvaEstadoOrden(c)===filtUC.est))
    .sort((a,b)=>cmpVal(a[stUC.col]||'',b[stUC.col]||'',stUC.dir));
  updSortHeaders('thUC-',stUC,['folio','fecha']);
  document.getElementById('tbody-uva-compras').innerHTML=rows.map(c=>{
    const p=uvaTotalOrden(c.folio),r=uvaRecibidoOrden(c.folio),pct=Math.min(100,p?Math.round(r/p*100):0);
    const est=uvaEstadoOrden(c),ec=est==='Completo'?'completo':est==='Parcial'?'parcial':'pend';
    const bc=est==='Completo'?'var(--green)':est==='Parcial'?'var(--blue)':'var(--amber)';
    const tiposStr=UVA_TIPOS.filter(t=>c.tipos[t]>0).map(t=>`<span class="tipo-badge t-s1" style="font-size:9px;margin-right:2px">${UVA_SHORT[t]}: ${c.tipos[t]}</span>`).join('');
    return`<tr>
      <td><span class="mono" style="color:var(--blue)">${c.folio}</span></td>
      <td style="font-size:11px;color:var(--text3)">${c.factura}</td>
      <td style="font-size:11px">${c.fecha}</td>
      <td style="white-space:normal">${tiposStr}</td>
      <td><span class="chip ${scls(c.socio)}">${INITIALS[c.socio]}</span></td>

    </tr>`;
  }).join('');
}


/* ── COMPRA UVA FORM ── */
function validarFechaUC(){
  const v=document.getElementById('uc-fecha').value;
  const err=document.getElementById('uc-fecha-err');
  const fi=document.getElementById('uc-fecha');
  if(v&&v>getTodayMX()){fi.classList.add('date-invalid');err.style.display='block';return false;}
  fi.classList.remove('date-invalid');err.style.display='none';return true;
}
/* Verifica si un rango UVA tiene folios ya registrados para ese tipo */
function uvaRangoDups(tipo, ini, fin){
  const i=parseInt(ini), f=parseInt(fin);
  if(isNaN(i)||isNaN(f)||f<i) return [];
  const set=UVA_FOLIOS_REG[tipo]||new Set();
  const dups=[];
  for(let n=i;n<=f;n++){
    if(set.has(n)) dups.push(String(n).padStart(5,'0'));
  }
  return dups;
}

/* Registra los folios de una compra UVA guardada */
function registrarFoliosUva(folios){
  UVA_TIPOS.forEach(t=>{
    const f=folios[t];
    if(!f||(!f.ini&&!f.fin)) return;
    const i=parseInt(f.ini), fi=parseInt(f.fin);
    if(isNaN(i)||isNaN(fi)||fi<i) return;
    for(let n=i;n<=fi;n++) (UVA_FOLIOS_REG[t]||new Set()).add(n);
  });
}

function getCantUvaFolios(ini,fin){
  if(!ini&&!fin)return 0;
  const i=parseInt(ini),f=parseInt(fin);
  if(isNaN(i)||isNaN(f)||f<i)return 0;
  return f-i+1;
}
function updUvaResumen(){
  const vals={
    '1er semestre':getCantUvaFolios(document.getElementById('uc-f1-ini').value,document.getElementById('uc-f1-fin').value),
    '2do semestre':getCantUvaFolios(document.getElementById('uc-f2-ini').value,document.getElementById('uc-f2-fin').value),
    'Anual':getCantUvaFolios(document.getElementById('uc-f3-ini').value,document.getElementById('uc-f3-fin').value),
    'Inspección pagada':getCantUvaFolios(document.getElementById('uc-f4-ini').value,document.getElementById('uc-f4-fin').value),
    'Global':getCantUvaFolios(document.getElementById('uc-f5-ini').value,document.getElementById('uc-f5-fin').value),
  };
  const total=Object.values(vals).reduce((s,v)=>s+v,0);
  const precio=proveedorUVA.precio||0;
  const res=document.getElementById('uc-resumen');
  if(total===0){res.style.display='none';return;}
  // Verificar duplicados por tipo
  const dupsPorTipo={};
  const ids={
    '1er semestre':['uc-f1-ini','uc-f1-fin'],
    '2do semestre':['uc-f2-ini','uc-f2-fin'],
    'Anual':['uc-f3-ini','uc-f3-fin'],
    'Inspección pagada':['uc-f4-ini','uc-f4-fin'],
    'Global':['uc-f5-ini','uc-f5-fin'],
  };
  UVA_TIPOS.forEach(t=>{
    const [iniId,finId]=ids[t];
    const dups=uvaRangoDups(t,document.getElementById(iniId).value,document.getElementById(finId).value);
    if(dups.length>0) dupsPorTipo[t]=dups;
  });
  res.style.display='block';
  document.getElementById('uc-res-body').innerHTML=UVA_TIPOS.filter(t=>vals[t]>0).map(t=>{
    let rangoStr='';
    if(t==='1er semestre')rangoStr=` <span style="font-family:var(--mono);font-size:10px;color:var(--text3)">${document.getElementById('uc-f1-ini').value}→${document.getElementById('uc-f1-fin').value}</span>`;
    if(t==='2do semestre')rangoStr=` <span style="font-family:var(--mono);font-size:10px;color:var(--text3)">${document.getElementById('uc-f2-ini').value}→${document.getElementById('uc-f2-fin').value}</span>`;
    if(t==='Anual')rangoStr=` <span style="font-family:var(--mono);font-size:10px;color:var(--text3)">${document.getElementById('uc-f3-ini').value}→${document.getElementById('uc-f3-fin').value}</span>`;
    if(t==='Inspección pagada')rangoStr=` <span style="font-family:var(--mono);font-size:10px;color:var(--text3)">${document.getElementById('uc-f4-ini').value}→${document.getElementById('uc-f4-fin').value}</span>`;
    if(t==='Global')rangoStr=` <span style="font-family:var(--mono);font-size:10px;color:var(--text3)">${document.getElementById('uc-f5-ini').value}→${document.getElementById('uc-f5-fin').value}</span>`;
    return`<div style="display:flex;justify-content:space-between;align-items:center;font-size:12px;padding:3px 0;border-bottom:1px solid var(--border)">
      <span><span class="tipo-badge t-s1">${t}</span>${rangoStr}</span>
      <span style="font-weight:500">${vals[t].toLocaleString()} etiquetas${precio>0?' · $'+(vals[t]*precio).toLocaleString('es-MX',{minimumFractionDigits:2}):''}${dupsPorTipo[t]?` <span style="color:var(--red);font-size:10px;font-weight:600">⚠ ${dupsPorTipo[t].length} dup.</span>`:''}</span>
    </div>`;
  }).join('');
  const hayDups=Object.keys(dupsPorTipo).length>0;
  document.getElementById('uc-res-total').textContent=total.toLocaleString()+' etiquetas'+(precio>0?' · $'+(total*precio).toLocaleString('es-MX',{minimumFractionDigits:2}):'')+(hayDups?' ⚠ hay folios duplicados':'');
  document.getElementById('uc-res-total').style.color=hayDups?'var(--red)':'var(--blue)';
}

function guardarUvaCompra(){
  if(!validarFechaUC())return;
  const factura=document.getElementById('uc-factura').value;
  const fecha=document.getElementById('uc-fecha').value;
  const socio=document.getElementById('uc-socio').value;
  if(!factura||!fecha||!socio){alert('Completa factura, fecha y socio.');return;}
  const folios={
    '1er semestre':{ini:document.getElementById('uc-f1-ini').value,fin:document.getElementById('uc-f1-fin').value},
    '2do semestre':{ini:document.getElementById('uc-f2-ini').value,fin:document.getElementById('uc-f2-fin').value},
    'Anual':{ini:document.getElementById('uc-f3-ini').value,fin:document.getElementById('uc-f3-fin').value},
    'Inspección pagada':{ini:document.getElementById('uc-f4-ini').value,fin:document.getElementById('uc-f4-fin').value},
    'Global':{ini:document.getElementById('uc-f5-ini').value,fin:document.getElementById('uc-f5-fin').value},
  };
  const tipos={};
  UVA_TIPOS.forEach(t=>{tipos[t]=getCantUvaFolios(folios[t].ini,folios[t].fin);});
  if(Object.values(tipos).every(v=>v===0)){alert('Agrega al menos un tipo con folio o cantidad.');return;}
  // Verificar duplicados
  const dups=[];
  UVA_TIPOS.forEach(t=>{const f=folios[t];if(!f)return;const d=uvaRangoDups(t,f.ini,f.fin);if(d.length>0)dups.push(t+': '+d.slice(0,3).join(', ')+(d.length>3?' +más':''));});
  if(dups.length>0){alert('Hay folios ya registrados:\n'+dups.join('\n'));return;}
  const total=Object.values(tipos).reduce((s,v)=>s+v,0);
  const precio=proveedorUVA.precio||0;
  const folio=nextUvaFolioCompra();
  uvaCompras.unshift({folio,factura,fecha,socio,precio,tipos,folios,notas:document.getElementById('uc-notas').value,entregaInmediata:true});
  registrarFoliosUva(folios);
  // Registrar recepción automática
  const tiposRec={};
  UVA_TIPOS.forEach(t=>{tiposRec[t]={ini:folios[t]?.ini||'',fin:folios[t]?.fin||'',cant:tipos[t]};});
  uvaRecepciones.unshift({folio:nextUvaFolioRec(),orden:folio,socio,fecha,hora:getNowTimeMX(),tipos:tiposRec,total,quien:'Entrega en compra',notas:'Recepción automática — entrega al momento de la compra'});
  closeModal('modal-uva-compra');renderUvaCompras();
}

/* ── RECEPCION UVA FORM ── */





/* ══════════════════════════════════════════════
   MÓDULO TRANSFERENCIAS
══════════════════════════════════════════════ */
let transferencias=[];
const filtT={text:'',tipo:'',de:'',a:''};

function nextFolioTrans(){return'TRF-'+String(transferencias.length+1).padStart(4,'0');}


/* ── INVENTARIO POR SOCIO ──
   Devuelve {tipo: cantidadDisponible} para un socio dado, hologramas.
   Suma lo recibido en recepciones + transferencias entrantes
   y resta transferencias salientes. */

/* Devuelve Set de números de folio (int) que tiene un socio para un tipo de holograma */

/* Convierte un Set de enteros a lista de rangos consecutivos */
function setToRangos(set, pad, prefijo){
  if(!set||set.size===0) return [];
  const nums=[...set].sort((a,b)=>a-b);
  const rangos=[];
  let ini=nums[0], prev=nums[0];
  for(let i=1;i<nums.length;i++){
    if(nums[i]===prev+1){prev=nums[i];}
    else{rangos.push({ini,fin:prev,cant:prev-ini+1});ini=nums[i];prev=nums[i];}
  }
  rangos.push({ini,fin:prev,cant:prev-ini+1});
  return rangos.map(r=>({
    ini:(prefijo||'')+String(r.ini).padStart(pad,'0'),
    fin:(prefijo||'')+String(r.fin).padStart(pad,'0'),
    cant:r.cant
  }));
}

function foliosHoloDisponibles(socio, tipo){
  const disponibles = new Set();
  // Agregar folios de recepciones asignadas
  recepciones.forEach(r=>{
    if(!r.asignacion||!r.asignacion[socio])return;
    const rangos=r.asignacion[socio][tipo];
    if(!rangos)return;
    const arr=Array.isArray(rangos)?rangos:[{ini:rangos,fin:rangos,cant:rangos}];
    arr.forEach(rng=>{
      if(!rng.ini||!rng.fin)return;
      const pIni=parseFolioHolo(rng.ini), pFin=parseFolioHolo(rng.fin);
      if(!pIni||!pFin)return;
      for(let n=pIni.numInt;n<=pFin.numInt;n++) disponibles.add(n);
    });
  });
  // Agregar folios recibidos por transferencia CONFIRMADA
  transferencias.filter(t=>t.tipo==='holograma'&&t.a===socio&&t.subtipo===tipo&&t.estado==='confirmada').forEach(t=>{
    const pIni=parseFolioHolo(t.folioIni), pFin=parseFolioHolo(t.folioFin);
    if(!pIni||!pFin)return;
    for(let n=pIni.numInt;n<=pFin.numInt;n++) disponibles.add(n);
  });
  // Quitar folios enviados CONFIRMADOS + PENDIENTES (propuesta no descuenta aún)
  transferencias.filter(t=>t.tipo==='holograma'&&t.de===socio&&t.subtipo===tipo&&(t.estado==='confirmada'||t.estado==='pendiente')).forEach(t=>{
    const pIni=parseFolioHolo(t.folioIni), pFin=parseFolioHolo(t.folioFin);
    if(!pIni||!pFin)return;
    for(let n=pIni.numInt;n<=pFin.numInt;n++) disponibles.delete(n);
  });
  return disponibles;
}

/* Devuelve Set de números de folio (int) que tiene un socio para un tipo UVA */
function foliosUvaDisponibles(socio, tipo){
  const disponibles = new Set();
  // Agregar folios de compras UVA del socio
  uvaCompras.filter(c=>c.socio===socio).forEach(c=>{
    const f=c.folios&&c.folios[tipo];
    if(!f||!f.ini||!f.fin)return;
    const ini=parseInt(f.ini), fin=parseInt(f.fin);
    if(isNaN(ini)||isNaN(fin))return;
    for(let n=ini;n<=fin;n++) disponibles.add(n);
  });
  // Agregar folios recibidos por transferencia UVA CONFIRMADA
  transferencias.filter(t=>t.tipo==='uva'&&t.a===socio&&t.subtipo===tipo&&t.estado==='confirmada').forEach(t=>{
    const ini=parseInt(t.folioIni), fin=parseInt(t.folioFin);
    if(!isNaN(ini)&&!isNaN(fin)) for(let n=ini;n<=fin;n++) disponibles.add(n);
  });
  // Quitar folios enviados UVA CONFIRMADOS + PENDIENTES (propuesta no descuenta aún)
  transferencias.filter(t=>t.tipo==='uva'&&t.de===socio&&t.subtipo===tipo&&(t.estado==='confirmada'||t.estado==='pendiente')).forEach(t=>{
    const ini=parseInt(t.folioIni), fin=parseInt(t.folioFin);
    if(!isNaN(ini)&&!isNaN(fin)) for(let n=ini;n<=fin;n++) disponibles.delete(n);
  });
  return disponibles;
}

/* Verifica que TODOS los folios del rango ini→fin estén disponibles para el socio.
   Devuelve array de folios NO disponibles (vacío = OK) */
function foliosNoDisponiblesHolo(socio, tipo, ini, fin){
  const pIni=parseFolioHolo(ini), pFin=parseFolioHolo(fin);
  if(!pIni||!pFin) return ['folios inválidos'];
  const disponibles=foliosHoloDisponibles(socio, tipo);
  const faltantes=[];
  for(let n=pIni.numInt;n<=pFin.numInt;n++){
    if(!disponibles.has(n)) faltantes.push(pIni.tipoDigit+String(n).padStart(7,'0'));
  }
  return faltantes;
}

function foliosNoDisponiblesUva(socio, tipo, ini, fin){
  const i=parseInt(ini), f=parseInt(fin);
  if(isNaN(i)||isNaN(f)) return ['folios inválidos'];
  const disponibles=foliosUvaDisponibles(socio, tipo);
  const faltantes=[];
  for(let n=i;n<=f;n++){
    if(!disponibles.has(n)) faltantes.push(String(n).padStart(5,'0'));
  }
  return faltantes;
}

function inventarioHoloSocio(socio){
  const inv={};
  // Sumar recepciones asignadas
  recepciones.forEach(r=>{
    if(!r.asignacion||!r.asignacion[socio])return;
    Object.entries(r.asignacion[socio]).forEach(([tipo,rangos])=>{
      inv[tipo]=(inv[tipo]||0)+asigCant(rangos);
    });
  });
  // Sumar transferencias recibidas CONFIRMADAS
  transferencias.filter(t=>t.tipo==='holograma'&&t.a===socio&&t.estado==='confirmada').forEach(t=>{
    inv[t.subtipo]=(inv[t.subtipo]||0)+t.cant;
  });
  // Restar transferencias enviadas CONFIRMADAS + PENDIENTES (propuesta no descuenta)
  transferencias.filter(t=>t.tipo==='holograma'&&t.de===socio&&(t.estado==='confirmada'||t.estado==='pendiente')).forEach(t=>{
    inv[t.subtipo]=(inv[t.subtipo]||0)-t.cant;
  });
  return inv;
}

/* Inventario UVA de un socio: {tipo: cantidadDisponible} */
function inventarioUvaSocio(socio){
  const inv={};
  // Sumar compras UVA asignadas a este socio
  uvaCompras.filter(c=>c.socio===socio).forEach(c=>{
    Object.entries(c.tipos).forEach(([tipo,cant])=>{
      inv[tipo]=(inv[tipo]||0)+cant;
    });
  });
  // Sumar transferencias UVA recibidas CONFIRMADAS
  transferencias.filter(t=>t.tipo==='uva'&&t.a===socio&&t.estado==='confirmada').forEach(t=>{
    inv[t.subtipo]=(inv[t.subtipo]||0)+t.cant;
  });
  // Restar transferencias UVA enviadas CONFIRMADAS + PENDIENTES (propuesta no descuenta)
  transferencias.filter(t=>t.tipo==='uva'&&t.de===socio&&(t.estado==='confirmada'||t.estado==='pendiente')).forEach(t=>{
    inv[t.subtipo]=(inv[t.subtipo]||0)-t.cant;
  });
  return inv;
}

/* Muestra el inventario disponible del socio origen al cambiar selección */
function updTransInventario(){
  const de=document.getElementById('tr-de').value;
  const tipo=document.getElementById('tr-tipo').value;
  const panel=document.getElementById('tr-inv-panel');
  if(!de||!tipo){panel.style.display='none';return;}
  panel.style.display='block';
  let html='';
  if(tipo==='holograma'){
    const inv=inventarioHoloEntidad(de);
    const tiposConStock=TIPOS.filter(t=>(inv[t]||0)>0);
    if(tiposConStock.length===0){
      html='<span style="font-size:11px;color:var(--text3);font-style:italic">Sin hologramas disponibles</span>';
    } else {
      html=tiposConStock.map(t=>{
        const set=foliosHoloEntidadDisponibles(de,t);
        const rangos=setToRangos(set,7,TIPO_DIGIT[t]);
        const rangosStr=rangos.map(r=>
          `<div style="display:flex;justify-content:space-between;padding:2px 0 2px 12px;font-size:10px;color:var(--text3);border-bottom:1px dashed var(--border)">
            <span style="font-family:var(--mono)">${r.ini} → ${r.fin}</span>
            <span style="color:var(--green);font-weight:500">${r.cant.toLocaleString()}</span>
          </div>`
        ).join('');
        return`<div>
          <div style="display:flex;justify-content:space-between;font-size:11px;padding:4px 0;border-bottom:1px solid var(--border)">
            <span class="tipo-badge ${TIPO_CLASS[t]}">${t}</span>
            <span style="font-weight:600;color:var(--green)">${(inv[t]||0).toLocaleString()} disponibles</span>
          </div>${rangosStr}</div>`;
      }).join('');
    }
  } else if(tipo==='uva'){
    const inv=inventarioUvaEntidad(de);
    const tiposConStock=UVA_TIPOS.filter(t=>(inv[t]||0)>0);
    if(tiposConStock.length===0){
      html='<span style="font-size:11px;color:var(--text3);font-style:italic">Sin etiquetas UVA disponibles</span>';
    } else {
      html=tiposConStock.map(t=>{
        const set=foliosUvaEntidadDisponibles(de,t);
        const rangos=setToRangos(set,5,'');
        const rangosStr=rangos.map(r=>
          `<div style="display:flex;justify-content:space-between;padding:2px 0 2px 12px;font-size:10px;color:var(--text3);border-bottom:1px dashed var(--border)">
            <span style="font-family:var(--mono)">${r.ini} → ${r.fin}</span>
            <span style="color:var(--purple);font-weight:500">${r.cant.toLocaleString()}</span>
          </div>`
        ).join('');
        return`<div>
          <div style="display:flex;justify-content:space-between;font-size:11px;padding:4px 0;border-bottom:1px solid var(--border)">
            <span class="tipo-badge t-s1">${t}</span>
            <span style="font-weight:600;color:var(--purple)">${(inv[t]||0).toLocaleString()} disponibles</span>
          </div>${rangosStr}</div>`;
      }).join('');
    }
  } else if(tipo==='dictamen'){
    const set=foliosDictEntidadDisponibles(de);
    const cant=set.size;
    if(cant===0){
      html='<span style="font-size:11px;color:var(--text3);font-style:italic">Sin dictámenes disponibles</span>';
    } else {
      const pad=[...set].sort((a,b)=>a-b)[0];
      const rangos=setToRangos(set,String(pad).length,'');
      const rangosStr=rangos.map(r=>
        `<div style="display:flex;justify-content:space-between;padding:2px 0 2px 12px;font-size:10px;color:var(--text3);border-bottom:1px dashed var(--border)">
          <span style="font-family:var(--mono)">${r.ini} → ${r.fin}</span>
          <span style="color:var(--amber);font-weight:500">${r.cant.toLocaleString()}</span>
        </div>`
      ).join('');
      html=`<div>
        <div style="display:flex;justify-content:space-between;font-size:11px;padding:4px 0;border-bottom:1px solid var(--border)">
          <span style="font-weight:500">Dictámenes</span>
          <span style="font-weight:600;color:var(--amber)">${cant.toLocaleString()} disponibles</span>
        </div>${rangosStr}</div>`;
    }
  }
  document.getElementById('tr-inv-body').innerHTML=html;
}


/* ── ENTIDADES: socios y verificadores ──
   Una entidad es cualquier actor que puede tener inventario:
   un socio (Socio A/B/C) o un verificador (usuario con rol=verificador) */

function getVerificadoresDeSocio(socio){
  // Buscar en el arreglo verificadores[] (no en usuarios[])
  return verificadores.filter(v=>v.socio===socio&&v.activo);
}

function getSocioDeEntidad(entidad){
  if(SOCIOS.includes(entidad)) return entidad;
  // Buscar en verificadores[]
  const v=verificadores.find(v=>v.nombre===entidad);
  if(v) return v.socio;
  // Fallback: buscar en usuarios[] por si acaso
  const u=usuarios.find(u=>u.nombre===entidad&&u.rol==='verificador');
  return u?u.socio:null;
}

function esVerificador(entidad){
  return verificadores.some(v=>v.nombre===entidad);
}

/* Poblar selects de origen y destino en transferencias según rol del usuario */
function poblarSelectsTransferencia(){
  // Helper: socio + sus verificadores activos del arreglo verificadores[]
  function itemsSocioYVerifs(socio){
    const verifs=verificadores.filter(v=>v.socio===socio&&v.activo).map(v=>({label:v.nombre+' ('+v.tipoUsuario+')',value:v.nombre}));
    return [{label:socio,value:socio},...verifs];
  }

  // Grupos ORIGEN
  let gruposOrigen=[];
  if(SESSION.rol==='socio'){
    // Socio ve su inventario + sus verificadores
    gruposOrigen=[{label:'Mi inventario y verificadores',items:itemsSocioYVerifs(SESSION.socio)}];
  } else {
    // Admin y personal ven todos los socios con sus verificadores
    SOCIOS.forEach(s=>gruposOrigen.push({label:s,items:itemsSocioYVerifs(s)}));
  }

  // Grupos DESTINO
  let gruposDestino=[];
  if(SESSION.rol==='socio'){
    const otrosSocios=SOCIOS.filter(s=>s!==SESSION.socio).map(s=>({label:s+' ⟳ (requiere autorización mutua)',value:s}));
    gruposDestino.push({label:'Mi inventario y verificadores',items:itemsSocioYVerifs(SESSION.socio)});
    if(otrosSocios.length>0) gruposDestino.push({label:'Otros socios (doble autorización)',items:otrosSocios});
  } else {
    SOCIOS.forEach(s=>gruposDestino.push({label:s,items:itemsSocioYVerifs(s)}));
  }

  const buildHTML=(grupos,excluir)=>'<option value="">Seleccionar...</option>'+
    grupos.map(g=>{
      const items=g.items.filter(i=>i.value!==excluir);
      if(!items.length) return '';
      return `<optgroup label="${g.label}">${items.map(i=>`<option value="${i.value}">${i.label}</option>`).join('')}</optgroup>`;
    }).join('');

  // Leer valores actuales ANTES de reconstruir
  const deActual=document.getElementById('tr-de').value;
  const aActual=document.getElementById('tr-a').value;

  document.getElementById('tr-de').innerHTML=buildHTML(gruposOrigen, aActual);
  document.getElementById('tr-a').innerHTML=buildHTML(gruposDestino, deActual);

  // Restaurar valores si existían
  if(deActual) document.getElementById('tr-de').value=deActual;
  if(aActual)  document.getElementById('tr-a').value=aActual;
}

/* Inventario de una entidad (socio o verificador) para hologramas */
function inventarioHoloEntidad(entidad){
  if(SOCIOS.includes(entidad)) return inventarioHoloSocio(entidad);
  const inv={};
  // Folios asignados directamente al verificador por el socio
  const verObj=verificadores.find(v=>v.nombre===entidad);
  if(verObj){
    verObj.asignaciones.filter(a=>a.tipo==='holograma').forEach(a=>{
      inv[a.subtipo]=(inv[a.subtipo]||0)+a.cant;
    });
  }
  // Sumar transferencias recibidas confirmadas
  transferencias.filter(t=>t.tipo==='holograma'&&t.a===entidad&&t.estado==='confirmada').forEach(t=>{
    inv[t.subtipo]=(inv[t.subtipo]||0)+t.cant;
  });
  // Restar transferencias enviadas confirmadas + pendientes
  transferencias.filter(t=>t.tipo==='holograma'&&t.de===entidad&&(t.estado==='confirmada'||t.estado==='pendiente')).forEach(t=>{
    inv[t.subtipo]=(inv[t.subtipo]||0)-t.cant;
  });
  return inv;
}

function inventarioUvaEntidad(entidad){
  if(SOCIOS.includes(entidad)) return inventarioUvaSocio(entidad);
  const inv={};
  transferencias.filter(t=>t.tipo==='uva'&&t.a===entidad).forEach(t=>{
    inv[t.subtipo]=(inv[t.subtipo]||0)+t.cant;
  });
  transferencias.filter(t=>t.tipo==='uva'&&t.de===entidad).forEach(t=>{
    inv[t.subtipo]=(inv[t.subtipo]||0)-t.cant;
  });
  return inv;
}

function inventarioDictEntidad(entidad){
  if(SOCIOS.includes(entidad)) return inventarioDictSocio(entidad);
  let cant=0;
  transferencias.filter(t=>t.tipo==='dictamen'&&t.a===entidad).forEach(t=>cant+=t.cant);
  transferencias.filter(t=>t.tipo==='dictamen'&&t.de===entidad).forEach(t=>cant-=t.cant);
  return cant;
}

/* Folios disponibles de una entidad */
function foliosHoloEntidadDisponibles(entidad, tipo){
  if(SOCIOS.includes(entidad)) return foliosHoloDisponibles(entidad, tipo);
  const disponibles=new Set();
  // 1. Folios asignados directamente por el socio al verificador
  const verObj=verificadores.find(v=>v.nombre===entidad);
  if(verObj){
    verObj.asignaciones.filter(a=>a.tipo==='holograma'&&a.subtipo===tipo).forEach(a=>{
      const pI=parseFolioHolo(a.folioIni),pF=parseFolioHolo(a.folioFin);
      if(pI&&pF) for(let n=pI.numInt;n<=pF.numInt;n++) disponibles.add(n);
    });
  }
  // 2. Folios recibidos por transferencia confirmada
  transferencias.filter(t=>t.tipo==='holograma'&&t.a===entidad&&t.subtipo===tipo&&t.estado==='confirmada').forEach(t=>{
    const pI=parseFolioHolo(t.folioIni),pF=parseFolioHolo(t.folioFin);
    if(pI&&pF) for(let n=pI.numInt;n<=pF.numInt;n++) disponibles.add(n);
  });
  // 3. Restar folios enviados por transferencia confirmada o pendiente
  transferencias.filter(t=>t.tipo==='holograma'&&t.de===entidad&&t.subtipo===tipo&&(t.estado==='confirmada'||t.estado==='pendiente')).forEach(t=>{
    const pI=parseFolioHolo(t.folioIni),pF=parseFolioHolo(t.folioFin);
    if(pI&&pF) for(let n=pI.numInt;n<=pF.numInt;n++) disponibles.delete(n);
  });
  return disponibles;
}

function foliosUvaEntidadDisponibles(entidad, tipo){
  if(SOCIOS.includes(entidad)) return foliosUvaDisponibles(entidad, tipo);
  const disponibles=new Set();
  transferencias.filter(t=>t.tipo==='uva'&&t.a===entidad&&t.subtipo===tipo).forEach(t=>{
    const i=parseInt(t.folioIni),f=parseInt(t.folioFin);
    if(!isNaN(i)&&!isNaN(f)) for(let n=i;n<=f;n++) disponibles.add(n);
  });
  transferencias.filter(t=>t.tipo==='uva'&&t.de===entidad&&t.subtipo===tipo).forEach(t=>{
    const i=parseInt(t.folioIni),f=parseInt(t.folioFin);
    if(!isNaN(i)&&!isNaN(f)) for(let n=i;n<=f;n++) disponibles.delete(n);
  });
  return disponibles;
}

function foliosDictEntidadDisponibles(entidad){
  if(SOCIOS.includes(entidad)) return foliosDictDisponibles(entidad);
  const disponibles=new Set();
  transferencias.filter(t=>t.tipo==='dictamen'&&t.a===entidad).forEach(t=>{
    const i=parseInt(t.folioIni),f=parseInt(t.folioFin);
    if(!isNaN(i)&&!isNaN(f)) for(let n=i;n<=f;n++) disponibles.add(n);
  });
  transferencias.filter(t=>t.tipo==='dictamen'&&t.de===entidad).forEach(t=>{
    const i=parseInt(t.folioIni),f=parseInt(t.folioFin);
    if(!isNaN(i)&&!isNaN(f)) for(let n=i;n<=f;n++) disponibles.delete(n);
  });
  return disponibles;
}

function renderTransferencias(){
  document.getElementById('tm-tot').textContent=transferencias.length;
  const totalHolo=transferencias.filter(t=>t.tipo==='holograma').reduce((s,t)=>s+t.cant,0);
  const totalUva=transferencias.filter(t=>t.tipo==='uva').reduce((s,t)=>s+t.cant,0);
  document.getElementById('tm-holo').textContent=totalHolo.toLocaleString();
  document.getElementById('tm-uva').textContent=totalUva.toLocaleString();
  const socios=new Set(transferencias.flatMap(t=>[t.de,t.a]));
  document.getElementById('tm-socios').textContent=socios.size;

  const rows=transferencias.filter(t=>{
    if(filtT.text&&!(t.folio+t.de+t.a+t.subtipo).toLowerCase().includes(filtT.text.toLowerCase()))return false;
    if(filtT.tipo&&t.tipo!==filtT.tipo&&t.estado!==filtT.tipo)return false;
    if(filtT.de&&t.de!==filtT.de)return false;
    if(filtT.a&&t.a!==filtT.a)return false;
    return true;
  });

  document.getElementById('tbody-trans').innerHTML=rows.map(t=>{
    const tipoBadge=t.tipo==='holograma'
      ?`<span class="tipo-badge ${TIPO_CLASS[t.subtipo]||'t-s1'}">${TIPO_SHORT[t.subtipo]||t.subtipo}</span>`
      :`<span class="chip p2" style="font-size:10px">${t.subtipo}</span>`;
    const folioStr=t.folioIni&&t.folioFin?`<span class="mono">${t.folioIni}→${t.folioFin}</span>`:'—';
    return`<tr>
      <td><span class="mono" style="color:var(--blue)">${t.folio}</span></td>
      <td style="font-size:11px">${t.fecha}</td>
      <td><span class="chip ${t.tipo==='holograma'?'parcial':t.tipo==='uva'?'p3':'warn'}" style="font-size:10px">${t.tipo==='holograma'?'Holo':t.tipo==='uva'?'UVA':'Dict'}</span></td>
      <td><span class="chip ${scls(t.de)}">${INITIALS[t.de]}</span></td>
      <td><span class="chip ${scls(t.a)}">${INITIALS[t.a]}</span></td>
      <td>${tipoBadge}</td>
      <td>${folioStr}</td>
      <td style="font-weight:600">${t.cant.toLocaleString()}</td>
      <td><span class="chip ${
        t.estado==='confirmada'?'completo':
        t.estado==='rechazada'?'p1':
        t.estado==='aprobacion_socio_emisor'?'apr-e':
        t.estado==='aprobacion_socio_receptor'?'apr-r':
        'pend'
      }">${
        t.estado==='confirmada'?'Confirmada':
        t.estado==='rechazada'?'Rechazada':
        t.estado==='aprobacion_socio_emisor'?'Aprobación A':
        t.estado==='aprobacion_socio_receptor'?'Aprobación B':
        'Pendiente'
      }</span></td>
      <td style="font-size:11px;color:var(--text3)">${(()=>{
        const socioE=t.socioEmisor||getSocioDeEntidad(t.de);
        const socioR=t.socioReceptor||getSocioDeEntidad(t.a);
        // --- Aprobación 4 partes ---
        if(t.estado==='aprobacion_socio_emisor'){
          if(SESSION.socio===socioE) return `<button class="btn sm success" onclick="aprobarTransSocio('${t.folio}','emisor')">✓ Aprobar envío</button>
            <button class="btn sm ghost" style="color:var(--red)" onclick="rechazarTrans('${t.folio}')">✕</button>`;
          if(SESSION.socio===socioR) return `<span style="font-size:10px;color:var(--amber)">Esperando aprobación de ${socioE}</span>`;
        }
        if(t.estado==='aprobacion_socio_receptor'){
          if(SESSION.socio===socioR) return `<button class="btn sm success" onclick="aprobarTransSocio('${t.folio}','receptor')">✓ Aprobar recepción</button>
            <button class="btn sm ghost" style="color:var(--red)" onclick="rechazarTrans('${t.folio}')">✕</button>`;
          if(SESSION.socio===socioE) return `<span style="font-size:10px;color:var(--purple)">Aprobado — esperando ${socioR}</span>`;
        }
        // --- Pendiente normal ---
        if(t.estado==='pendiente'){
          if(t.a===SESSION.socio||(getSocioDeEntidad(t.a)===SESSION.socio)) return `<div style="display:flex;gap:4px">
            <button class="btn sm success" onclick="confirmarTrans('${t.folio}')">🔐 Confirmar</button>
            <button class="btn sm ghost" style="color:var(--red)" onclick="rechazarTrans('${t.folio}')">✕</button>
          </div>`;
          if(t.de===SESSION.socio||(getSocioDeEntidad(t.de)===SESSION.socio)) return `<button class="btn sm ghost" style="color:var(--red);font-size:10px" onclick="cancelarTrans('${t.folio}')">Cancelar</button>`;
        }
        return '—';
      })()}</td>
    </tr>`;
  }).join('');
}

/* ── FORM ── */
function validarFechaTR(){
  const v=document.getElementById('tr-fecha').value,
        err=document.getElementById('tr-fecha-err'),
        fi=document.getElementById('tr-fecha');
  if(v&&v>getTodayMX()){fi.classList.add('date-invalid');err.style.display='block';return false;}
  fi.classList.remove('date-invalid');err.style.display='none';return true;
}

function selTipoTrans(){
  const tipo=document.getElementById('tr-tipo').value;
  updTransInventario();
  document.getElementById('tr-subtipo-uva-row').style.display=tipo==='uva'?'flex':'none';
  document.getElementById('tr-folios-row').style.display=tipo?'block':'none';
  if(tipo==='holograma'){
    document.getElementById('tr-folio-ini-lbl').textContent='Folio inicial (8 dígitos)';
    document.getElementById('tr-folio-fin-lbl').textContent='Folio final (8 dígitos)';
    document.getElementById('tr-folio-ini').placeholder='10047001';
    document.getElementById('tr-folio-ini').maxLength='8';
    document.getElementById('tr-folio-fin').placeholder='10047050';
    document.getElementById('tr-folio-fin').maxLength='8';
  } else if(tipo==='uva'){
    document.getElementById('tr-folio-ini-lbl').textContent='Folio inicial (5 dígitos)';
    document.getElementById('tr-folio-fin-lbl').textContent='Folio final (5 dígitos)';
    document.getElementById('tr-folio-ini').placeholder='00100';
    document.getElementById('tr-folio-ini').maxLength='5';
    document.getElementById('tr-folio-fin').placeholder='00150';
    document.getElementById('tr-folio-fin').maxLength='5';
  } else if(tipo==='dictamen'){
    document.getElementById('tr-folio-ini-lbl').textContent='Folio inicial';
    document.getElementById('tr-folio-fin-lbl').textContent='Folio final';
    document.getElementById('tr-folio-ini').placeholder='00001';
    document.getElementById('tr-folio-ini').maxLength='10';
    document.getElementById('tr-folio-fin').placeholder='00050';
    document.getElementById('tr-folio-fin').maxLength='10';
  }
  document.getElementById('tr-folio-ini').value='';
  document.getElementById('tr-folio-fin').value='';
  updTransResumen();
}

function updTransSocios(){
  poblarSelectsTransferencia();
  const de=document.getElementById('tr-de').value;
  const a=document.getElementById('tr-a').value;
  const err=document.getElementById('tr-mismo-socio-err');
  err.style.display=(de&&a&&de===a)?'block':'none';
  // Aviso según tipo de transferencia
  const infoDoble=document.getElementById('tr-doble-auth-info');
  if(infoDoble&&de&&a&&de!==a){
    const socioOrigen=getSocioDeEntidad(de);
    const socioDestino=getSocioDeEntidad(a);
    const esInterna=socioOrigen&&socioDestino&&socioOrigen===socioDestino;
    const esSocioASocio=SOCIOS.includes(de)&&SOCIOS.includes(a)&&de!==a;
    if(esInterna){
      infoDoble.style.display='block';
      infoDoble.style.borderLeftColor='var(--green)';
      infoDoble.style.background='var(--green-bg)';
      infoDoble.style.color='var(--green)';
      infoDoble.innerHTML='<strong>↩ Transferencia interna</strong> — Entre entidades del mismo socio. Se confirma automáticamente.';
    } else if(esSocioASocio){
      infoDoble.style.display='block';
      infoDoble.style.borderLeftColor='var(--blue)';
      infoDoble.style.background='var(--blue-bg)';
      infoDoble.style.color='var(--blue)';
      infoDoble.innerHTML='<strong>🔐 Requiere PIN</strong> — El emisor firma el envío con su PIN y el receptor confirma la recepción con el suyo.';
    } else {
      infoDoble.style.display='none';
    }
  } else if(infoDoble){
    infoDoble.style.display='none';
  }
  updTransInventario();
  updTransResumen();
}

function updTransResumen(){
  const tipo=document.getElementById('tr-tipo').value;
  const ini=document.getElementById('tr-folio-ini').value.trim();
  const fin=document.getElementById('tr-folio-fin').value.trim();
  const res=document.getElementById('tr-resumen');
  const errEl=document.getElementById('tr-err');

  if(!tipo||!ini||!fin){res.style.display='none';errEl.style.display='none';return;}

  let cant=0,err='',label='',foliosStr='';

  if(tipo==='holograma'){
    const pIni=parseFolioHolo(ini), pFin=parseFolioHolo(fin);
    const fbIni=document.getElementById('tr-folio-ini-fb');
    const fbFin=document.getElementById('tr-folio-fin-fb');
    if(!pIni){fbIni.innerHTML='<span class="fb-err">✗ Folio inválido</span>';res.style.display='none';return;}
    else fbIni.innerHTML=`<span class="fb-ok">✓</span> <span class="tipo-badge ${TIPO_CLASS[pIni.tipo]}">${TIPO_SHORT[pIni.tipo]}</span> <span class="fb-hint">#${pIni.numero}</span>`;
    if(!pFin){fbFin.innerHTML='<span class="fb-err">✗ Folio inválido</span>';res.style.display='none';return;}
    else fbFin.innerHTML=`<span class="fb-ok">✓</span> <span class="tipo-badge ${TIPO_CLASS[pFin.tipo]}">${TIPO_SHORT[pFin.tipo]}</span> <span class="fb-hint">#${pFin.numero}</span>`;
    if(pIni.tipoDigit!==pFin.tipoDigit){err='Los tipos del folio inicial y final deben ser iguales.';}
    else if(pFin.numInt<pIni.numInt){err='El folio final debe ser mayor al inicial.';}
    else{
      cant=pFin.numInt-pIni.numInt+1;
      label=`Hologramas ${pIni.tipo}`;
      foliosStr=`${ini} → ${fin}`;
    }
  } else if(tipo==='uva'){
    const i=parseInt(ini), f=parseInt(fin);
    document.getElementById('tr-folio-ini-fb').innerHTML=ini.length===5?'<span class="fb-ok">✓</span>':'<span class="fb-hint">5 dígitos</span>';
    document.getElementById('tr-folio-fin-fb').innerHTML=fin.length===5?'<span class="fb-ok">✓</span>':'<span class="fb-hint">5 dígitos</span>';
    if(ini.length<5||fin.length<5){res.style.display='none';return;}
    if(isNaN(i)||isNaN(f)||f<i){err='El folio final debe ser mayor al inicial.';}
    else{
      cant=f-i+1;
      const subtipo=document.getElementById('tr-subtipo-uva').value;
      label=`UVA ${subtipo||'(selecciona tipo)'}`;
      foliosStr=`${ini} → ${fin}`;
    }
  } else if(tipo==='dictamen'){
    const i=parseInt(ini),f=parseInt(fin);
    document.getElementById('tr-folio-ini-fb').innerHTML=ini&&!isNaN(parseInt(ini))?'<span class="fb-ok">✓</span>':'<span class="fb-hint">—</span>';
    document.getElementById('tr-folio-fin-fb').innerHTML=fin&&!isNaN(parseInt(fin))?'<span class="fb-ok">✓</span>':'<span class="fb-hint">—</span>';
    if(!ini||!fin){res.style.display='none';return;}
    if(isNaN(i)||isNaN(f)||f<i){err='El folio final debe ser mayor al inicial.';}
    else{cant=f-i+1;label='Dictámenes';foliosStr=`${ini} → ${fin}`;}
  }

  if(err){errEl.style.display='block';errEl.textContent=err;res.style.display='none';return;}
  errEl.style.display='none';
  // Validar folios exactos en tiempo real
  if(cant>0){
    const de2=document.getElementById('tr-de').value;
    if(de2){
      let noDisp=[];
      if(tipo==='holograma'){
        const pI=parseFolioHolo(ini),pF=parseFolioHolo(fin);
        if(pI&&pF){const st=pI.tipo;const s2=foliosHoloEntidadDisponibles(de2,st);noDisp=[...Array(pF.numInt-pI.numInt+1)].map((_,i)=>pI.numInt+i).filter(n=>!s2.has(n)).map(n=>pI.tipoDigit+String(n).padStart(7,'0'));}
      } else if(tipo==='uva'){
        const st=document.getElementById('tr-subtipo-uva').value;
        if(st){const s2=foliosUvaEntidadDisponibles(de2,st);const iU=parseInt(ini),fU=parseInt(fin);if(!isNaN(iU)&&!isNaN(fU))noDisp=[...Array(fU-iU+1)].map((_,j)=>iU+j).filter(n=>!s2.has(n)).map(n=>String(n).padStart(5,'0'));}
      } else if(tipo==='dictamen'){
        const s2=foliosDictEntidadDisponibles(de2);const iD=parseInt(ini),fD=parseInt(fin);if(!isNaN(iD)&&!isNaN(fD))noDisp=[...Array(fD-iD+1)].map((_,k)=>iD+k).filter(n=>!s2.has(n)).map(n=>String(n).padStart(ini.length,'0'));
      }
      if(noDisp.length>0){
        errEl.style.display='block';
        const muestra=noDisp.slice(0,3).join(', ')+(noDisp.length>3?` +${noDisp.length-3} más`:'');
        errEl.textContent=`⚠ ${noDisp.length} folio(s) no pertenecen al inventario de ${de2}: ${muestra}`;
        res.style.display='none';return;
      }
    }
  }

  if(cant>0){
    res.style.display='block';
    document.getElementById('tr-res-label').textContent=label;
    document.getElementById('tr-res-folios').textContent=foliosStr;
    document.getElementById('tr-res-cant').textContent=cant.toLocaleString()+' unidades';
  } else {
    res.style.display='none';
  }
}

function guardarTransferencia(){
  if(!validarFechaTR())return;
  const tipo=document.getElementById('tr-tipo').value;
  const de=document.getElementById('tr-de').value;
  const a=document.getElementById('tr-a').value;
  const fecha=document.getElementById('tr-fecha').value;
  const ini=document.getElementById('tr-folio-ini').value.trim();
  const fin=document.getElementById('tr-folio-fin').value.trim();
  const notas=document.getElementById('tr-notas').value;

  if(!tipo){alert('Selecciona el tipo de producto.');return;}
  if(!de||!a){alert('Selecciona origen y destino.');return;}
  if(de===a){alert('El origen y destino no pueden ser el mismo.');return;}
  // Validar que origen y destino pertenezcan al mismo socio (interno) o sean socios distintos (doble auth)
  const socioOrigen=getSocioDeEntidad(de);
  const socioDestino=getSocioDeEntidad(a);
  if(!socioOrigen||!socioDestino){alert('Origen o destino inválido.');return;}
  if(!fecha||fecha>getTodayMX()){alert('La fecha no puede ser futura.');return;}
  if(!ini||!fin){alert('Captura el folio inicial y final.');return;}

  let cant=0, subtipo='', err='';

  if(tipo==='holograma'){
    const pIni=parseFolioHolo(ini), pFin=parseFolioHolo(fin);
    if(!pIni||!pFin){alert('Folios inválidos.');return;}
    if(pIni.tipoDigit!==pFin.tipoDigit){alert('Los tipos del folio inicial y final deben coincidir.');return;}
    if(pFin.numInt<pIni.numInt){alert('El folio final debe ser mayor al inicial.');return;}
    subtipo=pIni.tipo; // inferido automáticamente del folio
    cant=pFin.numInt-pIni.numInt+1;
    const setH=foliosHoloEntidadDisponibles(de,subtipo);
    const noDispH=[...Array(pFin.numInt-pIni.numInt+1)].map((_,i)=>pIni.numInt+i).filter(n=>!setH.has(n)).map(n=>pIni.tipoDigit+String(n).padStart(7,'0'));
    if(noDispH.length>0){
      const muestra=noDispH.slice(0,5).join(', ')+(noDispH.length>5?` +${noDispH.length-5} más`:'');
      alert(`${de} no tiene disponibles ${noDispH.length} folio(s) de ese rango:\n${muestra}`);return;
    }
  } else if(tipo==='uva'){
    subtipo=document.getElementById('tr-subtipo-uva').value;
    if(!subtipo){alert('Selecciona el tipo de etiqueta UVA.');return;}
    const i=parseInt(ini), f=parseInt(fin);
    if(isNaN(i)||isNaN(f)||f<i||ini.length!==5||fin.length!==5){alert('Folios UVA inválidos. Deben ser 5 dígitos y el final mayor al inicial.');return;}
    cant=f-i+1;
    const setU=foliosUvaEntidadDisponibles(de,subtipo);
    const iU=parseInt(ini),fU=parseInt(fin);
    const noDispU=!isNaN(iU)&&!isNaN(fU)?[...Array(fU-iU+1)].map((_,j)=>iU+j).filter(n=>!setU.has(n)).map(n=>String(n).padStart(5,'0')):['folios inválidos'];
    if(noDispU.length>0){
      const muestra=noDispU.slice(0,5).join(', ')+(noDispU.length>5?` +${noDispU.length-5} más`:'');
      alert(`${de} no tiene disponibles ${noDispU.length} folio(s) UVA de ese rango:\n${muestra}`);return;
    }
  } else if(tipo==='dictamen'){
    subtipo='Dictamen';
    const i=parseInt(ini),f=parseInt(fin);
    if(isNaN(i)||isNaN(f)||f<i){alert('Folios inválidos. El folio final debe ser mayor al inicial.');return;}
    cant=f-i+1;
    const setD=foliosDictEntidadDisponibles(de);
    const iD=parseInt(ini),fD=parseInt(fin);
    const noDispD=!isNaN(iD)&&!isNaN(fD)?[...Array(fD-iD+1)].map((_,k)=>iD+k).filter(n=>!setD.has(n)).map(n=>String(n).padStart(ini.length,'0')):['folios inválidos'];
    if(noDispD.length>0){
      const muestra=noDispD.slice(0,5).join(', ')+(noDispD.length>5?` +${noDispD.length-5} más`:'');
      alert(`${de} no tiene disponibles ${noDispD.length} folio(s) de dictamen de ese rango:\n${muestra}`);return;
    }
  }

  // Determinar tipo de transferencia y estado inicial
  const esInterna = socioOrigen === socioDestino;
  const deEsVerif = !SOCIOS.includes(de);
  const aEsVerif  = !SOCIOS.includes(a);
  const entreVerifsDiferentesSocios = deEsVerif && aEsVerif && !esInterna;

  // Entre verificadores de socios distintos: 4 pasos de autorización
  // Otros casos entre socios distintos: pendiente (receptor confirma con PIN)
  // Caso interno: confirmada inmediatamente
  let estadoInicial;
  if(esInterna) estadoInicial='confirmada';
  else if(entreVerifsDiferentesSocios) estadoInicial='aprobacion_socio_emisor';
  else estadoInicial='pendiente';

  transferencias.unshift({
    folio:nextFolioTrans(), tipo, subtipo, de, a, fecha,
    folioIni:ini, folioFin:fin, cant, notas,
    estado:estadoInicial,
    socioEmisor: socioOrigen,
    socioReceptor: socioDestino,
    fechaConfirm:esInterna?getTodayMX():null,
    confirmadaPor:esInterna?SESSION.user:null,
    autorizadaPor:null, fechaAutorizacion:null,
    aprobSocioEmisor:null, aprobSocioReceptor:null
  });

  closeModal('modal-transferencia');
  renderTransferencias();
}

/* ── TÍTULOS ── */
titles['transferencias']='Transferencias';
breadcrumbs['transferencias']='Transferencias';


/* ══════════════════════════════════════════════
   MÓDULO DICTÁMENES DE VERIFICACIÓN
══════════════════════════════════════════════ */
const filtD={text:''};

function nextFolioDict(){return'DICT-'+String(dictamenes.length+1).padStart(4,'0');}


/* Devuelve Set de folios (int) disponibles de dictámenes para un socio */
function foliosDictDisponibles(socio){
  const disponibles=new Set();
  // Folios de compras del socio
  dictamenes.filter(d=>d.socio===socio).forEach(d=>{
    const i=parseInt(d.folioIni),f=parseInt(d.folioFin);
    if(!isNaN(i)&&!isNaN(f)) for(let n=i;n<=f;n++) disponibles.add(n);
  });
  // Recibidos por transferencia CONFIRMADA
  transferencias.filter(t=>t.tipo==='dictamen'&&t.a===socio&&t.estado==='confirmada').forEach(t=>{
    const i=parseInt(t.folioIni),f=parseInt(t.folioFin);
    if(!isNaN(i)&&!isNaN(f)) for(let n=i;n<=f;n++) disponibles.add(n);
  });
  // Enviados CONFIRMADOS + PENDIENTES (propuesta no descuenta aún)
  transferencias.filter(t=>t.tipo==='dictamen'&&t.de===socio&&(t.estado==='confirmada'||t.estado==='pendiente')).forEach(t=>{
    const i=parseInt(t.folioIni),f=parseInt(t.folioFin);
    if(!isNaN(i)&&!isNaN(f)) for(let n=i;n<=f;n++) disponibles.delete(n);
  });
  return disponibles;
}

function inventarioDictSocio(socio){
  return foliosDictDisponibles(socio).size;
}

function foliosNoDisponiblesDict(socio,ini,fin){
  const i=parseInt(ini),f=parseInt(fin);
  if(isNaN(i)||isNaN(f)) return['folios inválidos'];
  const disponibles=foliosDictDisponibles(socio);
  const faltantes=[];
  for(let n=i;n<=f;n++) if(!disponibles.has(n)) faltantes.push(String(n).padStart(ini.length,'0'));
  return faltantes;
}

function renderDictamenes(){
  const tot=dictamenes.reduce((s,d)=>s+d.cant,0);
  document.getElementById('dm-ord').textContent=dictamenes.length;
  document.getElementById('dm-tot').textContent=tot.toLocaleString();
  document.getElementById('dm-prov').textContent=proveedorUVA.nombre||'Proveedor UVA';
  const ult=dictamenes.length>0?dictamenes[0].folioFin:'—';
  document.getElementById('dm-ult').textContent=ult;

  const rows=dictamenes.filter(d=>!filtD.text||(d.folio+d.factura).toLowerCase().includes(filtD.text.toLowerCase()));
  document.getElementById('tbody-dict').innerHTML=rows.map(d=>`<tr>
    <td><span class="mono" style="color:var(--blue)">${d.folio}</span></td>
    <td style="font-size:11px;color:var(--text3)">${d.factura}</td>
    <td style="font-size:11px">${d.fecha}</td>
    <td><span class="chip ${scls(d.socio)}">${INITIALS[d.socio]}</span></td>
    <td style="font-family:var(--mono);font-size:11px">${d.folioIni}</td>
    <td style="font-family:var(--mono);font-size:11px">${d.folioFin}</td>
    <td style="font-weight:600">${d.cant.toLocaleString()}</td>
    <td style="font-family:var(--mono);font-size:11px">$${d.precio.toFixed(2)}</td>
    <td style="font-weight:600;color:var(--green)">$${(d.cant*d.precio).toLocaleString('es-MX',{minimumFractionDigits:2})}</td>
  </tr>`).join('');
}

function validarFechaDict(){
  const v=document.getElementById('d-fecha').value,
        err=document.getElementById('d-fecha-err'),
        fi=document.getElementById('d-fecha');
  if(v&&v>getTodayMX()){fi.classList.add('date-invalid');err.style.display='block';return false;}
  fi.classList.remove('date-invalid');err.style.display='none';return true;
}

function dictRangoDups(ini,fin){
  const i=parseInt(ini),f=parseInt(fin);
  if(isNaN(i)||isNaN(f)||f<i)return[];
  const dups=[];
  for(let n=i;n<=f;n++) if(DICT_FOLIOS_REG.has(n)) dups.push(String(n).padStart(ini.length,'0'));
  return dups;
}

function updDictResumen(){
  const ini=document.getElementById('d-ini').value;
  const fin=document.getElementById('d-fin').value;
  const res=document.getElementById('d-resumen');
  const errEl=document.getElementById('d-dup-err');
  if(!ini||!fin){res.style.display='none';errEl.style.display='none';return;}
  const i=parseInt(ini),f=parseInt(fin);
  if(isNaN(i)||isNaN(f)||f<i){res.style.display='none';return;}
  const cant=f-i+1;
  const precio=proveedorUVA.precio||0;
  // Verificar duplicados
  const dups=dictRangoDups(ini,fin);
  if(dups.length>0){
    errEl.style.display='block';
    errEl.textContent=`⚠ ${dups.length} folio(s) ya registrado(s): ${dups.slice(0,5).join(', ')}${dups.length>5?' +más':''}`;
    res.style.display='none';return;
  }
  errEl.style.display='none';
  res.style.display='block';
  document.getElementById('d-res-body').innerHTML=`
    <div style="display:flex;justify-content:space-between;font-size:12px;padding:3px 0;border-bottom:1px solid var(--border)">
      <span style="font-family:var(--mono);color:var(--text3)">${ini} → ${fin}</span>
      <span style="font-weight:500">${cant.toLocaleString()} dictámenes${precio>0?' · $'+(cant*precio).toLocaleString('es-MX',{minimumFractionDigits:2}):''}</span>
    </div>`;
  document.getElementById('d-res-total').textContent=cant.toLocaleString()+' dictámenes'+(precio>0?' · $'+(cant*precio).toLocaleString('es-MX',{minimumFractionDigits:2}):'');
}

function guardarDictamen(){
  if(!validarFechaDict())return;
  const factura=document.getElementById('d-factura').value;
  const fecha=document.getElementById('d-fecha').value;
  const socio=document.getElementById('d-socio').value;
  const ini=document.getElementById('d-ini').value;
  const fin=document.getElementById('d-fin').value;
  if(!factura||!fecha||!socio){alert('Completa factura, fecha y socio.');return;}
  if(!ini||!fin){alert('Captura el folio inicial y final.');return;}
  const i=parseInt(ini),f=parseInt(fin);
  if(isNaN(i)||isNaN(f)||f<i){alert('El folio final debe ser mayor al inicial.');return;}
  const dups=dictRangoDups(ini,fin);
  if(dups.length>0){alert(`Hay folios ya registrados:\n${dups.slice(0,5).join(', ')}${dups.length>5?' +más':''}`);return;}
  const cant=f-i+1;
  const precio=proveedorUVA.precio||0;
  // Registrar folios
  for(let n=i;n<=f;n++) DICT_FOLIOS_REG.add(n);
  dictamenes.unshift({folio:nextFolioDict(),factura,fecha,socio,folioIni:ini,folioFin:fin,cant,precio,notas:document.getElementById('d-notas').value});
  closeModal('modal-dictamen');
  renderDictamenes();
}

titles['papeleria']='Dictámenes de verificación';
breadcrumbs['papeleria']='Papelería';


/* ══════════════════════════════════════════════
   SISTEMA DE AUTENTICACIÓN Y PERMISOS
══════════════════════════════════════════════ */

let usuarios=[
  {nombre:'Administrador',user:'admin',pass:'admin123',pin:'1234',rol:'admin',socio:''},
  {nombre:'Socio A',user:'socioa',pass:'socio123',pin:'1234',rol:'socio',socio:'Socio A'},
  {nombre:'Socio B',user:'sociob',pass:'socio123',pin:'1234',rol:'socio',socio:'Socio B'},
  {nombre:'Socio C',user:'socioc',pass:'socio123',pin:'1234',rol:'socio',socio:'Socio C'},
  {nombre:'Personal Admin',user:'personal',pass:'personal123',pin:'1234',rol:'personal',socio:''},
];

let SESSION={user:null,nombre:'',rol:'',socio:''};

const PERMISOS={
  admin:{
    verTodo:true, editar:true, transferir:true, comprar:true,
    verUsuarios:true, crearUsuarios:true
  },
  socio:{
    verTodo:true, editar:false, editarPropio:true, transferir:true, comprar:false,
    verUsuarios:false, crearUsuarios:false
  },
  personal:{
    verTodo:true, editar:false, editarPropio:false, transferir:true, comprar:true,
    verUsuarios:false, crearUsuarios:false
  },
  verificador:{
    verTodo:false, editar:false, transferir:false, comprar:false,
    verUsuarios:false, crearUsuarios:false, soloApp:true
  },
};

function puedeHacer(accion){
  const p=PERMISOS[SESSION.rol]||{};
  return !!p[accion];
}

function puedeEditarSocio(socio){
  if(SESSION.rol==='admin') return true;
  if(SESSION.rol==='socio') return SESSION.socio===socio;
  return false;
}

/* ── LOGIN / LOGOUT ── */
function doLogin(){
  const user=document.getElementById('login-user').value.trim();
  const pass=document.getElementById('login-pass').value;
  const u=usuarios.find(u=>u.user===user&&u.pass===pass);
  const err=document.getElementById('login-err');
  if(!u){err.style.display='block';document.getElementById('login-pass').value='';return;}
  if(u.rol==='verificador'){err.style.display='block';err.textContent='Los verificadores solo tienen acceso mediante la app móvil.';document.getElementById('login-pass').value='';return;}
  if(u.rol==='verificador'){err.style.display='block';err.textContent='Los verificadores solo tienen acceso a la app móvil.';document.getElementById('login-pass').value='';return;}
  err.style.display='none';
  SESSION={user:u.user,nombre:u.nombre,rol:u.rol,socio:u.socio};
  document.getElementById('login-screen').style.display='none';
  document.getElementById('session-username').textContent=u.nombre;
  const badge=document.getElementById('session-role-badge');
  const rolLabel={admin:'Admin',socio:'Socio',personal:'Personal',verificador:'Verificador'};
  badge.textContent=rolLabel[u.rol]||u.rol;
  badge.className='session-role '+u.rol;
  aplicarPermisos();
  renderAll();
  go('dashboard');
  updNotifPendientes();
}

function doLogout(){
  SESSION={user:null,nombre:'',rol:'',socio:''};
  document.getElementById('login-screen').style.display='flex';
  document.getElementById('login-user').value='';
  document.getElementById('login-pass').value='';
}

/* ── APLICAR PERMISOS UI ── */
function aplicarPermisos(){
  const esAdmin=SESSION.rol==='admin';
  const esPersonal=SESSION.rol==='personal';
  const esSocio=SESSION.rol==='socio';

  // Menú de usuarios: solo admin
  const navAdmin=document.getElementById('nav-admin-group');
  const navUsuarios=document.getElementById('nav-usuarios');
  if(navAdmin) navAdmin.style.display=esAdmin?'':'none';
  if(navUsuarios) navUsuarios.style.display=esAdmin?'':'none';

  // Botones de nueva compra: admin y personal
  const puedeComprar=esAdmin||esPersonal;
  ['btn-nueva-compra','btn-nueva-compra-uva','btn-nueva-compra-dict'].forEach(id=>{
    const el=document.getElementById(id);
    if(el) el.style.display=puedeComprar?'':'none';
  });

  // Pestaña "Mi inventario" en dashboard: solo socios
  const tabInv=document.getElementById('dash-tab-inv');
  if(tabInv) tabInv.style.display=esSocio?'':'none';

  // Filtro de socio en equipo de trabajo: ocultar para socios (solo ven el suyo)
  const filtVSocio=document.getElementById('filtV-socio');
  if(filtVSocio) filtVSocio.style.display=esSocio?'none':'';

  // Botón de nueva recepción: admin y personal
  const puedeRecepcionar=esAdmin||esPersonal;
  const btnRec=document.getElementById('btn-nueva-recepcion');
  if(btnRec) btnRec.style.display=puedeRecepcionar?'':'none';
}

/* ── GESTIÓN DE USUARIOS ── */
function renderUsuarios(){
  document.getElementById('usuarios-list').innerHTML=usuarios.map((u,i)=>`
    <div class="user-row">
      <span style="font-family:var(--mono);font-size:11px">${u.user}</span>
      <span>${u.nombre}</span>
      <span><span class="session-role ${u.rol}" style="font-size:10px">${{admin:'Admin',socio:'Socio',personal:'Personal',verificador:'Verificador'}[u.rol]||u.rol}</span></span>
      <span style="font-size:11px;color:var(--text3)">${u.socio||'—'}</span>
      <span style="display:flex;gap:4px">
        ${u.user!=='admin'?`<button class="btn sm ghost" onclick="editarUsuario(${i})">✏</button>
        <button class="btn sm ghost" style="color:var(--red)" onclick="eliminarUsuario(${i})">✕</button>`:'<span style="font-size:10px;color:var(--text3)">—</span>'}
      </span>
    </div>`).join('');
}

function updRolForm(){
  const rol=document.getElementById('u-rol').value;
  document.getElementById('u-socio-row').style.display=(rol==='socio'||rol==='verificador')?'flex':'none';
  const nota=document.getElementById('u-verificador-nota');
  if(nota) nota.style.display=rol==='verificador'?'block':'none';
}

function editarUsuario(i){
  const u=usuarios[i];
  document.getElementById('modal-usuario-title').textContent='Editar usuario';
  document.getElementById('u-edit-idx').value=i;
  document.getElementById('u-nombre').value=u.nombre;
  document.getElementById('u-user').value=u.user;
  document.getElementById('u-pass').value='';
  document.getElementById('u-pass2').value='';
  document.getElementById('u-rol').value=u.rol;
  document.getElementById('u-socio').value=u.socio||'';
  updRolForm();
  openModal('modal-usuario');
}

function eliminarUsuario(i){
  if(usuarios[i].user===SESSION.user){alert('No puedes eliminar tu propio usuario.');return;}
  if(!confirm(`¿Eliminar usuario "${usuarios[i].nombre}"?`))return;
  usuarios.splice(i,1);
  renderUsuarios();
}

function guardarUsuario(){
  const idx=document.getElementById('u-edit-idx').value;
  const nombre=document.getElementById('u-nombre').value.trim();
  const user=document.getElementById('u-user').value.trim();
  const pass=document.getElementById('u-pass').value;
  const pass2=document.getElementById('u-pass2').value;
  const rol=document.getElementById('u-rol').value;
  const socio=document.getElementById('u-socio').value;

  if(!nombre||!user||!rol){alert('Completa nombre, usuario y rol.');return;}
  if((rol==='socio'||rol==='verificador')&&!socio){alert('Selecciona el socio asignado.');return;}

  const esEdicion=idx!=='';
  if(!esEdicion&&!pass){alert('La contraseña es requerida para nuevos usuarios.');return;}
  if(pass&&pass.length<6){alert('La contraseña debe tener al menos 6 caracteres.');return;}
  if(pass&&pass!==pass2){alert('Las contraseñas no coinciden.');return;}

  // Verificar usuario duplicado
  const dupIdx=usuarios.findIndex(u=>u.user===user);
  if(dupIdx!==-1&&(!esEdicion||dupIdx!==parseInt(idx))){alert('Ese nombre de usuario ya existe.');return;}

  if(esEdicion){
    const u=usuarios[parseInt(idx)];
    u.nombre=nombre;u.user=user;u.rol=rol;u.socio=(rol==='socio'||rol==='verificador')?socio:'';
    if(pass) u.pass=pass;
  } else {
    usuarios.push({nombre,user,pass,rol,socio:(rol==='socio'||rol==='verificador')?socio:''});
  }
  closeModal('modal-usuario');
  renderUsuarios();
}

/* ── GUARD en guardarTransferencia: socio solo transfiere desde lo suyo + PIN ── */
const _guardarTransOrig=guardarTransferencia;
guardarTransferencia=function(){
  if(SESSION.rol==='socio'){
    const de=document.getElementById('tr-de').value;
    const socioOrigen=getSocioDeEntidad(de);
    if(de&&socioOrigen!==SESSION.socio){
      alert('Solo puedes transferir desde tu inventario o el de tus verificadores.');return;
    }
  }
  // Pedir PIN antes de registrar
  const destino=document.getElementById('tr-a').value||'destino';
  const cant=document.getElementById('tr-res-cant').textContent||'';
  pedirPin(
    '🔐 Confirmar transferencia',
    `Ingresa tu PIN para registrar el envío a ${destino}`,
    ()=>{ _guardarTransOrig(); }
  );
};

titles['usuarios']='Gestión de usuarios';
breadcrumbs['usuarios']='Administración';


/* ══════════════════════════════════════════════
   MÓDULO VERIFICADORES
══════════════════════════════════════════════ */

function nextIdVer(){return'VER-'+String(verificadores.length+1).padStart(3,'0');}

/* Folios asignados a verificadores de un socio (para descontarlos del inventario disponible) */
function foliosAsignadosVerificadores(socio, tipo, subtipo){
  const set=new Set();
  verificadores.filter(v=>v.socio===socio).forEach(v=>{
    v.asignaciones.filter(a=>a.tipo===tipo&&(subtipo?a.subtipo===subtipo:true)).forEach(a=>{
      const i=parseInt(a.folioIni),f=parseInt(a.folioFin);
      if(!isNaN(i)&&!isNaN(f)) for(let n=i;n<=f;n++) set.add(n);
    });
  });
  return set;
}

/* Inventario del socio ya descontando lo asignado a verificadores */
function foliosLibresSocioHolo(socio, tipo){
  const disp=foliosHoloDisponibles(socio,tipo);
  const asig=foliosAsignadosVerificadores(socio,'holograma',tipo);
  asig.forEach(n=>disp.delete(n));
  return disp;
}
function foliosLibresSocioUva(socio, tipo){
  const disp=foliosUvaDisponibles(socio,tipo);
  const asig=foliosAsignadosVerificadores(socio,'uva',tipo);
  asig.forEach(n=>disp.delete(n));
  return disp;
}
function foliosLibresSocioDict(socio){
  const disp=foliosDictDisponibles(socio);
  const asig=foliosAsignadosVerificadores(socio,'dictamen','');
  asig.forEach(n=>disp.delete(n));
  return disp;
}

function renderVerificadores(){
  const filtSocio=document.getElementById('filtV-socio').value;
  const filtText=(document.getElementById('filtV-text').value||'').toLowerCase();
  const filtActivo=document.getElementById('filtV-activo').value;

  // Si es socio, solo ve los suyos
  const socioSession=SESSION.rol==='socio'?SESSION.socio:'';

  const lista=verificadores.filter(v=>{
    if(socioSession&&v.socio!==socioSession) return false;
    if(filtSocio&&v.socio!==filtSocio) return false;
    if(filtActivo==='1'&&!v.activo) return false;
    if(filtActivo==='0'&&v.activo) return false;
    if(filtText&&!(v.nombre+v.zona+v.socio).toLowerCase().includes(filtText)) return false;
    return true;
  });

  const AV_COLS={
    'Socio A':'#7B1C3A','Socio B':'#1C3A7B','Socio C':'#1C7B3A'
  };
  const AV_BG={
    'Socio A':'#F5E8EC','Socio B':'#E8ECF5','Socio C':'#E8F5EC'
  };

  document.getElementById('ver-cards').innerHTML=lista.map(v=>{
    // Calcular total asignado a este verificador
    const totalAsig=v.asignaciones.reduce((s,a)=>s+a.cant,0);

    // Mostrar asignaciones agrupadas
    const asigRows=v.asignaciones.map(a=>`
      <div class="ver-asig-row">
        <span>${a.tipo==='holograma'?`<span class="tipo-badge ${TIPO_CLASS[a.subtipo]||'t-s1'}">${TIPO_SHORT[a.subtipo]||a.subtipo}</span>`:
              a.tipo==='uva'?`<span class="tipo-badge t-s1">${a.subtipo}</span>`:
              `<span class="tipo-badge t-an">Dict.</span>`}
          <span style="font-family:var(--mono);font-size:9px;margin-left:4px">${a.folioIni}→${a.folioFin}</span>
        </span>
        <span>${a.cant.toLocaleString()}</span>
      </div>`).join('');

    const canEdit=SESSION.rol==='admin'||(SESSION.rol==='socio'&&SESSION.socio===v.socio)||SESSION.rol==='personal';
    const canTransfer=SESSION.rol==='admin'||(SESSION.rol==='socio'&&SESSION.socio===v.socio)||SESSION.rol==='personal';

    // Inventario actual del verificador
    const invHoloVer=inventarioHoloEntidad(v.nombre);
    const tieneInventario=TIPOS.some(t=>(invHoloVer[t]||0)>0);

    return`<div class="ver-card">
      <div class="ver-card-hd">
        <div class="ver-avatar" style="background:${AV_BG[v.socio]||'var(--surface2)'};color:${AV_COLS[v.socio]||'var(--text1)'}">
          ${v.nombre.split(' ').map(p=>p[0]).slice(0,2).join('')}
        </div>
        <div style="flex:1">
          <div style="font-size:13px;font-weight:600;display:flex;align-items:center;gap:6px">
            ${v.nombre}
            <span style="width:7px;height:7px;border-radius:50%;background:${v.activo?'var(--green)':'var(--text3)'};display:inline-block"></span>
          </div>
          <div style="font-size:11px;color:var(--text3)">${v.zona}</div>
        </div>
        ${canEdit?`<div style="display:flex;gap:4px">
          <button class="btn sm ghost" onclick="abrirAsigVer('${v.id}')" title="Asignar folios desde socio">＋</button>
          <button class="btn sm ghost" onclick="abrirAsigEquipoPatronVer('${v.id}')" title="Asignar equipo patrón">⚖</button>
          <button class="btn sm ghost" onclick="abrirTransVerificador('${v.id}','libre')" title="Transferir inventario">↔</button>
          <button class="btn sm ghost" onclick="editarVerificador('${v.id}')" title="Editar">✏</button>
          <button class="btn sm ghost" onclick="toggleActivoVer('${v.id}')" title="${v.activo?'Desactivar':'Activar'}">${v.activo?'⏸':'▶'}</button>
        </div>`:''}
      </div>
      <div class="det-row"><span class="dl">Socio</span><span class="dv"><span class="chip ${scls(v.socio)}">${INITIALS[v.socio]}</span></span></div>
      <div class="det-row"><span class="dl">Tipo</span><span class="dv"><span class="chip p3" style="text-transform:capitalize">${v.tipoUsuario||'verificador'}</span></span></div>
      <div class="det-row"><span class="dl">Teléfono</span><span class="dv" style="font-size:11px">${v.tel||'—'}</span></div>
      <div class="det-row"><span class="dl">Email</span><span class="dv" style="font-size:11px">${v.email||'—'}</span></div>
      <div class="det-row"><span class="dl">Total asignado</span><span class="dv" style="color:var(--green);font-weight:600">${totalAsig.toLocaleString()}</span></div>
      ${tieneInventario?`<div class="det-row"><span class="dl">En inventario</span><span class="dv" style="color:var(--blue);font-weight:600">${TIPOS.reduce((s,t)=>s+(invHoloVer[t]||0),0).toLocaleString()} holos</span></div>`:''}
      ${v.asignaciones.length>0?`
        <div style="font-size:10px;font-weight:600;color:var(--text3);text-transform:uppercase;letter-spacing:.05em;margin:10px 0 4px">Folios asignados (desde socio)</div>
        ${asigRows}`:''}
      ${canTransfer&&tieneInventario?`
        <div style="margin-top:10px;padding-top:10px;border-top:1px solid var(--border);display:flex;gap:6px;flex-wrap:wrap">
          <button class="btn sm ghost" style="font-size:11px" onclick="abrirTransVerificador('${v.id}','regreso')">↩ Regresar a ${v.socio}</button>
          ${getVerificadoresDeSocio(v.socio).filter(u=>u.nombre!==v.nombre).length>0?`<button class="btn sm ghost" style="font-size:11px" onclick="abrirTransVerificador('${v.id}','otro')">↔ Otro verificador</button>`:''}
        </div>`:''}
    </div>`;
  }).join('');
}

/* ── TRANSFERENCIA DESDE TARJETA DE VERIFICADOR ── */
function abrirTransVerificador(idVer, modo){
  const v=verificadores.find(v=>v.id===idVer);
  if(!v)return;

  // Pre-configurar origen y destino antes de abrir el modal
  window._transOrigen=v.nombre;
  window._transDestino=null;

  if(modo==='regreso'){
    window._transDestino=v.socio;
  } else if(modo==='otro'){
    const otrosVerifs=getVerificadoresDeSocio(v.socio).filter(u=>u.nombre!==v.nombre);
    if(otrosVerifs.length===1) window._transDestino=otrosVerifs[0].nombre;
  }
  // modo 'libre': destino queda libre

  openModal('modal-transferencia');

  // Pre-seleccionar hologramas y actualizar inventario
  document.getElementById('tr-tipo').value='holograma';
  selTipoTrans();
  updTransInventario();
}

function guardarVerificador(){
  const id=document.getElementById('mv-id').value;
  const nombre=document.getElementById('mv-nombre').value.trim();
  const socio=document.getElementById('mv-socio').value;
  const tel=document.getElementById('mv-tel').value.trim();
  const email=document.getElementById('mv-email').value.trim();
  const zona=document.getElementById('mv-zona').value.trim();
  const tipoUsuario=document.getElementById('mv-tipo-usuario').value||'verificador';
  if(!nombre||!socio){alert('Nombre y socio son requeridos.');return;}
  if(id){
    const v=verificadores.find(v=>v.id===id);
    if(v){Object.assign(v,{nombre,socio,tel,email,zona,tipoUsuario});}
  } else {
    verificadores.push({id:nextIdVer(),socio,nombre,tel,email,zona,activo:true,tipoUsuario,asignaciones:[]});
  }
  closeModal('modal-verificador');
  renderVerificadores();
}

function editarVerificador(id){
  const v=verificadores.find(v=>v.id===id);
  if(!v)return;
  document.getElementById('mv-title').textContent='Editar verificador';
  document.getElementById('mv-id').value=id;
  document.getElementById('mv-nombre').value=v.nombre;
  document.getElementById('mv-socio').value=v.socio;
  document.getElementById('mv-tel').value=v.tel;
  document.getElementById('mv-email').value=v.email;
  document.getElementById('mv-zona').value=v.zona;
  document.getElementById('mv-tipo-usuario').value=v.tipoUsuario||'verificador';
  openModal('modal-verificador');
}

function toggleActivoVer(id){
  const v=verificadores.find(v=>v.id===id);
  if(v) v.activo=!v.activo;
  renderVerificadores();
}

/* ── ASIGNACIÓN DE FOLIOS A VERIFICADOR ── */
function abrirAsigVer(id){
  const v=verificadores.find(v=>v.id===id);
  if(!v)return;
  document.getElementById('av-ver-id').value=id;
  document.getElementById('av-nombre').textContent=v.nombre;
  document.getElementById('av-zona').textContent=v.zona+' · '+v.socio;
  document.getElementById('av-tipo').value='';
  document.getElementById('av-subtipo-uva-row').style.display='none';
  document.getElementById('av-folios-row').style.display='none';
  document.getElementById('av-inv-panel').style.display='none';
  document.getElementById('av-resumen').style.display='none';
  document.getElementById('av-err').style.display='none';
  document.getElementById('av-ini').value='';
  document.getElementById('av-fin').value='';
  document.getElementById('av-notas').value='';
  openModal('modal-asig-ver');
}

function selTipoAsigVer(){
  const tipo=document.getElementById('av-tipo').value;
  document.getElementById('av-subtipo-uva-row').style.display=tipo==='uva'?'flex':'none';
  document.getElementById('av-folios-row').style.display=tipo?'grid':'none';
  if(tipo==='holograma'){
    document.getElementById('av-ini-lbl').textContent='Folio inicial (8 dígitos)';
    document.getElementById('av-fin-lbl').textContent='Folio final (8 dígitos)';
    document.getElementById('av-ini').maxLength=8;
    document.getElementById('av-fin').maxLength=8;
    document.getElementById('av-ini').placeholder='10000001';
    document.getElementById('av-fin').placeholder='10000050';
  } else {
    document.getElementById('av-ini-lbl').textContent='Folio inicial (5 dígitos)';
    document.getElementById('av-fin-lbl').textContent='Folio final (5 dígitos)';
    document.getElementById('av-ini').maxLength=5;
    document.getElementById('av-fin').maxLength=5;
    document.getElementById('av-ini').placeholder='00001';
    document.getElementById('av-fin').placeholder='00050';
  }
  document.getElementById('av-ini').value='';
  document.getElementById('av-fin').value='';
  updAsigVerInv();
  updAsigVerResumen();
}

function updAsigVerInv(){
  const id=document.getElementById('av-ver-id').value;
  const v=verificadores.find(v=>v.id===id);
  if(!v)return;
  const tipo=document.getElementById('av-tipo').value;
  const panel=document.getElementById('av-inv-panel');
  if(!tipo){panel.style.display='none';return;}
  panel.style.display='block';
  let html='';
  if(tipo==='holograma'){
    html=TIPOS.map(t=>{
      const set=foliosLibresSocioHolo(v.socio,t);
      if(set.size===0)return'';
      const rangos=setToRangos(set,7,TIPO_DIGIT[t]);
      return`<div style="margin-bottom:6px">
        <span class="tipo-badge ${TIPO_CLASS[t]}">${t}</span>
        <span style="font-size:10px;color:var(--green);font-weight:600;margin-left:6px">${set.size.toLocaleString()} libres</span>
        ${rangos.map(r=>`<div style="font-family:var(--mono);font-size:10px;color:var(--text3);padding:1px 0 1px 12px">${r.ini} → ${r.fin} (${r.cant})</div>`).join('')}
      </div>`;
    }).filter(Boolean).join('') || '<span style="font-size:11px;color:var(--text3);font-style:italic">Sin hologramas libres</span>';
  } else if(tipo==='uva'){
    const st=document.getElementById('av-subtipo-uva').value;
    const tipos=st?[st]:UVA_TIPOS;
    html=tipos.map(t=>{
      const set=foliosLibresSocioUva(v.socio,t);
      if(set.size===0)return'';
      const rangos=setToRangos(set,5,'');
      return`<div style="margin-bottom:6px">
        <span class="tipo-badge t-s1">${t}</span>
        <span style="font-size:10px;color:var(--green);font-weight:600;margin-left:6px">${set.size.toLocaleString()} libres</span>
        ${rangos.map(r=>`<div style="font-family:var(--mono);font-size:10px;color:var(--text3);padding:1px 0 1px 12px">${r.ini} → ${r.fin} (${r.cant})</div>`).join('')}
      </div>`;
    }).filter(Boolean).join('') || '<span style="font-size:11px;color:var(--text3);font-style:italic">Sin etiquetas UVA libres</span>';
  } else if(tipo==='dictamen'){
    const set=foliosLibresSocioDict(v.socio);
    if(set.size===0){html='<span style="font-size:11px;color:var(--text3);font-style:italic">Sin dictámenes libres</span>';}
    else{
      const rangos=setToRangos(set,5,'');
      html=`<span style="font-size:10px;color:var(--amber);font-weight:600">${set.size.toLocaleString()} libres</span>
      ${rangos.map(r=>`<div style="font-family:var(--mono);font-size:10px;color:var(--text3);padding:1px 0 1px 12px">${r.ini} → ${r.fin} (${r.cant})</div>`).join('')}`;
    }
  }
  document.getElementById('av-inv-body').innerHTML=html;
}

function updAsigVerResumen(){
  const tipo=document.getElementById('av-tipo').value;
  const ini=document.getElementById('av-ini').value.trim();
  const fin=document.getElementById('av-fin').value.trim();
  const res=document.getElementById('av-resumen');
  const err=document.getElementById('av-err');
  if(!ini||!fin){res.style.display='none';err.style.display='none';return;}

  const id=document.getElementById('av-ver-id').value;
  const v=verificadores.find(v=>v.id===id);
  if(!v)return;

  let cant=0,label='',foliosStr='',errMsg='';

  if(tipo==='holograma'){
    const pIni=parseFolioHolo(ini),pFin=parseFolioHolo(fin);
    if(!pIni||!pFin){errMsg='Folios inválidos.';}
    else if(pIni.tipoDigit!==pFin.tipoDigit){errMsg='Los tipos del folio inicial y final deben coincidir.';}
    else if(pFin.numInt<pIni.numInt){errMsg='El folio final debe ser mayor al inicial.';}
    else{
      const st=pIni.tipo; // inferido del folio
      const libres=foliosLibresSocioHolo(v.socio,st);
      const noDisp=[];
      for(let n=pIni.numInt;n<=pFin.numInt;n++) if(!libres.has(n)) noDisp.push(TIPO_DIGIT[st]+String(n).padStart(7,'0'));
      if(noDisp.length>0) errMsg=`${noDisp.length} folio(s) no disponibles: ${noDisp.slice(0,3).join(', ')}${noDisp.length>3?' +más':''}`;
      else{cant=pFin.numInt-pIni.numInt+1;label=`Hologramas ${st}`;foliosStr=`${ini} → ${fin}`;}
    }
  } else if(tipo==='uva'){
    const st=document.getElementById('av-subtipo-uva').value;
    if(!st){res.style.display='none';return;}
    const i=parseInt(ini),f=parseInt(fin);
    if(isNaN(i)||isNaN(f)||f<i){errMsg='El folio final debe ser mayor al inicial.';}
    else{
      const libres=foliosLibresSocioUva(v.socio,st);
      const noDisp=[];
      for(let n=i;n<=f;n++) if(!libres.has(n)) noDisp.push(String(n).padStart(5,'0'));
      if(noDisp.length>0) errMsg=`${noDisp.length} folio(s) no disponibles: ${noDisp.slice(0,3).join(', ')}${noDisp.length>3?' +más':''}`;
      else{cant=f-i+1;label=`UVA ${st}`;foliosStr=`${ini} → ${fin}`;}
    }
  } else if(tipo==='dictamen'){
    const i=parseInt(ini),f=parseInt(fin);
    if(isNaN(i)||isNaN(f)||f<i){errMsg='El folio final debe ser mayor al inicial.';}
    else{
      const libres=foliosLibresSocioDict(v.socio);
      const noDisp=[];
      for(let n=i;n<=f;n++) if(!libres.has(n)) noDisp.push(String(n).padStart(5,'0'));
      if(noDisp.length>0) errMsg=`${noDisp.length} folio(s) no disponibles: ${noDisp.slice(0,3).join(', ')}${noDisp.length>3?' +más':''}`;
      else{cant=f-i+1;label='Dictámenes';foliosStr=`${ini} → ${fin}`;}
    }
  }

  if(errMsg){err.style.display='block';err.textContent=`⚠ ${errMsg}`;res.style.display='none';}
  else if(cant>0){
    err.style.display='none';res.style.display='block';
    document.getElementById('av-res-label').textContent=label;
    document.getElementById('av-res-folios').textContent=foliosStr;
    document.getElementById('av-res-cant').textContent=cant.toLocaleString()+' folios';
  }
}

function guardarAsigVer(){
  const id=document.getElementById('av-ver-id').value;
  const v=verificadores.find(v=>v.id===id);
  if(!v)return;
  const tipo=document.getElementById('av-tipo').value;
  const ini=document.getElementById('av-ini').value.trim();
  const fin=document.getElementById('av-fin').value.trim();
  if(!tipo||!ini||!fin){alert('Completa todos los campos.');return;}
  let subtipo='',cant=0;
  if(tipo==='holograma'){
    const p=parseFolioHolo(ini),f=parseFolioHolo(fin);
    if(!p||!f){alert('Folios inválidos.');return;}
    if(p.tipoDigit!==f.tipoDigit){alert('Los tipos del folio inicial y final deben coincidir.');return;}
    if(f.numInt<p.numInt){alert('El folio final debe ser mayor al inicial.');return;}
    subtipo=p.tipo;
    cant=f.numInt-p.numInt+1;
    // Validar que los folios estén libres (no asignados a otro verificador)
    const libres=foliosLibresSocioHolo(v.socio,subtipo);
    const noDisp=[];
    for(let n=p.numInt;n<=f.numInt;n++) if(!libres.has(n)) noDisp.push(TIPO_DIGIT[subtipo]+String(n).padStart(7,'0'));
    if(noDisp.length>0){
      alert(`⚠ ${noDisp.length} folio(s) no disponibles (ya asignados a otro verificador o fuera del inventario):\n${noDisp.slice(0,5).join(', ')}${noDisp.length>5?' +más':''}`);return;
    }
  } else if(tipo==='uva'){
    subtipo=document.getElementById('av-subtipo-uva').value;
    if(!subtipo){alert('Selecciona el tipo de etiqueta.');return;}
    const i=parseInt(ini),f=parseInt(fin);
    if(isNaN(i)||isNaN(f)||f<i){alert('El folio final debe ser mayor al inicial.');return;}
    cant=f-i+1;
    // Validar disponibilidad UVA
    const libres=foliosLibresSocioUva(v.socio,subtipo);
    const noDisp=[];
    for(let n=i;n<=f;n++) if(!libres.has(n)) noDisp.push(String(n).padStart(5,'0'));
    if(noDisp.length>0){
      alert(`⚠ ${noDisp.length} folio(s) UVA no disponibles (ya asignados o fuera del inventario):\n${noDisp.slice(0,5).join(', ')}${noDisp.length>5?' +más':''}`);return;
    }
  } else {
    // Dictamen
    const i=parseInt(ini),f=parseInt(fin);
    if(isNaN(i)||isNaN(f)||f<i){alert('El folio final debe ser mayor al inicial.');return;}
    cant=f-i+1;
    const libres=foliosLibresSocioDict(v.socio);
    const noDisp=[];
    for(let n=i;n<=f;n++) if(!libres.has(n)) noDisp.push(String(n).padStart(5,'0'));
    if(noDisp.length>0){
      alert(`⚠ ${noDisp.length} folio(s) de dictamen no disponibles:\n${noDisp.slice(0,5).join(', ')}${noDisp.length>5?' +más':''}`);return;
    }
  }
  if(cant<=0){alert('El folio final debe ser mayor al inicial.');return;}
  v.asignaciones.push({tipo,subtipo,folioIni:ini,folioFin:fin,cant,fecha:getTodayMX(),notas:document.getElementById('av-notas').value});
  closeModal('modal-asig-ver');
  renderVerificadores();
}

titles['verificadores']='Equipo de trabajo';
breadcrumbs['verificadores']='Catálogos';


/* ── CONFIRMACIÓN DE TRANSFERENCIAS ── */

/* Aprobación de socio emisor o receptor en flujo de 4 partes */
function aprobarTransSocio(folio, parte){
  const t=transferencias.find(t=>t.folio===folio);
  if(!t)return;
  if(parte==='emisor'&&t.estado!=='aprobacion_socio_emisor')return;
  if(parte==='receptor'&&t.estado!=='aprobacion_socio_receptor')return;
  const accion=parte==='emisor'?'aprobar el envío de':'aprobar la recepción de';
  if(!confirm(`¿Confirmar ${accion} ${t.cant.toLocaleString()} ${t.tipo}(s)?\nDe: ${t.de} → A: ${t.a}\nFolios: ${t.folioIni} → ${t.folioFin}`))return;
  if(parte==='emisor'){
    t.estado='aprobacion_socio_receptor';
    t.aprobSocioEmisor=SESSION.user;
  } else {
    // Ambos socios aprobaron — pasa a pendiente (espera PIN del receptor)
    t.estado='pendiente';
    t.aprobSocioReceptor=SESSION.user;
  }
  renderTransferencias();updNotifPendientes();
}

/* El receptor confirma la recepción — requiere PIN */
function confirmarTrans(folio){
  const t=transferencias.find(t=>t.folio===folio);
  if(!t||t.estado!=='pendiente')return;
  pedirPin(
    '🔐 Confirmar recepción',
    `${t.cant.toLocaleString()} ${t.tipo}(s) de ${t.de} · Folios ${t.folioIni}→${t.folioFin}`,
    ()=>{
      t.estado='confirmada';
      t.fechaConfirm=getTodayMX();
      t.confirmadaPor=SESSION.user;
      renderTransferencias();
      updNotifPendientes();
      if(document.getElementById('dash-panel-inventario').classList.contains('active')) renderInvPersonal();
      alert('✓ Transferencia confirmada. Los folios ya están en tu inventario.');
    }
  );
}

function rechazarTrans(folio){
  const t=transferencias.find(t=>t.folio===folio);
  if(!t||(t.estado!=='pendiente'&&t.estado!=='aprobacion_socio_emisor'&&t.estado!=='aprobacion_socio_receptor'))return;
  if(!confirm(`¿Rechazar la transferencia de ${t.cant.toLocaleString()} ${t.tipo}(s)?`))return;
  t.estado='rechazada';t.fechaConfirm=getTodayMX();t.confirmadaPor=SESSION.user;
  renderTransferencias();updNotifPendientes();
}

function cancelarTrans(folio){
  const t=transferencias.find(t=>t.folio===folio);
  if(!t||(t.estado!=='pendiente'&&t.estado!=='aprobacion_socio_emisor'&&t.estado!=='aprobacion_socio_receptor'))return;
  if(!confirm('¿Cancelar esta transferencia?'))return;
  t.estado='rechazada';
  renderTransferencias();updNotifPendientes();
}

function updNotifPendientes(){
  const btn=document.getElementById('btn-pendientes');
  if(!btn||!SESSION.socio)return;

  // Aprobaciones pendientes del socio emisor
  const porAprobarE=transferencias.filter(t=>t.estado==='aprobacion_socio_emisor'&&(t.socioEmisor||getSocioDeEntidad(t.de))===SESSION.socio);
  // Aprobaciones pendientes del socio receptor
  const porAprobarR=transferencias.filter(t=>t.estado==='aprobacion_socio_receptor'&&(t.socioReceptor||getSocioDeEntidad(t.a))===SESSION.socio);
  // Pendientes normales para confirmar recepción
  const porRecibir=transferencias.filter(t=>t.estado==='pendiente'&&(t.a===SESSION.socio||getSocioDeEntidad(t.a)===SESSION.socio));

  const total=porAprobarE.length+porAprobarR.length+porRecibir.length;
  if(total===0){btn.style.display='none';document.getElementById('panel-pendientes').style.display='none';return;}

  btn.style.display='block';
  document.getElementById('btn-pendientes-cnt').textContent=total;

  const renderItem=(t,btnHtml)=>`
    <div style="padding:10px 0;border-bottom:1px solid var(--border)">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
        <span style="font-family:var(--mono);font-size:11px;color:var(--blue)">${t.folio}</span>
        <span style="font-size:10px;color:var(--text3)">${t.fecha}</span>
      </div>
      <div style="font-size:12px;margin-bottom:2px">
        <strong>${t.de}</strong> → <strong>${t.a}</strong> · <strong>${t.cant.toLocaleString()}</strong> ${t.tipo}
        ${t.subtipo&&t.subtipo!=='Dictamen'?`<span class="tipo-badge t-s1" style="font-size:9px">${t.subtipo}</span>`:''}
      </div>
      <div style="font-family:var(--mono);font-size:10px;color:var(--text3);margin-bottom:8px">${t.folioIni} → ${t.folioFin}</div>
      <div style="display:flex;gap:6px">${btnHtml}</div>
    </div>`;

  let html='';
  if(porAprobarE.length>0){
    html+=`<div style="font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.05em;color:var(--amber);margin-bottom:6px">Aprobar envío (${porAprobarE.length})</div>`;
    html+=porAprobarE.map(t=>renderItem(t,
      `<button class="btn sm success" onclick="aprobarTransSocio('${t.folio}','emisor');document.getElementById('panel-pendientes').style.display='none'" style="flex:1;justify-content:center">✓ Aprobar envío</button>
       <button class="btn sm ghost" style="color:var(--red);flex:1;justify-content:center" onclick="rechazarTrans('${t.folio}');document.getElementById('panel-pendientes').style.display='none'">✕ Rechazar</button>`
    )).join('');
  }
  if(porAprobarR.length>0){
    html+=`<div style="font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.05em;color:var(--purple);margin:10px 0 6px">Aprobar recepción (${porAprobarR.length})</div>`;
    html+=porAprobarR.map(t=>renderItem(t,
      `<button class="btn sm success" onclick="aprobarTransSocio('${t.folio}','receptor');document.getElementById('panel-pendientes').style.display='none'" style="flex:1;justify-content:center">✓ Aprobar recepción</button>
       <button class="btn sm ghost" style="color:var(--red);flex:1;justify-content:center" onclick="rechazarTrans('${t.folio}');document.getElementById('panel-pendientes').style.display='none'">✕ Rechazar</button>`
    )).join('');
  }
  if(porRecibir.length>0){
    html+=`<div style="font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.05em;color:var(--green);margin:10px 0 6px">Confirmar recepción (${porRecibir.length})</div>`;
    html+=porRecibir.map(t=>renderItem(t,
      `<button class="btn sm success" onclick="confirmarTrans('${t.folio}');document.getElementById('panel-pendientes').style.display='none'" style="flex:1;justify-content:center">🔐 Confirmar</button>
       <button class="btn sm ghost" style="color:var(--red);flex:1;justify-content:center" onclick="rechazarTrans('${t.folio}');document.getElementById('panel-pendientes').style.display='none'">✕ Rechazar</button>`
    )).join('');
  }
  document.getElementById('panel-pendientes-body').innerHTML=html;
}

function togglePendientes(){
  const p=document.getElementById('panel-pendientes');
  p.style.display=p.style.display==='none'?'block':'none';
}

/* ── SIDEBAR MÓVIL ── */
function toggleSidebar(){
  document.querySelector('.sidebar').classList.toggle('open');
  document.getElementById('sidebar-overlay').classList.toggle('open');
  document.body.style.overflow=document.querySelector('.sidebar').classList.contains('open')?'hidden':'';
}
function closeSidebar(){
  document.querySelector('.sidebar').classList.remove('open');
  document.getElementById('sidebar-overlay').classList.remove('open');
  document.body.style.overflow='';
}
// Cerrar sidebar al navegar en móvil
const _goOrig=go;
function renderAll(){renderCompras();renderRec();renderInv();renderDash();renderTransferencias();renderDictamenes();if(SESSION.rol==='admin')renderUsuarios();}

/* ══════════════════════════════════════════════
   SISTEMA DE PIN
══════════════════════════════════════════════ */
let _pinBuffer='';
let _pinCallback=null;
const PIN_LEN=4;

function pedirPin(titulo, desc, callback){
  _pinBuffer='';
  _pinCallback=callback;
  document.getElementById('pin-titulo').textContent=titulo;
  document.getElementById('pin-desc').textContent=desc;
  document.getElementById('pin-err').textContent='';
  _pintUpdDots();
  openModal('modal-pin');
  // Soporte teclado
  document.getElementById('modal-pin').onkeydown=function(e){
    if(e.key>='0'&&e.key<='9') pinKey(e.key);
    else if(e.key==='Backspace') pinDel();
    else if(e.key==='Escape'){closeModal('modal-pin');_pinCallback=null;}
  };
}

function pinKey(d){
  if(_pinBuffer.length>=PIN_LEN) return;
  _pinBuffer+=d;
  _pintUpdDots();
  if(_pinBuffer.length===PIN_LEN) _pinVerify();
}

function pinDel(){
  _pinBuffer=_pinBuffer.slice(0,-1);
  document.getElementById('pin-err').textContent='';
  _pintUpdDots(false);
}

function _pintUpdDots(error=false){
  for(let i=0;i<PIN_LEN;i++){
    const dot=document.getElementById('pd'+i);
    dot.classList.toggle('filled',i<_pinBuffer.length);
    dot.classList.toggle('error',error);
  }
}

function _pinVerify(){
  // El PIN es el campo 'pin' del usuario en sesión (separado de la contraseña de acceso)
  const u=usuarios.find(u=>u.user===SESSION.user);
  if(u&&_pinBuffer===(u.pin||u.pass)){
    closeModal('modal-pin');
    const cb=_pinCallback;
    _pinCallback=null;
    _pinBuffer='';
    if(cb) cb();
  } else {
    _pintUpdDots(true);
    document.getElementById('pin-err').textContent='PIN incorrecto. Inténtalo de nuevo.';
    setTimeout(()=>{
      _pinBuffer='';
      _pintUpdDots(false);
      document.getElementById('pin-err').textContent='';
    },900);
  }
}
// Arrancar con login
document.getElementById('login-user').focus();