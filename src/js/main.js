import * as THREE from 'https://esm.sh/three@0.158.0';
import { OrbitControls } from 'https://esm.sh/three@0.158.0/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'https://esm.sh/three@0.158.0/examples/jsm/loaders/GLTFLoader.js';
const loader = new GLTFLoader();
gsap.registerPlugin(ScrollTrigger);


/* =========================
   ESCENA
========================= */

const scene = new THREE.Scene();

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

// Cámara un poco más lejos para ver sombra
camera.position.set(0, 0, 2);

/* =========================
   CANVAS & RENDERER
========================= */

const canvas = document.querySelector('#webgl');

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  //alpha: true // fondo transparente
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
const axesHelper = new THREE.AxesHelper(5);
scene.add(axesHelper);

/* =========================
   modelo zapatilla
============================*/

let shoes;


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

   /* =========================
     GSAP SCROLL ANIMATIONS
  ========================= */
  
});


/* =========================
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

// Luz ambiente suave
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

// Luz principal (como sol)
const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
directionalLight.position.set(2, 4, 3);
directionalLight.castShadow = true;

directionalLight.shadow.mapSize.set(1024, 1024);
directionalLight.shadow.camera.near = 0.1;
directionalLight.shadow.camera.far = 10;

scene.add(directionalLight);

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

/*
function heroIntro() {

  const spin = gsap.to(shoes.rotation, {
    y: "+=" + Math.PI * 2,
    duration: 20,
    repeat: -1,
    ease: "none",
    paused: true
  });

  const move = gsap.to(shoes.position, {
    x: 0,        // hacia la derecha
    y: 0,        // un poco arriba
    z: 0,
    duration: 1.5,
    ease: "power2.out",
    paused: true
  });

  const trigger = ScrollTrigger.create({
    trigger: ".hero-title",
    start: "top center",
    end: "bottom end",

    onEnter: () => {
      spin.play();
      move.play();
    },

    onEnterBack: () => {
      spin.play();
      move.play();
    },

    onLeave: () => {
      spin.pause();
      move.reverse(); // vuelve a su lugar original
    },

    onLeaveBack: () => {
      spin.pause();
      move.reverse();
    },
  });

  if (trigger.isActive) {
    spin.play();
    move.play();
  }
}
function horizontalAnimations() {

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: "body",
      start: "top top",
      end: "bottom bottom",
      scrub: 1
    }
  });

  // HERO
  tl.to(shoes.position, {
    x: -1.5,
    duration: 1
  })
  .to(shoes.rotation, {
    y: "+=1.2"
  }, "<");

  // sección 2
  tl.to(shoes.position, {
    x: -0.5,
    duration: 1
  })
  .to(shoes.rotation, {
    y: "+=3.3"
  }, "<");

  // sección 3
  tl.to(shoes.position, {
    x: 0.8,
    duration: 1
  })
  .to(shoes.rotation, {
    y: "+=1.5"
  }, "<");

  // sección 4
  tl.to(shoes.position, {
    x: -1,
    duration: 1
  })
  .to(shoes.rotation, {
    y: "+=1.2"
  }, "<");
}
  */