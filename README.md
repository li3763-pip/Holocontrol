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

1. Descarga el repositorio:
   - Entra a https://github.com/li3763-pip/Holocontrol
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

2. Abre **Git Bash** o el **Símbolo del sistema (CMD)**

3. Ejecuta los siguientes comandos:

```bat
git clone https://github.com/li3763-pip/Holocontrol.git
cd Holocontrol
```

4. Abre las apps:

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

## 📲 Cómo ver la app en el celular

La **App del Verificador** está diseñada para usarse en el celular. Hay dos formas de abrirla desde tu teléfono:

### Opción A — Usando GitHub Pages (recomendado, sin instalar nada)

El proyecto tiene GitHub Pages activado. Una vez que el PR sea aprobado y se haga merge, la app estará disponible en línea en:

```
https://li3763-pip.github.io/Holocontrol/src/apps/verificador/index.html
```

Solo abre esa URL desde el navegador de tu celular (Chrome o Safari).

### Opción B — Desde tu computadora con servidor local (red WiFi)

Esta opción permite abrir la app en el celular usando tu red WiFi local, sin necesidad de internet.

#### Paso 1 — Instalar Python (si no lo tienes)

1. Descarga Python desde https://www.python.org/downloads/
2. Durante la instalación, marca la casilla **"Add Python to PATH"**
3. Haz clic en **Install Now**

#### Paso 2 — Levantar un servidor local

1. Abre el **Símbolo del sistema (CMD)** y navega a la carpeta del proyecto:

```bat
cd C:\Holocontrol
```

2. Inicia el servidor con Python:

```bat
python -m http.server 8080
```

3. Verás un mensaje como:
```
Serving HTTP on 0.0.0.0 port 8080 (http://0.0.0.0:8080/) ...
```

#### Paso 3 — Obtener la IP de tu computadora

1. Abre otra ventana del **CMD** y ejecuta:

```bat
ipconfig
```

2. Busca la línea que dice **"Dirección IPv4"**, por ejemplo:
```
Dirección IPv4. . . . . . . . . . . : 192.168.1.100
```

#### Paso 4 — Abrir en el celular

1. Asegúrate de que tu celular esté conectado a la **misma red WiFi** que tu computadora
2. Abre el navegador de tu celular (Chrome recomendado)
3. Escribe la siguiente URL (usando la IP que obtuviste):

```
http://192.168.1.100:8080/src/apps/verificador/index.html
```

> 💡 Cambia `192.168.1.100` por la IP real de tu computadora

#### Paso 5 — Agregar al inicio (opcional)

Para acceder más rápido desde el celular sin escribir la URL cada vez:

**En Android (Chrome):**
1. Abre la URL en Chrome
2. Toca los tres puntos (⋮) del menú
3. Selecciona **"Agregar a pantalla de inicio"**
4. La app aparecerá como un ícono en tu pantalla

**En iPhone (Safari):**
1. Abre la URL en Safari
2. Toca el botón de compartir (□↑)
3. Selecciona **"Agregar a pantalla de inicio"**
4. La app aparecerá como un ícono en tu pantalla

### ⚠️ Notas importantes para el celular

- El servidor local (`python -m http.server`) debe estar corriendo en la computadora mientras uses la app en el celular
- El celular y la computadora deben estar en la **misma red WiFi**
- Usa **Chrome** en Android o **Safari** en iPhone para mejor compatibilidad
- Las funciones de **GPS** y **cámara** funcionan mejor en el celular que en la computadora

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