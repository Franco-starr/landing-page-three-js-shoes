import * as THREE from 'three';

/* =========================
   ESCENA 3 - TALLES / CTA
   Fondo 0x1c1c1c, la zapa gira (turntable) para
   elegir talle. Reutilizada en el CTA final.
========================= */

export function initTallesScene(canvas, model) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x161616);

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
  const plane = new THREE.Mesh(
    new THREE.PlaneGeometry(12, 12),
    new THREE.ShadowMaterial({ opacity: 0.3 })
  );

  plane.rotation.x = -Math.PI / 2;
  plane.position.y = -1.3;
  plane.receiveShadow = true;

  scene.add(plane);

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

  /* HELPERS (DEBUG) */
  const axes = new THREE.AxesHelper(1.5);
  axes.position.set(2.3, -1, 0);
  scene.add(axes);

  model.rotation.y = 1.5;
  model.scale.setScalar(1.05);

  const applyPosition = () => {
    const mobile = window.innerWidth < 768;
    model.position.set(mobile ? 0 : -1.1, mobile ? 0.05 : 0.1, mobile ? 0.3 : 0);
  };

  applyPosition();
  scene.add(model);

  return {
    resize(w, h) {
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      applyPosition();
    },
    render(s) {
      model.rotation.y = 1.5 + s * 0.3;
      renderer.render(scene, camera);
    }
  };
}