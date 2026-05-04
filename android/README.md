# HoloVerifica — App Android Nativa

Aplicación Android que empaqueta la app web HoloVerifica en un WebView nativo.
Toda la lógica de negocio reside en los archivos web existentes bajo `src/`; no se duplica ningún archivo.

## Requisitos

| Herramienta | Versión mínima |
|-------------|----------------|
| Android Studio | Hedgehog (2023.1) o superior |
| JDK | 17 |
| Android SDK | API 34 |

## Cómo abrir y compilar

### Con Android Studio (recomendado)

1. Abre Android Studio → **File → Open…**
2. Selecciona la carpeta `android/` de este repositorio.
3. Android Studio descargará el Gradle wrapper automáticamente.
4. Conecta un dispositivo Android o inicia un emulador (API 24+).
5. Haz clic en **Run ▶** para instalar y lanzar la app.

### Desde la línea de comandos

```bash
# Dentro de la carpeta android/
./gradlew assembleDebug
# El APK queda en: app/build/outputs/apk/debug/app-debug.apk
```

> **Nota:** La primera compilación descarga las dependencias de Gradle (~200 MB).
> Se requiere conexión a internet.

## Estructura

```
android/
  app/
    src/
      main/
        AndroidManifest.xml
        kotlin/com/holocontrol/verificador/
          MainActivity.kt       # WebView + configuración nativa
        res/
          layout/activity_main.xml
          mipmap-*/             # Íconos generados desde icon-512.png
          values/               # Colores, temas, strings
  build.gradle.kts              # Dependencias del módulo
  settings.gradle.kts
  gradle/libs.versions.toml     # Version catalog
```

Los activos web (HTML/CSS/JS) se cargan directamente desde `src/` a través
de la configuración `sourceSets.assets.srcDirs("../../src")` en `app/build.gradle.kts`.
La URL de inicio es `file:///android_asset/apps/verificador/index.html`.

## Funcionalidades nativas

| Característica | Soporte |
|----------------|---------|
| Orientación portrait fija | ✅ |
| Status bar personalizada (`#7B1C2E`) | ✅ |
| Edge-to-edge (sin barra de acción) | ✅ |
| localStorage / sessionStorage | ✅ |
| Botón Atrás navega en el historial web | ✅ |
| Modo offline (activos locales) | ✅ |
| INTERNET permission (sync + Google Fonts) | ✅ |

## Generar APK de release firmado

```bash
./gradlew assembleRelease \
  -Pandroid.injected.signing.store.file=/ruta/a/keystore.jks \
  -Pandroid.injected.signing.store.password=STORE_PASS \
  -Pandroid.injected.signing.key.alias=KEY_ALIAS \
  -Pandroid.injected.signing.key.password=KEY_PASS
```
