# Holocontrol — Sistema de Verificación de Básculas NOM-010

Sistema de gestión para la verificación de básculas conforme a la **NOM-010-SCFI-1994**. Consta de dos aplicaciones web:

- 📱 **App Verificador** — Aplicación móvil para verificadores de campo
- 🖥️ **Panel Admin** — Sistema de gestión para socios y personal administrativo

---

## 📁 Estructura del proyecto

```
Holocontrol/
│
├── data/
│   └── catalogo_nom010_v22.xlsx        ← Catálogo oficial NOM-010 v22
│
├── src/
│   ├── shared/                         ← Código compartido entre ambas apps
│   │   ├── assets/
│   │   │   └── fonts.css
│   │   ├── css/
│   │   │   └── variables.css
│   │   └── js/
│   │       ├── auth.js
│   │       ├── catalog.js              ← Catálogo NOM-010 (DGN_CATALOG)
│   │       └── utils.js
│   │
│   └── apps/
│       ├── verificador/                ← App móvil del verificador
│       │   ├── index.html
│       │   ├── css/
│       │   │   ├── base.css
│       │   │   ├── components.css
│       │   │   └── screens.css
│       │   └── js/
│       │       ├── auth.js
│       │       ├── dictamen.js
│       │       ├── hologramas.js
│       │       ├── instrumentos.js
│       │       └── render.js
│       │
│       └── admin/                      ← Panel de administración
│           ├── index.html
│           ├── css/
│           │   ├── base.css
│           │   ├── components.css
│           │   └── responsive.css
│           └── js/
│               ├── auth.js
│               ├── compras.js
│               ├── dashboard.js
│               ├── inventario.js
│               ├── papeleria.js
│               ├── proveedores.js
│               ├── recepciones.js
│               ├── socios.js
│               ├── transferencias.js
│               ├── usuarios.js
│               └── verificadores.js
│
├── docs/
│   ├── arquitectura.md
│   └── flujo-verificacion.md
│
├── app_verificador_basculas.html       ← Versión legacy (referencia)
├── holo_control_sistema_completo.html  ← Versión legacy (referencia)
└── README.md
```

---

## 🚀 Cómo usar en Windows

No se necesita instalar nada. El proyecto funciona directamente en el navegador.

### Requisitos
- Windows 10 u 11
- Navegador web moderno (Google Chrome, Microsoft Edge o Firefox)

### Pasos para abrir las aplicaciones

#### Opción 1 — Desde el Explorador de archivos (más fácil)

1. Descarga o clona el repositorio:
   - Entra a [https://github.com/li3763-pip/Holocontrol](https://github.com/li3763-pip/Holocontrol)
   - Haz clic en el botón verde **`Code`** → **`Download ZIP`**
   - Extrae el ZIP en una carpeta de tu computadora (por ejemplo `C:\Holocontrol`)

2. Abre la carpeta extraída con el Explorador de archivos de Windows

3. Para abrir la **App del Verificador**:
   - Navega a `src\apps\verificador\`
   - Haz doble clic en `index.html`
   - Se abrirá automáticamente en tu navegador predeterminado

4. Para abrir el **Panel de Administración**:
   - Navega a `src\apps\admin\`
   - Haz doble clic en `index.html`
   - Se abrirá automáticamente en tu navegador predeterminado

#### Opción 2 — Usando Git (recomendado para desarrollo)

1. Instala [Git para Windows](https://git-scm.com/download/win) si no lo tienes

2. Abre la aplicación **Git Bash** o el **Símbolo del sistema (CMD)**

3. Ejecuta los siguientes comandos:

```bat
git clone https://github.com/li3763-pip/Holocontrol.git
cd Holocontrol
```

4. Abre los archivos:

```bat
REM App del Verificador
start src\apps\verificador\index.html

REM Panel de Administración
start src\apps\admin\index.html
```

### ⚠️ Nota sobre el navegador

Se recomienda usar **Google Chrome** o **Microsoft Edge** para mejor compatibilidad, especialmente para:
- La función de obtener ubicación GPS (coordenadas UTM)
- La cámara para evidencia fotográfica
- El almacenamiento local (`localStorage`)

---

## 📱 App del Verificador

Diseñada para usarse en **dispositivos móviles** (teléfono o tablet). Permite a los verificadores de campo:

- Iniciar sesión con su usuario y contraseña
- Registrar nuevas solicitudes de inspección paso a paso:
  1. Datos del cliente y dirección
  2. Instrumentos a verificar (con búsqueda en catálogo NOM-010)
  3. Dictamen de inspección y hologramas
  4. Recibo de pago y evidencia fotográfica
- Consultar el historial de dictámenes
- Sincronizar registros

### Usuarios de prueba

| Usuario | Contraseña | Nombre | Zona |
|---------|------------|--------|------|
| `verif1` | `campo123` | Carlos Ramírez | Zona Norte |
| `verif2` | `campo123` | Laura Mendoza | Zona Sur |
| `verif3` | `campo123` | Héctor Sosa | Zona Centro |

---

## 🖥️ Panel de Administración

Diseñado para usarse en **computadora de escritorio**. Permite a socios y personal administrativo:

- Gestionar órdenes de compra de hologramas
- Registrar recepciones de material
- Controlar el inventario por socio y tipo
- Gestionar transferencias entre socios
- Administrar verificadores y sus asignaciones
- Controlar catálogos de socios y proveedores
- Gestionar papelería y dictámenes
- Administrar usuarios del sistema

---

## 📋 Tareas pendientes

- [ ] Vincular la app del verificador con el panel web (#1)
- [ ] Agregar catálogo de equipo patrón y vincularlo con la app (#2)
- [ ] Completar el catálogo de básculas (#3)

---

## 📄 Documentación adicional

Consulta la carpeta `docs/` para más detalles:
- `docs/arquitectura.md` — Descripción técnica de la arquitectura
- `docs/flujo-verificacion.md` — Flujo del proceso de verificación NOM-010

---

## 📌 Versión

`v2.5.0 · RC-38 r1` — Sistema de verificación NOM-010-SCFI-1994