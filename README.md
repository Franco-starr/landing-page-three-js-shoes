# Nike Landing Page — Three.js + GSAP

Landing page 3D de una zapatilla Nike con modelo `.glb`, animaciones de scroll
(horizontales) y UI responsive, construida con **Three.js** y **GSAP** usando **Vite**.

## Tech Stack

- [Vite](https://vite.dev) — bundler y dev server
- [Three.js](https://threejs.org) — render 3D del modelo (`.glb`)
- [GSAP](https://gsap.com) — animaciones de scroll y texto (ScrollTrigger + ScrollToPlugin)

## Requisitos

- Node.js 18+ (probado con Node 24)

## Instalación

```bash
npm install
```

## Desarrollo

```bash
npm run dev
```

Abrí `http://localhost:5173`.

## Build de producción

```bash
npm run build      # genera la carpeta dist/
npm run preview    # sirve el build en http://localhost:4173
```

> Importante: hay que servir el proyecto con un servidor local (`npm run dev` o
> `npm run preview`). No funciona abriendo `index.html` directo (file://) porque
> los ES modules lo bloquean por CORS.

## Estructura

```
├── index.html            # entrada principal
├── vite.config.js
├── public/
│   ├── img/              # recursos (logo)
│   └── model/            # zapatilla 3D (.glb)
└── src/
    ├── css/style.css     # estilos
    └── js/
        ├── main.js       # escena three.js, modelo, luces, render
        ├── gsap.js       # animaciones de scroll
        └── ui.js         # menú móvil
```

## Assets del modelo

El modelo 3D `nike_air_zoom_pegasus_36.glb` vive en `public/model/` y se sirve
directamente en `/model/nike_air_zoom_pegasus_36.glb`. Al estar en `public/`,
Vite lo copia a `dist/` tal cual, sin hashear.