# Compilar, firmar y publicar

## Requisitos

- Android Studio reciente con **JDK 17**.
- Android SDK **Platform 36** (Android 16).
- El proyecto usa Android Gradle Plugin 8.13 y Gradle 8.13 (incluido el *wrapper*, no hace falta instalar Gradle).
- Sin dependencias externas: solo el SDK de Android.

## Build de depuración

Con Android Studio: **File → Open** → carpeta del proyecto → espera a que sincronice → ▶ **Run** con un móvil conectado por USB.

Por terminal:

```bash
./gradlew assembleDebug          # Windows: gradlew.bat assembleDebug
```

Resultado: `app/build/outputs/apk/debug/app-debug.apk`.

## Build de release firmado

La clave de firma **nunca** se sube al repositorio (`.gitignore` bloquea `*.p12`, `*.jks`, `*.keystore`, `*.pk8`, `keystore.properties`...).

1. Crea una clave si no tienes una (guárdala fuera del repositorio y haz copia de seguridad):

   ```bash
   keytool -genkeypair -storetype PKCS12 -keystore ~/claves/mathstarfighters.p12 \
     -alias mathstarfighters -keyalg RSA -keysize 4096 -validity 10000
   ```

2. Crea `keystore.properties` en la raíz del proyecto (está ignorado por git):

   ```properties
   storeFile=/ruta/absoluta/a/mathstarfighters.p12
   storePassword=TU_CONTRASEÑA
   keyAlias=mathstarfighters
   keyPassword=TU_CONTRASEÑA
   ```

3. Compila:

   ```bash
   ./gradlew assembleRelease   # APK  → app/build/outputs/apk/release/
   ./gradlew bundleRelease     # AAB  → app/build/outputs/bundle/release/  (para Google Play)
   ```

Si no existe `keystore.properties`, el release se firma con la clave de depuración (vale para probar, no para publicar).

> ⚠️ Si pierdes la clave no podrás publicar actualizaciones con la misma firma. Con *Firma de apps de Google Play* activada, la clave local es solo la de subida y Google puede restablecerla.

## Subir versión

Antes de cada publicación incrementa en `app/build.gradle`:

```groovy
versionCode 5        // entero, siempre mayor que el anterior
versionName "1.3.1"  // el que ve el usuario
```

y añade una entrada en [CHANGELOG.md](../CHANGELOG.md).

## Publicar en GitHub Releases

Los `.apk` y `.aab` no se guardan en git (están en `.gitignore`): se adjuntan a una *release*.

```bash
git tag -a v1.3.1 -m "Math Starfighters 1.3.1"
git push origin v1.3.1
gh release create v1.3.1 MathStarfighters-v1.3.1.apk --title "Math Starfighters 1.3.1" --notes-file notas.md
```

## Verificar la descarga

Cada release publica la huella SHA-256 del APK. Para comprobarla:

```bash
# Linux / macOS
sha256sum MathStarfighters-v1.3.1.apk
# Windows (PowerShell)
Get-FileHash .\MathStarfighters-v1.3.1.apk -Algorithm SHA256
```

El resultado debe coincidir exactamente con el de la release. También puedes ver el certificado de firma con:

```bash
apksigner verify --print-certs MathStarfighters-v1.3.1.apk
```

Debe mostrar `CN=Math Starfighters, O=pendatkill-dev, C=ES`.
