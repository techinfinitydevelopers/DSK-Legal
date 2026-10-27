import { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

/*
 * A narrow red satin ribbon gathered into a pom-pom ball of loops (like a tied bow seen head-on),
 * which unwinds into one straight line as `progress` goes 0 → 1.
 */
const PETALS = 24;     // loops in the ball
const BALL_R = 2.05;   // ball radius (world units)
const W = 0.34;        // ribbon width — narrow relative to the ball, like the reference
const N = 1000;        // segments along the ribbon
const TEXT = 'True Value, True Values  ·  Fairness  ·  Integrity  ·  Excellence  ·';

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = (x) => x * x * (3 - 2 * x);

// small deterministic RNG so the ball looks the same on every load
function rng(seed) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

/**
 * Loops radiate from the core in Fibonacci-sphere directions; each loop is a circle that passes (near) the
 * centre and reaches the ball's surface, so the ribbon keeps returning through a dense core.
 * Also returns, per point, the loop's plane normal: the ribbon's width runs along it, so loops read as bands.
 */
function buildBall() {
  const rand = rng(11);
  const rl = BALL_R / 2;
  const golden = Math.PI * (3 - Math.sqrt(5));
  const raw = [];
  for (let k = 0; k < PETALS; k++) {
    const y = 1 - ((k + 0.5) / PETALS) * 2;
    const r = Math.sqrt(1 - y * y);
    const d = new THREE.Vector3(Math.cos(golden * k) * r, y, Math.sin(golden * k) * r);
    const t = new THREE.Vector3(rand() - 0.5, rand() - 0.5, rand() - 0.5);
    const e = t.sub(d.clone().multiplyScalar(t.dot(d))).normalize();
    const rk = rl * (0.62 + 0.38 * rand()); // loops of different sizes stack in layers, so the ball reads as full
    const c = d.clone().multiplyScalar(rk * 0.95 + (rl - rk) * 0.9).add(new THREE.Vector3(rand() - 0.5, rand() - 0.5, rand() - 0.5).multiplyScalar(0.28));
    const steps = 44;
    for (let s = 0; s < steps; s++) {
      const a = Math.PI + (s / steps) * Math.PI * 2;
      raw.push(c.clone().addScaledVector(d, rk * Math.cos(a)).addScaledVector(e, rk * Math.sin(a)));
    }
  }
  const curve = new THREE.CatmullRomCurve3(raw, false, 'centripetal');
  const pts = curve.getSpacedPoints(N);
  const length = curve.getLength();

  // width direction for the knot state: across the tangent, perpendicular to the radial direction,
  // so each loop shows its broad face outwards (as in a real pom-pom bow); sign-continuous and smoothed
  const T = pts.map((_, i) => pts[Math.min(i + 1, N)].clone().sub(pts[Math.max(i - 1, 0)]).normalize());
  const wd = [];
  for (let i = 0; i <= N; i++) {
    const radial = pts[i].clone();
    let n;
    if (radial.lengthSq() > 0.09) n = new THREE.Vector3().crossVectors(T[i], radial.normalize());
    if (!n || n.lengthSq() < 1e-6) n = (wd[i - 1] || new THREE.Vector3(0, 1, 0)).clone();
    n.normalize();
    if (i > 0 && n.dot(wd[i - 1]) < 0) n.negate();
    wd.push(n);
  }
  const sm = wd.map((_, i) => {
    const v = new THREE.Vector3();
    for (let j = -5; j <= 5; j++) v.add(wd[clamp(i + j, 0, N)]);
    return v.normalize();
  });
  return { pts, wd: sm, length };
}

const BALL = buildBall();
// rotation that turns each point's tied width direction into the final 'up' (text upright). Slerping this,
// rather than lerping the two vectors, never passes through zero — so the ribbon can't flip 180° mid-way.
const UP0 = new THREE.Vector3(0, 1, 0);
BALL.q = BALL.wd.map((w) => new THREE.Quaternion().setFromUnitVectors(w, UP0));
const L = BALL.length; // the straight line is as long as the ribbon (far wider than the screen)

function drawText(g, color) {
  g.textBaseline = 'middle';
  g.fillStyle = color;
  g.font = '700 50px IrisUPC, Georgia, serif';
  if ('letterSpacing' in g) g.letterSpacing = '4px';
  const w = g.measureText(TEXT).width || 1;
  g.font = `700 ${Math.round((50 * (2048 - 60)) / w)}px IrisUPC, Georgia, serif`;
  g.fillText(TEXT, 30, 68);
}

/**
 * Procedural normal map for woven satin: fine twill (diagonal) + weft threads, raised selvedges,
 * and the lettering woven slightly proud of the ribbon (jacquard), turned into normals with a Sobel pass.
 */
function makeNormalMap() {
  const Wd = 2048, Ht = 128;
  const c = document.createElement('canvas');
  c.width = Wd;
  c.height = Ht;
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.colorSpace = THREE.NoColorSpace;
  tex.repeat.x = L / (W * 16);
  const mask = document.createElement('canvas');
  mask.width = Wd;
  mask.height = Ht;
  const build = () => {
    const mg = mask.getContext('2d');
    mg.clearRect(0, 0, Wd, Ht);
    drawText(mg, '#fff');
    const m = mg.getImageData(0, 0, Wd, Ht).data;
    const h = new Float32Array(Wd * Ht);
    for (let y = 0; y < Ht; y++) {
      for (let x = 0; x < Wd; x++) {
        let v = 0.5
          + 0.16 * Math.sin(((x + y) / 6) * Math.PI * 2)   // twill diagonal
          + 0.07 * Math.sin((x / 3) * Math.PI * 2);        // weft threads
        if (y < 7 || y > Ht - 8) v += 0.22 + 0.06 * Math.sin((x / 2) * Math.PI * 2); // selvedge
        v += 0.28 * (m[(y * Wd + x) * 4 + 3] / 255);       // woven lettering
        h[y * Wd + x] = v;
      }
    }
    const g = c.getContext('2d');
    const img = g.createImageData(Wd, Ht);
    const d = img.data;
    const strength = 2.2;
    for (let y = 0; y < Ht; y++) {
      for (let x = 0; x < Wd; x++) {
        const xl = h[y * Wd + ((x - 1 + Wd) % Wd)], xr = h[y * Wd + ((x + 1) % Wd)];
        const yu = h[Math.max(y - 1, 0) * Wd + x], yd = h[Math.min(y + 1, Ht - 1) * Wd + x];
        let nx = (xl - xr) * strength, ny = (yd - yu) * strength, nz = 1;
        const len = Math.hypot(nx, ny, nz);
        nx /= len; ny /= len; nz /= len;
        const k = (y * Wd + x) * 4;
        d[k] = (nx * 0.5 + 0.5) * 255; d[k + 1] = (ny * 0.5 + 0.5) * 255; d[k + 2] = (nz * 0.5 + 0.5) * 255; d[k + 3] = 255;
      }
    }
    g.putImageData(img, 0, 0);
    tex.needsUpdate = true;
  };
  build();
  if (document.fonts?.load) document.fonts.load('700 50px IrisUPC').then(build).catch(() => {});
  return tex;
}

function makeTexture() {
  const c = document.createElement('canvas');
  c.width = 2048;
  c.height = 128;
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.repeat.x = L / (W * 16);
  const draw = () => {
    const g = c.getContext('2d');
    const grad = g.createLinearGradient(0, 0, 0, 128);
    grad.addColorStop(0, '#b4121a');
    grad.addColorStop(0.5, '#a10f16');
    grad.addColorStop(1, '#880c12');
    g.fillStyle = grad;
    g.fillRect(0, 0, 2048, 128);
    // twill weave: dark + light diagonals
    g.lineWidth = 1;
    g.strokeStyle = 'rgba(0,0,0,.16)';
    for (let x = -128; x < 2048; x += 4) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x + 128, 128); g.stroke(); }
    g.strokeStyle = 'rgba(255,190,190,.06)';
    for (let x = -126; x < 2048; x += 4) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x + 128, 128); g.stroke(); }
    // woven selvedges
    g.fillStyle = 'rgba(255,255,255,.08)';
    g.fillRect(0, 2, 2048, 4);
    g.fillRect(0, 122, 2048, 4);
    drawText(g, '#efe2cf');
    tex.needsUpdate = true;
  };
  draw();
  if (document.fonts?.load) document.fonts.load('700 50px IrisUPC').then(draw).catch(() => {});
  return tex;
}

function makeGlowTexture() {
  const c = document.createElement('canvas');
  c.width = 8;
  c.height = 128;
  const g = c.getContext('2d');
  const grad = g.createLinearGradient(0, 0, 0, 128);
  grad.addColorStop(0, 'rgba(255,30,30,0)');
  grad.addColorStop(0.5, 'rgba(255,45,40,1)');
  grad.addColorStop(1, 'rgba(255,30,30,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 8, 128);
  return new THREE.CanvasTexture(c);
}

function ribbonGeometry() {
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array((N + 1) * 2 * 3);
  const uv = new Float32Array((N + 1) * 2 * 2);
  const idx = [];
  for (let i = 0; i <= N; i++) {
    uv.set([i / N, 0, i / N, 1], i * 4);
    if (i < N) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  geo.setIndex(idx);
  return geo;
}

const UP = new THREE.Vector3(0, 1, 0);
const Q_FLAT = new THREE.Quaternion(); // identity: the final line faces the camera exactly

function Ribbon({ progress }) {
  const group = useRef();
  const glowRef = useRef();
  const ribbonRef = useRef();
  const { gl, camera, size, scene } = useThree();
  const line = useMemo(() => Array.from({ length: N + 1 }, (_, i) => new THREE.Vector3(-L / 2 + (L * i) / N, 0, 0)), []);
  const tex = useMemo(makeTexture, []);
  const normalTex = useMemo(makeNormalMap, []);
  const glowTex = useMemo(makeGlowTexture, []);
  const geo = useMemo(ribbonGeometry, []);
  const glowGeo = useMemo(ribbonGeometry, []);
  const work = useMemo(() => ({
    P: Array.from({ length: N + 1 }, () => new THREE.Vector3()),
    T: Array.from({ length: N + 1 }, () => new THREE.Vector3()),
    Wd: Array.from({ length: N + 1 }, () => new THREE.Vector3()),
    ei: new Float32Array(N + 1),
    tmp: new THREE.Vector3(),
    eul: new THREE.Euler(),
    qt: new THREE.Quaternion(),
    prev: Array.from({ length: N + 1 }, () => new THREE.Vector3(0, 1, 0)),
    q: new THREE.Quaternion(),
    cur: 0,
  }), []);

  // mouse interaction state: hover, drag-to-spin with inertia, tilt toward the cursor, cursor position in 3D
  const light = useRef();
  const ui = useMemo(() => ({
    hover: 0, hoverT: 0, dragging: false, lastX: 0, lastY: 0,
    spinX: 0, spinY: 0, velX: 0, velY: 0, tiltX: 0, tiltY: 0,
    ray: new THREE.Raycaster(), plane: new THREE.Plane(new THREE.Vector3(0, 0, 1), 0),
    cursor: new THREE.Vector3(), local: new THREE.Vector3(), inv: new THREE.Matrix4(),
  }), []);

  useEffect(() => {
    const el = gl.domElement;
    el.style.cursor = 'grab';
    const enter = () => { ui.hoverT = 1; };
    const leave = () => { ui.hoverT = 0; ui.dragging = false; el.style.cursor = 'grab'; };
    const down = (e) => {
      if (e.pointerType !== 'mouse') return; // touch keeps driving the scroll/unwind
      ui.dragging = true; ui.lastX = e.clientX; ui.lastY = e.clientY;
      el.setPointerCapture?.(e.pointerId);
      el.style.cursor = 'grabbing';
    };
    const move = (e) => {
      if (!ui.dragging) return;
      const dx = e.clientX - ui.lastX, dy = e.clientY - ui.lastY;
      ui.lastX = e.clientX; ui.lastY = e.clientY;
      ui.velY = dx * 0.006; ui.velX = dy * 0.006;
      ui.spinY += ui.velY; ui.spinX = clamp(ui.spinX + ui.velX, -1.2, 1.2);
    };
    const up = () => { ui.dragging = false; el.style.cursor = 'grab'; };
    el.addEventListener('pointerenter', enter);
    el.addEventListener('pointerleave', leave);
    el.addEventListener('pointerdown', down);
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
    return () => {
      el.removeEventListener('pointerenter', enter);
      el.removeEventListener('pointerleave', leave);
      el.removeEventListener('pointerdown', down);
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerup', up);
      el.removeEventListener('pointercancel', up);
    };
  }, [gl, ui]);

  useEffect(() => {
    const a = Math.min(8, gl.capabilities.getMaxAnisotropy());
    tex.anisotropy = a;
    normalTex.anisotropy = a;
  }, [gl, tex, normalTex]);
  useEffect(() => () => { geo.dispose(); glowGeo.dispose(); tex.dispose(); normalTex.dispose(); glowTex.dispose(); }, [geo, glowGeo, tex, normalTex, glowTex]);

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime;
    work.cur += (progress.current - work.cur) * (1 - Math.exp(-5 * Math.min(dt, 0.1)));
    const E = clamp(work.cur / 0.82); // fully straight at 82% of the progress; the rest holds for the heading
    const { P, T, Wd, ei, tmp } = work;
    const S = 0.7;
    const calm = 1 - E;
    const k = 1 - Math.exp(-6 * Math.min(dt, 0.1));
    ui.hover += (ui.hoverT - ui.hover) * k;
    ui.tiltX += (-state.pointer.y * 0.3 * ui.hover - ui.tiltX) * k;
    ui.tiltY += (state.pointer.x * 0.45 * ui.hover - ui.tiltY) * k;
    if (!ui.dragging) {
      const decay = Math.pow(0.94, Math.min(dt, 0.1) * 60); // inertia after a drag
      ui.spinY += ui.velY; ui.spinX = clamp(ui.spinX + ui.velX, -1.2, 1.2);
      ui.velY *= decay; ui.velX *= decay;
    }
    // cursor → point on the z=0 plane through the ball, then into the ball's local space
    ui.ray.setFromCamera(state.pointer, camera);
    ui.ray.ray.intersectPlane(ui.plane, ui.cursor);
    group.current.updateMatrixWorld();
    ui.local.copy(ui.cursor).applyMatrix4(ui.inv.copy(group.current.matrixWorld).invert());
    const push = 0.5 * ui.hover * calm * (ui.dragging ? 0.4 : 1);
    const PR = 1.3;
    for (let i = 0; i <= N; i++) {
      const u = i / N;
      const fromEnd = Math.min(u, 1 - u) * 2; // 0 at both ends, 1 in the middle
      const e = smooth(clamp(E * (1 + S) - fromEnd * S)); // both ends pull out of the ball together; the middle straightens last
      ei[i] = e;
      const w = Math.sin(Math.PI * e);
      P[i].copy(BALL.pts[i]).lerp(line[i], e);
      P[i].x += w * Math.sin(u * 23 + 1.3 + t * 0.4) * 0.6;
      P[i].y += w * Math.cos(u * 17 + 0.4 + t * 0.3) * 0.8;
      P[i].z += w * Math.sin(u * 13 + t * 0.35) * 1.0;
      if (push > 0.002) { // loops near the cursor part, as if touched
        const dx = P[i].x - ui.local.x, dy = P[i].y - ui.local.y, dz = P[i].z - ui.local.z;
        const d = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (d < PR && d > 1e-4) { const f = 1 - d / PR; const m = (f * f * push) / d; P[i].x += dx * m; P[i].y += dy * m; P[i].z += dz * m; }
      }
    }
    for (let i = 0; i <= N; i++) T[i].subVectors(P[Math.min(i + 1, N)], P[Math.max(i - 1, 0)]).normalize();
    for (let i = 0; i <= N; i++) {
      // width faces outward while tied and turns to vertical once straight (text upright, facing the camera)
      work.qt.identity().slerp(BALL.q[i], ei[i]);
      Wd[i].copy(BALL.wd[i]).applyQuaternion(work.qt);
      Wd[i].addScaledVector(T[i], -Wd[i].dot(T[i]));
      if (Wd[i].lengthSq() < 1e-4) Wd[i].copy(work.prev[i]); // edge-on to the tangent: keep last frame's
      Wd[i].normalize();
    }
    // relax the twist along the ribbon so it bends softly instead of folding into sharp creases
    for (let pass = 0; pass < 3; pass++) {
      for (let i = 1; i < N; i++) {
        tmp.copy(Wd[i - 1]).add(Wd[i + 1]).multiplyScalar(0.5).add(Wd[i]);
        tmp.addScaledVector(T[i], -tmp.dot(T[i]));
        if (tmp.lengthSq() > 1e-6) Wd[i].copy(tmp.normalize());
      }
    }
    for (let i = 0; i <= N; i++) work.prev[i].copy(Wd[i]);
    const fill = (g, width, zOff = 0) => {
      const a = g.attributes.position.array;
      for (let i = 0; i <= N; i++) {
        tmp.copy(Wd[i]).multiplyScalar(width * 0.5);
        const k = i * 6;
        a[k] = P[i].x - tmp.x; a[k + 1] = P[i].y - tmp.y; a[k + 2] = P[i].z - tmp.z + zOff;
        a[k + 3] = P[i].x + tmp.x; a[k + 4] = P[i].y + tmp.y; a[k + 5] = P[i].z + tmp.z + zOff;
      }
      g.attributes.position.needsUpdate = true;
    };
    fill(geo, W);
    geo.computeVertexNormals();
    if (ribbonRef.current) ribbonRef.current.receiveShadow = E < 0.45;
    const glow = smooth(clamp((E - 0.85) / 0.15));
    if (glowRef.current) {
      glowRef.current.visible = glow > 0.01;
      glowRef.current.material.opacity = glow * 0.13;
      if (glow > 0.01) fill(glowGeo, W * 2.2, -0.08); // just behind the ribbon, so it reads as a halo, never on top of it
    }
    tex.offset.x = t * 0.004;
    normalTex.offset.x = tex.offset.x;

    // depth: fog darkens the back loops of the ball; it clears as the ribbon straightens
    if (scene.fog) { scene.fog.near = 6.6 + E * 30; scene.fog.far = 10.8 + E * 30; }

    // breathing + slow drift while tied; everything settles flat as it loosens
    const g = group.current;
    g.scale.setScalar(1 + 0.04 * Math.sin(t * 1.25) * calm);
    work.eul.set(0.2 + Math.sin(t * 0.21) * 0.15 + ui.spinX + ui.tiltX, t * 0.12 + Math.sin(t * 0.3) * 0.2 + ui.spinY + ui.tiltY, Math.sin(t * 0.17) * 0.1);
    work.q.setFromEuler(work.eul);
    g.quaternion.copy(work.q).slerp(Q_FLAT, smooth(clamp(E / 0.9)));

    // a warm light follows the cursor, so the satin highlight moves with the mouse
    if (light.current) {
      light.current.position.set(0.5 + (ui.cursor.x - 0.5) * ui.hover, 1 + (ui.cursor.y - 1) * ui.hover, 5.5 - 2.5 * ui.hover);
      light.current.intensity = 22 + 9 * ui.hover * calm;
    }

    const aspect = size.width / size.height;
    camera.position.z = aspect < 1 ? 8.2 + (1 - aspect) * 7 : 8.2;
  });

  return (
    <>
    <pointLight ref={light} position={[0.5, 1, 5.5]} intensity={22} distance={14} color="#ffd6cc" />
    <group ref={group}>
      <mesh ref={ribbonRef} geometry={geo} frustumCulled={false} castShadow receiveShadow>
        <meshPhysicalMaterial
          map={tex}
          normalMap={normalTex}
          normalScale={[0.6, 0.6]}
          roughness={0.56}
          metalness={0}
          specularIntensity={0.45}
          specularColor="#ff8a80"
          sheen={1}
          sheenRoughness={0.35}
          sheenColor="#d8343a"
          anisotropy={0.35}
          side={THREE.DoubleSide}
          shadowSide={THREE.DoubleSide}
        />
      </mesh>
      <mesh ref={glowRef} geometry={glowGeo} frustumCulled={false} visible={false} renderOrder={-1}>
        <meshBasicMaterial map={glowTex} transparent opacity={0} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} fog={false} />
      </mesh>
    </group>
    </>
  );
}

export default function Ribbon3D({ progress, running }) {
  return (
    <Canvas
      shadows
      dpr={[1, 1.5]}
      camera={{ position: [0, 0, 9], fov: 35 }}
      gl={{ antialias: true, alpha: true, toneMappingExposure: 0.95 }}
      frameloop={running ? 'always' : 'never'}
    >
      <fog attach="fog" args={['#050505', 6.6, 10.8]} />
      <ambientLight intensity={0.28} />
      <directionalLight
        position={[-3.5, 4.5, 6]}
        intensity={3.2}
        color="#fff0e4"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.03}
        shadow-camera-left={-3}
        shadow-camera-right={3}
        shadow-camera-top={3}
        shadow-camera-bottom={-3}
        shadow-camera-near={1}
        shadow-camera-far={20}
      />
      <directionalLight position={[4, -2, -5]} intensity={1.4} color="#ff2a2a" />
      <Ribbon progress={progress} />
    </Canvas>
  );
}
