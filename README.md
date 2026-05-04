# Holocontrol — Sistema de Verificación de Básculas NOM-010

Sistema de gestión para la verificación de básculas conforme a la NOM-010-SCFI-1994. Consta de dos aplicaciones web:

- App Verificador — Aplicación móvil para verificadores de campo
- Panel Admin — Sistema de gestión para socios y personal administrativo

## Estructura del proyecto

src/shared/ — Código compartido
src/apps/verificador/ — App móvil del verificador
src/apps/admin/ — Panel de administración
data/ — Catálogo NOM-010
docs/ — Documentación

## Cómo usar en Windows

No se necesita instalar nada. El proyecto funciona directamente en el navegador.

Requisitos:
- Windows 10 u 11
- Google Chrome, Microsoft Edge o Firefox

Opción 1 — Desde el Explorador de archivos:
1. Descarga el ZIP desde https://github.com/li3763-pip/Holocontrol (Code > Download ZIP)
2. Extrae el ZIP en C:\Holocontrol
3. Navega a src\apps\verificador\ y haz doble clic en index.html
4. Para el admin: navega a src\apps\admin\ y haz doble clic en index.html

Opción 2 — Con Git:
  git clone https://github.com/li3763-pip/Holocontrol.git
  cd Holocontrol
  start src\apps\verificador\index.html
  start src\apps\admin\index.html

## Cómo ver la app en el celular

Opción A — GitHub Pages (sin instalar nada):
Abre en el celular: https://li3763-pip.github.io/Holocontrol/src/apps/verificador/index.html

Opción B — Servidor local por WiFi:
1. Instala Python desde https://www.python.org/downloads/ (marca "Add Python to PATH")
2. Abre CMD y ejecuta:
   cd C:\Holocontrol
   python -m http.server 8080
3. Ejecuta ipconfig en otro CMD y busca la "Dirección IPv4" (ej: 192.168.1.100)
4. En el celular (misma red WiFi) abre: http://192.168.1.100:8080/src/apps/verificador/index.html

Agregar al inicio del celular:
- Android (Chrome): tres puntos > Agregar a pantalla de inicio
- iPhone (Safari): compartir > Agregar a pantalla de inicio

## Usuarios de prueba (App Verificador)

| Usuario | Contraseña | Nombre         | Zona         |
|---------|------------|----------------|--------------|
| verif1  | campo123   | Carlos Ramírez | Zona Norte   |
| verif2  | campo123   | Laura Mendoza  | Zona Sur     |
| verif3  | campo123   | Héctor Sosa    | Zona Centro  |

## Cómo generar el APK (Android)

### Opción A — App Android nativa (proyecto incluido en este repositorio)

El directorio `android/` contiene un proyecto Android Studio completo con un WebView que empaqueta la app. No requiere duplicar archivos.

1. Abre Android Studio → **File → Open…** → selecciona la carpeta `android/`.
2. Conecta un dispositivo o inicia un emulador (Android 7.0+).
3. Haz clic en **Run ▶**, o desde la terminal:

```bash
cd android
./gradlew assembleDebug
# APK: android/app/build/outputs/apk/debug/app-debug.apk
```

Consulta `android/README.md` para más detalles.

---

La app también es una PWA. Las opciones siguientes generan una TWA (requiere URL pública con HTTPS):

### Opción B — PWABuilder (sin instalar nada)

1. Asegúrate de que GitHub Pages esté habilitado para el repositorio.  
   URL pública: `https://li3763-pip.github.io/Holocontrol/src/apps/verificador/index.html`
2. Entra a **https://www.pwabuilder.com** desde la PC.
3. Pega la URL de GitHub Pages y haz clic en **Start**.
4. Descarga el paquete Android → genera el APK firmado listo para instalar.

### Opción C — Bubblewrap (línea de comandos)

Requiere Node.js ≥ 14 y Android SDK.

```bash
npm install -g @bubblewrap/cli
bubblewrap init --manifest https://li3763-pip.github.io/Holocontrol/src/apps/verificador/manifest.json
bubblewrap build
```

El APK queda en `app-release-signed.apk`.

### Requisito: assetlinks.json

Para que la TWA funcione sin la barra de Chrome, hay que agregar el fingerprint SHA-256 del keystore en:

`https://li3763-pip.github.io/.well-known/assetlinks.json`

PWABuilder y Bubblewrap generan este archivo automáticamente durante el proceso.

---

## Estado del proyecto

### Completado ✅

- Vincular la app del verificador con el panel web (#1) — los verificadores y sus asignaciones se gestionan desde el panel admin y se leen en la app campo
- Catálogo de equipo patrón y asignación a verificadores (#2) — módulo `equipo_patron.js` integrado en el panel admin; el verificador solo puede usar el equipo que le fue asignado

### Pendiente

- Completar el catálogo de básculas (#3)

## Versión

v2.5.0 RC-38 r1 — Sistema de verificación NOM-010-SCFI-1994
