import * as THREE from 'three';
import gsap from 'gsap';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { createAsphaltFloor } from './street-floor.js';

/* =========================
   ESCENA 1 - HERO
   Un solo canvas WebGL pinta el fondo negro, el piso de asfalto texturado,
   el texto (CanvasTexture acostado en el piso) y la zapa con su sombra.
   Todo convive en la MISMA escena: la sombra de la zapa cae sobre las
   letras y no queda ninguna capa DOM flotando sobre las secciones.
   Se renderiza solo mientras el hero está en pantalla.
========================= */

export function initHeroScene(canvas, model) {
  /* ESCENA: fondo negro pintado por three.js. El canvas es opaco porque
     todo el contenido (asfalto, texto, zapa y sombra) vive en esta escena. */
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000);

  /* CÁMARA: única en todas las escenas.
     Mirando desde (0,0,-2) hacia el origen (0,0,0), donde se apoya la zapa. */
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 1.5, -1.5);
  camera.lookAt(0, 0.5, 0);

  /* RENDERER: vincula el canvas <canvas id="webgl-hero">, antialias y
     fondo opaco (la escena pinta su propio negro). El canvas es fijo a
     pantalla completa (z-index 0), debajo de las secciones. */
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: false
  });

  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  /* PISO DE ASFALTO: textura PBR de calle en el mismo nivel del antiguo
     plano invisible. El asfalto recibe la sombra de la zapa (receiveShadow)
     y ocupa el rol del plano ShadowMaterial, que se comenta más abajo. */
  scene.add(createAsphaltFloor({ size: 48, y: 0 }));

  /* PISO (sombra): COMENTADO porque el asfalto ya cumple ese rol (recibe la
     sombra). Se mantiene como referencia para las otras escenas.
  const shadowMaterial = new THREE.ShadowMaterial({ opacity: 0.3 });

  const plane = new THREE.Mesh(
    new THREE.PlaneGeometry(12, 12),
    shadowMaterial
  );

  plane.rotation.x = -Math.PI / 2;
  plane.position.y = 0;
  plane.receiveShadow = true;

  scene.add(plane);
  */

  /* HELPERS (DEBUG): acá se establecen los helpers de referencia.
     - GridHelper(12, 12, 0x8f8f8f, 0x454545): grilla en el piso (12x12,
       carril central gris claro). Se posiciona en el nivel del asfalto (y=0).
     - AxesHelper(1.5): ejes de color (rojo=X, verde=Y, azul=Z).
       Se posicionan en 0,0,0 para marcar el origen. */
  const DEBUG = false;

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
     - keyLight: luz principal desde la derecha (x=1) y atrás-arriba (z=7):
       proyectada baja, su sombra barre el título y el subtítulo en el piso.
        Es la única con castShadow (2048 PCFSoft).
     - fillLight: luz de relleno desde la izquierda (suaviza sombras).
     - rimLight: contraluz desde atrás (recorta el contorno). */
  const ambient = new THREE.AmbientLight(0xffffff, 0.25);
  scene.add(ambient);

  const keyLight = new THREE.DirectionalLight(0xffffff, 1.5);
  keyLight.position.set(1, 2, 7);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.width = 2048;
  keyLight.shadow.mapSize.height = 2048;
  keyLight.shadow.camera.near = 0.1;
  keyLight.shadow.camera.far = 20;
  keyLight.shadow.normalBias = 0.02;
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

  /* REFLEJOS DEL PISO: se hornea una sola vez un entorno de estudio
     (RoomEnvironment) en un cubemap. Dentro de ese entorno se agrega un
     panel luminoso blanco en la misma posición de la keyLight. El cubemap
     NO se aplica a la escena entera (eso sube el brillo de todo): se usa
     únicamente como envMap de la banda glossy, así solo el piso muestra el
     reflejo del panel y el resto queda oscuro. PMREMGenerator se descarta
     tras hornear (costo solo al inicio). */
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envScene = new RoomEnvironment();
  const lightPanel = new THREE.Mesh(
    new THREE.PlaneGeometry(2, 1.4),
    new THREE.MeshBasicMaterial({ color: 0xffffff })
  );
  lightPanel.position.copy(keyLight.position);
  lightPanel.lookAt(keyLight.position.x, 0, keyLight.position.z);
  envScene.add(lightPanel);
  const envMap = pmrem.fromScene(envScene).texture;
  pmrem.dispose();

  /* BANDA GLOSSY: superficie oscura y pulida de "pasarela" apenas por encima
     del asfalto (y=0.009, debajo del texto en 0.01, evita z-fight). Es la
     única superficie que refleja el entorno horneado: muestra el panel de
     luz (dónde está la keyLight) sin subir el brillo del resto de la escena.
     Recibe la sombra de la zapa igual que el asfalto. */
  const stageBand = new THREE.Mesh(
    new THREE.PlaneGeometry(7, 6),
    new THREE.MeshStandardMaterial({
      color: 0x111111,
      metalness: 0.9,
      roughness: 0.25,
      envMap,
      envMapIntensity: 0.8
    })
  );
  stageBand.rotation.x = Math.PI / 2;
  stageBand.position.set(0, 0.009, 0);
  stageBand.receiveShadow = true;
  scene.add(stageBand);

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
  model.rotation.y = 0;
  gsap.from(model.position, { y: '+=0.7', duration: 1.4, ease: 'power3.out', delay: 0.1 });

  /* =========================
     TEXTO EN EL PISO (CanvasTexture)
     El título y el subtítulo se dibujan en un canvas 2D offscreen y se
     aplican como textura a planos acostados en el piso (y=0.01), dentro de
     la MISMA escena WebGL. Así la sombra de la zapa cae sobre las letras
     (el material recibe sombra) y no existe una capa DOM que pueda
     superponerse a las transiciones entre secciones.
  ========================= */
  const FONT = '"American Sporty"';
  const RES = 4;                    // supermuestreo del texto (nitidez)
  const TEXT_SCALE = 0.002 / RES;   // px -> unidades de mundo (misma escala CSS3D)

  /* Lee el texto de un elemento reemplazando los <br> por saltos de línea. */
  const readText = (selector) => {
    const el = document.querySelector(selector);
    if (!el) return '';
    const clone = el.cloneNode(true);
    clone.querySelectorAll('br').forEach((br) => br.replaceWith('\n'));
    return clone.textContent.trim();
  };

  /* Dibuja un texto en un canvas offscreen y devuelve su textura.
     La primera pasada usa la fuente ya cargada; si American Sporty todavía
     no cargó, repinta apenas termine (document.fonts) para no quedar
     "sin letras". */
  const makeTextTexture = (text, fontSize, { maxWidth = 0, color = '#ffffff' }) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    /* Aplica wrap por palabras si hace falta y devuelve las líneas. */
    const wrap = (lines) => {
      if (maxWidth <= 0) return lines;
      const out = [];
      lines.forEach((line) => {
        const words = line.split(' ');
        let current = '';
        for (const word of words) {
          const test = current ? `${current} ${word}` : word;
          if (ctx.measureText(test).width > maxWidth && current) {
            out.push(current);
            current = word;
          } else {
            current = test;
          }
        }
        if (current) out.push(current);
      });
      return out;
    };

    ctx.font = `${fontSize}px ${FONT}, sans-serif`;
    const lines = wrap(text.split('\n'));
    const width = Math.max(...lines.map((l) => ctx.measureText(l).width));
    const height = lines.length * fontSize * 1.1;
    canvas.width = Math.max(1, Math.ceil(width));
    canvas.height = Math.max(1, Math.ceil(height));

    const paint = () => {
      const c = canvas.getContext('2d');
      c.clearRect(0, 0, canvas.width, canvas.height);
      c.font = `${fontSize}px ${FONT}, sans-serif`;
      c.fillStyle = color;
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      lines.forEach((l, i) => {
        c.fillText(l, canvas.width / 2, (i + 0.5) * fontSize * 1.1);
      });
    };

    paint();

    const texture = new THREE.CanvasTexture(canvas);
    //texture.flipY = false;
    texture.colorSpace = THREE.SRGBColorSpace;

    /* Re-pintar al terminar la carga del tipo (los glifos reales miden
       distinto) y avisar a three.js que la textura cambió. */
    if (document.fonts && document.fonts.load) {
      document.fonts.load(`400 ${fontSize}px ${FONT}`).then(() => {
        paint();
        texture.needsUpdate = true;
      });
    }

    return texture;
  };

  /* Crea un plano acostado que muestra una textura de texto en el piso.
     El ancho sale del canvas real * TEXT_SCALE (mismas proporciones que la
     versión CSS3D: em de 200px -> 0.4 unidades de mundo). El material
     recibe la sombra de la zapa (receiveShadow). */
  const addFloorText = (text, fontSize, { x = 0, z = 0, maxWidth = 0 }) => {
    const texture = makeTextTexture(text, fontSize, { maxWidth });
    const plane = new THREE.Mesh(
      new THREE.PlaneGeometry(
        texture.image.width * TEXT_SCALE,
        texture.image.height * TEXT_SCALE
      ),
      new THREE.MeshStandardMaterial({
        map: texture,
        transparent: true,
        side: THREE.DoubleSide,
        receiveShadow: true,
        color: 0xffffff
      })
    );
    plane.rotation.x = -Math.PI / 2;
    plane.rotation.z = Math.PI; // <--- AGREGA ESTA LÍNEA (Gira el texto hacia la cámara)
    plane.position.set(x, 0.01, z);
    scene.add(plane);
    return plane;
  };

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* El título va detrás (z positivo = más lejos = más arriba en pantalla);
     el subtítulo delante, más cerca de la cámara. Los tamaños 200px/54px
     y el wrap de 1000px coinciden con la versión CSS3D. */
  const titlePlane = addFloorText(readText('.hero-title'), 200 * RES, { z: 0.45 });
  const subtitlePlane = addFloorText(readText('.hero-subtitle'), 54 * RES, {
    z: -0.35,
    maxWidth: 1000 * RES
  });

  if (!reduceMotion) {
    [titlePlane, subtitlePlane].forEach((object, i) => {
      gsap.from(object.position, { y: -0.5, duration: 1.2, ease: 'power3.out', delay: 0.15 + i * 0.1 });
    });
  }

  return {
    /* Resize: solo la cámara y el canvas WebGL (ya no hay capa CSS3D). */
    resize(w, h) {
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    },
    /* Render: asfalto + zapa + sombra + texto de piso, todo en una pasada. */
    render() {
      renderer.render(scene, camera);
    }
  };
}