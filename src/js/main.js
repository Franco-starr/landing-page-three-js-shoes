import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { initHeroScene } from './scenes/hero-scene.js';
import { initTechScene } from './scenes/tech-scene.js';
import { initTallesScene } from './scenes/talles-scene.js';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

/* =========================
   MAIN.JS - ORQUESTADOR
   Carga el modelo GLB una sola vez, clona la zapa en cada escena,
   controla qué canvas está visible por sección y corre el render loop.
========================= */

const loader = new GLTFLoader();

/* PANTALLA DE CARGA: cubre todo (z-index 2000) mientras carga el .glb.
   La barra se llena con onProgress; se oculta cuando el modelo quedó
   montado y las fuentes están listas, con un mínimo de exhibición para
   que no parpadee en cargas rápidas. */
const loaderEl = document.querySelector('#loader');
const loaderFill = document.querySelector('#loader-fill');
const loadStartedAt = Date.now();

document.body.style.overflow = 'hidden';

const updateLoaderFill = (xhr) => {
  const total = xhr.total || 1;
  loaderFill.style.width = `${Math.min(100, Math.round((xhr.loaded / total) * 100))}%`;
};

const hideLoader = () => {
  Promise.all([
    new Promise((r) => setTimeout(r, Math.max(0, 700 - (Date.now() - loadStartedAt)))),
    document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()
  ]).then(() => {
    loaderEl.classList.add('hidden');
    document.body.style.overflow = '';
    ScrollTrigger.refresh();
  });
};

/* Objetos creados al cargar el modelo y flags de qué escena está activa. */
const scenes = {};
const active = { hero: false, tech: false, talles: false };
let techRotating = false;

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

  /* La escena del hero recién ahora existe: re-sincronizar para dejar la
     visibilidad de su canvas acorde a la sección activa (hero está arriba
     al cargar). */
  syncActive();

  /* Aplica el layout responsive según el viewport actual (si ya se abrió
     en tablet/media ventana, empezar angosto y no en el layout desktop). */
  handleResize();

  /* Si ya se scrolleó hasta el CTA cuando monta la escena, dejar la zapa
     en la pose que corresponde al scroll actual. */
  if (shoeTrigger) applyShoePose(shoeTrigger.progress);

  hideLoader();
}, updateLoaderFill, () => {
  /* Si el modelo falla, igual se libera la pantalla para no dejar un
     bloqueo invisible. */
  loaderFill.style.width = '100%';
  hideLoader();
});

/* =========================
   VISIBILIDAD POR SECCIÓN
   La escena activa = la ÚLTIMA sección cuyo top cruzó su umbral.
   Cada corte cae cuando el telón negro de la sección entrante cubre
   toda la pantalla, así el cambio de color nunca se ve:
   - hero (naranja) hasta que features tapa (top 0).
- tech (celeste) en Tecnología y Elegí tu talle, hasta que Reseñas
     tapa (top 0, s≈450) → null (negro puro, sin escena colada).
     La zapa gira solo en la sección Talles (flag rotate);
     en Tecnología se muestra estática.
   - talles (violeta) se pre-activa mientras Reseñas ocupa toda la
     pantalla (cta top <= 1.5*vh, s≈550) y su telón tapa todo; queda
     oculto y aparece con el scroll hacia el final. Ahí la zapa ya no gira.
 ========================= */

const couple = [
  ['hero',   false, document.querySelector('.hero'),            0],
  ['tech',   false, document.querySelector('.features'),        0],
  ['tech',   true,  document.querySelector('#talles'),          window.innerHeight],
  [null,     false, document.querySelector('.reviews'),         0],
  ['talles', false, document.querySelector('.cta-final'),       window.innerHeight * 1.5]
];

function currentScene() {
  let key = null;
  let rotate = false;
  for (const [k, rot, el, th] of couple) {
    if (el.getBoundingClientRect().top <= th) {
      key = k;
      rotate = rot;
    }
  }
  return { key, rotate };
}

function syncActive() {
  const { key, rotate } = currentScene();
  Object.keys(active).forEach((k) => { active[k] = false; });
  Object.keys(canvases).forEach((k) => { canvases[k].style.visibility = 'hidden'; });
  if (key) {
    active[key] = true;
    canvases[key].style.visibility = 'visible';
  }
  techRotating = rotate;

  /* Drag con el mouse sobre la zapa: el canvas tech solo captura eventos
     cuando la sección Talles está al 100% (top <= 0). Al salir (Reseñas)
     vuelve a pointer-events: none. El resto de los canvas queda sin eventos. */
  const tallesIn = key === 'tech' && document.querySelector('#talles').getBoundingClientRect().top <= 0;
  canvases.tech.style.pointerEvents = tallesIn ? 'auto' : 'none';
}

window.addEventListener('scroll', syncActive, { passive: true });
syncActive();

/* =========================
   POSE DE LA ZAPA POR SCROLL (sección CTA final)
   ScrollTrigger usa la geometría real de la sección (sin suposiciones
   de altura):
   - start 'top 150%'   -> el giro arranca cuando la escena 3D se activa
     (top del .cta-final en 1.5*vh), es decir justo cuando el telón negro
     de Reseñas empieza a irse y el three.js queda a la vista. Así la zapa
     YA está rotando apenas se la empieza a ver.
   - end 'bottom bottom' -> progreso 1 (pose final del usuario: la zapa
     queda exactamente en esa rotación al llegar al fondo de la página).
   Con la sección de 300svh el rango va de +150vh a -200vh (350vh).
   La interpolación (x/y/z) la hace talles-scene.setShoePose.
   Reversa exacta al subir el scroll.
 ========================= */

function applyShoePose(progress) {
  if (!scenes.talles || !scenes.talles.setShoePose) return;
  scenes.talles.setShoePose(progress);
}

let shoeTrigger = null;

function initShoeScroll() {
  shoeTrigger = ScrollTrigger.create({
    trigger: '.cta-final',
    start: 'top 150%',
    end: 'bottom bottom',
    onUpdate: (self) => applyShoePose(self.progress)
  });
  applyShoePose(shoeTrigger.progress);
}

gsap.registerPlugin(ScrollTrigger);
initShoeScroll();

/* =========================
   RENDER LOOP
animate(t) recibe el timestamp del navegador; s = segundos (t/1000).
   Los segundos s alimentan el turntable (solo en la sección Talles).
   Solo se renderiza la escena cuya sección está activa (ahorro de GPU).
 ========================= */

function animate(t) {
  requestAnimationFrame(animate);
  const s = t / 1000;

  if (active.hero && scenes.hero) scenes.hero.render(t);
  if (active.tech && scenes.tech) scenes.tech.render(t, techRotating);
  if (active.talles && scenes.talles) scenes.talles.render();
}

requestAnimationFrame(animate);

/* =========================
   RESIZE + LAYOUT RESPONSIVE
   Cada escena expone layout(state) para re-componer su encuadre según el
   viewport (desktop / tablet / mobile) y resize(w, h) para el aspect +
   tamaño del canvas. Un solo handler unifica resize y orientationchange.
   El refresh de ScrollTrigger evita que los triggers queden con medidas
   viejas tras cambiar el layout.
========================= */

const MOBILE_W = 768;
const TABLET_W = 1024;

const mqTablet = window.matchMedia(`(max-width: ${TABLET_W}px)`);
const mqMobile = window.matchMedia(`(max-width: ${MOBILE_W}px)`);

function getState() {
  const w = window.innerWidth;
  const aspect = w / window.innerHeight;
  if (w < MOBILE_W) return 'mobile';                    // celular
  if (w <= TABLET_W || aspect < 1.35) return 'tablet';  // tablet portrait o media ventana
  return 'desktop';
}

function handleResize() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  const state = getState();

  [scenes.hero, scenes.tech, scenes.talles].forEach((scene) => {
    if (!scene) return;
    if (scene.layout) scene.layout(state);
    scene.resize(w, h);
  });

  syncActive();
}

window.addEventListener('resize', handleResize);
window.addEventListener('orientationchange', () => { setTimeout(handleResize, 250); });
[mqTablet, mqMobile].forEach((mq) => mq.addEventListener('change', () => { handleResize(); ScrollTrigger.refresh(); }));