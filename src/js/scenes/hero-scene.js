import * as THREE from 'three';
import gsap from 'gsap';

/* =========================
   ESCENA 1 - HERO (original)
   Fondo 0x1c1c1c, cámara fov 75, grid debug, entrada GSAP.
========================= */

export function initHeroScene(canvas, model) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x262626);

  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 0, 2);

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true
  });

  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  /* PISO (sombra) */
  const shadowMaterial = new THREE.ShadowMaterial({ opacity: 0.3 });

  const plane = new THREE.Mesh(
    new THREE.PlaneGeometry(12, 12),
    shadowMaterial
  );

  plane.rotation.x = -Math.PI / 2;
  plane.position.y = -1.3;
  plane.receiveShadow = true;

  scene.add(plane);

  /* HELPERS (DEBUG) */
  const DEBUG = true;

  if (DEBUG) {
    const grid = new THREE.GridHelper(12, 12, 0x8f8f8f, 0x454545);
    grid.position.y = -1.3;
    scene.add(grid);

    const axes = new THREE.AxesHelper(1.5);
    axes.position.set(-2.3, -1, 0);
    scene.add(axes);
  }

  /* LUCES SHOWROOM */
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

  /* MODELO */
  model.traverse((obj) => {
    if (obj.isMesh) {
      obj.castShadow = true;
      obj.receiveShadow = true;
    }
  });

  scene.add(model);

  /* Entrada al cargar (original) + turntable lento continuo */
  gsap.from(model.position, { x: '+=1.6', y: '+=0.7', duration: 1.4, ease: 'power3.out', delay: 0.1 });
  gsap.from(model.rotation, { y: '+=1.2', duration: 1.4, ease: 'power3.out', delay: 0.1 });
  gsap.to(model.rotation, { y: '+=6.2832', duration: 24, ease: 'none', repeat: -1, delay: 1.7 });

  return {
    resize(w, h) {
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    },
    render() {
      renderer.render(scene, camera);
    }
  };
}