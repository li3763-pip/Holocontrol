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
