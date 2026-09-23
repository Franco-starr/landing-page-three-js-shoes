import * as THREE from 'three';
import gsap from 'gsap';

/* =========================
   ESCENA 2 - TECNOLOGÍA / TALLES
   Fondo 0x2f80ed, cámara única (0,0,-2), la zapa
   a la derecha (x=1). Gira (turntable) solo en la sección Talles;
   en Tecnología queda estática (main.js manda el flag rotating).
   Se renderiza mientras Tecnología o Talles está en pantalla
   (detrás del telón negro, que la tapa y la destapa).
 ========================= */

export function initTechScene(canvas, model, options = {}) {
  const card = !!options.card;
  /* En modo card el renderer dimensiona el canvas por el rect del elemento
     (cuadrado de la card en mobile) en vez del viewport completo. */
  const rect = () => canvas.getBoundingClientRect();

  /* ESCENA + FONDO: escena propia y fondo más oscuro que el hero. */
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x1A1A1A);

  /* CÁMARA: única en todas las escenas.
     Mirando desde (0,0,-2) hacia el origen (0,0,0). */
  const aspect = card ? (rect().width || 1) / (rect().height || 1) : window.innerWidth / window.innerHeight;
  const camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);
  camera.position.set(0, 0, -2);
  camera.lookAt(0, 0, 0);

  /* RENDERER: vincula el canvas <canvas id="webgl-tech">. */
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true
  });

  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  if (card) {
    renderer.setSize(rect().width || 1, rect().height || 1, false);
  } else {
    renderer.setSize(window.innerWidth, window.innerHeight, false);
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  /* PISO (sombra): igual que el resto de las escenas, en y=-1.3. */
  const plane = new THREE.Mesh(
    new THREE.PlaneGeometry(12, 12),
    new THREE.ShadowMaterial({ opacity: 0.3 })
  );

  plane.rotation.x = -Math.PI / 2;
  plane.position.y = -1;
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

  /* HELPERS (DEBUG): ejes RGB en (-2.3,-1,0), fuera del centro. */
  /*
  const axes = new THREE.AxesHelper(1.5);
  axes.position.set(0, 0, 0);
  scene.add(axes);
  */

/* POSICIÓN de la zapa en esta sección: centro (0,0,0).
     Rotación inicial -0.6 rad para un ángulo más frontal.
     SHOE_X: en tablet/mobile el aspect colapsa el campo horizontal y si la
     zapa quedara en x=1 se cortaría por la derecha, así que se acerca al
     centro (0.55). */
  const SHOE_X = { desktop: 1, tablet: 0.55, mobile: 0 };
  /* En mobile portrait la zapa sube a la mitad superior (el formulario de
     Talles queda abajo). En landscape y en desktop/tablet se mantiene en 0. */
  const SHOE_Y = { desktop: 0, tablet: 0, mobile: 0.75 };
  /* ESCALA RESPONSIVE de la zapa (igual que el hero): en mobile se achica
     al 90% para que entre en el frame angosto; tablet y desktop quedan a
     tamaño original. */
  const SHOE_SCALE = { desktop: 1, tablet: 1, mobile: 0.9 };
  /* En modo card (canvas del cuadrado de Talles en mobile) la zapa se centra
     y se achica para llenar el marco sin cortarse. */
  model.position.set(card ? 0 : SHOE_X.desktop, 0, 0);
  model.rotation.y = -0.6;

  scene.add(model);

  /* Giro acumulado (turntable de Talles): spin avanza con delta-time,
     arranca desde el ángulo estático sin "snap" y se congela solo.
     En Talles el usuario puede agarrar la zapa (drag) y rotarla en
     Y (horizontal) y X (cabeceo); mientras arrastra, el giro se pausa.
     drag guarda el desvío manual: al soltar vuelve a 0 con GSAP, así
     la zapa retoma la pose original del turntable. */
  let spin = 0;
  let lastT = null;
  const drag = { y: 0, x: 0 };
  let dragging = false;
  let isRotating = false;
  let lastX = 0;
  let lastY = 0;

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const SENS = 0.01;
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

  const toNDC = (e) => {
    /* Se mapea contra el rect real del canvas: en modo card el canvas es el
       cuadrado de Talles (menor al viewport) y el raycast debe alinearse a él. */
    const r = rect();
    const rx = r.width || 1;
    const ry = r.height || 1;
    pointer.x = ((e.clientX - (r.left || 0)) / rx) * 2 - 1;
    pointer.y = -((e.clientY - (r.top || 0)) / ry) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
  };

  canvas.addEventListener('pointerdown', (e) => {
    if (!isRotating || dragging) return;
    toNDC(e);
    if (!raycaster.intersectObject(model, true).length) return;
    dragging = true;
    gsap.killTweensOf(drag);
    lastX = e.clientX;
    lastY = e.clientY;
    canvas.setPointerCapture(e.pointerId);
    canvas.style.cursor = 'grabbing';
  });

  canvas.addEventListener('pointermove', (e) => {
    if (dragging) {
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;
      drag.y += dx * SENS;
      drag.x = clamp(drag.x + dy * SENS, -1.1, 1.1);
      return;
    }
    if (e.pointerType === 'mouse' && isRotating) {
      toNDC(e);
      canvas.style.cursor = raycaster.intersectObject(model, true).length ? 'grab' : '';
    }
  });

  const endDrag = (e) => {
    if (!dragging) return;
    dragging = false;
    canvas.style.cursor = '';
    if (canvas.hasPointerCapture(e.pointerId)) canvas.releasePointerCapture(e.pointerId);
    gsap.to(drag, { y: 0, x: 0, duration: 0.9, ease: 'power3.out' });
  };
  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', endDrag);

  return {
    /* Resize: aspect + tamaño del canvas. En modo card se usa el rect del
       elemento (cuadrado), no el viewport; si la card está oculta (width 0)
       no se toca nada para no romper la cámara. */
    resize(w, h) {
      if (card) {
        const r = { width: rect().width || 1, height: rect().height || 1 };
        camera.aspect = r.width / r.height;
        camera.updateProjectionMatrix();
        renderer.setSize(r.width, r.height, false);
        return;
      }
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
    },
    /* Layout responsive por estado: recorta el offset lateral de la zapa en
       tablet/mobile para que no se salga del frame (ver SHOE_X), sube la
       zapa en mobile portrait (SHOE_Y), la achica en mobile (SHOE_SCALE,
       igual que el hero) y baja el pixel ratio en esos estados.
       El drag/turntable no se tocan.
       En modo card siempre centra la zapa con escala propia. */
    layout(state) {
      if (card) {
        model.position.set(0, 0, 0);
        model.scale.setScalar(0.8);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
        return;
      }
      const portrait = window.matchMedia('(orientation: portrait)').matches;
      if (state === 'mobile' && portrait) {
        model.position.set(0, SHOE_Y.mobile, 0);
      } else {
        model.position.set(SHOE_X[state] ?? SHOE_X.desktop, 0, 0);
      }
      model.scale.setScalar(SHOE_SCALE[state] ?? 1);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, state !== 'desktop' ? 1.5 : 2));
    },
    /* MOVIMIENTO DE LA ZAPA: turntable solo en la sección Talles.
       t lo pasa main.js (timestamp del navegador); rotating se prende
       cuando la sección Talles asoma por abajo, así la zapa ya gira
       al entrar. En Tecnología queda estática en -0.6.
       Con el mouse, en Talles, se puede arrastrar la zapa: mientras
       va apretada el giro automático se pausa y el usuario la rota
       en Y (horizontal) y X (vertical, con cabeceo clampado).
       Al soltar, drag vuelve a 0 y la zapa retoma el turntable. */
    render(t, rotating) {
      isRotating = rotating;
      if (lastT === null) lastT = t;
      const dt = Math.min((t - lastT) / 1000, 0.1);
      lastT = t;
      if (rotating && !dragging) spin += dt * 0.3;
      model.rotation.y = -0.6 + spin + drag.y;
      model.rotation.x = drag.x;
      renderer.render(scene, camera);
    }
  };
}