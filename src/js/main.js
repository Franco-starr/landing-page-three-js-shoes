import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { initHeroScene } from './scenes/hero-scene.js';
import { initTechScene } from './scenes/tech-scene.js';
import { initTallesScene } from './scenes/talles-scene.js';

const loader = new GLTFLoader();

const scenes = {};
const active = { hero: false, tech: false, talles: false };

const canvases = {
  hero: document.querySelector('#webgl-hero'),
  tech: document.querySelector('#webgl-tech'),
  talles: document.querySelector('#webgl-talles')
};

Object.values(canvases).forEach((c) => { c.style.visibility = 'hidden'; });
canvases.hero.style.visibility = 'visible';

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
========================= */

const map = {
  producto: 'hero',
  caracteristicas: 'tech',
  talles: 'talles',
  cta: 'talles'
};

const io = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    const key = map[entry.target.id];
    if (!key) return;
    active[key] = entry.isIntersecting;
    canvases[key].style.visibility = entry.isIntersecting ? 'visible' : 'hidden';
  });
}, { threshold: 0 });

io.observe(document.querySelector('.hero'));
io.observe(document.querySelector('.features'));
io.observe(document.querySelector('#talles'));
io.observe(document.querySelector('.cta-final'));

/* =========================
   RENDER LOOP
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
========================= */

window.addEventListener('resize', () => {
  const w = window.innerWidth;
  const h = window.innerHeight;

  if (scenes.hero) scenes.hero.resize(w, h);
  if (scenes.tech) scenes.tech.resize(w, h);
  if (scenes.talles) scenes.talles.resize(w, h);
});