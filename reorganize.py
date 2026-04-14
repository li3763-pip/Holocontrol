#!/usr/bin/env python3
"""Reorganizes the Holocontrol monolithic HTML files into a modular structure."""
import os
import re
import shutil

BASE = "/home/runner/work/Holocontrol/Holocontrol"

# ── Directory structure ────────────────────────────────────────────────────────
DIRS = [
    "data",
    "src/shared/css",
    "src/shared/js",
    "src/shared/assets",
    "src/apps/verificador/css",
    "src/apps/verificador/js",
    "src/apps/admin/css",
    "src/apps/admin/js",
    "docs",
]

for d in DIRS:
    os.makedirs(os.path.join(BASE, d), exist_ok=True)

# ── Read source files ─────────────────────────────────────────────────────────
with open(os.path.join(BASE, "app_verificador_basculas.html"), "r", encoding="utf-8") as f:
    verif_html = f.read()

with open(os.path.join(BASE, "holo_control_sistema_completo.html"), "r", encoding="utf-8") as f:
    admin_html = f.read()


def extract_between(text, start_marker, end_marker):
    """Extract content between two markers (exclusive)."""
    start = text.find(start_marker)
    end = text.find(end_marker, start)
    if start == -1 or end == -1:
        return ""
    return text[start + len(start_marker):end]


# ── Extract CSS and JS blocks ─────────────────────────────────────────────────
verif_css = extract_between(verif_html, "<style>", "</style>")
verif_js  = extract_between(verif_html, "<script>", "</script>")
verif_body_raw = extract_between(verif_html, "<body>", "</body>")
# Strip the inline <script> block from body (it's between <body> and </body>)
verif_body = re.sub(r'\n?<script>[\s\S]*?</script>', '', verif_body_raw, flags=re.DOTALL)

admin_css = extract_between(admin_html, "<style>", "</style>")
admin_js  = extract_between(admin_html, "<script>", "</script>")
admin_body_raw = extract_between(admin_html, "<body>", "</body>")
admin_body = re.sub(r'\n?<script>[\s\S]*?</script>', '', admin_body_raw, flags=re.DOTALL)


# ═══════════════════════════════════════════════════════════════════════════════
# CSS SPLITTING HELPERS
# ═══════════════════════════════════════════════════════════════════════════════

def split_css_blocks(css_text):
    """
    Split a CSS string into a list of (selector_hint, rule_text) tuples.
    Each 'rule' is one top-level block (including @media, @keyframes, etc.).
    """
    blocks = []
    i = 0
    n = len(css_text)
    current = ""

    while i < n:
        # Collect until we hit an opening brace or end
        brace_depth = 0
        block_start = i
        block_text = ""

        # Find next '{' to start a block
        while i < n and css_text[i] != '{':
            current += css_text[i]
            i += 1

        if i >= n:
            break

        # We found '{', include selector + content
        selector = current.strip()
        current = ""
        block_text = selector + "{"
        brace_depth = 1
        i += 1  # skip '{'

        while i < n and brace_depth > 0:
            ch = css_text[i]
            block_text += ch
            if ch == '{':
                brace_depth += 1
            elif ch == '}':
                brace_depth -= 1
            i += 1

        if selector:
            blocks.append((selector, block_text))

    return blocks


def classify_verif_block(selector):
    """Return category for verificador CSS block."""
    s = selector.lower()
    # screens.css
    screens_patterns = [
        '#sc-login', '.lg-', '.topbar', '.tb-',
        '.bnav', '.mf', '.prog-bar', '.sdot', '.ovl',
    ]
    for p in screens_patterns:
        if p in s:
            return 'screens'
    # base.css
    base_patterns = [
        r'^\*$', r'^\*{', ':root', 'html', 'html,body', '.app',
        '.scroll', '.screen',
    ]
    for p in base_patterns:
        if re.search(p, s):
            return 'base'
    return 'components'


def classify_admin_block(selector):
    """Return category for admin CSS block."""
    s = selector.lower()
    # responsive.css
    if '@media' in s:
        return 'responsive'
    # base.css
    base_patterns = [
        r'^\*$', r'^\*{', ':root', 'html', 'html,body', '.app',
        '.sidebar', '.main', '.topbar', '.body', '.section',
        '.login-bg', '.login-card', '.logo', r'^\.nav', '.breadcrumb',
        '@keyframes',
    ]
    for p in base_patterns:
        if re.search(p, s):
            return 'base'
    return 'components'


def split_css(css_text, classifier):
    """Split CSS text into {category: content} dict."""
    buckets = {}
    blocks = split_css_blocks(css_text)
    for selector, rule in blocks:
        cat = classifier(selector)
        buckets.setdefault(cat, []).append(rule)
    return {k: "\n".join(v) + "\n" for k, v in buckets.items()}


# ═══════════════════════════════════════════════════════════════════════════════
# CSS COMMENT EXTRACTION (extract comment lines and attach to next block)
# ═══════════════════════════════════════════════════════════════════════════════

def split_css_with_comments(css_text, classifier):
    """
    A simpler, line/regex-based CSS splitter that handles comments properly.
    Works by finding top-level selectors and their associated blocks.
    """
    base_parts = []
    screens_parts = []
    components_parts = []

    # We'll tokenize into "comment/whitespace" chunks and "rule blocks"
    pos = 0
    pending_comment = ""
    text = css_text

    # Pattern for top-level rule: grab everything up to matching closing brace
    rule_re = re.compile(
        r'(/\*.*?\*/\s*|//[^\n]*\n\s*)*'   # optional comments
        r'([^{}/]+)'                          # selector
        r'\{',
        re.DOTALL
    )

    i = 0
    n = len(text)
    current_comment = ""
    result_base = []
    result_screens = []
    result_components = []

    while i < n:
        # Skip whitespace
        ws_match = re.match(r'\s+', text[i:])
        if ws_match:
            ws = ws_match.group(0)
            current_comment += ws
            i += len(ws)
            continue

        # Match a CSS comment
        cm_match = re.match(r'/\*.*?\*/', text[i:], re.DOTALL)
        if cm_match:
            current_comment += cm_match.group(0)
            i += len(cm_match.group(0))
            continue

        # Try to match a selector + opening brace
        sel_match = re.match(r'([^{}/]+)\{', text[i:], re.DOTALL)
        if sel_match:
            selector_raw = sel_match.group(1)
            selector = selector_raw.strip()
            block_text = current_comment + selector_raw + "{"
            current_comment = ""
            i += len(sel_match.group(0))
            depth = 1
            while i < n and depth > 0:
                ch = text[i]
                block_text += ch
                if ch == '{':
                    depth += 1
                elif ch == '}':
                    depth -= 1
                i += 1

            cat = classifier(selector)
            if cat == 'base':
                result_base.append(block_text)
            elif cat == 'screens':
                result_screens.append(block_text)
            else:
                result_components.append(block_text)
        else:
            # Unknown char, skip
            current_comment += text[i]
            i += 1

    return {
        'base': "\n".join(result_base),
        'screens': "\n".join(result_screens),
        'components': "\n".join(result_components),
        'responsive': "\n".join([
            b for b in result_components
            if '@media' in b.lower()
        ]),
    }


# ═══════════════════════════════════════════════════════════════════════════════
# VERIFICADOR CSS
# ═══════════════════════════════════════════════════════════════════════════════

verif_css_parts = split_css_with_comments(verif_css, classify_verif_block)

write_file = lambda path, content: open(os.path.join(BASE, path), "w", encoding="utf-8").write(content)

write_file("src/apps/verificador/css/base.css", verif_css_parts.get('base', ''))
write_file("src/apps/verificador/css/screens.css", verif_css_parts.get('screens', ''))
write_file("src/apps/verificador/css/components.css", verif_css_parts.get('components', ''))

# ═══════════════════════════════════════════════════════════════════════════════
# ADMIN CSS
# ═══════════════════════════════════════════════════════════════════════════════

# For admin we need to separate @media into responsive.css
# Build a custom classifier that also handles responsive
admin_parts_base = []
admin_parts_comp = []
admin_parts_resp = []

i = 0
n = len(admin_css)
current_comment = ""

while i < n:
    ws_match = re.match(r'\s+', admin_css[i:])
    if ws_match:
        current_comment += ws_match.group(0)
        i += len(ws_match.group(0))
        continue

    cm_match = re.match(r'/\*.*?\*/', admin_css[i:], re.DOTALL)
    if cm_match:
        current_comment += cm_match.group(0)
        i += len(cm_match.group(0))
        continue

    sel_match = re.match(r'([^{}/]+)\{', admin_css[i:], re.DOTALL)
    if sel_match:
        selector_raw = sel_match.group(1)
        selector = selector_raw.strip()
        block_text = current_comment + selector_raw + "{"
        current_comment = ""
        i += len(sel_match.group(0))
        depth = 1
        while i < n and depth > 0:
            ch = admin_css[i]
            block_text += ch
            if ch == '{':
                depth += 1
            elif ch == '}':
                depth -= 1
            i += 1

        cat = classify_admin_block(selector)
        if cat == 'responsive':
            admin_parts_resp.append(block_text)
        elif cat == 'base':
            admin_parts_base.append(block_text)
        else:
            admin_parts_comp.append(block_text)
    else:
        current_comment += admin_css[i]
        i += 1

write_file("src/apps/admin/css/base.css", "\n".join(admin_parts_base))
write_file("src/apps/admin/css/components.css", "\n".join(admin_parts_comp))
write_file("src/apps/admin/css/responsive.css", "\n".join(admin_parts_resp))

# ═══════════════════════════════════════════════════════════════════════════════
# JS EXTRACTION
# ═══════════════════════════════════════════════════════════════════════════════

# --- Shared catalog.js: extract DGN_CATALOG and related constants ---
# Find the catalog constant block in verificador JS
catalog_pattern = re.compile(
    r'((?:^|\n)(?:const|var|let)\s+(?:DGN_CATALOG|MARCAS_INDEX|MARCAS_NOM010|TIPOS_NOM010|MODELOS_NOM010)'
    r'[\s\S]*?(?=\n(?:const|var|let|function|\/\/|$)))',
    re.MULTILINE
)

# Better approach: find specific variable declarations
def extract_top_level_var(js, varname):
    """Extract a top-level const/let/var declaration (handles multi-line)."""
    # Find the declaration
    pattern = re.compile(
        r'((?:const|let|var)\s+' + re.escape(varname) + r'\s*=\s*)',
        re.MULTILINE
    )
    m = pattern.search(js)
    if not m:
        return "", js

    start = m.start()
    # Find the value: could be [...] or {...} or "string" or number
    val_start = m.end()
    # Determine type of value
    stripped = js[val_start:].lstrip()
    offset = val_start + (len(js[val_start:]) - len(stripped))

    if not stripped:
        return "", js

    first_ch = stripped[0]
    if first_ch in ('{', '['):
        # Find matching bracket
        depth = 0
        end = offset
        while end < len(js):
            if js[end] in ('{', '['):
                depth += 1
            elif js[end] in ('}', ']'):
                depth -= 1
                if depth == 0:
                    end += 1
                    break
            end += 1
        # Skip optional semicolon
        if end < len(js) and js[end] == ';':
            end += 1
    else:
        # Scalar: find end of statement
        end_m = re.search(r'\n', js[val_start:])
        end = val_start + (end_m.end() if end_m else len(js[val_start:]))

    extracted = js[start:end]
    remaining = js[:start] + js[end:]
    return extracted, remaining


catalog_vars = ['DGN_CATALOG', 'MARCAS_INDEX', 'MARCAS_NOM010', 'TIPOS_NOM010']
catalog_content_parts = []
remaining_verif_js = verif_js

for varname in catalog_vars:
    extracted, remaining_verif_js = extract_top_level_var(remaining_verif_js, varname)
    if extracted:
        catalog_content_parts.append(extracted)

# Also extract getModelosDeMarca function
def extract_function(js, funcname):
    """Extract a named function declaration."""
    pattern = re.compile(
        r'(function\s+' + re.escape(funcname) + r'\s*\([^)]*\)\s*\{)',
        re.MULTILINE
    )
    m = pattern.search(js)
    if not m:
        return "", js
    start = m.start()
    i = m.end()
    depth = 1
    while i < len(js) and depth > 0:
        if js[i] == '{':
            depth += 1
        elif js[i] == '}':
            depth -= 1
        i += 1
    extracted = js[start:i]
    remaining = js[:start] + js[i:]
    return extracted, remaining

get_modelos, remaining_verif_js = extract_function(remaining_verif_js, 'getModelosDeMarca')
if get_modelos:
    catalog_content_parts.append(get_modelos)

catalog_js_content = (
    "// Catálogo NOM-010 — constantes compartidas\n"
    "// Extraído de app_verificador_basculas.html\n\n"
    + "\n\n".join(catalog_content_parts)
)

write_file("src/shared/js/catalog.js", catalog_js_content)

# --- All remaining verificador JS → render.js ---
write_file("src/apps/verificador/js/render.js", remaining_verif_js.strip())

# --- Verificador JS stubs ---
stubs_verif = {
    "auth.js":        "// Auth logic is integrated into render.js\n// This file is reserved for future modular refactoring.\n",
    "instrumentos.js":"// Instrument logic is integrated into render.js\n// This file is reserved for future modular refactoring.\n",
    "hologramas.js":  "// Hologram logic is integrated into render.js\n// This file is reserved for future modular refactoring.\n",
    "dictamen.js":    "// Dictamen logic is integrated into render.js\n// This file is reserved for future modular refactoring.\n",
}
for fname, content in stubs_verif.items():
    write_file(f"src/apps/verificador/js/{fname}", content)

# --- All admin JS → usuarios.js (last loaded) ---
write_file("src/apps/admin/js/usuarios.js", admin_js.strip())

# --- Admin JS stubs ---
stubs_admin = {
    "auth.js":         "// Auth logic is integrated into usuarios.js\n// This file is reserved for future modular refactoring.\n",
    "dashboard.js":    "// Dashboard logic is integrated into usuarios.js\n// This file is reserved for future modular refactoring.\n",
    "compras.js":      "// Compras logic is integrated into usuarios.js\n// This file is reserved for future modular refactoring.\n",
    "recepciones.js":  "// Recepciones logic is integrated into usuarios.js\n// This file is reserved for future modular refactoring.\n",
    "inventario.js":   "// Inventario logic is integrated into usuarios.js\n// This file is reserved for future modular refactoring.\n",
    "transferencias.js":"// Transferencias logic is integrated into usuarios.js\n// This file is reserved for future modular refactoring.\n",
    "verificadores.js":"// Verificadores logic is integrated into usuarios.js\n// This file is reserved for future modular refactoring.\n",
    "socios.js":       "// Socios logic is integrated into usuarios.js\n// This file is reserved for future modular refactoring.\n",
    "proveedores.js":  "// Proveedores logic is integrated into usuarios.js\n// This file is reserved for future modular refactoring.\n",
    "papeleria.js":    "// Papelería logic is integrated into usuarios.js\n// This file is reserved for future modular refactoring.\n",
}
for fname, content in stubs_admin.items():
    write_file(f"src/apps/admin/js/{fname}", content)

# ═══════════════════════════════════════════════════════════════════════════════
# SHARED FILES
# ═══════════════════════════════════════════════════════════════════════════════

write_file("src/shared/assets/fonts.css",
    "@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600"
    "&family=Sora:wght@300;400;500;600;700&display=swap');\n"
)

write_file("src/shared/css/variables.css",
    "/* Shared CSS custom properties\n"
    " * Each app defines its own :root variables.\n"
    " * Common overrides or additions can be placed here.\n"
    " */\n"
)

write_file("src/shared/js/auth.js",
    "// Shared auth placeholder.\n"
    "// Each app (verificador, admin) has its own auth.js with app-specific logic.\n"
)

write_file("src/shared/js/utils.js",
    "// Shared utility functions placeholder.\n"
    "// Utility functions (toast, openModal, etc.) are currently app-specific.\n"
)

# ═══════════════════════════════════════════════════════════════════════════════
# NEW index.html FILES
# ═══════════════════════════════════════════════════════════════════════════════

# Extract <head> meta/title from originals (excluding style/link tags we're replacing)
def extract_head_meta(html):
    """Extract <meta> and <title> tags from <head>."""
    head_content = extract_between(html, "<head>", "</head>")
    lines = []
    for line in head_content.split('\n'):
        stripped = line.strip()
        if stripped.startswith('<meta') or stripped.startswith('<title'):
            lines.append(line)
    return "\n".join(lines)

verif_head_meta = extract_head_meta(verif_html)
admin_head_meta = extract_head_meta(admin_html)

# ── verificador/index.html ────────────────────────────────────────────────────
verif_index = f"""<!DOCTYPE html>
<html lang="es">
<head>
{verif_head_meta}
<link rel="stylesheet" href="../../shared/assets/fonts.css">
<link rel="stylesheet" href="../../shared/css/variables.css">
<link rel="stylesheet" href="css/base.css">
<link rel="stylesheet" href="css/components.css">
<link rel="stylesheet" href="css/screens.css">
</head>
<body>
{verif_body.strip()}
<script src="../../shared/js/catalog.js"></script>
<script src="../../shared/js/utils.js"></script>
<script src="../../shared/js/auth.js"></script>
<script src="js/auth.js"></script>
<script src="js/instrumentos.js"></script>
<script src="js/hologramas.js"></script>
<script src="js/dictamen.js"></script>
<script src="js/render.js"></script>
</body>
</html>
"""
write_file("src/apps/verificador/index.html", verif_index)

# ── admin/index.html ──────────────────────────────────────────────────────────
admin_index = f"""<!DOCTYPE html>
<html lang="es">
<head>
{admin_head_meta}
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="../../shared/assets/fonts.css">
<link rel="stylesheet" href="css/base.css">
<link rel="stylesheet" href="css/components.css">
<link rel="stylesheet" href="css/responsive.css">
</head>
<body>
{admin_body.strip()}
<script src="../../shared/js/utils.js"></script>
<script src="js/auth.js"></script>
<script src="js/dashboard.js"></script>
<script src="js/compras.js"></script>
<script src="js/recepciones.js"></script>
<script src="js/inventario.js"></script>
<script src="js/transferencias.js"></script>
<script src="js/verificadores.js"></script>
<script src="js/socios.js"></script>
<script src="js/proveedores.js"></script>
<script src="js/papeleria.js"></script>
<script src="js/usuarios.js"></script>
</body>
</html>
"""
write_file("src/apps/admin/index.html", admin_index)

# ═══════════════════════════════════════════════════════════════════════════════
# COPY xlsx TO data/
# ═══════════════════════════════════════════════════════════════════════════════

shutil.copy2(
    os.path.join(BASE, "catalogo_nom010_v22.xlsx"),
    os.path.join(BASE, "data", "catalogo_nom010_v22.xlsx"),
)

# ═══════════════════════════════════════════════════════════════════════════════
# DOCS
# ═══════════════════════════════════════════════════════════════════════════════

arquitectura_md = """\
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
"""

flujo_md = """\
# Flujo de Verificación NOM-010

## ¿Qué es la NOM-010-SCFI?

La **Norma Oficial Mexicana NOM-010-SCFI** regula los instrumentos de medición
de masa (básculas, balanzas y sus partes) en México. Los verificadores
metrológicos acreditados deben emitir un **dictamen técnico** para cada
instrumento inspeccionado.

---

## Actores del Sistema

| Actor | Rol |
|---|---|
| **Verificador de campo** | Técnico que realiza la inspección física |
| **Administrador** | Gestiona hologramas, compras, inventario y reportes |
| **Socio/Empresa** | Dueño del instrumento verificado |

---

## Flujo Completo de Verificación

```
┌─────────────────────────────────────────────────────────┐
│                   INICIO DE SESIÓN                       │
│  Verificador ingresa usuario/contraseña en HoloVerifica  │
└─────────────────────────┬───────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                PANTALLA HOME                             │
│  • Resumen de dictámenes del día                         │
│  • Inventario de hologramas disponibles                  │
│  • Acceso a historial y perfil                           │
└─────────────────────────┬───────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│              NUEVO DICTAMEN (Paso 1/5)                   │
│  Folio y datos generales:                                │
│  • Número de folio del dictamen                          │
│  • Fecha de verificación                                 │
│  • Razón social del cliente                              │
│  • Código postal → obtiene municipio/estado              │
└─────────────────────────┬───────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│              NUEVO DICTAMEN (Paso 2/5)                   │
│  Instrumento:                                            │
│  • Búsqueda por número DGN                               │
│  • Selección de marca y modelo                           │
│  • Capacidad y resolución                                │
│  • Número de serie                                       │
└─────────────────────────┬───────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│              NUEVO DICTAMEN (Paso 3/5)                   │
│  Hologramas:                                             │
│  • Asignación de folios de hologramas                    │
│  • Registro de series usadas del inventario              │
└─────────────────────────┬───────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│              NUEVO DICTAMEN (Paso 4/5)                   │
│  Verificación técnica:                                   │
│  • Pruebas de repetibilidad                              │
│  • Prueba de excentricidad                               │
│  • Resultado: APROBADO / RECHAZADO                       │
└─────────────────────────┬───────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│              NUEVO DICTAMEN (Paso 5/5)                   │
│  Resumen y firma:                                        │
│  • Fotografía del instrumento (cámara)                   │
│  • Cálculo de totales (derechos + IVA)                   │
│  • Guardar dictamen localmente                           │
└─────────────────────────┬───────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                  SINCRONIZACIÓN                          │
│  • El dictamen queda en estado "Pendiente"               │
│  • Al hacer sync → pasa a "Sincronizado"                 │
│  • Los datos fluyen al panel HoloControl                 │
└─────────────────────────────────────────────────────────┘
```

---

## Estados de un Dictamen

| Estado | Color | Descripción |
|---|---|---|
| `pend` | Ámbar | Guardado localmente, sin sincronizar |
| `sync` | Azul | Sincronizado con el servidor |
| `ok` | Verde | Revisado y aprobado por administración |

---

## Gestión de Hologramas (Panel Admin)

1. **Compra**: El administrador registra la compra de hologramas al proveedor
2. **Recepción**: Se reciben y registran los folios físicos en inventario
3. **Asignación**: Se asignan lotes de hologramas a cada verificador
4. **Uso**: El verificador consume hologramas al emitir dictámenes
5. **Control**: El inventario se actualiza automáticamente

---

## Catálogo NOM-010

El catálogo de instrumentos aprobados se almacena en:
- `data/catalogo_nom010_v22.xlsx` — Versión de referencia en Excel
- `src/shared/js/catalog.js` — Versión JS para uso en la app

Contiene marcas, modelos y números DGN autorizados por la SCFI.
"""

write_file("docs/arquitectura.md", arquitectura_md)
write_file("docs/flujo-verificacion.md", flujo_md)

# ═══════════════════════════════════════════════════════════════════════════════
# LEGACY COMMENTS ON ORIGINAL FILES
# ═══════════════════════════════════════════════════════════════════════════════

legacy_comment_verif = (
    "<!-- LEGACY: Este archivo es la versión monolítica original. "
    "La versión modular está en src/apps/verificador/ -->\n"
)
legacy_comment_admin = (
    "<!-- LEGACY: Este archivo es la versión monolítica original. "
    "La versión modular está en src/apps/admin/ -->\n"
)

for path, comment in [
    ("app_verificador_basculas.html", legacy_comment_verif),
    ("holo_control_sistema_completo.html", legacy_comment_admin),
]:
    full_path = os.path.join(BASE, path)
    with open(full_path, "r", encoding="utf-8") as f:
        original = f.read()
    if not original.startswith("<!-- LEGACY"):
        with open(full_path, "w", encoding="utf-8") as f:
            f.write(comment + original)

# ═══════════════════════════════════════════════════════════════════════════════
# UPDATE README.md
# ═══════════════════════════════════════════════════════════════════════════════

readme = """\
# Holocontrol — Sistema de Gestión de Verificación NOM-010

Sistema web para la gestión integral de básculas e instrumentos de medición
bajo la **Norma Oficial Mexicana NOM-010-SCFI**. Incluye una app móvil para
verificadores de campo y un panel administrativo de escritorio.

---

## Aplicaciones

### HoloVerifica — App Verificador (Móvil)
Aplicación progresiva para técnicos verificadores. Permite crear dictámenes
técnicos en campo, gestionar hologramas y sincronizar resultados.

**Ruta:** `src/apps/verificador/index.html`

### HoloControl — Panel Administrativo (Escritorio)
Panel de gestión para personal administrativo. Cubre compras de hologramas,
recepción, inventario, transferencias y reportes.

**Ruta:** `src/apps/admin/index.html`

---

## Estructura del Proyecto

```
Holocontrol/
├── data/
│   └── catalogo_nom010_v22.xlsx   # Catálogo oficial NOM-010
├── src/
│   ├── shared/                    # Recursos compartidos entre apps
│   │   ├── assets/fonts.css
│   │   ├── css/variables.css
│   │   └── js/
│   │       ├── catalog.js         # Catálogo DGN (marcas, modelos)
│   │       ├── auth.js
│   │       └── utils.js
│   ├── apps/
│   │   ├── verificador/           # App móvil (HoloVerifica)
│   │   │   ├── index.html
│   │   │   ├── css/  (base, components, screens)
│   │   │   └── js/   (render.js + stubs)
│   │   └── admin/                 # Panel admin (HoloControl)
│   │       ├── index.html
│   │       ├── css/  (base, components, responsive)
│   │       └── js/   (usuarios.js + stubs)
└── docs/
    ├── arquitectura.md
    └── flujo-verificacion.md
```

---

## Cómo Usar

Sirve los archivos desde cualquier servidor HTTP estático:

```bash
python3 -m http.server 8080
```

Luego abre:
- **Verificador:** http://localhost:8080/src/apps/verificador/
- **Admin:**       http://localhost:8080/src/apps/admin/

> **Nota:** Los archivos originales monolíticos (`app_verificador_basculas.html`,
> `holo_control_sistema_completo.html`) se mantienen en la raíz como referencia
> legacy.

---

## Documentación

- [`docs/arquitectura.md`](docs/arquitectura.md) — Estructura y módulos
- [`docs/flujo-verificacion.md`](docs/flujo-verificacion.md) — Flujo NOM-010

---

## Issues Pendientes

- [ ] **Refactorización JS**: Los módulos stub (auth.js, dictamen.js, etc.) deben
  extraerse de `render.js` / `usuarios.js` para lograr separación real de
  responsabilidades.
- [ ] **Sincronización real**: Implementar backend API para sincronizar dictámenes
  del verificador al panel admin (actualmente es demo/local).
- [ ] **PWA**: Convertir la app verificador en Progressive Web App con
  Service Worker para uso offline.
- [ ] **Tests**: Añadir pruebas unitarias para lógica de dictámenes y catálogo.
- [ ] **Variables compartidas**: Consolidar las variables CSS `:root` de ambas
  apps en `src/shared/css/variables.css`.
"""

write_file("README.md", readme)

# ═══════════════════════════════════════════════════════════════════════════════
# VERIFICATION
# ═══════════════════════════════════════════════════════════════════════════════

print("=== Files created ===")
import subprocess
result = subprocess.run(
    ["find", BASE, "-not", "-path", "*/.git/*", "-type", "f", "-newer",
     os.path.join(BASE, "app_verificador_basculas.html")],
    capture_output=True, text=True
)
for line in sorted(result.stdout.splitlines()):
    size = os.path.getsize(line)
    print(f"  {size:>8}  {line.replace(BASE + '/', '')}")

print("\n=== Catalog.js preview (first 8 lines) ===")
with open(os.path.join(BASE, "src/shared/js/catalog.js")) as f:
    for i, line in enumerate(f):
        if i >= 8:
            break
        print(line, end="")

print("\n\nDone!")
