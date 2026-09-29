# 🌀 SpinSeq — Arcade Ring Puzzle

**SpinSeq** es un juego de reflejos, lógica y velocidad mental en tiempo real construido con HTML5 Canvas y empaquetado como **PWA (Progressive Web App)**. 

El objetivo es encontrar y presionar la secuencia correcta de números y letras distribuidos en anillos concéntricos que no paran de girar, desafiando tu capacidad de concentración y agilidad visual.

![SpinSeq Gameplay](https://via.placeholder.com/800x400/0a0e17/06b6d4?text=SpinSeq+Arcade+PWA)

---

## 🚀 Características Principales

* 🎯 **Mecánica de Rotación Continua:** Los anillos concéntricos giran a diferentes velocidades y sentidos (horario y antihorario).
* 🧠 **Memoria y Secuencia a Ciegas:** No hay indicadores visuales del siguiente objetivo; debes recordar y deducir el orden.
* ⚡ **20 Niveles Progresivos:**
  * **Niveles 1 – 2:** Números del 1 al 25 desordenados.
  * **Niveles 3 – 5:** Abecedario de la A a la P.
  * **Niveles 6 – 14:** Combinación mixta de números y letras ($A=1, B=2, \dots, Z=27$).
  * **Niveles 15 – 20 (Modo Pesadilla):** Rotaciones de alta velocidad, escalado masivo hasta **100 números en pantalla** e inversión de sentido al acertar.
* ⏱️ **Modo Récord (Speedrun):** Cronómetro de alta precisión en milisegundos (`00:00.000`) con guardado automático de tu mejor tiempo en cada nivel (`LocalStorage`).
* 🎵 **Música Tensa y SFX Sintéticos:** Generación de audio en tiempo real mediante **Web Audio API** para máxima inmersión sin descargas pesadas.
* 📱 **PWA (Progressive Web App):** Totalmente responsivo para móviles y computadoras. Se puede instalar en la pantalla de inicio y jugar sin conexión a internet.

---

## 🛠️ Tecnologías Utilizadas

* **HTML5 & CSS3** (Animaciones Neón & Diseño Responsivo)
* **JavaScript Vanilla** (Motor gráfico en Canvas)
* **Web Audio API** (Sintetizador de música tensa y efectos de sonido)
* **Service Workers & Web App Manifest** (Soporte PWA e instalación móvil)

---

## 🎮 ¿Cómo Jugar?

1. Selecciona el nivel desde el menú de inicio.
2. Observa la rotación de los anillos y busca el **primer elemento** de la secuencia (ej. el número `1` o la letra `A`).
3. Toca la casilla correspondiente en el momento preciso.
4. Continúa la secuencia en orden sin cometer errores para detener el cronómetro con el mejor tiempo posible.

---

## 📲 ¡Juega en Línea!

Puedes probar el juego directamente desde cualquier navegador (PC o celular) o instalarlo como App desde el siguiente enlace:

👉 **[Jugar a SpinSeq en Render](https://spinseq.onrender.com)

---

## 📱 Aplicación Android (Capacitor + AdMob)

La app Android usa Capacitor 8 y el plugin nativo `@capacitor-community/admob`. Los IDs se leen de `.env`; ese archivo está excluido de Git. Los IDs de AdMob no son contraseñas: se incluyen en la app compilada y pueden inspeccionarse en el dispositivo.

### Requisitos

* Node.js 22 o posterior, Android Studio, Android SDK y JDK compatibles con Android Studio.
* Una aplicación y unidades de anuncios creadas en AdMob.

### Instalar y crear Android

Desde la raíz del repositorio, copia `.env.example` como `.env` si todavía no tienes ese archivo y verifica `VITE_ADMOB_APP_ID`, `VITE_ADMOB_BANNER_ID` y `VITE_ADMOB_REWARDED_ID`. La configuración local ya usa los IDs proporcionados. Mantén `VITE_ADMOB_TESTING=true` durante las pruebas. Antes de crear Android, confirma que `appId` en `capacitor.config.json` sea el identificador definitivo de tu app; cambiarlo más adelante también requiere actualizar `applicationId` en Gradle.

```powershell
npm install
npm run android:add
npm run android:open
```

`android:add` genera el sitio en `dist`, añade la plataforma y configura el ID de aplicación de AdMob en Android. También fija `android:screenOrientation="portrait"` en la actividad launcher; es un bloqueo nativo, además de `orientation: "portrait-primary"` del manifiesto PWA.

En Android Studio, deja que Gradle sincronice y ejecuta la aplicación en un dispositivo Android o emulador. AdMob debe probarse con anuncios de prueba; no pulses tus anuncios reales para probarlos. Después de cambiar el sitio o `.env`, ejecuta:

```powershell
npm run android:sync
```

### Generar el `.aab` firmado desde terminal (Windows)

Requiere JDK 21, Android SDK con **Android SDK Platform 36** y **Android SDK Build-Tools 36.0.0**, además de aceptar las licencias del SDK. Instala el JDK y las herramientas de línea de comandos de Android si aún no están instalados; configura `JAVA_HOME` y `ANDROID_HOME`/`ANDROID_SDK_ROOT` para esta terminal.

1. Confirma que `com.spinseq.game` coincide con el paquete de Play Console; no lo cambies tras publicar la primera versión.
2. En PowerShell, crea una clave de carga segura. Sustituye la ruta si deseas almacenar la clave en otra ubicación y guarda su contraseña fuera del repositorio:

```powershell
New-Item -ItemType Directory -Force "$env:USERPROFILE\.android" | Out-Null
keytool -genkeypair -v -keystore "$env:USERPROFILE\.android\spinseq-upload.jks" -keyalg RSA -keysize 2048 -validity 10000 -alias spinseq-upload
```

3. Configura la firma en el archivo personal `%USERPROFILE%\.gradle\gradle.properties` (créalo si hace falta). Añade estas propiedades y reemplaza los valores de ejemplo; este archivo queda fuera del repositorio:

```properties
SPINSEQ_UPLOAD_STORE_FILE=C:/Users/TU_USUARIO/.android/spinseq-upload.jks
SPINSEQ_UPLOAD_STORE_PASSWORD=TU_CONTRASENA_DEL_KEYSTORE
SPINSEQ_UPLOAD_KEY_ALIAS=spinseq-upload
SPINSEQ_UPLOAD_KEY_PASSWORD=TU_CONTRASENA_DE_LA_CLAVE
```

4. En la raíz del repositorio, conserva `VITE_ADMOB_TESTING=true` mientras pruebas. Para la versión de producción, ponlo en `false` en `.env` y sincroniza:

```powershell
npm run android:sync
```

5. Compila el Android App Bundle firmado desde la raíz:

```powershell
Set-Location android
.\gradlew.bat bundleRelease
```

El archivo listo para subir estará en `android\app\build\outputs\bundle\release\app-release.aab`. El proyecto ahora exige la firma configurada al pedir un bundle/ APK `release`; no almacenes el keystore ni sus contraseñas en Git. Haz una copia de seguridad segura de la clave de carga y habilita Play App Signing en Play Console.

Antes de publicar, configura en AdMob los mensajes de privacidad y consentimiento (UMP) para las regiones aplicables. La app solicita/actualiza el consentimiento antes de pedir anuncios y muestra el acceso a opciones de privacidad cuando UMP lo requiere. Completa también en Play Console el formulario de seguridad de datos y la política de privacidad. El botón de pista solo concede la recompensa tras confirmarla el SDK; desde el navegador web las funciones de AdMob nativo no se ejecutan.
