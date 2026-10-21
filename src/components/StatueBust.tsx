import { Suspense, useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment, Lightformer, SpotLight, useGLTF } from '@react-three/drei';
import { Bloom, EffectComposer, ToneMapping } from '@react-three/postprocessing';
import { ToneMappingMode } from 'postprocessing';
import * as THREE from 'three';

// Marble statue generated from a front-facing concept image (TRELLIS.2), cleaned
// up in statue-work/. Normalised to 1 unit tall, cut at the hips (y = 0),
// facing +Z, and meshopt-compressed.
const MODEL_URL = '/models/statue.glb';

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

const NOISE_GLSL = /* glsl */ `
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

  float fbm(vec3 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 5; i++) {
      v += a * noise3(p);
      p *= 2.03;
      a *= 0.5;
    }
    return v;
  }
`;

function patchVertex(shader: { vertexShader: string }, withNormals: boolean) {
  shader.vertexShader = shader.vertexShader
    .replace('#include <common>', `#include <common>\n${DEFORM_GLSL}`)
    .replace(
      '#include <begin_vertex>',
      '#include <begin_vertex>\nvObjPos = position;\ntransformed = deformBody(position);'
    );
  if (withNormals) {
    shader.vertexShader = shader.vertexShader.replace(
      '#include <beginnormal_vertex>',
      '#include <beginnormal_vertex>\nobjectNormal = headRotation(position) * objectNormal;'
    );
  }
}

// Marble with faint veining and grain. The pattern is sampled on the rest pose
// so it stays pinned to the stone as it moves.
function createMarbleMaterial(uniforms: BodyUniforms) {
  const material = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color('#ebe5da'),
    roughness: 0.48,
    metalness: 0,
    clearcoat: 0.2,
    clearcoatRoughness: 0.55,
    sheen: 0.4,
    sheenRoughness: 0.8,
    sheenColor: new THREE.Color('#fff2e0'),
  });

  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    patchVertex(shader, true);

    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>\nvarying vec3 vObjPos;\n${NOISE_GLSL}`
      )
      .replace(
        '#include <color_fragment>',
        `#include <color_fragment>
        vec3 mp = vObjPos * 6.0;
        float veins = abs(sin(mp.x * 1.3 + mp.y * 0.6 + fbm(mp) * 5.0));
        veins = pow(1.0 - veins, 14.0);
        float grain = fbm(vObjPos * 60.0);
        diffuseColor.rgb *= 1.0 - veins * 0.12;
        diffuseColor.rgb *= 0.96 + grain * 0.08;`
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
    const material = createMarbleMaterial(uniforms);
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
  }, [scene, uniforms]);

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

function Dust({ count = 500 }: { count?: number }) {
  const pointsRef = useRef<THREE.Points>(null);

  const [geometry, material] = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const seeds = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 2.4;
      positions[i * 3 + 1] = Math.random() * 1.8 - 0.2;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 1.6;
      seeds[i] = Math.random();
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));

    const mat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: { uTime: { value: 0 }, uPixelRatio: { value: 1 } },
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
          gl_PointSize = (1.0 + aSeed * 2.5) * uPixelRatio * (2.0 / -mv.z);
          // Brighter inside the overhead beam, twinkling slowly.
          float beam = 1.0 - smoothstep(0.1, 0.7, length(p.xz - vec2(0.1, -0.5)));
          vAlpha = (0.15 + beam * 0.6) * (0.5 + 0.5 * sin(uTime * (0.5 + aSeed) + aSeed * 60.0));
        }
      `,
      fragmentShader: /* glsl */ `
        varying float vAlpha;
        void main() {
          float d = length(gl_PointCoord - 0.5);
          float a = smoothstep(0.5, 0.0, d) * vAlpha;
          gl_FragColor = vec4(vec3(0.85, 0.9, 1.0) * a, a);
        }
      `,
    });
    return [geo, mat];
  }, [count]);

  useFrame((state) => {
    material.uniforms.uTime.value = state.clock.elapsedTime;
    material.uniforms.uPixelRatio.value = state.viewport.dpr;
  });

  return <points ref={pointsRef} geometry={geometry} material={material} />;
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
      <EffectComposer multisampling={4}>
        <Bloom intensity={0.6} luminanceThreshold={0.95} luminanceSmoothing={0.2} mipmapBlur />
        <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      </EffectComposer>
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
        gl={{ antialias: false, alpha: true }}
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
