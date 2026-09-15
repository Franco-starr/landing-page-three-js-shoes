import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { initHeroScene } from './scenes/hero-scene.js';
import { initTechScene } from './scenes/tech-scene.js';
import { initTallesScene } from './scenes/talles-scene.js';

/* =========================
   MAIN.JS - ORQUESTADOR
   Carga el modelo GLB una sola vez, clona la zapa en cada escena,
   controla qué canvas está visible por sección y corre el render loop.
========================= */

const loader = new GLTFLoader();

/* Objetos creados al cargar el modelo y flags de qué escena está activa. */
const scenes = {};
const active = { hero: false, tech: false, talles: false };

/* Los 3 canvas fijos (z-index 0) apilados. Solo se muestra el de la
   sección activa; si quedara más de uno visible, el opaco de arriba
   taparía a los del fondo. */
const canvases = {
  hero: document.querySelector('#webgl-hero'),
  tech: document.querySelector('#webgl-tech'),
  talles: document.querySelector('#webgl-talles')
};

Object.values(canvases).forEach((c) => { c.style.visibility = 'hidden'; });
canvases.hero.style.visibility = 'visible';

/* CARGA DEL MODELO: se carga el .glb una vez y se clona por escena
   (un mismo Object3D no puede estar en dos escenas a la vez).
   En la copia base se activan las sombras de todos los meshes. */
loader.load('./model/nike_air_zoom_pegasus_36.glb', (gltf) => {
  const model = gltf.scene;

  model.traverse((obj) => {
    if (obj.isMesh) {
      obj.castShadow = true;
      obj.receiveShadow = true;
    }
  });

  scenes.hero = initHeroScene(document.querySelector('#webgl-hero'), model.clone(true));
  scenes.tech = initTechScene(document.querySelector('#webgl-tech'), model.clone(true));
  scenes.talles = initTallesScene(document.querySelector('#webgl-talles'), model.clone(true));
});

/* =========================
   VISIBILIDAD POR SECCIÓN
   La escena activa = la ÚLTIMA sección cuyo top cruzó su umbral.
   Cada corte cae cuando el telón negro de la sección entrante cubre
   toda la pantalla, así el cambio de color nunca se ve:
   - hero (naranja) hasta que features tapa (top 0).
   - tech (celeste) en Tecnología y Elegí tu talle, hasta que Reseñas
     tapa (top 0, s≈450) → null (negro puro, sin escena colada).
   - talles (violeta) se pre-activa mientras Reseñas ocupa toda la
     pantalla (cta top <= 1.5*vh, s≈550) y su telón tapa todo; queda
     oculto y aparece con el scroll hacia el final.
========================= */

const couple = [
  ['hero', document.querySelector('.hero'), 0],
  ['tech', document.querySelector('.features'), 0],
  ['tech', document.querySelector('#talles'), 0],
  [null, document.querySelector('.reviews'), 0],
  ['talles', document.querySelector('.cta-final'), window.innerHeight * 1.5]
];

function currentScene() {
  let key = null;
  for (const [k, el, th] of couple) {
    if (el.getBoundingClientRect().top <= th) key = k;
  }
  return key;
}

function syncActive() {
  const key = currentScene();
  Object.keys(active).forEach((k) => { active[k] = false; });
  Object.keys(canvases).forEach((k) => { canvases[k].style.visibility = 'hidden'; });
  if (key) {
    active[key] = true;
    canvases[key].style.visibility = 'visible';
  }
}

window.addEventListener('scroll', syncActive, { passive: true });
window.addEventListener('resize', syncActive);
syncActive();

/* =========================
   RENDER LOOP
   animate(t) recibe el timestamp del navegador; s = segundos (t/1000).
   Los segundos s alimentan los turntables de las escenas tech/talles.
   Solo se renderiza la escena cuya sección está activa (ahorro de GPU).
========================= */

function animate(t) {
  requestAnimationFrame(animate);
  const s = t / 1000;

  if (active.hero && scenes.hero) scenes.hero.render();
  if (active.tech && scenes.tech) scenes.tech.render(s);
  if (active.talles && scenes.talles) scenes.talles.render(s);
}

requestAnimationFrame(animate);

/* =========================
   RESIZE
   Al redimensionar se actualiza el aspect de cada cámara y el tamaño
   de cada renderer (las cámaras miran al origen, la posición la pone
   la zapa, así que no hay que reposicionar nada acá).
========================= */

window.addEventListener('resize', () => {
  const w = window.innerWidth;
  const h = window.innerHeight;

  if (scenes.hero) scenes.hero.resize(w, h);
  if (scenes.tech) scenes.tech.resize(w, h);
  if (scenes.talles) scenes.talles.resize(w, h);
});