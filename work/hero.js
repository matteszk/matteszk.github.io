// /work hero: the intro's black goat idling in a night forest, with fireflies and
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
  const BG = 0x1c1820;
  R.setClearColor(BG);

  const S = new THREE.Scene();
  S.fog = new THREE.Fog(0x241d2c, 9, 34);
  const cam = new THREE.PerspectiveCamera(40, 2, 0.1, 100);
  const camBase = new THREE.Vector3(0, 2.1, 7.2), look = new THREE.Vector3(1.2, 1.45, 0);

  // light: cool moonlight from above-left, dim purple fill
  S.add(new THREE.HemisphereLight(0x8c86b8, 0x1a1712, 0.95));
  const moon = new THREE.DirectionalLight(0xc9d4ff, 0.75); moon.position.set(-6, 10, 4); S.add(moon);
  const warm = new THREE.PointLight(0xffc860, 0.6, 7); warm.position.set(1.6, 2.2, 2.2); S.add(warm);

  // --- materials and helpers, matching the intro ---
  const M = c => new THREE.MeshLambertMaterial({ color: c, flatShading: true });
  const trunkM = M('#4a3626'), pineM = M('#2b3a2a'), firM = M('#22301f'), deadM = M('#3a302a'), barkM = M('#2e241c');
  const mk = (geo, mat, x, y, z, sx = 1, sy = 1, sz = 1) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.scale.set(sx, sy, sz); return m; };
  const TREES = {
    pine() { const g = new THREE.Group(); g.add(mk(new THREE.CylinderGeometry(.25, .35, 1.6, 5), trunkM, 0, .8, 0)); g.add(mk(new THREE.ConeGeometry(1.6, 4.5, 5), pineM, 0, 3.6, 0)); return g; },
    fir() { const g = new THREE.Group(); g.add(mk(new THREE.CylinderGeometry(.2, .3, 2, 5), trunkM, 0, 1, 0)); for (let i = 0; i < 3; i++) g.add(mk(new THREE.ConeGeometry(1.9 - i * .5, 2.6, 6), firM, 0, 2.4 + i * 1.5, 0)); return g; },
    dead() { const g = new THREE.Group(); g.add(mk(new THREE.CylinderGeometry(.15, .35, 4, 5), deadM, 0, 2, 0)); [[.9, 3, .6], [-.8, 2.4, -.9], [.6, 3.6, -1.1]].forEach(([r, h, t]) => { const b = mk(new THREE.CylinderGeometry(.06, .12, 1.8, 4), deadM, 0, h, 0); b.rotation.z = r; b.rotation.y = t; g.add(b); }); return g; }
  };
  let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

  // ground: a gently rolling clearing, darker toward the edges
  const gg = new THREE.PlaneGeometry(80, 60, 40, 30); gg.rotateX(-Math.PI / 2);
  const gp = gg.attributes.position, cols = [];
  for (let i = 0; i < gp.count; i++) {
    const x = gp.getX(i), z = gp.getZ(i), d = Math.hypot(x, z);
    gp.setY(i, Math.sin(x * .3) * .12 + Math.cos(z * .25) * .12 + Math.max(0, d - 10) * .04);
    const k = Math.max(.45, 1 - d / 30), j = .9 + rnd() * .2;
    cols.push(.17 * k * j, .22 * k * j, .13 * k * j);
  }
  gg.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3)); gg.computeVertexNormals();
  S.add(new THREE.Mesh(gg, new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true })));

  // forest: rings of trees around the clearing, thicker behind the goat
  for (let i = 0; i < 70; i++) {
    const a = rnd() * Math.PI * 2, r = 7 + rnd() * 20;
    const x = Math.cos(a) * r, z = Math.sin(a) * r - 3;
    if (z > -4 && Math.abs(x) < 8) continue; // keep the clearing between camera and goat open
    if (z > 3) continue;
    const t = rnd() < .45 ? TREES.fir() : rnd() < .85 ? TREES.pine() : TREES.dead();
    t.position.set(x, 0, z); t.scale.setScalar(.9 + rnd() * .7); t.rotation.y = rnd() * 6; S.add(t);
  }
  // a few rocks and stumps in the clearing
  const rockM = M('#4c4852');
  [[-3.4, -1.5, .5], [5.6, -2.8, .7], [-1.2, 2.2, .3]].forEach(([x, z, s]) => S.add(mk(new THREE.DodecahedronGeometry(1, 0), rockM, x, s * .4, z, s, s * .7, s)));
  S.add(mk(new THREE.CylinderGeometry(.45, .55, .5, 7), trunkM, 4.9, .25, .9));

  // foreground trunks: big, close to the camera, partly out of frame
  const FG = [];
  [[-3.9, 3.4, .5], [4.3, 2.8, .62], [-6.2, 1.2, .45], [6.6, .6, .5]].forEach(([x, z, r]) => {
    const t = mk(new THREE.CylinderGeometry(r * .9, r * 1.15, 14, 7), barkM, x, 6, z); S.add(t); FG.push(t);
  });

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
  rig.position.y = -.13;
  const HOME = new THREE.Vector3(2.6, 0, -.6);
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
  for (let i = 0; i < 22; i++) {
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: fTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
    const home = new THREE.Vector3((rnd() - .5) * 12, .6 + rnd() * 3.2, (rnd() - .6) * 8);
    sp.scale.setScalar(.32 + rnd() * .2); S.add(sp);
    FLIES.push({ sp, home, a: rnd() * 100, b: rnd() * 100, sp1: .25 + rnd() * .35, ph: rnd() * 6.28, rate: .6 + rnd() * 1.1 });
  }

  // --- behavior: graze by default; look up at the pointer while it's in the header nav;
  //     walk to a spot on the ground when it's clicked near his home spot ---
  const nav = document.querySelector('header.top');
  let navPtr = null; // pointer x across the window (-1..1) while it's in the header
  if (nav) {
    nav.addEventListener('pointermove', e => { navPtr = (e.clientX / innerWidth) * 2 - 1; });
    nav.addEventListener('pointerleave', () => { navPtr = null; });
    nav.addEventListener('focusin', () => { if (navPtr === null) navPtr = 0; });
    nav.addEventListener('focusout', () => { navPtr = null; });
  }
  const WALK_RADIUS = 4.5, walkTo = new THREE.Vector3(); let walking = false, walkPh = 0;
  let nextBlink = 2, blinkT = -1, down = 1, yaw = 0, lift = 0;
  const lerp = (a, b, k) => a + (b - a) * k, sstep = x => x * x * (3 - 2 * x);
  function idle(t, dt) {
    chest.scale.y = 1 + Math.sin(t * 1.7) * .02; hips.scale.y = 1 + Math.sin(t * 1.7 - .4) * .015;
    if (t > nextBlink) { blinkT = t; nextBlink = t + 2.5 + Math.random() * 4; }
    const closed = blinkT > 0 && t - blinkT < .14; EYES.forEach(e => { e.material = closed ? lidM : eyeM; e.scale.y = closed ? .25 : 1; });

    // walking: turn toward the spot, then step over to it
    if (walking) {
      const dx = walkTo.x - goat.position.x, dz = walkTo.z - goat.position.z, dist = Math.hypot(dx, dz);
      const want = Math.atan2(dx, dz); let dYaw = want - goat.rotation.y;
      dYaw = Math.atan2(Math.sin(dYaw), Math.cos(dYaw));
      goat.rotation.y += dYaw * Math.min(1, dt * 4);
      if (Math.abs(dYaw) < .6) { const step = Math.min(dist, dt * 1.6); goat.position.x += dx / dist * step; goat.position.z += dz / dist * step; }
      walkPh += dt * 7;
      if (dist < .05) walking = false;
    }
    const moving = walking ? 1 : 0;
    LEGS.forEach(([l, off]) => { const s = Math.sin(walkPh + off) * moving;
      l.hip.rotation.x = lerp(l.hip.rotation.x, s * .4, Math.min(1, dt * 10)); l.knee.rotation.x = lerp(l.knee.rotation.x, Math.max(0, -s) * .5, Math.min(1, dt * 10)); });
    rig.position.y = -.13 + Math.abs(Math.sin(walkPh)) * .04 * moving;

    // head: down to graze unless walking or someone's in the nav
    const looking = navPtr !== null && !walking;
    down = lerp(down, walking || looking ? 0 : 1, Math.min(1, dt * (looking ? 5 : 2)));
    const e = sstep(Math.max(0, Math.min(1, down)));
    // when looking, turn the head toward the pointer's side of the screen
    let wantYaw = 0;
    if (looking) { wantYaw = navPtr * .7 - goat.rotation.y; wantYaw = Math.max(-1.1, Math.min(1.1, Math.atan2(Math.sin(wantYaw), Math.cos(wantYaw)))); }
    yaw = lerp(yaw, wantYaw, Math.min(1, dt * 6));
    lift = lerp(lift, looking ? 1 : 0, Math.min(1, dt * 5));
    neck.rotation.x = -.08 - lift * .25 + e * 1.3;
    head.rotation.x = e * (.6 + Math.sin(t * 6.6) * .05) - lift * .15;
    head.rotation.y = yaw;
    body.rotation.x = e * .08;
    EARS.forEach(({ ear, sd }) => { ear.rotation.z = -.35 * sd + Math.max(0, Math.sin(t * 3 + sd * 2) - .94) * 6 * sd + lift * .25 * sd; });
    tail.rotation.x = -.5 + Math.sin(t * (walking ? 5 : 2.4)) * .25;
    beard.rotation.x = Math.sin(t * 1.3) * .05;
    placeBlob();
  }

  // click the ground near his spot and he walks over
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), floor = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), hit = new THREE.Vector3();
  wrap.addEventListener('click', e => {
    if (reduce) return;
    const r = wrap.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, cam);
    if (!ray.ray.intersectPlane(floor, hit)) return;
    if (hit.distanceTo(HOME) > WALK_RADIUS) return;
    walkTo.copy(hit); walking = true;
  });
  // show a pointer cursor over ground he can walk to
  wrap.addEventListener('pointermove', e => {
    if (reduce || e.pointerType !== 'mouse') return;
    const r = wrap.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, cam);
    wrap.style.cursor = ray.ray.intersectPlane(floor, hit) && hit.distanceTo(HOME) <= WALK_RADIUS ? 'pointer' : '';
  });

  // --- camera: ease toward the mouse while it's over the scene, drift gently otherwise ---
  const tgt = { x: 0, y: 0 }, cur = { x: 0, y: 0 }; let hovering = false;
  wrap.addEventListener('pointermove', e => {
    if (e.pointerType !== 'mouse') return;
    const r = wrap.getBoundingClientRect(); hovering = true;
    tgt.x = ((e.clientX - r.left) / r.width) * 2 - 1; tgt.y = ((e.clientY - r.top) / r.height) * 2 - 1;
  });
  wrap.addEventListener('pointerleave', () => { hovering = false; });

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
    if (!hovering) { tgt.x = Math.sin(t * .13) * .35; tgt.y = Math.sin(t * .09) * .2; }
    cur.x += (tgt.x - cur.x) * Math.min(1, dt * 2.5); cur.y += (tgt.y - cur.y) * Math.min(1, dt * 2.5);
    cam.position.set(camBase.x + cur.x * 1.6, camBase.y - cur.y * .6, camBase.z);
    cam.lookAt(look.x + cur.x * .5, look.y - cur.y * .2, look.z);
    FLIES.forEach(f => {
      f.a += dt * f.sp1; f.b += dt * f.sp1 * .8;
      f.sp.position.set(f.home.x + Math.sin(f.a) * 1.3 + Math.sin(f.b * 1.7) * .5, f.home.y + Math.sin(f.b) * .6, f.home.z + Math.cos(f.a * .8) * 1.1);
      f.sp.material.opacity = Math.max(.08, Math.pow(Math.max(0, Math.sin(t * f.rate + f.ph)), 3));
    });
    warm.position.copy(FLIES[0].sp.position); warm.intensity = .6 * FLIES[0].sp.material.opacity;
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
