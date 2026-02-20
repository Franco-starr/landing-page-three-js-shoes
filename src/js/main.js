import * as THREE from 'https://esm.sh/three@0.158.0';
import { OrbitControls } from 'https://esm.sh/three@0.158.0/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'https://esm.sh/three@0.158.0/examples/jsm/loaders/GLTFLoader.js';
const loader = new GLTFLoader();


/* =========================
   ESCENA
========================= */

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xbf0a30); // gris oscuro elegante

/* =========================
   CÁMARA
========================= */


const fov = 75;
const aspectRatio = window.innerWidth / window.innerHeight;
const near = 0.1;
const far = 1000;

const camera = new THREE.PerspectiveCamera(
  fov,
  aspectRatio,
  near,
  far
);
export { camera };


// Cámara un poco más lejos para ver sombra
camera.position.set(0, 0, 2);

/* =========================
   CANVAS & RENDERER
========================= */

const canvas = document.querySelector('#webgl');

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: true // fondo transparente
});

// ✅ sombras ACTIVADAS (este era el typo)
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

/* =========================
   CONTROLS
========================= */

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = false;

/* =========================
   HELPERS (solo para debug)
========================= */

// ❗ Cuando ya esté listo, eliminá esto
/*
const axesHelper = new THREE.AxesHelper(5);
scene.add(axesHelper);
*/
/* =========================
   modelo zapatilla
============================*/
export let shoes = null;
loader.load('/src/model/nike_air_zoom_pegasus_36.glb', (gltf) => {
   shoes = gltf.scene;

  shoes.traverse((obj) => {
    if (obj.isMesh) {
      obj.castShadow = true;    // proyecta sombra
      obj.receiveShadow = true; // recibe sombra (opcional)
    }
  });
  shoes.rotation.y = 1
  // tamaño correcto
  shoes.scale.set(1.2, 1.2, 1.2);
  shoes.position.set(0, 0, 0);
  scene.add(shoes);

  // 🔥 avisamos que el modelo ya existe
  window.dispatchEvent(new Event("modelReady"));

  /*=========================
     GSAP SCROLL ANIMATIONS
    ========================= */
    function updateModelScale() {
  const isMobile = window.innerWidth < 768;

  if (isMobile) {
    shoes.scale.set(0.9, 0.9, 0.9);
  } else {
    shoes.scale.set(1.2, 1.2, 1.2);
  }
}

updateModelScale();
window.addEventListener('resize', updateModelScale);
    
});


/*=========================
   PISO (INVISIBLE + SOMBRA)
  ========================= */

const material = new THREE.MeshStandardMaterial({
  color: 0x00ff00,
  roughness: 0.4,
  metalness: 0.2
});

// ✅ ESTE ES EL MATERIAL CORRECTO
const shadowMaterial = new THREE.ShadowMaterial({
  opacity: 0.3 // intensidad de la sombra
});

const plane = new THREE.Mesh(
  new THREE.PlaneGeometry(12, 12),
  shadowMaterial,
);

plane.rotation.x = -Math.PI / 2;
plane.position.y = -1.3; 

// ✅ typo corregido
plane.receiveShadow = true;

scene.add(plane);

/* =========================
   LUCES
========================= */

/* =========================
   LUCES PRO SHOWROOM
========================= */

// ambiente MUY suave (solo para no tener negros puros)
const ambient = new THREE.AmbientLight(0xffffff, 0.25);
scene.add(ambient);


// ☀️ KEY LIGHT (principal)
const keyLight = new THREE.DirectionalLight(0xffffff, 1.5);
keyLight.position.set(3, 4, 2);
keyLight.castShadow = true;

keyLight.shadow.mapSize.width = 2048;
keyLight.shadow.mapSize.height = 2048;

keyLight.shadow.camera.near = 0.1;
keyLight.shadow.camera.far = 20;

scene.add(keyLight);


// 💡 FILL LIGHT (suaviza sombras)
const fillLight = new THREE.DirectionalLight(0xffffff, 0.6);
fillLight.position.set(-3, 2, 2);
scene.add(fillLight);


// ✨ RIM LIGHT (borde / silueta)
const rimLight = new THREE.DirectionalLight(0xffffff, 1);
rimLight.position.set(0, 3, -3);
scene.add(rimLight);

renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1;
renderer.outputColorSpace = THREE.SRGBColorSpace;

/* =========================
   ANIMACIÓN
========================= */

function animate() {
  requestAnimationFrame(animate);
  controls.update();
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

//gsap 