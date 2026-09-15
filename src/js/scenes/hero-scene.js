import * as THREE from 'three';
import gsap from 'gsap';

/* =========================
   ESCENA 1 - HERO
   Fondo 0xF54927, cámara única (0,0,-2), la zapa
   se ubica a la derecha (x=1.1), entrada GSAP + turntable.
   Se renderiza solo mientras el hero está en pantalla.
========================= */

export function initHeroScene(canvas, model) {
  /* ESCENA + FONDO: acá se crea la escena y se define su color de fondo.
     El modelo y los helpers se agregan a esta escena. */
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xF54927);

  /* CÁMARA: única en todas las escenas.
     Mirando desde (0,0,-2) hacia el origen (0,0,0), donde se apoya la zapa. */
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 0.5, -2);
  camera.lookAt(0, 0, 0);

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

  /* POSICIÓN de la zapa en esta sección: a la derecha (x=1.1),
     dejando espacio para el texto del hero a la izquierda. */
  model.position.set(-1.1, 0.5, 0);

  /* MOVIMIENTO DE LA ZAPA (hero):
     - Entrada: gsap.from desliza la zapa desde la derecha/abajo
       (+1.6 en x, +0.7 en y) hacia su posición, girándola (+1.2 rad).
     - Turntable: vuelta completa (2π = 6.2832 rad) cada 24s, en loop infinito. */
  gsap.from(model.position, { x: '+=1.6', y: '+=0.7', duration: 1.4, ease: 'power3.out', delay: 0.1 });
  gsap.from(model.rotation, { y: '+=1.2', duration: 1.4, ease: 'power3.out', delay: 0.1 });
  gsap.to(model.rotation, { y: '+=6.2832', duration: 24, ease: 'none', repeat: -1, delay: 1.7 });

  return {
    /* Resize: recalcula el aspect de la cámara y reacomoda el canvas. */
    resize(w, h) {
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    },
    /* Render: pinta la escena con la cámara (lo llama main.js
       solo cuando el hero está visible). */
    render() {
      renderer.render(scene, camera);
    }
  };
}