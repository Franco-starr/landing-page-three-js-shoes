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
   - talles (violeta) se pre-activa mientras Reseñas ocupa toda la
     pantalla (cta top <= 2*vh) y su telón tapa todo; queda
     oculto y aparece con el scroll hacia el final. Ahí la zapa ya no gira.
   La ROTACIÓN del turntable no va acá: la maneja un ScrollTrigger propio
   con el mismo rango que el scrub de features (abajo), no el tope de Talles.
 ========================= */

/* Los cortes se miden contra innerHeight de ARRANQUE: las secciones están
   dimensionadas en svh (= innerHeight con la barra visible, el estado normal
   de carga en mobile). Usar el layout viewport (clientHeight, más grande)
   retrasaría el pre-activado de Talles y el switch se vería. */
const couple = [
  ['hero',   document.querySelector('.hero'),            0],
  ['tech',   document.querySelector('.features'),        0],
  [null,     document.querySelector('.reviews'),         0],
  ['talles', document.querySelector('.cta-final'),       window.innerHeight * 2.0]
];

function currentScene() {
  let key = null;
  for (const [k, el, th] of couple) {
    if (el.getBoundingClientRect().top <= th) {
      key = k;
    }
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
ScrollTrigger.config({ ignoreMobileResize: true });
initShoeScroll();

/* =========================
   TURNTABLE - ENCENDIDO POR SCRUB DE FEATURES
   La zapa gira durante el tramo final de Tecnología y durante Talles.
   Se usa EXACTAMENTE el mismo rango que la timeline de features en
   animations.js (start 'top bottom' → end 'bottom top'): apenas el
   scrub pasa ~45% (mientras las cards aún se leen), la zapa arranca a
   girar DETRÁS del telón y ya está girando cuando el telón levanta y
   entra a Talles. Al subir el scroll, revierte.
   Así el encendido escala con la altura real de features (200/250svh)
   en vez de clavar el umbral al tope de #talles, que era tarde.
 ========================= */

ScrollTrigger.create({
  trigger: '.features',
  start: 'top bottom',
  end: 'bottom top',
  onUpdate: (self) => {
    techRotating = self.progress > 0.45;
  }
});

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

/* Métrica de LAYOUT VIEWPORT: constante en Chrome Android (no cambia con la
   barra de URL). Se usa como METRICA ESTABLE para decidir cuándo re-aplicar
   layout/resize (gating): como w/clientHeight no varía con la barra, los
   toggles de la barra nunca reencuadran el three.js. */
const layoutVh = () => document.documentElement.clientHeight;

const mqTablet = window.matchMedia(`(max-width: ${TABLET_W}px)`);
const mqMobile = window.matchMedia(`(max-width: ${MOBILE_W}px)`);

function getState() {
  const w = window.innerWidth;
  const aspect = w / layoutVh();
  if (w < MOBILE_W) return 'mobile';                    // celular
  if (w <= TABLET_W || aspect < 1.35) return 'tablet';  // tablet portrait o media ventana
  return 'desktop';
}

/* Cachés de lo último que se aplicó. Parten en null para que el primer
   handleResize() (al montar las escenas) fuerce el layout inicial. */
let lastState = null;
let lastLayoutState = null;
let lastAspect = window.innerWidth / layoutVh();
const ASPECT_EPSILON = 0.2;
let resizeRaf = null;

/* layout(state) solo cambia cosas que se "ven" al escrollar (escala del
   texto 3D, posición de la zapa, pixel ratio). Re-ejecutarlo en cada
   resize provocaría parpadeo del texto en mobile cuando Chrome Android
   colapsa/expande la barra de URL (cambia innerHeight -> aspect varía
   ~0.1-0.17). Por eso, JUNTO CON scene.resize(), se aplica SOLO cuando
   cambió el estado (mobile/tablet/desktop) o el aspect cambió de forma
   realmente significativa (> ASPECT_EPSILON, ej. rotación de pantalla o
   resize real de la ventana). syncActive() sí corre siempre: es barato y
   mantiene la visibilidad de sección al día. */
function applyLayout(state) {
  if (lastLayoutState === state) return;
  lastLayoutState = state;
  [scenes.hero, scenes.tech, scenes.talles].forEach((scene) => {
    if (scene && scene.layout) scene.layout(state);
  });
}

function handleResize() {
  const w = window.innerWidth;
  /* El canvas se dimensiona con lo VISIBLE con la barra abierta (= svh /
     innerHeight), igual que las secciones: así canvas y hero comparten la
     misma caja y el 3D queda centrado en el hero sin cintas en los bordes.
     Como resize() solo corre detrás del gating (cambio real), los toggles
     de barra no lo vuelven a tocar. */
  const h = window.innerHeight;
  const state = getState();

  const aspect = w / h;
  const stateChanged = state !== lastState;
  const aspectChanged = Math.abs(aspect - lastAspect) > ASPECT_EPSILON;
  lastState = state;
  lastAspect = aspect;

  /* Layout Y tamaño de canvas se aplican SOLO en cambios reales (rotación,
     resize de ventana). En mobile el colapso/expansión de la barra de URL
     dispara resizes con h constante (clientHeight): como w/h no cambia, acá
     no entra nada y el three.js no se reencuadra → sin parpadeo al scrollear. */
  if (stateChanged || aspectChanged) {
    applyLayout(state);
    [scenes.hero, scenes.tech, scenes.talles].forEach((scene) => {
      if (!scene) return;
      scene.resize(w, h);
    });
  }

  syncActive();
}

window.addEventListener('resize', () => {
  if (resizeRaf) return;
  resizeRaf = requestAnimationFrame(() => {
    resizeRaf = null;
    handleResize();
  });
});

window.addEventListener('orientationchange', () => {
  /* Al rotar, resetear las cachés para que el layout se re-aplique por
     fuerza: el aspect guardado y el estado pueden coincidir por casualidad
     (ej. un celular sigue siendo 'mobile' en ambas orientaciones). */
  lastState = null;
  lastLayoutState = null;
  lastAspect = window.innerWidth / layoutVh();
  setTimeout(handleResize, 250);
});

[mqTablet, mqMobile].forEach((mq) => mq.addEventListener('change', () => { handleResize(); ScrollTrigger.refresh(); }));