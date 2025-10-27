<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>Arctic Seal Slide — Prototype Game</title>
<style>
  html,body { height:100%; margin:0; font-family:Inter,system-ui,Segoe UI,Roboto,Arial; }
  #gameRoot { display:flex; flex-direction:column; height:100vh; background: linear-gradient(#cfeefc,#eaf7ff 60%); }
  header { display:flex; justify-content:space-between; align-items:center; padding:10px 14px; background:transparent; }
  .title { font-weight:700; color:#074b6b; }
  .controls { display:flex; gap:8px; align-items:center; }
  button { border:0; padding:8px 12px; border-radius:8px; cursor:pointer; background:#0f9ad6; color:white; font-weight:600; }
  button.secondary { background:transparent; color:#0f9ad6; border:1px solid rgba(15,154,214,0.15); }
  canvas { display:block; width:100%; flex:1; }
  .hud { position:absolute; left:12px; top:12px; color:#033; font-weight:700; }
  #touchButton { position: absolute; right:18px; bottom:22px; width:72px; height:72px; border-radius:50%; border:0; background: rgba(15,154,214,0.95); color:white; font-weight:800; font-size:18px; display:flex; align-items:center; justify-content:center; box-shadow:0 8px 18px rgba(10,50,80,0.18); user-select:none; }
  #toolbar { position: absolute; right:18px; top:14px; display:flex; gap:8px; }
  #message { position:absolute; left:50%; transform:translateX(-50%); bottom:28px; background:rgba(255,255,255,0.9); padding:8px 12px; border-radius:8px; font-weight:600; color:#094; box-shadow:0 6px 14px rgba(0,0,0,0.06); }
  @media (max-width:600px){ #touchButton{ right:10px; bottom:12px; width:64px; height:64px; } }
</style>
</head>
<body>
<div id="gameRoot">
  <header>
    <div class="title">Arctic Seal — Prototype</div>
    <div class="controls">
      <div id="scoreDisplay">Time: 0.0s</div>
      <button id="restartBtn" class="secondary">Restart</button>
      <button id="pauseBtn">Pause</button>
    </div>
  </header>

  <canvas id="c"></canvas>

  <div id="touchButton" aria-hidden="true">HOLD</div>
  <div id="toolbar"></div>
  <div id="message">Hold space / hold the button to stick to hills</div>
</div>

<script>
/*
  Simple side-scroller prototype:
  - Seal is a circle drawn at fixed X.
  - Terrain scrolls left (function of worldX).
  - Pressing spacebar or holding the on-screen button increases gravity (strong pull) so the seal presses into the ground and "sticks".
  - Releasing returns to normal gravity.
  - Minimal visuals; easy to expand with sprites later.
*/

/* ====== Setup ====== */
const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d', { alpha: false });
let W = 800, H = 450;
function resize() {
  const dpr = Math.max(1, window.devicePixelRatio || 1);
  W = Math.max(600, Math.min(window.innerWidth, 1200));
  H = Math.max(320, window.innerHeight - 110);
  canvas.width = Math.floor(W * dpr);
  canvas.height = Math.floor(H * dpr);
  canvas.style.width = W+'px';
  canvas.style.height = H+'px';
  ctx.setTransform(dpr,0,0,dpr,0,0);
}
window.addEventListener('resize', resize);
resize();

/* ====== World & Terrain ====== */
let scroll = 0;                 // how much world has scrolled
const scrollSpeed = 2.2;        // pixels per frame (terrain moves left)
const baseGroundY = H * 0.72;   // baseline ground baseline
// compute ground y using multiple sine waves for "hills"
function groundYAt(worldX) {
  // worldX in pixels (increasing to the right)
  // combine a few sine waves for variety
  const a = Math.sin(worldX * 0.004) * 60;
  const b = Math.sin(worldX * 0.012 + 1.2) * 30;
  const c = Math.sin(worldX * 0.03 + 0.3) * 12;
  return baseGroundY + a + b + c;
}

/* ====== Player (seal) ====== */
const seal = {
  x: Math.round(W * 0.22),     // fixed screen X (seal stays ~left)
  y: baseGroundY - 24,         // top-left baseline
  r: 18,                       // radius
  vy: 0,                       // vertical velocity
  onGround: false
};

let gravityNormal = 0.42;
let gravityPressed = 2.6;
let gravity = gravityNormal;
let stickFrictionWhenPressed = 0.9; // more friction while pressed

/* ====== Controls ====== */
let pressed = false;
window.addEventListener('keydown', e => {
  if (e.code === 'Space') { e.preventDefault(); pressed = true; }
  if (e.code === 'KeyP') togglePause();
});
window.addEventListener('keyup', e => {
  if (e.code === 'Space') { e.preventDefault(); pressed = false; }
});

// on-screen button (touch/mouse)
const touchBtn = document.getElementById('touchButton');
touchBtn.addEventListener('mousedown', e => { e.preventDefault(); pressed = true; });
window.addEventListener('mouseup', ()=> pressed = false);
touchBtn.addEventListener('touchstart', e => { e.preventDefault(); pressed = true; }, {passive:false});
window.addEventListener('touchend', ()=> pressed = false);

/* ====== Game state ====== */
let lastTs = 0;
let running = true;
let elapsed = 0;
const scoreDisplay = document.getElementById('scoreDisplay');
const pauseBtn = document.getElementById('pauseBtn');
const restartBtn = document.getElementById('restartBtn');

pauseBtn.addEventListener('click', togglePause);
restartBtn.addEventListener('click', restart);

function togglePause() {
  running = !running;
  pauseBtn.textContent = running ? 'Pause' : 'Resume';
  if (running) {
    lastTs = performance.now();
    requestAnimationFrame(loop);
  }
}

function restart() {
  scroll = 0;
  seal.y = baseGroundY - 24;
  seal.vy = 0;
  elapsed = 0;
  lastTs = performance.now();
  if (!running) { running = true; pauseBtn.textContent = 'Pause'; requestAnimationFrame(loop); }
}

/* ====== Physics & Update ====== */
function update(dt) {
  // dt in seconds
  // update global scroll
  scroll += scrollSpeed * (60 * dt); // scale to approx px/frame at 60fps

  // gravity changes depending on control
  gravity = pressed ? gravityPressed : gravityNormal;

  // apply gravity to vertical velocity
  seal.vy += gravity;

  // update position
  seal.y += seal.vy;

  // ground check: compute ground y at world's x beneath the seal
  const worldXUnderSeal = seal.x + scroll;
  const groundY = groundYAt(worldXUnderSeal);

  // If below ground, push up
  if (seal.y + seal.r > groundY) {
    // place seal on ground
    seal.y = groundY - seal.r;
    // if falling, zero vertical speed (stick)
    if (seal.vy > 0) seal.vy = 0;

    // If pressed, make seal 'stick' strongly: resist leaving ground
    if (pressed) {
      // slightly push it into normal so it tightly tracks the hill
      seal.vy = 0;
      seal.onGround = true;
      // small vertical correction to avoid jitter
      seal.y = groundY - seal.r;
    } else {
      // not pressed: slight friction but allow separation if slope changes
      seal.onGround = true;
      // small bounce if we had some upward tendency (we'll keep vy=0)
      seal.vy *= 0; // keep still
    }
  } else {
    // in the air
    seal.onGround = false;
  }

  // small auto-slide effect when on ground and not pressed: drifting over hills
  // (because terrain moves, this mostly happens visually)
  // We'll also allow slight upward push when going uphill and not pressed:
  if (!pressed && seal.onGround) {
    // if next ground Y (a little ahead) is higher than current ground Y, we might lift
    const nextGroundY = groundYAt(worldXUnderSeal + 6);
    const slope = nextGroundY - groundY;
    // if slope is launching upward and small speed -> give tiny upward vy
    if (slope < -4) {
      // downward slope (next lower) -> do nothing
    } else if (slope > 6) {
      // uphill -> nudge upward slightly so it can leave the ground
      seal.vy -= 0.6;
      seal.onGround = false;
    }
  }

  // clamp to top
  if (seal.y < 8) { seal.y = 8; seal.vy = Math.max(seal.vy, 0); }

  // update elapsed time
  elapsed += dt;
  scoreDisplay.textContent = `Time: ${elapsed.toFixed(1)}s`;
}

/* ====== Draw ====== */
function draw() {
  // background sky
  ctx.fillStyle = '#cfeefc';
  ctx.fillRect(0,0,W,H);

  // sun (just decoration)
  ctx.beginPath();
  ctx.fillStyle = '#fff6b8';
  ctx.arc(W - 80, 80, 36, 0, Math.PI*2);
  ctx.fill();

  // draw terrain polygon
  ctx.fillStyle = '#dbeff7'; // ice/hill color
  ctx.strokeStyle = '#bcdff5';
  ctx.lineWidth = 2;
  ctx.beginPath();
  const step = 10;
  // start at left
  ctx.moveTo(0, H);
  for (let sx = 0; sx <= W; sx += step) {
    const worldX = sx + scroll;
    const gy = groundYAt(worldX);
    ctx.lineTo(sx, gy);
  }
  ctx.lineTo(W, H);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // optionally draw faint ridge lines for depth
  ctx.beginPath();
  for (let sx = 0; sx <= W; sx += 24) {
    const worldX = sx + scroll * 0.8;
    const gy = groundYAt(worldX);
    if (sx === 0) ctx.moveTo(sx, gy);
    else ctx.lineTo(sx, gy);
  }
  ctx.strokeStyle = 'rgba(11,64,84,0.05)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // draw seal (circle + small head triangle pointing right)
  const s = seal;
  // body
  ctx.beginPath();
  ctx.fillStyle = '#2b556b'; // seal dark (placeholder)
  ctx.arc(s.x, s.y, s.r, 0, Math.PI*2);
  ctx.fill();
  // eye
  ctx.beginPath();
  ctx.fillStyle = '#fff';
  ctx.arc(s.x + 6, s.y - 6, 4, 0, Math.PI*2);
  ctx.fill();
  ctx.beginPath();
  ctx.fillStyle = '#000';
  ctx.arc(s.x + 7.2, s.y - 6, 1.6, 0, Math.PI*2);
  ctx.fill();
  // little head/face triangle to the right (gives the "going right" look)
  ctx.beginPath();
  ctx.moveTo(s.x + s.r - 2, s.y - 6);
  ctx.lineTo(s.x + s.r + 12, s.y);
  ctx.lineTo(s.x + s.r - 2, s.y + 6);
  ctx.closePath();
  ctx.fillStyle = '#2b556b';
  ctx.fill();

  // small belly color
  ctx.beginPath();
  ctx.fillStyle = '#7fc9e6';
  ctx.ellipse(s.x - 3, s.y + 4, s.r*0.7, s.r*0.4, 0, 0, Math.PI*2);
  ctx.fill();

  // draw a shadow on the ground under the seal
  const groundYUnder = groundYAt(scroll + s.x);
  ctx.beginPath();
  ctx.ellipse(s.x, groundYUnder - 6, s.r*0.9, 8, 0, 0, Math.PI*2);
  ctx.fillStyle = 'rgba(6,25,40,0.08)';
  ctx.fill();

  // debug: show pressed state
  if (pressed) {
    ctx.fillStyle = 'rgba(8,80,120,0.08)';
    ctx.fillRect(0,0,W,H);
  }
}

/* ====== Main loop ====== */
function loop(ts) {
  if (!lastTs) lastTs = ts;
  const dt = Math.min(0.05, (ts - lastTs) / 1000); // clamp dt
  lastTs = ts;
  if (running) {
    update(dt);
    draw();
  }
  requestAnimationFrame(loop);
}

// start
lastTs = performance.now();
requestAnimationFrame(loop);

</script>
</body>
</html>