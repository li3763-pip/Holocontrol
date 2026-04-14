// Autenticación — App Verificador

const USUARIOS = [
  { user:'verif1', pass:'campo123', nombre:'Carlos Ramírez', socio:'Socio A', zona:'Zona Norte',
    inv:{ dict:48, s1:25, s2:10, uva:30 },
    fdIni:100, fdFin:147, fs1:'S10000100→S10000124', fs2:'S20000050→S20000059' },
  { user:'verif2', pass:'campo123', nombre:'Laura Mendoza', socio:'Socio B', zona:'Zona Sur',
    inv:{ dict:62, s1:40, s2:0, uva:15 },
    fdIni:200, fdFin:261, fs1:'S10000200→S10000239', fs2:'—' },
  { user:'verif3', pass:'campo123', nombre:'Héctor Sosa', socio:'Socio A', zona:'Zona Centro',
    inv:{ dict:15, s1:8, s2:5, uva:0 },
    fdIni:400, fdFin:414, fs1:'S10000300→S10000307', fs2:'S20000100→S20000104' },
];

function doLogin(){
  const u = document.getElementById('l-user').value.trim().toLowerCase();
  const p = document.getElementById('l-pass').value;
  const f = USUARIOS.find(v=>v.user===u && v.pass===p);
  if(!f){ document.getElementById('l-err').style.display='block'; document.getElementById('l-pass').value=''; return; }
  document.getElementById('l-err').style.display='none';
  SESSION = JSON.parse(JSON.stringify(f)); // copia profunda para mutar inventario sin afectar USUARIOS
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
