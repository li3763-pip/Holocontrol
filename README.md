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

## Tareas pendientes

- Vincular la app del verificador con el panel web (#1)
- Agregar catálogo de equipo patrón y vincularlo con la app (#2)
- Completar el catálogo de básculas (#3)

## Versión

v2.5.0 RC-38 r1 — Sistema de verificación NOM-010-SCFI-1994
