import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const loader = new GLTFLoader();

/* =========================
   ESCENA
========================= */

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1C1C1C);

/* =========================
   CÁMARA
========================= */

const fov = 75;
const aspectRatio = window.innerWidth / window.innerHeight;
const near = 0.1;
const far = 1000;

const camera = new THREE.PerspectiveCamera(fov, aspectRatio, near, far);
camera.position.set(0, 0, 2);

/* =========================
   CANVAS & RENDERER
========================= */

const canvas = document.querySelector('#webgl');

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: true
});

renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

/* =========================
   PISO (SOMBRA)
========================= */

const shadowMaterial = new THREE.ShadowMaterial({ opacity: 0.3 });

const plane = new THREE.Mesh(
  new THREE.PlaneGeometry(12, 12),
  shadowMaterial
);

plane.rotation.x = -Math.PI / 2;
plane.position.y = -1.3;
plane.receiveShadow = true;

scene.add(plane);

/* =========================
   HELPERS (DEBUG)
   ========================= */

const DEBUG = true;

if (DEBUG) {
  const grid = new THREE.GridHelper(12, 12, 0x3a3a3a, 0x222222);
  grid.position.y = -1.3;
  scene.add(grid);

  const axes = new THREE.AxesHelper(3);
  scene.add(axes);
}

/* =========================
   LUCES SHOWROOM
========================= */

const ambient = new THREE.AmbientLight(0xffffff, 0.25);
scene.add(ambient);

const keyLight = new THREE.DirectionalLight(0xffffff, 1.5);
keyLight.position.set(3, 4, 2);
keyLight.castShadow = true;
keyLight.shadow.mapSize.width = 2048;
keyLight.shadow.mapSize.height = 2048;
keyLight.shadow.camera.near = 0.1;
keyLight.shadow.camera.far = 20;
scene.add(keyLight);

const fillLight = new THREE.DirectionalLight(0xffffff, 0.6);
fillLight.position.set(-3, 2, 2);
scene.add(fillLight);

const rimLight = new THREE.DirectionalLight(0xffffff, 1);
rimLight.position.set(0, 3, -3);
scene.add(rimLight);

renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1;
renderer.outputColorSpace = THREE.SRGBColorSpace;

/* =========================
   MODELO ZAPATILLA + ANIMACIÓN
========================= */

loader.load('./model/nike_air_zoom_pegasus_36.glb', (gltf) => {
  const shoes = gltf.scene;

  shoes.traverse((obj) => {
    if (obj.isMesh) {
      obj.castShadow = true;
      obj.receiveShadow = true;
    }
  });

  scene.add(shoes);

  /* Poses clave por sección: [x, y, z, rotaciónY, escala].
     Las 5 secciones dividen el scroll: cada posición se alcanza
     cuando su sección ocupa la pantalla. */
  const poses = {
    desktop: [
      { x: 1.2, y: 0, z: 0, ry: 1, s: 1.2 },
      { x: 0.7, y: 0.4, z: -0.3, ry: 1.7, s: 1.05 },
      { x: -1.1, y: 0.1, z: 0, ry: 1.5, s: 1.05 },
      { x: 0.9, y: 0.2, z: -0.5, ry: 2.6, s: 0.85 },
      { x: 0, y: 0.05, z: 0.3, ry: 1.1, s: 1.35 }
    ],
    mobile: [
      { x: 0, y: 0.3, z: 0, ry: 0.6, s: 0.9 },
      { x: 0, y: 0.6, z: -0.4, ry: 1.3, s: 0.75 },
      { x: 0, y: 0.05, z: 0.3, ry: 1.5, s: 0.95 },
      { x: 0, y: 0.3, z: -0.5, ry: 2.7, s: 0.7 },
      { x: 0, y: 0.1, z: 0.3, ry: 1, s: 1.05 }
    ]
  };

  const setupScrub = (poseSet) => {
    gsap.set(shoes.position, { x: poseSet[0].x, y: poseSet[0].y, z: poseSet[0].z });
    gsap.set(shoes.rotation, { y: poseSet[0].ry });
    gsap.set(shoes.scale, { x: poseSet[0].s, y: poseSet[0].s, z: poseSet[0].s });

    /* Poses en [progreso en que cada sección cubre la pantalla]:
       hero 100svh, features 250svh (sticky), talles 100svh,
       reviews 250svh (sticky), cta 100svh = 800svh total → 700svh de scroll.
       features: 100/700 = 0.1429, talles: 350/700 = 0.5,
       reviews: 450/700 = 0.6429, cta: 1 */
    const stops = [0, 0.1429, 0.5, 0.6429, 1];

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: document.body,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 1
      }
    });

    for (let i = 0; i < poseSet.length - 1; i++) {
      const to = poseSet[i + 1];
      const dur = stops[i + 1] - stops[i];

      tl.to(shoes.position, { x: to.x, y: to.y, z: to.z, duration: dur, ease: 'none' }, stops[i])
        .to(shoes.rotation, { y: to.ry, duration: dur, ease: 'none' }, stops[i])
        .to(shoes.scale, { x: to.s, y: to.s, z: to.s, duration: dur, ease: 'none' }, stops[i]);
    }
  };

  const mm = gsap.matchMedia();

  mm.add('(min-width: 768px)', () => {
    setupScrub(poses.desktop);
    return () => {};
  });

  mm.add('(max-width: 767.98px)', () => {
    setupScrub(poses.mobile);
    return () => {};
  });

  /* Entrada al cargar */
  gsap.from(shoes.position, { x: '+=1.6', y: '+=0.7', duration: 1.4, ease: 'power3.out', delay: 0.1 });
  gsap.from(shoes.rotation, { y: '+=1.2', duration: 1.4, ease: 'power3.out', delay: 0.1 });

  ScrollTrigger.refresh();
});

/* =========================
   RENDER LOOP
========================= */

function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}

animate();

/* =========================
   RESIZE
========================= */

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});