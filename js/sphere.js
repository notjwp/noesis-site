import * as THREE from '../vendor/three/three.module.min.js';

// One state per section. `color` is a token from css/tokens.css; `amp` is the noise
// displacement, `order` blends the sphere toward a cubic lattice (1 = "measured"), `x` is the
// horizontal offset as a fraction of the visible width, `breathe` a slow radial pulse, `dim` an
// opacity multiplier for states that sit behind text.
export const STATES = {
  idle:     { color: '--text',   amp: 0.18, order: 0, x: 0,    breathe: 0, dim: 1 },
  install:  { color: '--text',   amp: 0.18, order: 0, x: 0.34, breathe: 0, dim: 1 },   // clear of the install block
  measured: { color: '--accent', amp: 0.06, order: 1, x: -0.3, breathe: 0, dim: 1 },
  gate:     { color: '--accent', amp: 0.25, order: 0, x: 0.3,  breathe: 0, dim: 1 },
  ledger:   { color: '--gold',   amp: 0.30, order: 0, x: 0.3,  breathe: 0, dim: 1 },
  memory:   { color: '--violet', amp: 0.50, order: 0, x: 0,    breathe: 1, dim: 0.5 },   // sits behind text
};
const BY_SECTION = { install: 'install', hero: 'idle', numbers: 'measured', gate: 'gate', ledger: 'ledger', properties: 'memory', footer: 'idle' };
export function stateFor(id) { return BY_SECTION[id] ?? 'idle'; }

export function fibonacciSphere(n) {
  const out = new Float32Array(n * 3), golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < n; i++) {
    const y = 1 - (i / (n - 1)) * 2, r = Math.sqrt(Math.max(0, 1 - y * y)), phi = i * golden;
    out[i * 3] = Math.cos(phi) * r; out[i * 3 + 1] = y; out[i * 3 + 2] = Math.sin(phi) * r;
  }
  return out;
}
export function latticeOf(positions, k = 9) {
  const out = new Float32Array(positions.length);
  for (let i = 0; i < positions.length; i++) out[i] = Math.round(positions[i] * k) / k;
  return out;
}

// Ashima / Stefan Gustavson 3D simplex noise (MIT).
const SNOISE = /* glsl */`
vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
float snoise(vec3 v){
  const vec2 C=vec2(1.0/6.0,1.0/3.0); const vec4 D=vec4(0.0,0.5,1.0,2.0);
  vec3 i=floor(v+dot(v,C.yyy)); vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz); vec3 l=1.0-g; vec3 i1=min(g.xyz,l.zxy); vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx; vec3 x2=x0-i2+C.yyy; vec3 x3=x0-D.yyy;
  i=mod289(i);
  vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));
  float n_=0.142857142857; vec3 ns=n_*D.wyz-D.xzx;
  vec4 j=p-49.0*floor(p*ns.z*ns.z); vec4 x_=floor(j*ns.z); vec4 y_=floor(j-7.0*x_);
  vec4 x=x_*ns.x+ns.yyyy; vec4 y=y_*ns.x+ns.yyyy; vec4 h=1.0-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy); vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.0+1.0; vec4 s1=floor(b1)*2.0+1.0; vec4 sh=-step(h,vec4(0.0));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy; vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x); vec3 p1=vec3(a0.zw,h.y); vec3 p2=vec3(a1.xy,h.z); vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0*=norm.x; p1*=norm.y; p2*=norm.z; p3*=norm.w;
  vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0); m=m*m;
  return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}`;

const VERT = /* glsl */`
attribute vec3 aSphere; attribute vec3 aLattice; attribute float aRand;
uniform float uTime, uAmp, uOrder, uBurst, uBurstT, uPointSize, uBreathe;
varying float vBurst;
${SNOISE}
void main(){
  vec3 p = mix(aSphere, aLattice, uOrder);
  vec3 n = normalize(aSphere);
  float breathe = 1.0 + uBreathe * 0.08 * sin(uTime * 0.8);
  float d = snoise(p * 1.6 + vec3(0.0, uTime * 0.15, 0.0)) * uAmp;
  p = p * breathe + n * d;
  vBurst = step(aRand, uBurst);
  p += n * vBurst * uBurstT * 2.5;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_PointSize = uPointSize * (3.0 / -mv.z);
  gl_Position = projectionMatrix * mv;
}`;

const FRAG = /* glsl */`
precision mediump float;
uniform vec3 uColor, uRefuse; uniform float uOpacity;
varying float vBurst;
void main(){
  float r = length(gl_PointCoord - 0.5);
  float a = smoothstep(0.5, 0.15, r) * uOpacity;
  if (a < 0.01) discard;
  gl_FragColor = vec4(mix(uColor, uRefuse, vBurst), a);
}`;

const cssColor = name => new THREE.Color(getComputedStyle(document.documentElement).getPropertyValue(name).trim());
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const phone = () => matchMedia('(max-width: 767px)').matches;

export function mountSphere(canvas) {
  const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
  if (!gl) {
    canvas.remove();
    return { ready: Promise.resolve(false), setState() {}, retint() {}, verdict() {}, tint() {}, unavailable: true };
  }

  const N = phone() ? 7000 : 14000;
  const renderer = new THREE.WebGLRenderer({ canvas, context: gl, alpha: true, antialias: false });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 20); camera.position.z = 3.2;

  const sphere = fibonacciSphere(N), rand = new Float32Array(N).map(() => Math.random());
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(sphere, 3));
  geo.setAttribute('aSphere', new THREE.BufferAttribute(sphere, 3));
  geo.setAttribute('aLattice', new THREE.BufferAttribute(latticeOf(sphere), 3));
  geo.setAttribute('aRand', new THREE.BufferAttribute(rand, 1));
  const baseOpacity = phone() ? 0.25 : 0.9;
  const u = {
    uTime: { value: 0 }, uAmp: { value: 0.35 }, uOrder: { value: 0 }, uBurst: { value: 0 }, uBurstT: { value: 0 },
    uPointSize: { value: 2.2 * Math.min(devicePixelRatio, 2) }, uBreathe: { value: 0 }, uOpacity: { value: baseOpacity },
    uColor: { value: new THREE.Color() }, uRefuse: { value: new THREE.Color() },
  };
  const mat = new THREE.ShaderMaterial({ uniforms: u, vertexShader: VERT, fragmentShader: FRAG, transparent: true, depthWrite: false });
  const points = new THREE.Points(geo, mat); scene.add(points);

  // targets the loop eases toward (~800 ms settle)
  let stateName = 'idle', state = STATES.idle, tintToken = null;
  let targetColor = new THREE.Color(), targetX = 0, rotSpeed = 0.08, pauseUntil = 0, flash = 0, burst = null, dim = 1;
  let lookX = 0, lookY = 0;

  const colorFor = () => cssColor(tintToken ?? state.color);
  function render() { renderer.render(scene, camera); }
  function snap() {   // reduced motion: no easing, draw once
    u.uAmp.value = state.amp; u.uOrder.value = state.order; u.uBreathe.value = state.breathe;
    u.uColor.value.copy(targetColor); points.position.x = targetX; dim = state.dim; u.uOpacity.value = baseOpacity * dim; render();
  }
  function retint() {
    targetColor = colorFor(); u.uRefuse.value = cssColor('--refuse');
    mat.blending = document.documentElement.dataset.theme === 'pm' ? THREE.AdditiveBlending : THREE.NormalBlending;
    if (reduced()) snap();
  }
  function visibleWidth() { return 2 * camera.position.z * Math.tan((camera.fov / 2) * Math.PI / 180) * camera.aspect; }
  function setState(name) {
    stateName = STATES[name] ? name : 'idle'; state = STATES[stateName];
    targetColor = colorFor();
    targetX = phone() ? 0 : state.x * visibleWidth();
    if (reduced()) snap();
  }
  function tint(token) { tintToken = token || null; targetColor = colorFor(); if (reduced()) snap(); }
  function verdict(kind) {
    if (kind === 'deny') { burst = { t: 0 }; u.uBurst.value = 0.03; }
    if (kind === 'confirm') pauseUntil = performance.now() + 600;
    if (kind === 'auto') flash = 1;
  }
  function resize() {
    const w = canvas.clientWidth || 1, h = canvas.clientHeight || 1;
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
    points.scale.setScalar(0.38 * Math.min(1, w / h) + (phone() ? 0.12 : 0));
    setState(stateName);
  }

  let last = performance.now(), ready;
  const readyPromise = new Promise(r => { ready = r; });
  function frame(now) {
    const dt = Math.min(0.1, (now - last) / 1000); last = now;
    const k = 1 - Math.exp(-dt / 0.25);
    u.uAmp.value += (state.amp - u.uAmp.value) * k;
    u.uOrder.value += (state.order - u.uOrder.value) * k;
    u.uBreathe.value += (state.breathe - u.uBreathe.value) * k;
    u.uColor.value.lerp(targetColor, k);
    points.position.x += (targetX - points.position.x) * k;
    if (now > pauseUntil) points.rotation.y += rotSpeed * dt;
    points.rotation.x += (lookY * 0.07 - points.rotation.x) * k;
    points.rotation.z += (lookX * 0.07 - points.rotation.z) * k;
    dim += (state.dim - dim) * k;
    flash = Math.max(0, flash - dt * 2); u.uOpacity.value = baseOpacity * dim + flash * 0.4;
    if (burst) {
      burst.t += dt / 1.5; u.uBurstT.value = Math.sin(Math.min(1, burst.t) * Math.PI);
      if (burst.t >= 1) { burst = null; u.uBurst.value = 0; u.uBurstT.value = 0; }
    }
    u.uTime.value += dt;
    render(); ready(true);
    if (!document.hidden) requestAnimationFrame(frame);
    else document.addEventListener('visibilitychange', () => { last = performance.now(); requestAnimationFrame(frame); }, { once: true });
  }

  new ResizeObserver(resize).observe(canvas); resize(); retint();
  document.addEventListener('themechange', retint);
  document.addEventListener('verdict', e => verdict(e.detail));
  addEventListener('pointermove', e => {
    if (e.pointerType !== 'mouse') return;
    lookX = (e.clientX / innerWidth) * 2 - 1; lookY = (e.clientY / innerHeight) * 2 - 1;
  }, { passive: true });
  if (reduced()) { snap(); ready(true); } else requestAnimationFrame(frame);
  return { ready: readyPromise, setState, retint, verdict, tint, get state() { return stateName; } };
}
