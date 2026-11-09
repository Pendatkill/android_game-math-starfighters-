# Arquitectura

Math Starfighters es un juego **HTML5 Canvas 2D** empaquetado en una app Android mínima con un `WebView`. No usa motores ni librerías externas: todo el arte y el audio están generados o incrustados en tres archivos JavaScript/HTML.

```
┌─────────────────────────── App Android ───────────────────────────┐
│ MainActivity.java                                                 │
│  · WebView a pantalla completa (modo inmersivo, horizontal)       │
│  · Solo carga file:///android_asset/ — navegación externa bloqueada│
│  · Botón/gesto atrás (OnBackInvokedCallback, API 33+) → JS        │
│                                                                   │
│  assets/                                                          │
│  ├─ index.html  ── juego: bucle, física, niveles, UI, fondos      │
│  ├─ art.js      ── sprites procedurales cacheados (window.ART)    │
│  └─ audio.js    ── motor de audio Web Audio + música (window.AE)  │
└───────────────────────────────────────────────────────────────────┘
```

## index.html

| Bloque | Qué hace |
|---|---|
| Física | Lienzo lógico de 720 px de alto. La nave está fija en x = 260 y el mundo se desplaza. Gravedad y empuje de 1700 px/s², velocidad vertical máxima 560 px/s. |
| Niveles | 50 misiones generadas de forma **determinista** con un generador pseudoaleatorio con semilla (*mulberry32*): siempre salen iguales. La velocidad, la separación de huecos y los tipos de obstáculo dependen de la dificultad. |
| Obstáculos móviles | Su posición depende de la distancia recorrida (no del tiempo), así el estado al llegar es siempre el mismo y el nivel es justo. |
| Puzles | `makeQuiz(tier)` crea preguntas aleatorias por nivel de dificultad. `genPuzzle` coloca los muros con tres huecos o los cruces de llaves y puertas. |
| Interfaz | Menú con droide animado, mapa galáctico, hangar, intro, pausa, victoria y "Acerca de". Todo dibujado en el canvas. |
| Fondos | 10 temas con capas de parallax pre-renderizadas y caché LRU. |
| Guardado | `localStorage` (clave `mathstarfighters_v1`): progreso, estrellas, récords, nave y sonido. |
| Puente Android | `window.androidBack()` devuelve `true` si el juego gestiona el *atrás* (pausa o volver); si devuelve `false`, la app se cierra. |

## art.js

Dibuja con la API de Canvas todas las piezas: muros, láseres, asteroides, drones, torretas, portales, cristales, estrellas, meta, 5 naves, explosiones y cazas de fondo. Las piezas se pre-renderizan una vez en canvas fuera de pantalla y luego solo se copian.

## audio.js

Motor `AE` sobre Web Audio: `init`, `music`, `sting`, `sfx`, `setMuted`, `suspend` y `resume`. Las pistas (menú, juego, jefe, victoria) son composiciones originales en MP3 incrustadas en base64, y los efectos se sintetizan.

## Tipografías

Orbitron, Exo 2, Audiowide y Bungee se incrustan como woff2 en base64 (licencia SIL OFL, ver `creditos/`). El juego funciona sin conexión.

## Seguridad del WebView

- `setAllowFileAccess(false)` y `setAllowContentAccess(false)`: no hay acceso a archivos del móvil.
- `AssetOnlyClient` bloquea cualquier URL que no sea de los archivos del propio juego.
- No hay `addJavascriptInterface`: el JavaScript no puede llamar a código nativo.
- Sin permisos de internet, ubicación, cámara ni almacenamiento. Solo `VIBRATE`.

## Calidad

Durante el desarrollo, un piloto automático con búsqueda superó las 50 misiones sin morir. Además se ejecutaron miles de comprobaciones de mecánica, de llaves y puertas (incluida una regresión del fallo de cambio de color) y de que cada pregunta tenga una única respuesta correcta.
