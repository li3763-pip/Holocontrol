// Shared utility functions

function toast(msg,type=''){
  const t=document.getElementById('toast');
  t.textContent=msg; t.className='toast show'+(type?' '+type:'');
  clearTimeout(window._tt);
  window._tt=setTimeout(()=>t.classList.remove('show'),2800);
}

// TODO: extraer funciones de render.js
// function onCPInput(val){ ... }  // depende de buscarCP() y otros helpers
// function obtenerUTM(){ ... }    // depende de setGPSbtnState(), ubicarPorIP(), setUTMfromCoords()
