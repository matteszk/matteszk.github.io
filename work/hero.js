// /work hero: the intro's black goat idling in a dusk forest (intro palette), and
// foreground trunks. The camera eases toward the mouse while it's over the scene.
// Decorative only. Pauses when off screen or in a background tab; a single still
// frame for reduced motion; hides itself if WebGL isn't available.
(function () {
  const wrap = document.getElementById('hero3d');
  if (!wrap || !window.THREE) return;
  const cv = wrap.querySelector('canvas');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  let R;
  try { R = new THREE.WebGLRenderer({ canvas: cv, antialias: false, alpha: false }); }
  catch (e) { wrap.hidden = true; return; }
  R.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
  const BG = 0x9e7378; // dusty-rose dusk, as in the intro
  R.setClearColor(BG);

  const S = new THREE.Scene();
  S.fog = new THREE.Fog(0x9e7378, 12, 46);
  // the intro's dusk sky: dusty rose at the horizon to deep violet overhead
  S.add(new THREE.Mesh(new THREE.SphereGeometry(80, 16, 12), new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, fog: false,
    vertexShader: 'varying float h;void main(){h=normalize(position).y;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader: 'varying float h;void main(){vec3 a=vec3(.62,.45,.47),b=vec3(.38,.31,.45),c=vec3(.13,.12,.25);vec3 col=mix(a,b,smoothstep(0.,.18,h));col=mix(col,c,smoothstep(.18,.75,h));gl_FragColor=vec4(col,1.);}' })));
  const cam = new THREE.PerspectiveCamera(40, 2, 0.1, 100);
  const camBase = new THREE.Vector3(0, 4.3, 10.5), look = new THREE.Vector3(1.2, .85, -.6); // higher and farther back, looking down on the goat

  // light: the intro's dusk - lilac sky fill and a low peach sun
  const hemi = new THREE.HemisphereLight(0xc8b0cc, 0x4a3e36, 1.15); S.add(hemi);
  const moon = new THREE.DirectionalLight(0xffcfb0, 0.95); moon.position.set(-6, 6, 4); S.add(moon);
  const warm = new THREE.PointLight(0xffc860, 0.6, 7); warm.position.set(1.6, 2.2, 2.2); S.add(warm);

  // --- materials and helpers, matching the intro ---
  const M = c => new THREE.MeshLambertMaterial({ color: c, flatShading: true });
  const foliM = [M('#4f5f2c'), M('#5e5a2e'), M('#6b4a2a'), M('#8a5a2a')], trunkM = M('#4a3626'), pineM = M('#2b3a2a'), firM = M('#22301f'), deadM = M('#3a302a'), barkM = M('#2e241c');
  const mk = (geo, mat, x, y, z, sx = 1, sy = 1, sz = 1) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.scale.set(sx, sy, sz); return m; };
  const TREES = {
    pine() { const g = new THREE.Group(); g.add(mk(new THREE.CylinderGeometry(.25, .35, 1.6, 5), trunkM, 0, .8, 0)); g.add(mk(new THREE.ConeGeometry(1.6, 4.5, 5), pineM, 0, 3.6, 0)); return g; },
    fir() { const g = new THREE.Group(); g.add(mk(new THREE.CylinderGeometry(.2, .3, 2, 5), trunkM, 0, 1, 0)); for (let i = 0; i < 3; i++) g.add(mk(new THREE.ConeGeometry(1.9 - i * .5, 2.6, 6), firM, 0, 2.4 + i * 1.5, 0)); return g; },
    oak() { const g = new THREE.Group(), lm = foliM[rnd() * foliM.length | 0]; g.add(mk(new THREE.CylinderGeometry(.35, .5, 2.6, 5), trunkM, 0, 1.3, 0));
      g.add(mk(new THREE.IcosahedronGeometry(2.2, 0), lm, 0, 3.8, 0)); g.add(mk(new THREE.IcosahedronGeometry(1.5, 0), lm, 1.3, 3.2, .4)); g.add(mk(new THREE.IcosahedronGeometry(1.4, 0), lm, -1.1, 3.4, -.5)); return g; },
    maple() { const g = new THREE.Group(), lm = foliM[1 + (rnd() * 3 | 0)]; g.add(mk(new THREE.CylinderGeometry(.28, .42, 3.2, 5), trunkM, 0, 1.6, 0));
      [[0, 4.4, 0, 1.8], [1.1, 3.7, .6, 1.3], [-1, 3.9, -.5, 1.35], [.3, 5.2, -.4, 1.1], [-.5, 3.4, 1, 1.1]].forEach(([x, y, z, r]) => g.add(mk(new THREE.IcosahedronGeometry(r, 0), lm, x, y, z))); return g; },
    dead() { const g = new THREE.Group(); g.add(mk(new THREE.CylinderGeometry(.15, .35, 4, 5), deadM, 0, 2, 0)); [[.9, 3, .6], [-.8, 2.4, -.9], [.6, 3.6, -1.1]].forEach(([r, h, t]) => { const b = mk(new THREE.CylinderGeometry(.06, .12, 1.8, 4), deadM, 0, h, 0); b.rotation.z = r; b.rotation.y = t; g.add(b); }); return g; }
  };
  let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

  // ground: same treatment as the intro - per-face meadow colours with dirt patches, under a soft mottled grass texture
  const gg = new THREE.PlaneGeometry(80, 60, 40, 30); gg.rotateX(-Math.PI / 2);
  const groundY = (x, z) => Math.sin(x * .3) * .12 + Math.cos(z * .25) * .12 + Math.max(0, Math.hypot(x, z) - 10) * .04;
  { const gp0 = gg.attributes.position;
    for (let i = 0; i < gp0.count; i++) { const x = gp0.getX(i), z = gp0.getZ(i), d = Math.hypot(x, z); gp0.setY(i, groundY(x, z)); } }
  gg.computeVertexNormals();
  const gn = gg.toNonIndexed(), gp = gn.attributes.position, cols = [];
  for (let i = 0; i < gp.count; i += 3) {
    const cx = (gp.getX(i) + gp.getX(i + 1) + gp.getX(i + 2)) / 3, cz = (gp.getZ(i) + gp.getZ(i + 1) + gp.getZ(i + 2)) / 3, r = rnd() * .05;
    const dn = Math.sin(cx * .45 + 1.3) * Math.cos(cz * .6) + Math.sin(cx * 1.2 + cz * .9) * .45, dd = Math.min(1, Math.max(0, (dn - .75) * 3));
    const bl = Math.sin(cx * .9 + .7) * Math.cos(cz * 1.1 + 1.9) + Math.sin(cx * 2.1 - cz * 1.7) * .6, bk = 1 + bl * .09, yl = Math.max(0, bl) * .04;
    const fade = 1, t = .4;
    for (let k = 0; k < 3; k++) cols.push((((.3 + t * .09 + r) * (1 - dd) + (.42 + r) * dd) * bk + yl) * fade, (((.34 + t * .09 + r) * (1 - dd) + (.33 + r) * dd) * bk + yl * .6) * fade, (((.21 + t * .04 + r * .6) * (1 - dd) + (.22 + r * .5) * dd) * bk) * fade);
  }
  gn.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
  const grassT = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d');
    x.fillStyle = '#b9bba8'; x.fillRect(0, 0, 64, 64);
    for (let i = 0; i < 34; i++) { const px = rnd() * 64, py = rnd() * 64, rr = 4 + rnd() * 12, v = rnd(), rot = rnd() * 3, sq = .55 + rnd() * .5,
      col = v < .55 ? `rgba(${132 + v * 50 | 0},${142 + v * 40 | 0},${104 + v * 24 | 0},.45)` : `rgba(${206 + v * 25 | 0},${210 + v * 20 | 0},${184 + v * 16 | 0},.35)`;
      for (const ox of [-64, 0, 64]) for (const oy of [-64, 0, 64]) { const gr = x.createRadialGradient(px + ox, py + oy, 0, px + ox, py + oy, rr); gr.addColorStop(0, col); gr.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = gr; x.beginPath(); x.ellipse(px + ox, py + oy, rr, rr * sq, rot, 0, 7); x.fill(); } }
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(14, 10); t.magFilter = THREE.LinearFilter; t.minFilter = THREE.LinearMipmapLinearFilter; t.anisotropy = R.capabilities.getMaxAnisotropy(); return t; })();
  S.add(new THREE.Mesh(gn, new THREE.MeshLambertMaterial({ vertexColors: true, map: grassT })));

  // forest: rings of trees around the clearing, thicker behind the goat
  const spots = [];
  for (let i = 0; i < 110; i++) {
    const a = rnd() * Math.PI * 2, r = 7 + rnd() * 20;
    const x = Math.cos(a) * r, z = Math.sin(a) * r - 3;
    if (z > -4 && Math.abs(x) < 8) continue; // keep the clearing between camera and goat open
    if (z > 3 || (x > 0 && z > -2 && x < 14)) continue; // nothing crowding the right foreground
    const q = rnd(), kd = q < .2 ? 'fir' : q < .32 ? 'pine' : q < .62 ? 'oak' : q < .9 ? 'maple' : 'dead', sc = .9 + rnd() * .7, cr = { fir: 2, pine: 1.7, oak: 3.1, maple: 2.6, dead: 1.4 }[kd] * sc;
    if (spots.some(([u, v, w]) => Math.hypot(u - x, v - z) < w + cr + .2)) continue; // canopies never overlap
    spots.push([x, z, cr]);
    const t = TREES[kd]();
    t.position.set(x, 0, z); t.scale.setScalar(sc); t.rotation.y = rnd() * 6; S.add(t);
  }
  // a few rocks and stumps in the clearing
  const rockM = M('#4c4852');
  // the invisible clearing the goat can wander: a wide, shallow oval
  const RING = { x: 1.22, z: .2, rx: 8.1, rz: 5.3 };
  // edge markers for the clickable clearing: a stump on its right edge, a little ring of mushrooms on its left
  { const sx = RING.x + RING.rx, sz = RING.z; S.add(mk(new THREE.CylinderGeometry(.45, .55, .5, 7), trunkM, sx, groundY(sx, sz) + .25, sz));
    const capM = M('#b8322a'), dotM = M('#efe6d2'), stemM2 = M('#e6dcc6'), mx = RING.x - RING.rx, mz = RING.z;
    [[0, 0, 1], [.45, .3, .7], [-.3, .42, .55], [.15, -.42, .6]].forEach(([dx, dz, sc]) => {
      const x = mx + dx, z = mz + dz, g = groundY(x, z), m = new THREE.Group(); m.position.set(x, g, z); m.scale.setScalar(sc); m.rotation.y = dx * 4;
      m.add(mk(new THREE.CylinderGeometry(.09, .12, .42, 6), stemM2, 0, .21, 0));
      const cap = new THREE.Mesh(new THREE.SphereGeometry(.32, 8, 4, 0, Math.PI * 2, 0, Math.PI / 2), capM); cap.position.y = .38; cap.scale.y = .75; m.add(cap);
      [[.15, .1], [-.12, .14], [0, -.17], [.05, .2]].forEach(([a, b]) => m.add(mk(new THREE.IcosahedronGeometry(.045, 0), dotM, a, .58 - Math.hypot(a, b) * .5, b)));
      S.add(m); }); }

  // --- the goat, built exactly as in the intro ---
  const fur = new THREE.MeshLambertMaterial({ color: '#26222a', flatShading: true });
  const furHi = new THREE.MeshLambertMaterial({ color: '#353039', flatShading: true });
  const hornM = M('#c4b38e'), hornM2 = M('#a6956f'), hornTip = M('#6e604a'), hoofM = M('#2c2620');
  const eyeM = new THREE.MeshBasicMaterial({ color: '#f2c23a' }), lidM = new THREE.MeshBasicMaterial({ color: '#0c0a0e' });
  const B = (w, h, d, m) => new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
  const EYES = [];
  const goat = new THREE.Group(), rig = new THREE.Group(); goat.add(rig);
  const body = new THREE.Group(); body.position.y = 1.55; rig.add(body);
  const chest = B(1.22, 1.22, 1.15, fur); chest.position.z = .45; body.add(chest);
  const hips = B(1.15, 1.12, 1.05, furHi); hips.position.z = -.5; body.add(hips);
  for (let i = 0; i < 7; i++) { const f = B(1.2, .28, .34, fur); f.position.set(0, -.7, -.95 + i * .32); f.rotation.x = (i % 2 ? .15 : -.1); body.add(f); }
  const neck = new THREE.Group(); neck.position.set(0, .35, .9); body.add(neck);
  const nk = B(.5, .9, .5, fur); nk.position.y = .4; nk.rotation.x = .45; neck.add(nk);
  const mane = B(.58, .9, .3, fur); mane.position.set(0, .3, .22); mane.rotation.x = .45; neck.add(mane);
  const head = new THREE.Group(); head.position.set(0, .85, .35); neck.add(head);
  const sk = B(.55, .55, .95, fur); sk.position.z = .25; head.add(sk);
  const muz = B(.42, .38, .35, furHi); muz.position.set(0, -.1, .75); head.add(muz);
  const beard = new THREE.Group(); beard.position.set(0, -.26, .62); head.add(beard);
  { const b1 = B(.32, .22, .3, fur); beard.add(b1); const b2 = B(.26, .34, .24, fur); b2.rotation.x = .12; beard.add(b2);
    const b3 = B(.18, .32, .16, fur); b3.rotation.x = .22; beard.add(b3); const b4 = B(.1, .24, .1, fur); b4.rotation.x = .3; beard.add(b4);
    [[-.1, .25], [.11, -.2], [.02, .05]].forEach(([x, r]) => { const st = B(.04, .32, .04, fur); st.rotation.z = r; st.rotation.x = .15; beard.add(st); }); }
  const EARS = [];
  [-1, 1].forEach(sd => {
    let hp = new THREE.Vector3(.17 * sd, .3, -.02), ang = 1.3;
    for (let i = 0; i < 6; i++) {
      const th = .17 * (1 - i * .1), len = .2, dir = new THREE.Vector3(.07 * sd, Math.sin(ang), -Math.cos(ang)).normalize();
      const seg = B(th, th, len, i == 5 ? hornTip : (i % 2 ? hornM2 : hornM)); seg.position.copy(hp).addScaledVector(dir, len / 2); seg.lookAt(seg.position.clone().add(dir)); head.add(seg);
      hp.addScaledVector(dir, len * .92); ang -= .42;
    }
    const e = B(.08, .1, .12, eyeM); e.position.set(.28 * sd, .08, .42); head.add(e); EYES.push(e);
    const ear = B(.42, .1, .16, fur); ear.position.set(.38 * sd, .12, .02); ear.rotation.z = -.35 * sd; head.add(ear); EARS.push({ ear, sd });
  });
  const tail = new THREE.Group(); tail.position.set(0, .4, -1); body.add(tail); const tl = B(.18, .45, .18, fur); tl.position.y = .2; tail.add(tl);
  function leg(x, z) { const hip = new THREE.Group(); hip.position.set(x, -.25, z); body.add(hip);
    const up = B(.24, .75, .28, fur); up.position.y = -.37; hip.add(up);
    const knee = new THREE.Group(); knee.position.y = -.72; hip.add(knee);
    const lo = B(.17, .7, .17, fur); lo.position.y = -.35; knee.add(lo);
    const hf = B(.2, .14, .24, hoofM); hf.position.set(0, -.72, .03); knee.add(hf); return { hip, knee }; }
  // diagonal pairs step together: front-left with back-right, front-right with back-left
  const LEGS = [[leg(.3, .7), 0], [leg(-.3, .7), Math.PI], [leg(.3, -.75), Math.PI], [leg(-.3, -.75), 0]];
  // stand the goat on his hooves: measure how far the hooves reach below the rig and lift by that much
  rig.position.y = 0; goat.updateMatrixWorld(true); const BASE = -new THREE.Box3().setFromObject(goat).min.y - .03; rig.position.y = BASE;
  const HOME = new THREE.Vector3(1.2, 0, -1.3);
  goat.position.copy(HOME); goat.rotation.y = -.75; S.add(goat);

  // fur + grain textures, as in the intro
  function texCanvas(fn) { const c = document.createElement('canvas'); c.width = c.height = 64; fn(c.getContext('2d')); const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.magFilter = THREE.LinearFilter; return t; }
  const furT = texCanvas(x => { x.fillStyle = '#a2a2a2'; x.fillRect(0, 0, 64, 64);
    for (let i = 0; i < 70; i++) { const v = Math.random() < .55 ? 60 + Math.random() * 50 : 200 + Math.random() * 50, px = Math.random() * 64, py = Math.random() * 64, h = 8 + Math.random() * 14;
      const g = x.createLinearGradient(0, py, 0, py + h); g.addColorStop(0, `rgba(${v},${v},${v},0)`); g.addColorStop(.5, `rgba(${v},${v},${v},.7)`); g.addColorStop(1, `rgba(${v},${v},${v},0)`);
      x.fillStyle = g; for (const ox of [-64, 0, 64]) for (const oy of [-64, 0, 64]) x.fillRect(px + ox, py + oy, 2 + Math.random() * 2, h); } });
  furT.repeat.set(2, 2);
  const roughT = texCanvas(x => { x.fillStyle = '#dedcd6'; x.fillRect(0, 0, 64, 64);
    for (let i = 0; i < 22; i++) { const cx = Math.random() * 64, cy = Math.random() * 64, r = 4 + Math.random() * 12, v = Math.random() < .5 ? 165 : 240;
      for (const ox of [-64, 0, 64]) for (const oy of [-64, 0, 64]) { const g = x.createRadialGradient(cx + ox, cy + oy, 0, cx + ox, cy + oy, r); g.addColorStop(0, `rgba(${v},${v},${v - 8},.4)`); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(cx + ox - r, cy + oy - r, r * 2, r * 2); } } });
  const seen = new Set();
  goat.traverse(o => { if (o.isMesh && o.material.isMeshLambertMaterial && !seen.has(o.material)) { seen.add(o.material); o.material.map = furT; o.material.color.offsetHSL(0, 0, .12); o.material.needsUpdate = true; } });
  S.traverse(o => { if (o.isMesh && o.material && o.material.isMeshLambertMaterial && !o.material.map && !seen.has(o.material) && !o.material.vertexColors) { seen.add(o.material); o.material.map = roughT; o.material.needsUpdate = true; } });

  // soft blob shadow under the goat
  const bc = document.createElement('canvas'); bc.width = bc.height = 64;
  { const b = bc.getContext('2d'), gr = b.createRadialGradient(32, 32, 2, 32, 32, 31); gr.addColorStop(0, 'rgba(0,0,0,.6)'); gr.addColorStop(.6, 'rgba(0,0,0,.35)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); b.fillStyle = gr; b.fillRect(0, 0, 64, 64); }
  const blob = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 3.2), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(bc), transparent: true, depthWrite: false }));
  S.add(blob);
  function placeBlob() { blob.rotation.set(-Math.PI / 2, 0, goat.rotation.y); blob.position.set(goat.position.x, .16, goat.position.z); }
  placeBlob();

  // --- fireflies: glowing sprites that drift on slow noise and pulse ---
  const fc = document.createElement('canvas'); fc.width = fc.height = 64;
  { const f = fc.getContext('2d'), gr = f.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,240,170,1)'); gr.addColorStop(.18, 'rgba(240,200,80,.9)'); gr.addColorStop(.5, 'rgba(231,184,74,.25)'); gr.addColorStop(1, 'rgba(231,184,74,0)'); f.fillStyle = gr; f.fillRect(0, 0, 64, 64); }
  const fTex = new THREE.CanvasTexture(fc);
  const FLIES = [];
  for (let i = 0; i < 11; i++) {
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: fTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
    const home = new THREE.Vector3((rnd() - .5) * 12, .6 + rnd() * 3.2, (rnd() - .6) * 8);
    sp.scale.setScalar(.32 + rnd() * .2); sp.visible = false; S.add(sp); // fireflies off: it's dusk now, not night
    FLIES.push({ sp, home, a: rnd() * 100, b: rnd() * 100, sp1: .25 + rnd() * .35, ph: rnd() * 6.28, rate: .6 + rnd() * 1.1 });
  }

  // --- behavior: idle by default; his head follows the mouse over the hero;
  //     click the ground inside the ring and an apple pops in, drops, and he walks over to eat it ---
  // the goat watches the mouse while it's over the hero: a point where the pointer ray meets head height (or far along it, for the sky)
  let ptr = null;
  const lookPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -1.6), lookHit = new THREE.Vector3(), lookNdc = new THREE.Vector2(), lookRay = new THREE.Raycaster();
  wrap.addEventListener('pointermove', e => { if (e.pointerType !== 'mouse') return;
    const r = wrap.getBoundingClientRect(); lookNdc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); lookRay.setFromCamera(lookNdc, cam);
    const d = lookRay.ray.direction; if (!(d.y < -.02 && lookRay.ray.intersectPlane(lookPlane, lookHit))) lookHit.copy(lookRay.ray.origin).addScaledVector(d, 30);
    ptr = { x: lookHit.x, z: lookHit.z, up: Math.max(0, Math.min(1, lookNdc.y * .9 + .25)) }; });
  wrap.addEventListener('pointerleave', () => { ptr = null; });

  // the apple: low-poly, in the intro's orchard colors
  const stemM = M('#4a3020'), leafM = M('#5c8a32');
  const FLESH = new THREE.Color('#f3e3b0');
  // three varieties: [skin, blush, height, width]
  // apple-shaped: broad shoulders, tapered base, a dimple top and bottom, faint lobes
  function appleGeo(r, detail) {
    const g = new THREE.IcosahedronGeometry(r, detail), P = g.attributes.position, v = new THREE.Vector3();
    for (let i = 0; i < P.count; i++) { v.fromBufferAttribute(P, i).divideScalar(r);
      const y = v.y, h = Math.hypot(v.x, v.z), th = Math.atan2(v.z, v.x);
      let w = 1 + .06 * Math.max(0, y) - .24 * Math.max(0, -y) ** 1.6; w *= 1 + .035 * Math.cos(5 * th) * Math.max(0, -y);
      let ny = y * .97 - .26 * Math.exp(-h * h * 9) * Math.sign(y) * (y > 0 ? 1 : .55);
      P.setXYZ(i, v.x * w * r, ny * r, v.z * w * r); }
    g.computeVertexNormals(); return g;
  }
  const KINDS = [['#d42a2a', '#e8453a', .92, 1], ['#9e1620', '#c8302e', 1.04, .95], ['#c0301e', '#e8763a', .95, 1.02]];
  function appleStages([skin, blush, sy, sxz], seed) {
    let rs = seed; const r = () => (rs = (rs * 16807) % 2147483647) / 2147483647;
    const base = appleGeo(.28, 3); const g0 = base.index ? base.toNonIndexed() : base;
    const P = g0.attributes.position, n = P.count, cSkin = new THREE.Color(skin), cBlush = new THREE.Color(blush);
    const pos = [], col = [];
    for (let i = 0; i < n; i++) { pos.push(new THREE.Vector3(P.getX(i) * sxz, P.getY(i) * sy, P.getZ(i) * sxz)); col.push(cSkin.clone().lerp(cBlush, Math.max(0, P.getX(i) / .28) * .6)); }
    const bites = []; let ang = r() * 6.28;
    for (let b = 0; b < 3; b++) { ang += 2.1 + r() * .5; bites.push({ c: new THREE.Vector3(Math.cos(ang) * .34 * sxz, (r() - .5) * .14, Math.sin(ang) * .34 * sxz), rb: .22 + r() * .03 }); }
    const make = k => { // k bites taken; k === 4 is the core
      const p = pos.map(v => v.clone()), c = col.map(x => x.clone());
      for (let b = 0; b < Math.min(k, 3); b++) { const { c: bc, rb } = bites[b];
        p.forEach((v, i) => { const d = v.distanceTo(bc); if (d < rb) { v.copy(bc).addScaledVector(v.clone().sub(bc).normalize(), rb); c[i].copy(FLESH); } }); }
      if (k === 4) p.forEach((v, i) => { const t = Math.abs(v.y) / (.28 * sy); if (t < .62) { const sq = .3 + t * .5; v.x *= sq; v.z *= sq; c[i].copy(FLESH); } });
      for (let f = 0; f < c.length; f += 3) { if (c[f].equals(FLESH) || c[f + 1].equals(FLESH) || c[f + 2].equals(FLESH)) { c[f].copy(FLESH); c[f + 1].copy(FLESH); c[f + 2].copy(FLESH); } }
      const g = new THREE.BufferGeometry(), a = [], cc = [];
      p.forEach((v, i) => { a.push(v.x, v.y, v.z); cc.push(c[i].r, c[i].g, c[i].b); });
      g.setAttribute('position', new THREE.Float32BufferAttribute(a, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(cc, 3)); g.computeVertexNormals(); return g;
    };
    return [0, 1, 2, 3, 4].map(make);
  }
  const STAGES = KINDS.map((k, i) => appleStages(k, 11 + i * 97));
  const apple = new THREE.Group();
  const appleMesh = new THREE.Mesh(STAGES[0][0], new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true, map: roughT }));
  apple.add(appleMesh);
  apple.add(mk(new THREE.CylinderGeometry(.025, .03, .16, 4), stemM, 0, .22, 0));
  { const lf = mk(new THREE.BoxGeometry(.16, .02, .08), leafM, .08, .26, 0); lf.rotation.z = -.5; apple.add(lf); }
  let kind = 0, stage = 0;
  apple.visible = false; S.add(apple);
  const APPLE_R = .26, SPAWN_Y = 1.05; // spawns at about half the goat's body height
  let appleState = 'none', appleT = 0, appleVy = 0, bounces = 0, appleSize = 1;

  let state = 'idle', stateT = 0, walkPh = 0, chomp = 0;
  const walkTo = new THREE.Vector3();
  let nextBlink = 2, blinkT = -1, down = 0, yaw = 0, lift = 0, glance = 0, glanceTo = 0, nextGlance = 3;
  const lerp = (a, b, k) => a + (b - a) * k, sstep = x => x * x * (3 - 2 * x);
  // debug (local/preview copies only, or #dev): show the clickable clearing as a translucent slab with its axes
  if (location.hash === '#dev' || !/(^|\.)matthewszklarz\.com$|\.github\.io$/.test(location.hostname)) {
    const zone = new THREE.Group(); zone.position.set(RING.x, 0, RING.z); S.add(zone);
    const slab = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, .5, 48), new THREE.MeshBasicMaterial({ color: 0xe7b84a, transparent: true, opacity: .18, depthWrite: false, fog: false }));
    slab.scale.set(RING.rx, 1, RING.rz); slab.position.y = .25; zone.add(slab);
    const edge = new THREE.LineSegments(new THREE.EdgesGeometry(slab.geometry, 1), new THREE.LineBasicMaterial({ color: 0xe7b84a, fog: false }));
    edge.scale.copy(slab.scale); edge.position.copy(slab.position); zone.add(edge);
    const ax = new THREE.AxesHelper(2.2); ax.position.y = .02; ax.material.depthTest = false; ax.renderOrder = 9; zone.add(ax); // x red, y green, z blue
  }
  const inRing = (x, z, pad) => ((x - RING.x) / (RING.rx - pad)) ** 2 + ((z - RING.z) / (RING.rz - pad)) ** 2 <= 1;

  function dropApple(x, z) {
    apple.position.set(x, SPAWN_Y, z); apple.rotation.y = Math.random() * 6;
    kind = Math.floor(Math.random() * 3); stage = 0; appleMesh.geometry = STAGES[kind][0];
    apple.scale.setScalar(.01); apple.visible = true; appleSize = 1;
    appleState = 'pop'; appleT = 0; appleVy = 0; bounces = 0;
    // walk to a spot where his mouth is over the apple
    const dx = x - goat.position.x, dz = z - goat.position.z, d = Math.hypot(dx, dz) || 1;
    const reach = 1.45;
    if (d > reach + .1) { walkTo.set(x - dx / d * reach, 0, z - dz / d * reach); state = 'walk'; }
    else { walkTo.copy(goat.position); state = 'turn'; }
  }

  function updateApple(dt) {
    if (appleState === 'none') return;
    appleT += dt;
    if (appleState === 'pop') { // quick pop with an easeOutBack overshoot, a beat of hang time, then drop
      const k = Math.min(1, appleT / .18), c1 = 2.4, c3 = c1 + 1, eb = 1 + c3 * (k - 1) ** 3 + c1 * (k - 1) ** 2;
      apple.scale.setScalar(Math.max(.01, appleSize * eb));
      if (appleT >= .24) { appleState = 'fall'; apple.scale.setScalar(appleSize); }
    } else if (appleState === 'fall') { // drop, then a couple of soft bounces
      appleVy -= 24 * dt; apple.position.y += appleVy * dt; apple.rotation.x += dt * 1.5;
      const floorY = groundY(apple.position.x, apple.position.z) + APPLE_R;
      if (apple.position.y <= floorY) {
        apple.position.y = floorY;
        if (bounces < 2 && Math.abs(appleVy) > 1.2) { appleVy = -appleVy * .28; bounces++; } else { appleVy = 0; appleState = 'rest'; }
      }
    }
  }

  function idle(t, dt) {
    stateT += dt;
    chest.scale.y = 1 + Math.sin(t * 1.7) * .02; hips.scale.y = 1 + Math.sin(t * 1.7 - .4) * .015;
    if (t > nextBlink) { blinkT = t; nextBlink = t + 2.5 + Math.random() * 4; }
    const closed = blinkT > 0 && t - blinkT < .14; EYES.forEach(e => { e.material = closed ? lidM : eyeM; e.scale.y = closed ? .25 : 1; });
    updateApple(dt);

    let moving = 0;
    if (state === 'walk' || state === 'turn') {
      const tx = state === 'walk' ? walkTo.x : apple.position.x, tz = state === 'walk' ? walkTo.z : apple.position.z;
      const dx = tx - goat.position.x, dz = tz - goat.position.z, dist = Math.hypot(dx, dz);
      let dYaw = Math.atan2(dx, dz) - goat.rotation.y; dYaw = Math.atan2(Math.sin(dYaw), Math.cos(dYaw));
      goat.rotation.y += dYaw * Math.min(1, dt * 4);
      if (state === 'walk') {
        if (Math.abs(dYaw) < .6 && dist > .02) { const step = Math.min(dist, dt * 1.6); goat.position.x += dx / dist * step; goat.position.z += dz / dist * step; moving = 1; }
        if (dist < .05) { state = 'turn'; stateT = 0; }
      } else {
        // face the apple, and wait for it to land before eating
        let fYaw = Math.atan2(apple.position.x - goat.position.x, apple.position.z - goat.position.z) - goat.rotation.y;
        fYaw = Math.atan2(Math.sin(fYaw), Math.cos(fYaw));
        if (Math.abs(fYaw) < .12 && appleState === 'rest') { state = 'eat'; stateT = 0; }
      }
    } else if (state === 'eat') {
      // a few bites: the apple shrinks with each one, then it's gone
      const want = Math.min(4, Math.max(0, Math.floor((stateT - .55) / .6) + 1));
      if (stateT > .55 && want !== stage) { stage = want; appleMesh.geometry = STAGES[kind][stage]; chomp = 1; }
      if (stateT > 3.35) { apple.visible = false; appleState = 'none'; state = 'idle'; stateT = 0; }
    }
    if (moving) walkPh += dt * 7;
    LEGS.forEach(([l, off]) => { const sw = Math.sin(walkPh + off) * moving;
      l.hip.rotation.x = lerp(l.hip.rotation.x, sw * .4, Math.min(1, dt * 10)); l.knee.rotation.x = lerp(l.knee.rotation.x, Math.max(0, -sw) * .5, Math.min(1, dt * 10)); });
    rig.position.y = BASE + Math.abs(Math.sin(walkPh)) * .04 * moving;

    // head: down only while eating; up and glancing around otherwise
    const looking = ptr !== null && state === 'idle';
    const eating = state === 'eat' && !looking;
    down = lerp(down, eating ? 1 : 0, Math.min(1, dt * (eating ? 3 : 4)));
    const e = sstep(Math.max(0, Math.min(1, down)));
    if (state === 'idle' && !looking && t > nextGlance) { glanceTo = (Math.random() - .5) * 1.1; nextGlance = t + 2.5 + Math.random() * 4; }
    if (state !== 'idle') glanceTo = 0;
    glance = lerp(glance, glanceTo, Math.min(1, dt * 2.2));
    let wantYaw = glance;
    if (looking) { wantYaw = Math.atan2(ptr.x - goat.position.x, ptr.z - goat.position.z) - goat.rotation.y; wantYaw = Math.max(-1.1, Math.min(1.1, Math.atan2(Math.sin(wantYaw), Math.cos(wantYaw)))); }
    yaw = lerp(yaw, wantYaw * (1 - e), Math.min(1, dt * 6));
    lift = lerp(lift, looking ? ptr.up : 0, Math.min(1, dt * 5));
    neck.rotation.x = -.08 - lift * .25 + e * 1.3;
    chomp = Math.max(0, chomp - dt * 5);
    head.rotation.x = e * (.6 - chomp * .22) - lift * .15;
    head.rotation.y = yaw;
    body.rotation.x = e * .08;
    EARS.forEach(({ ear, sd }) => { ear.rotation.z = -.35 * sd + Math.max(0, Math.sin(t * 3 + sd * 2) - .94) * 6 * sd + lift * .25 * sd; });
    tail.rotation.x = -.5 + Math.sin(t * (moving ? 5 : 2.4)) * .25;
    beard.rotation.x = Math.sin(t * 1.3) * .05;
    if (hopT >= 0) hop(dt);
    goat.position.y = groundY(goat.position.x, goat.position.z); // follow the gentle roll of the ground
    placeBlob();
  }

  // click the goat: a little goat hop - crouch, spring up with the front leading, tuck, a twist of the head, then a soft landing
  let hopT = -1;
  const ease = x => x * x * (3 - 2 * x);
  function hop(dt) {
    hopT += dt; const T = hopT;
    const CROUCH = .2, AIR = .42, LAND = .38;
    let y = 0, pitch = 0, fh = 0, fk = 0, rh = 0, rk = 0, tw = 0, nk = 0;
    if (T < CROUCH) { const u = ease(T / CROUCH);                       // load the springs
      y = -.16 * u; pitch = .04 * u; fh = .25 * u; fk = .45 * u; rh = -.3 * u; rk = .55 * u; nk = .12 * u; }
    else if (T < CROUCH + AIR) { const u = (T - CROUCH) / AIR;          // airborne: a real arc, nose up then level then nose down
      y = .5 * Math.sin(Math.PI * u) - .16 * Math.max(0, 1 - u * 6);
      pitch = -.2 * Math.cos(Math.PI * u);
      fh = -.55 * Math.sin(Math.PI * Math.min(1, u * 1.3)); fk = .8 * Math.sin(Math.PI * u);
      rh = .45 * Math.sin(Math.PI * Math.max(0, u * 1.2 - .2)); rk = .5 * Math.sin(Math.PI * u);
      tw = .28 * Math.sin(Math.PI * u); nk = -.18 * Math.sin(Math.PI * u); }
    else if (T < CROUCH + AIR + LAND) { const u = (T - CROUCH - AIR) / LAND; // absorb the landing and settle
      const d = Math.exp(-u * 5) * Math.cos(u * 9);
      y = -.12 * d; pitch = .06 * d; fh = .2 * d; fk = .4 * d; rh = -.15 * d; rk = .35 * d; nk = .1 * d; }
    else { hopT = -1; return; }
    rig.position.y = BASE + y; body.rotation.x = pitch;
    LEGS.forEach(([l], i) => { const front = i < 2; l.hip.rotation.x = front ? fh : rh; l.knee.rotation.x = front ? fk : rk; });
    neck.rotation.x += nk; head.rotation.z = tw * (hopSide);
  }
  let hopSide = 1;
  const goatAt = e => { const r = wrap.getBoundingClientRect(); ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); ray.setFromCamera(ndc, cam); return ray.intersectObject(goat, true).length > 0; };

  // click the ground inside the ring: an apple pops in there
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), floor = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), hit = new THREE.Vector3();
  function groundAt(e) {
    const r = wrap.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, cam);
    return ray.ray.intersectPlane(floor, hit) && inRing(hit.x, hit.z, 0) ? hit : null;
  }
  wrap.addEventListener('click', e => {
    if (reduce) return;
    if (goatAt(e)) { if (state === 'idle' && hopT < 0) { hopT = 0; hopSide = Math.random() < .5 ? -1 : 1; } return; } // tap the goat: he hops
    if (appleState !== 'none') return; // one apple at a time
    const g = groundAt(e); if (!g) return;
    // keep the apple a little inside the stones
    const dx = g.x - RING.x, dz = g.z - RING.z, ov = Math.hypot(dx / (RING.rx - .7), dz / (RING.rz - .7));
    const k = ov > 1 ? 1 / ov : 1;
    dropApple(RING.x + dx * k, RING.z + dz * k);
  });
  // pointer cursor over ground inside the ring
  wrap.addEventListener('pointermove', e => {
    if (reduce || e.pointerType !== 'mouse') return;
    wrap.style.cursor = (goatAt(e) && state === 'idle') || (groundAt(e) && appleState === 'none') ? 'pointer' : '';
  });

  // --- camera: a very slow, small drift so the scene feels alive ---
  const cur = { x: 0, y: 0 };

  function size() {
    const w = wrap.clientWidth, h = wrap.clientHeight; R.setSize(w, h, false);
    cam.aspect = w / h; cam.fov = w / h < 1.2 ? 52 : 40; cam.updateProjectionMatrix();
  }
  addEventListener('resize', size); size();

  let last = performance.now() / 1000, t = 0, running = false, visible = true;
  function frame(now) {
    if (!running) return;
    now /= 1000; const dt = Math.min(.05, now - last); last = now; t += dt;
    idle(t, dt);
    cur.x = Math.sin(t * .11) * .15; cur.y = Math.sin(t * .08) * .08;
    cam.position.set(camBase.x + cur.x * 1.6, camBase.y - cur.y * .6, camBase.z);
    cam.lookAt(look.x + cur.x * .5, look.y - cur.y * .2, look.z);
    FLIES.forEach(f => {
      f.a += dt * f.sp1; f.b += dt * f.sp1 * .8;
      f.sp.position.set(f.home.x + Math.sin(f.a) * 1.3 + Math.sin(f.b * 1.7) * .5, f.home.y + Math.sin(f.b) * .6, f.home.z + Math.cos(f.a * .8) * 1.1);
      f.sp.material.opacity = Math.max(.08, Math.pow(Math.max(0, Math.sin(t * f.rate + f.ph)), 3));
    });
    warm.position.copy(FLIES[0].sp.position); warm.intensity = 0;
    R.render(S, cam);
    requestAnimationFrame(frame);
  }
  function start() { if (running || reduce) return; running = true; last = performance.now() / 1000; requestAnimationFrame(frame); }
  function stop() { running = false; }

  if (reduce) { // one still frame: goat standing, fireflies lit
    idle(1, 0); EYES.forEach(e => { e.material = eyeM; e.scale.y = 1; });
    FLIES.forEach(f => { f.sp.position.copy(f.home); f.sp.material.opacity = .7; });
    cam.position.copy(camBase); cam.lookAt(look); R.render(S, cam);
  } else {
    new IntersectionObserver(es => { visible = es[0].isIntersecting; visible && !document.hidden ? start() : stop(); }).observe(wrap);
    document.addEventListener('visibilitychange', () => { document.hidden ? stop() : visible && start(); });
  }
  wrap.classList.add('ready');
})();
