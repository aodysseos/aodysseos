import { Suspense, useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment, Lightformer, SpotLight, useGLTF, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { INLAY_EMITTERS } from './statueEmitters';

// Marble statue generated from a front-facing concept image (TRELLIS.2), cleaned
// up in statue-work/. Normalised to 1 unit tall, cut at the hips (y = 0),
// facing +Z, and meshopt-compressed.
const MODEL_URL = '/models/statue.glb';

// Scanned white marble (ambientCG Marble019, CC0) with its specks removed; the
// normal map was derived from its height map. The inlays map holds the glossy
// black inlays (R), grey veins (G) and the thin black lines that continue out of
// the inlays along the veins (B), traced from the concept image and aligned
// to the statue's front view, so it's projected from the front. See statue-work/.
const MARBLE_MAPS = {
  color: '/textures/marble-color.jpg',
  inlays: '/textures/marble-inlays.png',
  normal: '/textures/marble-normal.jpg',
  roughness: '/textures/marble-roughness.jpg',
};

type Pointer = React.RefObject<{ x: number; y: number; lastMove: number }>;

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Uniforms shared by the surface and shadow-depth materials so the shadows
// follow the deformed body.
type BodyUniforms = {
  uHeadPitch: { value: number };
  uHeadYaw: { value: number };
  uHeadRoll: { value: number };
  uBreath: { value: number };
};

// The scan is a single rigid mesh, so it's "rigged" procedurally: the head
// twists around a pivot at the base of the neck, with the rotation fading out
// down the neck and away from the shoulders, and the chest and shoulders rise
// with each breath. Landmarks were measured from the mesh's cross-sections:
// collarbones ~0.58, chin ~0.67, chest ~0.36, navel ~0.08.
const DEFORM_GLSL = /* glsl */ `
  uniform float uHeadPitch;
  uniform float uHeadYaw;
  uniform float uHeadRoll;
  uniform float uBreath;
  varying vec3 vObjPos;
  varying vec3 vObjNormal;

  const vec3 NECK_PIVOT = vec3(0.0, 0.60, -0.035);

  mat3 rotationPYR(float pitch, float yaw, float roll) {
    float cp = cos(pitch), sp = sin(pitch);
    float cy = cos(yaw), sy = sin(yaw);
    float cr = cos(roll), sr = sin(roll);
    mat3 rx = mat3(1.0, 0.0, 0.0, 0.0, cp, sp, 0.0, -sp, cp);
    mat3 ry = mat3(cy, 0.0, -sy, 0.0, 1.0, 0.0, sy, 0.0, cy);
    mat3 rz = mat3(cr, sr, 0.0, -sr, cr, 0.0, 0.0, 0.0, 1.0);
    return ry * rx * rz;
  }

  float headWeight(vec3 p) {
    float vertical = smoothstep(0.56, 0.7, p.y);
    float radial = 1.0 - smoothstep(0.11, 0.2, length(p.xz - NECK_PIVOT.xz));
    return vertical * mix(radial, 1.0, smoothstep(0.65, 0.69, p.y));
  }

  mat3 headRotation(vec3 p) {
    float w = headWeight(p);
    return rotationPYR(uHeadPitch * w, uHeadYaw * w, uHeadRoll * w);
  }

  vec3 breathOffset(vec3 p) {
    vec3 d = (p - vec3(0.0, 0.36, 0.14)) * vec3(1.0, 1.3, 1.0);
    float chest = exp(-dot(d, d) / 0.05) * smoothstep(-0.1, 0.15, p.z);
    float shoulders = smoothstep(0.15, 0.32, abs(p.x))
      * smoothstep(0.42, 0.56, p.y) * (1.0 - smoothstep(0.62, 0.66, p.y));
    float lift = smoothstep(0.5, 0.66, p.y);
    return vec3(0.0, 0.007 * shoulders + 0.004 * chest + 0.005 * lift, 0.009 * chest) * uBreath;
  }

  vec3 deformBody(vec3 p) {
    vec3 breathed = p + breathOffset(p);
    return NECK_PIVOT + headRotation(p) * (breathed - NECK_PIVOT);
  }
`;

function patchVertex(shader: { vertexShader: string }, withNormals: boolean) {
  shader.vertexShader = shader.vertexShader
    .replace('#include <common>', `#include <common>\n${DEFORM_GLSL}`)
    .replace(
      '#include <begin_vertex>',
      '#include <begin_vertex>\nvObjPos = position;\nvObjNormal = normal;\ntransformed = deformBody(position);'
    );
  if (withNormals) {
    shader.vertexShader = shader.vertexShader.replace(
      '#include <beginnormal_vertex>',
      '#include <beginnormal_vertex>\nobjectNormal = headRotation(position) * objectNormal;'
    );
  }
}

// The marble maps are projected along the three axes and blended by the
// surface direction (triplanar), so they wrap the scan without UVs. Sampled on
// the rest pose so the stone stays pinned to the body as it moves.
const TRIPLANAR_GLSL = /* glsl */ `
  uniform sampler2D uMarbleColor;
  uniform sampler2D uMarbleInlays;
  uniform sampler2D uMarbleNormal;
  uniform sampler2D uMarbleRoughness;
  uniform mat3 normalMatrix; // not declared for fragment shaders by default
  varying vec3 vObjPos;
  varying vec3 vObjNormal;

  const float MARBLE_SCALE = 0.85;

  float hash3(vec3 p) {
    p = fract(p * 0.3183099 + 0.1);
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }

  float noise3(vec3 x) {
    vec3 i = floor(x);
    vec3 f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(mix(hash3(i), hash3(i + vec3(1, 0, 0)), f.x),
          mix(hash3(i + vec3(0, 1, 0)), hash3(i + vec3(1, 1, 0)), f.x), f.y),
      mix(mix(hash3(i + vec3(0, 0, 1)), hash3(i + vec3(1, 0, 1)), f.x),
          mix(hash3(i + vec3(0, 1, 1)), hash3(i + vec3(1, 1, 1)), f.x), f.y),
      f.z);
  }

  vec3 triWeights(vec3 n) {
    vec3 w = pow(abs(n), vec3(4.0));
    return w / (w.x + w.y + w.z);
  }

  // Each projection gets its own offset so the planes don't repeat the same pattern.
  void triUVs(vec3 p, out vec2 ux, out vec2 uy, out vec2 uz) {
    ux = p.zy + vec2(0.37, 0.11);
    uy = p.xz + vec2(0.71, 0.29);
    uz = p.xy + vec2(0.13, 0.53);
  }

  vec4 triSample(sampler2D tex, vec3 p, vec3 n) {
    vec2 ux, uy, uz;
    triUVs(p * MARBLE_SCALE, ux, uy, uz);
    vec3 w = triWeights(n);
    return texture2D(tex, ux) * w.x + texture2D(tex, uy) * w.y + texture2D(tex, uz) * w.z;
  }

  // Inlays (r), veins (g) and black vein lines (b), projected from the front:
  // u = x + 0.5, v = y. They fade out on surfaces facing away from the front so
  // they don't smear sideways.
  vec3 frontMarks(vec3 p, vec3 n) {
    vec3 m = texture2D(uMarbleInlays, vec2(p.x + 0.5, p.y)).rgb;
    return m * smoothstep(-0.05, 0.35, n.z);
  }

  // A blurred copy (smaller mip) of the inlays, for the stain that bleeds around them.
  float inlayStain(vec3 p, vec3 n) {
    return texture2D(uMarbleInlays, vec2(p.x + 0.5, p.y), 4.0).r * smoothstep(-0.05, 0.35, n.z);
  }

  // Bump mapping from a height (Mikkelsen, as in three's bumpmap chunk).
  vec3 perturbNormal(vec3 surfPos, vec3 surfNorm, float h, float faceDir) {
    vec3 sx = dFdx(surfPos);
    vec3 sy = dFdy(surfPos);
    vec3 r1 = cross(sy, surfNorm);
    vec3 r2 = cross(surfNorm, sx);
    float det = dot(sx, r1) * faceDir;
    vec3 grad = sign(det) * (dFdx(h) * r1 + dFdy(h) * r2);
    return normalize(abs(det) * surfNorm - grad);
  }

  // Whiteout-blended triplanar normal mapping (Ben Golus), in object space.
  vec3 triNormal(vec3 p, vec3 n, float strength) {
    vec2 ux, uy, uz;
    triUVs(p * MARBLE_SCALE, ux, uy, uz);
    vec3 w = triWeights(n);
    vec3 tx = texture2D(uMarbleNormal, ux).xyz * 2.0 - 1.0;
    vec3 ty = texture2D(uMarbleNormal, uy).xyz * 2.0 - 1.0;
    vec3 tz = texture2D(uMarbleNormal, uz).xyz * 2.0 - 1.0;
    tx.xy *= strength;
    ty.xy *= strength;
    tz.xy *= strength;
    tx = vec3(tx.xy + n.zy, abs(tx.z) * n.x);
    ty = vec3(ty.xy + n.xz, abs(ty.z) * n.y);
    tz = vec3(tz.xy + n.xy, abs(tz.z) * n.z);
    return normalize(tx.zyx * w.x + ty.xzy * w.y + tz.xyz * w.z);
  }
`;

type MarbleMaps = Record<keyof typeof MARBLE_MAPS, THREE.Texture>;

function createMarbleMaterial(uniforms: BodyUniforms, maps: MarbleMaps) {
  const material = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color('#f2ede4'),
    roughness: 1,
    metalness: 0,
    clearcoat: 0.08,
    clearcoatRoughness: 0.5,
    sheen: 0.3,
    sheenRoughness: 0.8,
    sheenColor: new THREE.Color('#fff2e0'),
  });

  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms, {
      uMarbleColor: { value: maps.color },
      uMarbleInlays: { value: maps.inlays },
      uMarbleNormal: { value: maps.normal },
      uMarbleRoughness: { value: maps.roughness },
    });
    patchVertex(shader, true);

    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>\n${TRIPLANAR_GLSL}`)
      .replace(
        '#include <color_fragment>',
        `#include <color_fragment>
        vec3 restNormal = normalize(vObjNormal);
        vec3 stone = triSample(uMarbleColor, vObjPos, restNormal).rgb;
        vec3 marks = frontMarks(vObjPos, restNormal);
        float inlay = marks.r;
        float blackLine = marks.b;
        stone *= 1.0 - smoothstep(0.0, 0.6, inlayStain(vObjPos, restNormal)) * 0.35;
        stone = mix(stone, vec3(0.14, 0.14, 0.16), smoothstep(0.1, 0.6, marks.g) * 0.7);
        stone = mix(stone, vec3(0.006, 0.006, 0.008), max(inlay, blackLine));
        diffuseColor.rgb *= stone;`
      )
      .replace(
        '#include <roughnessmap_fragment>',
        `#include <roughnessmap_fragment>
        float stoneRough = triSample(uMarbleRoughness, vObjPos, restNormal).r;
        roughnessFactor = mix(clamp(0.25 + stoneRough * 0.9, 0.0, 1.0), 0.08, inlay);`
      )
      .replace(
        '#include <normal_fragment_maps>',
        `#include <normal_fragment_maps>
        // Apply the detail as an offset from the rest normal; the head's small
        // rotation doesn't visibly skew it.
        vec3 detail = triNormal(vObjPos, restNormal, 0.55) - restNormal;
        normal = normalize(normal + normalize(normalMatrix * (restNormal + detail)) - normalize(normalMatrix * restNormal));
        // The inlays sit slightly below the stone with a broken rim. Thin ridges in
        // their glossy surface catch the light as sharp streaks.
        float ridge = 1.0 - abs(2.0 * noise3(vObjPos * vec3(28.0, 64.0, 28.0) + 3.0) - 1.0);
        float inlayHeight = -inlay * 0.0018 + inlay * pow(ridge, 8.0) * 0.0009 - blackLine * 0.0005;
        normal = perturbNormal(-vViewPosition, normal, inlayHeight, faceDirection);`
      )
      .replace(
        '#include <lights_physical_fragment>',
        `#include <lights_physical_fragment>
        // Lacquer-like: a stronger reflection than bare stone so the black catches the light.
        material.specularColor = mix(material.specularColor, vec3(0.07), inlay);
        material.clearcoat = mix(material.clearcoat, 1.0, inlay);
        material.clearcoatRoughness = mix(material.clearcoatRoughness, 0.03, inlay);`
      );
  };

  return material;
}

function createDepthMaterial(uniforms: BodyUniforms) {
  const material = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking });
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    patchVertex(shader, false);
  };
  return material;
}

// meshopt stores positions as quantised integers with the scale and offset on
// the node. The deformation landmarks are in the model's real units, so bake
// the node transform back into float attributes.
function bakeQuantizedGeometry(mesh: THREE.Mesh) {
  const geometry = mesh.geometry.clone();
  for (const name of ['position', 'normal']) {
    const attr = geometry.getAttribute(name);
    if (!attr) continue;
    const values = new Float32Array(attr.count * 3);
    for (let i = 0; i < attr.count; i++) {
      values[i * 3] = attr.getX(i);
      values[i * 3 + 1] = attr.getY(i);
      values[i * 3 + 2] = attr.getZ(i);
    }
    geometry.setAttribute(name, new THREE.BufferAttribute(values, 3));
  }
  geometry.applyMatrix4(mesh.matrixWorld);
  return geometry;
}

// A heavy, slightly under-damped spring: the head overshoots a touch and
// settles, which reads as mass rather than a UI animation.
function spring(state: { x: number; v: number }, target: number, dt: number, k = 7, c = 4.6) {
  state.v += ((target - state.x) * k - state.v * c) * dt;
  state.x += state.v * dt;
  return state.x;
}

function Statue({ pointer }: { pointer: Pointer }) {
  const { scene } = useGLTF(MODEL_URL, false, true);
  const maps = useTexture(MARBLE_MAPS) as MarbleMaps;
  const torsoRef = useRef<THREE.Group>(null);
  const reducedMotion = useMemo(prefersReducedMotion, []);
  const motion = useRef({
    yaw: { x: 0, v: 0 },
    pitch: { x: 0, v: 0 },
  });

  const uniforms = useMemo<BodyUniforms>(
    () => ({
      uHeadPitch: { value: 0 },
      uHeadYaw: { value: 0 },
      uHeadRoll: { value: 0 },
      uBreath: { value: 0 },
    }),
    []
  );

  const model = useMemo(() => {
    maps.color.colorSpace = THREE.SRGBColorSpace;
    for (const texture of Object.values(maps)) {
      texture.wrapS = texture.wrapT =
        texture === maps.inlays ? THREE.ClampToEdgeWrapping : THREE.RepeatWrapping;
      texture.anisotropy = 8;
      texture.needsUpdate = true;
    }
    const material = createMarbleMaterial(uniforms, maps);
    const depthMaterial = createDepthMaterial(uniforms);

    const root = scene.clone(true);
    root.updateMatrixWorld(true);
    root.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        const mesh = obj as THREE.Mesh;
        mesh.geometry = bakeQuantizedGeometry(mesh);
        mesh.position.set(0, 0, 0);
        mesh.quaternion.identity();
        mesh.scale.set(1, 1, 1);
        mesh.material = material;
        mesh.customDepthMaterial = depthMaterial;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        // Deformation can push the head outside the rest-pose bounds.
        mesh.frustumCulled = false;
      }
    });
    return root;
  }, [scene, maps, uniforms]);

  useFrame((state, delta) => {
    const p = pointer.current;
    if (!p) return;

    const dt = Math.min(delta, 1 / 30);
    const t = state.clock.elapsedTime;
    const m = motion.current;

    // Follow the cursor; once it rests for a few seconds the statue starts
    // looking around on its own, and returns to the viewer from time to time.
    const idle = !reducedMotion && performance.now() - p.lastMove > 3500;
    const wanderYaw = Math.sin(t * 0.21) * 0.45 + Math.sin(t * 0.53) * 0.15;
    const wanderPitch = Math.sin(t * 0.17 + 1.3) * 0.12;
    const targetYaw = idle ? wanderYaw * 0.8 : p.x * 0.4;
    const targetPitch = idle ? wanderPitch : -p.y * 0.16;

    const yaw = spring(m.yaw, targetYaw, dt);
    const pitch = spring(m.pitch, targetPitch, dt);

    // Slow inhale, slower exhale.
    const cycle = (t / 5.5) % 1;
    const breath = reducedMotion ? 0 : Math.sin(Math.pow(cycle, 0.8) * Math.PI * 2) * 0.5 + 0.5;

    uniforms.uHeadYaw.value = yaw;
    uniforms.uHeadPitch.value = pitch + breath * -0.02;
    uniforms.uHeadRoll.value = -yaw * 0.12;
    uniforms.uBreath.value = breath;

    // The torso turns a little after the head, like the body following the gaze.
    const torso = torsoRef.current;
    if (torso) {
      torso.rotation.y = THREE.MathUtils.damp(torso.rotation.y, yaw * 0.22, 1.2, dt);
      torso.rotation.x = THREE.MathUtils.damp(torso.rotation.x, pitch * 0.1, 1.2, dt);
    }
  });

  return (
    <group ref={torsoRef}>
      <primitive object={model} />
      {!reducedMotion && (
        <>
          <InlayParticles pointer={pointer} variant="smoke" count={200} />
          <InlayParticles pointer={pointer} variant="shards" count={35} />
        </>
      )}
    </group>
  );
}

// The key light drifts with the cursor so the shadows across the face and
// drapery sweep, not just rotate with the body.
function KeyLight({ pointer }: { pointer: Pointer }) {
  const lightRef = useRef<THREE.DirectionalLight>(null);
  const target = useMemo(() => {
    const obj = new THREE.Object3D();
    obj.position.set(0, 0.65, 0);
    return obj;
  }, []);

  useFrame((_, delta) => {
    const light = lightRef.current;
    if (!light || !pointer.current) return;
    const x = -1.4 + pointer.current.x * 0.8;
    const y = 2.4 + pointer.current.y * 0.5;
    light.position.x = THREE.MathUtils.damp(light.position.x, x, 1.2, delta);
    light.position.y = THREE.MathUtils.damp(light.position.y, y, 1.2, delta);
  });

  return (
    <>
      <primitive object={target} />
      <directionalLight
        ref={lightRef}
        position={[-1.4, 2.4, 1.6]}
        target={target}
        intensity={2.8}
        color="#fff4e6"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.003}
        shadow-radius={6}
        shadow-blurSamples={16}
        shadow-camera-left={-0.7}
        shadow-camera-right={0.7}
        shadow-camera-top={0.7}
        shadow-camera-bottom={-0.7}
        shadow-camera-near={0.5}
        shadow-camera-far={6}
      />
    </>
  );
}

// A light falling from above and behind the statue that rims the hair and
// shoulders. Its cone is not drawn, so the canvas stays transparent.
function OverheadBeam() {
  const target = useMemo(() => {
    const obj = new THREE.Object3D();
    obj.position.set(-0.1, 0.3, -0.4);
    return obj;
  }, []);

  return (
    <>
      <primitive object={target} />
      <SpotLight
        position={[1.1, 3.0, -1.3]}
        target={target}
        angle={0.2}
        penumbra={0.8}
        intensity={14}
        distance={6}
        attenuation={3.5}
        anglePower={6}
        volumetric={false}
        color="#cfe0ff"
      />
    </>
  );
}

// Dust per site theme: pale light on the dark theme, stronger charcoal specks on the light theme
// (small dark dots read much more faintly on white than light dots do on black).
const DUST_THEMES = {
  dark: { color: new THREE.Color(0.85, 0.9, 1.0), strength: 2.0 },
  light: { color: new THREE.Color(0.22, 0.23, 0.28), strength: 2.4 },
};

type DustThemes = typeof DUST_THEMES;

// Specks from the black cracks: white on the dark theme, soft charcoal on the light theme
// (dark specks stand out much more against the white marble and page).
const CRACK_DUST_THEMES: DustThemes = {
  dark: { color: new THREE.Color(0.92, 0.94, 1.0), strength: 2.2 },
  light: { color: new THREE.Color(0.12, 0.12, 0.14), strength: 1.3 },
};

const currentTheme = () =>
  document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';

// Drives a point material's time and theme uniforms, easing to the new theme's look over
// about half a second when the site theme changes.
function useDustUniforms(material: THREE.ShaderMaterial, themes: DustThemes = DUST_THEMES) {
  const target = useRef(themes[currentTheme()]);

  useEffect(() => {
    const observer = new MutationObserver(() => {
      target.current = themes[currentTheme()];
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, [themes]);

  useFrame((state, delta) => {
    material.uniforms.uTime.value = state.clock.elapsedTime;
    material.uniforms.uPixelRatio.value = state.viewport.dpr;
    const k = 1 - Math.exp(-delta * 6);
    material.uniforms.uColor.value.lerp(target.current.color, k);
    material.uniforms.uStrength.value += (target.current.strength - material.uniforms.uStrength.value) * k;
  });
}

const dustUniforms = (themes: DustThemes = DUST_THEMES) => ({
  uTime: { value: 0 },
  uPixelRatio: { value: 1 },
  uColor: { value: themes[currentTheme()].color.clone() },
  uStrength: { value: themes[currentTheme()].strength },
});

const DUST_FRAGMENT = /* glsl */ `
  uniform vec3 uColor;
  uniform float uStrength;
  varying float vAlpha;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = min(1.0, smoothstep(0.5, 0.0, d) * vAlpha * uStrength);
    gl_FragColor = vec4(uColor * a, a);
  }
`;

function Dust({ count = 900 }: { count?: number }) {
  const pointsRef = useRef<THREE.Points>(null);

  const [geometry, material] = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const seeds = new Float32Array(count);
    // Clustered around the statue (normal spread across x) and only behind it (z < 0), so none
    // drift in front of the body and the cloud doesn't fill the canvas edge to edge.
    for (let i = 0; i < count; i++) {
      const gauss = Math.sqrt(-2 * Math.log(1 - Math.random())) * Math.cos(2 * Math.PI * Math.random());
      positions[i * 3] = THREE.MathUtils.clamp(gauss * 0.42, -1.1, 1.1);
      positions[i * 3 + 1] = Math.random() * 1.8 - 0.2;
      positions[i * 3 + 2] = -0.2 - Math.random() * 0.65;
      seeds[i] = Math.random();
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));

    const mat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      // premultiplied "over" blending, so the specks show on light and dark backgrounds alike
      blending: THREE.CustomBlending,
      blendSrc: THREE.OneFactor,
      blendDst: THREE.OneMinusSrcAlphaFactor,
      uniforms: dustUniforms(),
      vertexShader: /* glsl */ `
        uniform float uTime;
        uniform float uPixelRatio;
        attribute float aSeed;
        varying float vAlpha;
        void main() {
          vec3 p = position;
          p.y = mod(p.y + uTime * (0.01 + aSeed * 0.015) + 0.2, 1.8) - 0.2;
          p.x += sin(uTime * 0.2 + aSeed * 40.0) * 0.04;
          p.z += cos(uTime * 0.17 + aSeed * 23.0) * 0.04;
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_Position = projectionMatrix * mv;
          gl_PointSize = (1.6 + aSeed * 3.2) * uPixelRatio * (2.0 / -mv.z);
          // Brighter inside the overhead beam, twinkling slowly.
          float beam = 1.0 - smoothstep(0.1, 0.7, length(p.xz - vec2(0.1, -0.5)));
          vAlpha = (0.32 + beam * 0.6) * (0.55 + 0.45 * sin(uTime * (0.5 + aSeed) + aSeed * 60.0));
          // full strength behind the statue, very faint out to the sides, gone before the canvas
          // edges and the top, so the cloud has no rectangular outline
          float side = exp(-pow(p.x / 0.38, 2.0));
          vAlpha *= mix(0.12, 1.0, side) * (1.0 - smoothstep(0.75, 1.05, abs(p.x)));
          vAlpha *= 1.0 - smoothstep(1.15, 1.5, p.y);
        }
      `,
      fragmentShader: DUST_FRAGMENT,
    });
    return [geo, mat];
  }, [count]);

  useDustUniforms(material);

  return <points ref={pointsRef} geometry={geometry} material={material} />;
}

// Specks escaping from the black inlays on the chest: each rises out along the
// surface normal from an emitter inside an inlay, drifts slowly up the canvas and
// fades only near its top, so there are few of them at a time. Most are small and
// faint, a few larger. White on the dark theme, dark on the light theme. Rendered
// inside the torso group so they turn with the body.
// A few hotspots spread over the inlays (farthest-point sampling, starting at the
// big chest fissure), each with its nearest emitters, so the specks rise in a
// handful of clear streams rather than evenly from every crack.
function inlayHotspots(hotspots = 5, spread = 7) {
  const n = INLAY_EMITTERS.length / 6;
  const pos = (i: number) => new THREE.Vector3().fromArray(INLAY_EMITTERS, i * 6);
  const fissure = new THREE.Vector3(0.05, 0.36, 0.17);
  const picked = [0];
  for (let i = 1; i < n; i++) {
    if (pos(i).distanceTo(fissure) < pos(picked[0]).distanceTo(fissure)) picked[0] = i;
  }
  while (picked.length < hotspots) {
    let best = 0;
    let bestDist = -1;
    for (let i = 0; i < n; i++) {
      const d = Math.min(...picked.map((j) => pos(i).distanceTo(pos(j))));
      if (d > bestDist) [best, bestDist] = [i, d];
    }
    picked.push(best);
  }
  return picked.map((h) =>
    Array.from({ length: n }, (_, i) => i)
      .sort((a, b) => pos(a).distanceTo(pos(h)) - pos(b).distanceTo(pos(h)))
      .slice(0, spread)
  );
}

// What comes out of the black cracks: curling ash (smoke) that the cursor stirs,
// and a few small broken fragments of stone (shards) tumbling off on a slow wind.
type InlayVariant = 'smoke' | 'shards';

const INLAY_COMMON_GLSL = /* glsl */ `
  uniform float uTime;
  uniform float uPixelRatio;
  uniform vec2 uPointer;     // cursor in canvas NDC
  uniform float uStir;       // 0 when the cursor is idle
  uniform float uAspect;
  attribute vec3 aNormal;
  attribute float aSeed;
  varying float vAlpha;

  float hash1(float n) { return fract(sin(n) * 43758.5453); }

  // A curling path that grows as the particle rises, like ash in a slow draught.
  vec3 swirl(float h, float seed, float time) {
    float grow = smoothstep(0.0, 0.25, h);
    return vec3(
      sin(h * 8.0 + seed * 40.0 + time * 0.25) * 0.04 + sin(h * 19.0 + seed * 13.0) * 0.012,
      0.0,
      cos(h * 7.0 + seed * 29.0 + time * 0.2) * 0.04
    ) * grow;
  }

  // Gently part the particles around the cursor in screen space: a wide, soft
  // falloff and a small displacement, so the ash sways aside rather than scatters.
  vec4 stir(vec4 clip) {
    vec2 ndc = clip.xy / clip.w;
    vec2 d = (ndc - uPointer) * vec2(uAspect, 1.0);
    float r = length(d);
    float push = exp(-r * r / 0.06) * 0.05 * uStir;
    ndc += normalize(d + 1e-5) * push / vec2(uAspect, 1.0);
    clip.xy = ndc * clip.w;
    return clip;
  }

  // Fade in out of the crack; about half fade somewhere on the way up, the rest near the top.
  float riseFade(float t, float screenY, float seed) {
    float early = fract(seed * 31.3);
    float fadeEnd = early < 0.5 ? mix(-0.2, 0.7, early * 2.0) : 0.97;
    return smoothstep(0.0, 0.03, t) * (1.0 - smoothstep(fadeEnd - 0.27, fadeEnd, screenY));
  }
`;

const INLAY_VERTEX: Record<InlayVariant, string> = {
  smoke: /* glsl */ `
    void main() {
      float rise = 1.25 - position.y;
      float speed = 0.025 + aSeed * 0.012;
      float t = fract(uTime / (rise / speed) + aSeed * 7.31);
      // uneven pace: gusts and lulls
      float h = rise * clamp(t + 0.025 * sin(t * 25.0 + aSeed * 30.0), 0.0, 1.0);
      vec3 p = position + aNormal * (0.003 + 0.06 * smoothstep(0.0, 0.2, t));
      p.y += h;
      p += swirl(h, aSeed, uTime) * 1.4;
      vec4 mv = modelViewMatrix * vec4(p, 1.0);
      gl_Position = stir(projectionMatrix * mv);
      float size = pow(fract(aSeed * 13.7), 2.2);
      // ash puffs out a little as it rises
      gl_PointSize = (1.0 + size * 3.8) * (1.0 + 0.5 * t) * uPixelRatio * (2.0 / -mv.z);
      vAlpha = riseFade(t, gl_Position.y / gl_Position.w, aSeed) * mix(0.55, 0.95, size) * (1.0 - 0.35 * t);
    }
  `,
  // Flakes break off the crack, tumble and glint as they turn, and drift off to
  // the side on a slow wind.
  shards: /* glsl */ `
    varying float vSpin;
    varying float vGlint;
    varying float vSeed;
    void main() {
      vSeed = aSeed;
      float life = 22.0 + aSeed * 10.0;
      float t = fract(uTime / life + aSeed * 7.31);
      float age = t * life;
      vec3 p = position + aNormal * (0.003 + 0.05 * (1.0 - exp(-age * 1.5)));
      float wind = (0.5 + hash1(aSeed * 5.0)) * 0.032;
      p.x += age * wind + sin(age * 0.7 + aSeed * 20.0) * 0.02;
      p.y += age * 0.013 - 0.025 * (1.0 - exp(-age * 0.8)) + sin(age * 0.6 + aSeed * 9.0) * 0.015;
      vec4 mv = modelViewMatrix * vec4(p, 1.0);
      gl_Position = projectionMatrix * mv;
      float size = 0.4 + 0.6 * pow(fract(aSeed * 13.7), 1.5);
      // about a quarter are larger chunks, and a few of those are much bigger
      float tier = fract(aSeed * 5.31);
      float chunk = tier > 0.92 ? 3.6 : tier > 0.75 ? 2.3 : 1.0;
      gl_PointSize = (3.5 + size * 8.0) * chunk * uPixelRatio * (2.0 / -mv.z);
      vSpin = uTime * (0.4 + aSeed * 1.1) + aSeed * 20.0;
      vGlint = pow(abs(sin(vSpin * 1.3 + aSeed * 4.0)), 10.0);
      vec2 ndc = gl_Position.xy / gl_Position.w;
      vAlpha = smoothstep(0.0, 0.04, t) * (1.0 - smoothstep(0.75, 1.0, t))
        * (1.0 - smoothstep(0.85, 1.0, abs(ndc.x))) * (1.0 - smoothstep(0.8, 0.97, ndc.y));
    }
  `,
};

// A small broken fragment of stone: a polygon of 5 to 9 corners at uneven angles
// and distances joined by straight edges, some pulled in to deep notches, so every
// shard is sharp and different.
// It turns in the sprite and brightens when it catches the light.
const SHARD_FRAGMENT = /* glsl */ `
  uniform vec3 uColor;
  uniform float uStrength;
  varying float vAlpha;
  varying float vSpin;
  varying float vGlint;
  varying float vSeed;

  const float TAU = 6.2831853;

  float hash1(float n) { return fract(sin(n) * 43758.5453); }

  vec2 corner(float i, float corners, float seed) {
    float k = mod(i, corners);
    float a = (i + 0.85 * (hash1(seed * 5.3 + k) - 0.5)) / corners * TAU;
    float r = 0.12 + 0.36 * hash1(seed * 13.1 + k);
    if (hash1(seed * 2.9 + k) < 0.22) r *= 0.55;
    return r * vec2(cos(a), sin(a));
  }

  // The polygon is star-shaped around its centre: find the wedge the point lies
  // in and test it against that wedge's edge.
  bool insideShard(vec2 q, float seed) {
    float corners = 5.0 + floor(hash1(seed * 3.7) * 5.0);
    float ang = mod(atan(q.y, q.x), TAU);
    for (int j = 0; j < 9; j++) {
      float i = float(j);
      if (i >= corners) break;
      float a0 = (i + 0.85 * (hash1(seed * 5.3 + i) - 0.5)) / corners * TAU;
      float a1 = (i + 1.0 + 0.85 * (hash1(seed * 5.3 + mod(i + 1.0, corners)) - 0.5)) / corners * TAU;
      if (mod(ang - mod(a0, TAU), TAU) < a1 - a0) {
        vec2 v0 = corner(i, corners, seed);
        vec2 v1 = corner(i + 1.0, corners, seed);
        vec2 e = v1 - v0;
        vec2 d = q - v0;
        return e.x * d.y - e.y * d.x >= 0.0;
      }
    }
    return false;
  }

  void main() {
    vec2 q = gl_PointCoord - 0.5;
    float c = cos(vSpin), s = sin(vSpin);
    q = mat2(c, -s, s, c) * q;
    // elongated splinters and squat chips, squashed on one axis as they tumble
    q.x /= 0.55 + 0.45 * hash1(vSeed * 7.9);
    q.y /= 0.3 + 0.7 * abs(cos(vSpin * 0.7));
    if (!insideShard(q, vSeed * 10.0)) discard;
    float a = min(1.0, vAlpha * uStrength * (0.55 + 0.45 * vGlint));
    gl_FragColor = vec4(uColor * (0.75 + 0.5 * vGlint) * a, a);
  }
`;

function InlayParticles({
  pointer,
  variant,
  count,
}: {
  pointer: Pointer;
  variant: InlayVariant;
  count: number;
}) {
  const { gl, size } = useThree();

  const [geometry, material] = useMemo(() => {
    const groups = inlayHotspots();
    const origins = new Float32Array(count * 3);
    const normals = new Float32Array(count * 3);
    const seeds = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      // the chest fissure (first group) gets twice the share of the others
      const g = Math.max(0, Math.floor(Math.random() * (groups.length + 1)) - 1);
      const group = groups[g];
      const e = group[Math.floor(Math.random() * group.length)] * 6;
      origins.set(INLAY_EMITTERS.subarray(e, e + 3), i * 3);
      normals.set(INLAY_EMITTERS.subarray(e + 3, e + 6), i * 3);
      seeds[i] = Math.random();
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(origins, 3));
    geo.setAttribute('aNormal', new THREE.BufferAttribute(normals, 3));
    geo.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));

    const mat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.CustomBlending,
      blendSrc: THREE.OneFactor,
      blendDst: THREE.OneMinusSrcAlphaFactor,
      uniforms: {
        ...dustUniforms(CRACK_DUST_THEMES),
        uPointer: { value: new THREE.Vector2(0, 0) },
        uStir: { value: 0 },
        uAspect: { value: 1 },
      },
      vertexShader: INLAY_COMMON_GLSL + INLAY_VERTEX[variant],
      fragmentShader: variant === 'shards' ? SHARD_FRAGMENT : DUST_FRAGMENT,
    });
    return [geo, mat];
  }, [variant, count]);

  useDustUniforms(material, CRACK_DUST_THEMES);

  // The cursor in canvas coordinates; its push fades out once it stops moving.
  useFrame((_, delta) => {
    const p = pointer.current;
    if (!p) return;
    const rect = gl.domElement.getBoundingClientRect();
    const clientX = ((p.x + 1) / 2) * window.innerWidth;
    const clientY = ((1 - p.y) / 2) * window.innerHeight;
    const target = new THREE.Vector2(
      ((clientX - rect.left) / rect.width) * 2 - 1,
      1 - ((clientY - rect.top) / rect.height) * 2
    );
    // the influence trails the cursor slowly and eases in and out
    const k = 1 - Math.exp(-delta * 1.8);
    material.uniforms.uPointer.value.lerp(target, k);
    const active = performance.now() - p.lastMove < 2500 ? 1 : 0;
    material.uniforms.uStir.value += (active - material.uniforms.uStir.value) * (1 - Math.exp(-delta * 0.8));
    material.uniforms.uAspect.value = size.width / size.height;
  });

  return <points geometry={geometry} material={material} frustumCulled={false} />;
}

// A low camera looking slightly up gives the statue a monumental scale; it
// drifts slowly so the frame never feels static. The frame runs from just
// above the hair down to the navel; the bottom fade hides the navel and the
// cut at the hips below it.
function CameraRig() {
  const { camera, size } = useThree();
  const base = useRef(new THREE.Vector3());

  useEffect(() => {
    const cam = camera as THREE.PerspectiveCamera;
    const aspect = size.width / size.height;
    const vFov = THREE.MathUtils.degToRad(cam.fov);
    const fitHeight = 0.54 / Math.tan(vFov / 2);
    // on narrow screens the arms may crop rather than pulling back past the hips
    const fitWidth = 0.36 / (Math.tan(vFov / 2) * aspect);
    base.current.set(0, 0.46, Math.min(Math.max(fitHeight, fitWidth), fitHeight * 1.2));
  }, [camera, size]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    camera.position.set(
      base.current.x + Math.sin(t * 0.07) * 0.06,
      base.current.y + Math.sin(t * 0.05) * 0.02,
      base.current.z + Math.sin(t * 0.04) * 0.05
    );
    camera.lookAt(0, 0.6, 0);
  });

  return null;
}

function Scene() {
  const pointer = useRef({ x: 0, y: 0, lastMove: -Infinity });

  useEffect(() => {
    const handleMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      pointer.current = {
        x: (e.clientX / window.innerWidth) * 2 - 1,
        y: -(e.clientY / window.innerHeight) * 2 + 1,
        lastMove: performance.now(),
      };
    };
    window.addEventListener('pointermove', handleMove);
    return () => window.removeEventListener('pointermove', handleMove);
  }, []);

  return (
    <>
      <CameraRig />
      <ambientLight intensity={0.04} />
      <KeyLight pointer={pointer} />
      <OverheadBeam />
      {/* Cool rim lights from behind to separate the silhouette from the void */}
      <directionalLight position={[2, 1.4, -2]} intensity={1.8} color="#cfdcff" />
      <directionalLight position={[-2, 1, -1.5]} intensity={0.8} color="#cfdcff" />
      <Environment resolution={256}>
        <Lightformer form="rect" intensity={1.0} position={[-3, 2, 3]} scale={[3, 3, 1]} color="#fff1e0" />
        <Lightformer form="rect" intensity={0.35} position={[3, 0, 2]} scale={[2, 4, 1]} color="#dfe8ff" />
        <Lightformer form="rect" intensity={0.2} position={[0, -2, 1]} rotation={[Math.PI / 2, 0, 0]} scale={[4, 4, 1]} />
      </Environment>
      <Dust />
      <Suspense fallback={null}>
        <Statue pointer={pointer} />
      </Suspense>
    </>
  );
}

export default function StatueBust() {
  return (
    <div
      style={{
        width: '100%',
        height: '100vh',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <Canvas
        shadows="percentage"
        dpr={[1, 1.75]}
        camera={{ fov: 30, near: 0.1, far: 20 }}
        gl={{ antialias: true, alpha: true, toneMapping: THREE.ACESFilmicToneMapping }}
        style={{ position: 'absolute', inset: 0 }}
      >
        <Scene />
      </Canvas>

      {/* Fade the lower stomach into the page background */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: '26%',
          background: 'linear-gradient(to bottom, transparent 0%, var(--color-background) 85%)',
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          position: 'absolute',
          bottom: '8%',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 10,
          textAlign: 'center',
          pointerEvents: 'none',
        }}
      >
        <h1
          style={{
            fontFamily: "'Montserrat', sans-serif",
            fontSize: 'clamp(0.75rem, 2vw, 1rem)',
            fontWeight: 300,
            letterSpacing: '0.3em',
            textTransform: 'uppercase',
            color: 'var(--color-secondary)',
            margin: 0,
          }}
        >
          Software Engineer
        </h1>
      </div>
    </div>
  );
}
