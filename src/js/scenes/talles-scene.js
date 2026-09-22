import * as THREE from 'three';

/* =========================
   ESCENA 3 - CTA FINAL
   Fondo 0x9b51e0, cámara única (0,0,-2), la zapa
   a la izquierda (x=-1.1), estática (sin turntable).
   Se renderiza en el CTA final
   (el negro de Reseñas la tapa en el medio).
 ========================= */

export function initTallesScene(canvas, model) {
  /* ESCENA + FONDO: fondo oscuro intermedio. */
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000);

  /* CÁMARA: única en todas las escenas.
     Mirando desde (0,0,-2) hacia el origen (0,0,0). */
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 0, -2);
  camera.lookAt(0, 0, 0);

  /* RENDERER: vincula el canvas <canvas id="webgl-talles">. */
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true
  });

  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  /* PISO (sombra): igual que el resto de las escenas, en y=-1.3. */
  const plane = new THREE.Mesh(
    new THREE.PlaneGeometry(12, 12),
    new THREE.ShadowMaterial({ opacity: 0.3 })
  );

  plane.rotation.x = -Math.PI / 2;
  plane.position.y = 0;
  plane.receiveShadow = true;

  scene.add(plane);

  /* LUCES SHOWROOM: misma iluminación en las 3 escenas. */
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

  /* TONO DE COLOR: ACES + sRGB. */
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  /* MODELO: sombras + agregar el clon a la escena. */
  model.traverse((obj) => {
    if (obj.isMesh) {
      obj.castShadow = true;
      obj.receiveShadow = true;
    }
  });

  /* HELPERS (DEBUG): ejes RGB a la derecha (2.3,-1,0),
     porque la zapa queda a la izquierda en esta sección. */
  /*
     const axes = new THREE.AxesHelper(1.5);
  axes.position.set(0, 0, 0);
  scene.add(axes);
  */

  /* POSICIÓN de la zapa en esta sección: izquierda (x=-1.1),
     dejando espacio para el selector de talles a la derecha. */
  model.position.set(-1.1, 0, 0);

  /* POSE POR SCROLL: la zapa interpola desde la pose inicial (la clásica
     en 1.5) hasta la pose final que dejó el usuario (x 6.80 ~ 0.52 rad,
     y -2, z 0.8) durante TODO el scroll de la sección CTA final. */
  const SHOE_POSE_START = { x: 0, y: 1.5, z: 0 };
  const SHOE_POSE_END = { x: 6.8 - Math.PI * 2, y: -2, z: 0.8 };
  model.rotation.set(SHOE_POSE_START.x, SHOE_POSE_START.y, SHOE_POSE_START.z);

  scene.add(model);

  return {
    /* Resize: aspect + tamaño del canvas. */
    resize(w, h) {
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    },
    /* MOVIMIENTO DE LA ZAPA (CTA): p (0..1) llega desde el scroll y la
       pose se interpola linealmente entre la inicial y la final (ver
       main.js). Al llegar al tope la zapa queda exactamente en la pose
       final del usuario. */
    setShoePose(p) {
      model.rotation.set(
        SHOE_POSE_START.x + (SHOE_POSE_END.x - SHOE_POSE_START.x) * p,
        SHOE_POSE_START.y + (SHOE_POSE_END.y - SHOE_POSE_START.y) * p,
        SHOE_POSE_START.z + (SHOE_POSE_END.z - SHOE_POSE_START.z) * p
      );
    },
    render() {
      renderer.render(scene, camera);
    }
  };
}