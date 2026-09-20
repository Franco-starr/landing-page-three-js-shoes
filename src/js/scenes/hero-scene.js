import * as THREE from 'three';
import gsap from 'gsap';
import { CSS3DRenderer, CSS3DObject } from 'three/addons/renderers/CSS3DRenderer.js';

/* =========================
   ESCENA 1 - HERO
   Fondo transparente (el naranja lo pinta la capa CSS3D): la zapa flota
   centrada y el título + subtítulo se dibujan como DOM acostados en el piso
   (CSS3DRenderer). El canvas WebGL va por encima de esa capa, así el plano
   ShadowMaterial recibe la sombra de la zapa y la proyecta sobre las letras.
   Se renderiza solo mientras el hero está en pantalla.
========================= */

export function initHeroScene(canvas, model) {
  /* ESCENA: sin background para que el canvas sea transparente y deje ver
     la capa CSS3D (que pinta el naranja) por debajo. */
  const scene = new THREE.Scene();
  scene.background = null;

  /* CÁMARA: única en todas las escenas.
     Mirando desde (0,0,-2) hacia el origen (0,0,0), donde se apoya la zapa. */
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 1.3, -1.5);
  camera.lookAt(0, 0.5, 0);

  /* RENDERER: vincula el canvas <canvas id="webgl-hero">, antialias y
     canal alpha. El canvas es fijo a pantalla completa (z-index 0). */
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true
  });

  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  /* PISO (sombra): plano invisible (ShadowMaterial) en y=-1.3 que
     recibe la sombra de la zapa. Tamaño y posición iguales en las 3 escenas. */
  const shadowMaterial = new THREE.ShadowMaterial({ opacity: 0.3 });

  const plane = new THREE.Mesh(
    new THREE.PlaneGeometry(12, 12),
    shadowMaterial
  );

  plane.rotation.x = -Math.PI / 2;
  plane.position.y = 0;
  plane.receiveShadow = true;

  scene.add(plane);

  /* HELPERS (DEBUG): acá se establecen los helpers de referencia.
     - GridHelper(12, 12, 0x8f8f8f, 0x454545): grilla en el piso (12x12,
       carril central gris claro). Se baja a y=-1.3 para que coincida con el piso.
     - AxesHelper(1.5): ejes de color (rojo=X, verde=Y, azul=Z).
       Se posicionan en (-2.3,-1,0), fuera del centro, para que la zapa no los tape. */
  const DEBUG = true;

  if (DEBUG) {
    const grid = new THREE.GridHelper(12, 12, 0x8f8f8f, 0x454545);
    grid.position.y = 0;
    scene.add(grid);

    const axes = new THREE.AxesHelper(1.5);
    axes.position.set(0, 0, 0);
    scene.add(axes);
  }

  /* LUCES SHOWROOM: iluminación básica idéntica en las 3 escenas.
     - ambient: luz general baja (no proyecta sombra).
     - keyLight: luz principal desde arriba-derecha, la única con castShadow.
     - fillLight: luz de relleno desde la izquierda (suaviza sombras).
     - rimLight: contraluz desde atrás (recorta el contorno). */
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

  /* TONO DE COLOR: mapeo cinematográfico ACES + espacio de color sRGB. */
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  /* MODELO: se activan sombras en todos los meshes de la zapa
     y se agrega el modelo clonado a la escena (una copia por escena). */
  model.traverse((obj) => {
    if (obj.isMesh) {
      obj.castShadow = true;
      obj.receiveShadow = true;
    }
  });

  scene.add(model);

  /* ZAPA: centrada (x=0) y elevada, para flotar por encima del texto que
     yace en el piso. La keyLight viene de (3,4,2), su sombra cae hacia -x/-z
     sobre las letras. Queda estática tras la entrada. */
  model.position.set(0, 0.45, 1.42);
  model.rotation.y = -1.2;
  gsap.from(model.position, { y: '+=0.7', duration: 1.4, ease: 'power3.out', delay: 0.1 });

  /* =========================
     TEXTO 3D (CSS3DRenderer)
     El título y el subtítulo son DOM reales acostados en el piso con
     CSS3DObject. La capa pinta el naranja y va debajo del canvas WebGL, que
     proyecta la sombra de la zapa sobre las letras.
  ========================= */
  const cssScene = new THREE.Scene();
  const cssRenderer = new CSS3DRenderer();
  cssRenderer.setSize(window.innerWidth, window.innerHeight);
  cssRenderer.domElement.className = 'css3d-layer';
  cssRenderer.domElement.style.visibility = 'hidden';
  document.body.appendChild(cssRenderer.domElement);

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const SCALE = 0.002;   // unidades de mundo por píxel del elemento DOM
  const flatObjects = [];

  /* Convierte un elemento del hero en texto acostado en el piso.
     rotation.set(-90°, 0, 180°): normal hacia arriba, letras derechas y
     legibles desde la cámara (verificado con proyección sobre la cámara real). */
  const layFlat = (selector, { fontSize, lineHeight = 1, width = null }) => {
    const el = document.querySelector(selector);
    if (!el) return null;

    el.classList.add('floor-text');
    el.style.fontSize = `${fontSize}px`;
    el.style.lineHeight = `${lineHeight}`;
    el.style.pointerEvents = 'none';
    if (width) el.style.width = `${width}px`;

    const object = new CSS3DObject(el);
    object.rotation.set(-Math.PI / 2, 0, Math.PI);
    object.scale.setScalar(SCALE);
    cssScene.add(object);
    flatObjects.push(object);
    return object;
  };

  const titleObj = layFlat('.hero-title', { fontSize: 200 });
  const subtitleObj = layFlat('.hero-subtitle', { fontSize: 54, lineHeight: 1.2, width: 1000 });

  /* El título va detrás (z positivo = más lejos = más arriba en pantalla);
     el subtítulo delante, más cerca de la cámara. */
  if (titleObj) titleObj.position.set(0, 0.01, 0.45);
  if (subtitleObj) subtitleObj.position.set(0, 0.01, -0.35);

  if (!reduceMotion) {
    flatObjects.forEach((object, i) => {
      gsap.from(object.position, { y: -0.5, duration: 1.2, ease: 'power3.out', delay: 0.15 + i * 0.1 });
    });
  }

  return {
    /* La capa CSS3D se muestra/oculta desde main.js junto con el canvas. */
    cssElement: cssRenderer.domElement,
    /* Resize: cámara, canvas WebGL y capa CSS3D. */
    resize(w, h) {
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      cssRenderer.setSize(w, h);
    },
    /* Render: WebGL (zapa + sombra) y CSS3D (texto) con la misma cámara. */
    render() {
      renderer.render(scene, camera);
      cssRenderer.render(cssScene, camera);
    }
  };
}