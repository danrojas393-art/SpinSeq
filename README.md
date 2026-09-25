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
