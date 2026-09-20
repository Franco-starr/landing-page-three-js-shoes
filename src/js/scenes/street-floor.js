import * as THREE from 'three';

/* =========================
   PISO DE ASFALTO - street-floor.js
   Crea un plano 3D con la textura PBR de una calle de asfalto.

   TEXTURAS (en public/textures/asphalt_track_1k.gltf/textures/):
     - asphalt_track_diff_1k.jpg  -> map (albedo, espacio de color sRGB)
     - asphalt_track_nor_gl_1k.jpg -> normalMap (relieve del asfalto)
     - asphalt_track_arm_1k.jpg    -> roughnessMap (G) + metalnessMap (B),
                                      canal ARM empaquetado: R = AO, G = rough, B = metal.

   USO:
     scene.add(createAsphaltFloor({ size: 48, y: -0.6 }));

   PARÁMETROS:
     size  : lado del cuadrado en unidades de mundo (48 = área 48x48).
     y     : altura del piso (default -0.6, por debajo del texto del hero).
   La textura se repite con densidad size/4 (asfalto en un plano 12x12
   muestra el tile 3 veces por lado). receiveShadow: true para recibir la
   sombra de la zapa.
========================= */

export function createAsphaltFloor({ size = 48, y = -0.6 } = {}) {
  const BASE = '/textures/asphalt_track_1k.gltf/textures/';

  const textureLoader = new THREE.TextureLoader();

  const colorMap = textureLoader.load(`${BASE}asphalt_track_diff_1k.jpg`);
  colorMap.colorSpace = THREE.SRGBColorSpace;

  const normalMap = textureLoader.load(`${BASE}asphalt_track_nor_gl_1k.jpg`);

  /* El canal ARM trae AO (R), rough (G) y metal (B): se usa como
     roughnessMap y metalnessMap a la vez. metalness queda en 0 (asfalto). */
  const armMap = textureLoader.load(`${BASE}asphalt_track_arm_1k.jpg`);

  [colorMap, normalMap, armMap].forEach((tex) => {
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(size / 4, size / 4);
    tex.anisotropy = 16;
  });

  const material = new THREE.MeshStandardMaterial({
    map: colorMap,
    normalMap,
    roughnessMap: armMap,
    metalnessMap: armMap,
    roughness: 1,
    metalness: 0
  });

  const plane = new THREE.Mesh(new THREE.PlaneGeometry(size, size), material);
  plane.rotation.x = -Math.PI / 2;
  plane.position.y = y;
  plane.receiveShadow = true;

  return plane;
}