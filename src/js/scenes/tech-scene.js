import * as THREE from 'three';

/* =========================
   ESCENA 2 - TECNOLOGÍA
   Fondo más oscuro (0x101010), ángulo inmersivo,
   la zapa rota y flota detrás del telón negro.
========================= */

export function initTechScene(canvas, model) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0a0a0a);

  const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 0.6, 3);
  camera.lookAt(0, 0, 0);

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
  const plane = new THREE.Mesh(
    new THREE.PlaneGeometry(24, 24),
    new THREE.ShadowMaterial({ opacity: 0.25 })
  );

  plane.rotation.x = -Math.PI / 2;
  plane.position.y = -1.3;
  plane.receiveShadow = true;

  scene.add(plane);

  /* LUCES más dramáticas */
  const ambient = new THREE.AmbientLight(0xffffff, 0.2);
  scene.add(ambient);

  const keyLight = new THREE.DirectionalLight(0xffffff, 1.8);
  keyLight.position.set(-3, 3, 2);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.width = 2048;
  keyLight.shadow.mapSize.height = 2048;
  scene.add(keyLight);

  const fillLight = new THREE.DirectionalLight(0xffffff, 0.5);
  fillLight.position.set(3, 1, 2);
  scene.add(fillLight);

  const rimLight = new THREE.DirectionalLight(0xffffff, 1.4);
  rimLight.position.set(0, 2, -4);
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

  /* HELPERS (DEBUG) */
  const axes = new THREE.AxesHelper(1.5);
  axes.position.set(-2.3, -1, 0);
  scene.add(axes);

  model.position.set(0, 0.2, 0);
  model.rotation.y = -0.6;
  model.scale.setScalar(1.15);

  scene.add(model);

  return {
    resize(w, h) {
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    },
    render(s) {
      model.rotation.y = -0.6 + s * 0.25;
      model.position.y = 0.2 + Math.sin(s * 1.2) * 0.08;
      renderer.render(scene, camera);
    }
  };
}