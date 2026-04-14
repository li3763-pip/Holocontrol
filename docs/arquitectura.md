# Arquitectura del Sistema Holocontrol

## Descripción General

Holocontrol es un sistema web para la gestión y verificación de básculas e
instrumentos de medición bajo la norma **NOM-010-SCFI** (verificación
metrológica). Consta de dos aplicaciones independientes:

| Aplicación | Descripción | Público objetivo |
|---|---|---|
| **HoloVerifica** | App móvil para verificadores de campo | Técnicos verificadores |
| **HoloControl** | Panel administrativo de escritorio | Personal administrativo |

---

## Estructura de Carpetas

```
Holocontrol/
├── data/
│   └── catalogo_nom010_v22.xlsx   # Catálogo oficial NOM-010
├── src/
│   ├── shared/                    # Recursos compartidos
│   │   ├── assets/
│   │   │   └── fonts.css          # Importación de fuentes Google
│   │   ├── css/
│   │   │   └── variables.css      # Variables CSS compartidas (placeholder)
│   │   └── js/
│   │       ├── auth.js            # Auth compartida (placeholder)
│   │       ├── catalog.js         # Catálogo DGN NOM-010 extraído
│   │       └── utils.js           # Utilidades compartidas (placeholder)
│   ├── apps/
│   │   ├── verificador/           # App HoloVerifica (móvil)
│   │   │   ├── index.html
│   │   │   ├── css/
│   │   │   │   ├── base.css       # Reset, variables, layout
│   │   │   │   ├── components.css # Componentes reutilizables
│   │   │   │   └── screens.css    # Pantallas específicas
│   │   │   └── js/
│   │   │       ├── render.js      # Lógica principal (todo el JS)
│   │   │       ├── auth.js        # Stub → ver render.js
│   │   │       ├── dictamen.js    # Stub → ver render.js
│   │   │       ├── hologramas.js  # Stub → ver render.js
│   │   │       └── instrumentos.js# Stub → ver render.js
│   │   └── admin/                 # Panel HoloControl (escritorio)
│   │       ├── index.html
│   │       ├── css/
│   │       │   ├── base.css       # Layout y estructura
│   │       │   ├── components.css # Componentes de UI
│   │       │   └── responsive.css # Media queries
│   │       └── js/
│   │           ├── usuarios.js    # Lógica principal (todo el JS)
│   │           ├── auth.js        # Stub → ver usuarios.js
│   │           ├── dashboard.js   # Stub → ver usuarios.js
│   │           ├── compras.js     # Stub → ver usuarios.js
│   │           ├── recepciones.js # Stub → ver usuarios.js
│   │           ├── inventario.js  # Stub → ver usuarios.js
│   │           ├── transferencias.js # Stub → ver usuarios.js
│   │           ├── verificadores.js  # Stub → ver usuarios.js
│   │           ├── socios.js      # Stub → ver usuarios.js
│   │           ├── proveedores.js # Stub → ver usuarios.js
│   │           └── papeleria.js   # Stub → ver usuarios.js
└── docs/
    ├── arquitectura.md            # Este archivo
    └── flujo-verificacion.md      # Flujo del proceso de verificación
```

---

## Cómo Ejecutar Cada Aplicación

### App Verificador (Móvil)

Abrir en un servidor HTTP local (no funciona con `file://` por CORS):

```bash
# Con Python
python3 -m http.server 8080 --directory .
# Luego abrir: http://localhost:8080/src/apps/verificador/
```

O bien abrir directamente `src/apps/verificador/index.html` desde un servidor
web (nginx, Apache, VS Code Live Server, etc.).

### Panel Administrativo (Escritorio)

```bash
python3 -m http.server 8080 --directory .
# Luego abrir: http://localhost:8080/src/apps/admin/
```

---

## Descripción de Módulos

### `src/shared/js/catalog.js`
Contiene las constantes del catálogo NOM-010:
- `DGN_CATALOG` — Índice de instrumentos por número DGN
- `MARCAS_INDEX` — Índice de marcas
- `MARCAS_NOM010` — Marcas aprobadas
- `TIPOS_NOM010` — Tipos de instrumentos
- `getModelosDeMarca()` — Función auxiliar de búsqueda

### `src/apps/verificador/js/render.js`
Módulo principal de la app verificador. Contiene:
- Estado global (`SESSION`, `registros`, etc.)
- Lógica de autenticación (`doLogin`, `doLogout`)
- Funciones de renderizado (`renderHome`, `renderHist`, `renderPerf`)
- Gestión de dictámenes (`openNuevo`, `guardarDictamen`, etc.)
- Gestión de instrumentos y hologramas

### `src/apps/admin/js/usuarios.js`
Módulo principal del panel administrativo. Contiene toda la lógica de:
- Autenticación con PIN
- Dashboard y métricas
- Gestión de compras, recepciones, inventario
- Transferencias, verificadores, socios, proveedores, papelería

---

## Deuda Técnica

Los módulos JS marcados como "Stub" deben ser refactorizados en el futuro para
extraer cada función a su módulo correspondiente, siguiendo el principio de
responsabilidad única. Ver `docs/flujo-verificacion.md` para el contexto
funcional.
