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
