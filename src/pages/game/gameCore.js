import sealSpriteSrc from "../../assets/Game/SealSprite.png";
import rollSpriteSrc from "../../assets/Game/RollSprite.png";
import { trends } from "../../back-end/dataSource";
import {
  CLIMATE_FACTS,
  roundRect,
  drawFancyButton,
  drawCloud,
  spawnSnowflake,
  drawSnow,
  drawIceCracks,
  wrapTextToLines,
  drawBird,
} from "./gameUtils";

export function createGame({
  canvas,
  scoreDisplay,
  pauseBtn,
  restartBtn,
  touchBtn,
  startControls,
  startBtnEl,
  demoBtnEl,
  fsBtn,
  COLORS,
}) {
  const ctx = canvas.getContext("2d", { alpha: false });
  const jumpStrength = -16;
  let gameState = "start"; // "start", "playing", "gameover"
  let gameMode = "full"; // "full" or "demo"
  let elapsed = 0;

  // visual/UX state moved from game.js
  let snowflakes = [];
  let melt = 0;
  const meltSpeed = 0.0008;
  let factAnim = 0;
  let factAnimSpeed = 6;

  // ----- Sizing -----
  let W = 800,
    H = 450;
  let holdBtn = { x: 0, y: 0, w: 120, h: 60 };

  const updateHoldBtnPosition = () => {
    holdBtn.x = W / 2 - holdBtn.w / 2;
    holdBtn.y = H - holdBtn.h - 60;
  };

  const resize = () => {
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    const header = canvas.parentElement.querySelector(".gameHeader");
    const headerHeight = header ? header.offsetHeight : 60;
    W = Math.max(700, window.innerWidth);
    H = Math.max(300, window.innerHeight - headerHeight);
    canvas.width = Math.floor(W * dpr);
    canvas.height = Math.floor(H * dpr);
    canvas.style.width = W + "px";
    canvas.style.height = H + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (typeof updateHoldBtnPosition === "function") updateHoldBtnPosition();
  };
  window.addEventListener("resize", resize);
  resize();

  // ----- Start Screen Visuals -----
  let clouds = [];
  for (let i = 0; i < 8; i++) {
    clouds.push({ x: Math.random() * W + W, y: 60 + Math.random() * 80, speed: 0.3 + Math.random() * 0.4 });
  }

  updateHoldBtnPosition();

  // ----- Background assets: mountains & birds -----
  let mountains = [];
  let birds = [];
  const initMountains = () => {
    mountains = [];
    const count = 6;
    for (let i = 0; i < count; i++) {
      const w = 220 + Math.random() * 220;
      const h = H * (0.08 + Math.random() * 0.2);
      mountains.push({ x: i * (W / count) + Math.random() * 80 - 40, y: H * 0.68 - h, w, h, speed: 0.12 + Math.random() * 0.2 });
    }
  };
  const initBirds = () => {
    birds = [];
    for (let i = 0; i < 8; i++) {
      birds.push({ x: Math.random() * W, y: 50 + Math.random() * 110, speed: 0.8 + Math.random() * 1.4, size: 8 + Math.random() * 10 });
    }
  };
  initMountains();
  initBirds();

  // ----- World & Terrain -----
  let scroll = 0;
  const scrollSpeed = 2.0;
  const baseGroundY = H * 0.72;

  // Mode-dependent constants
  let MAX_DISTANCE = 200;
  let coinSpawnIntervalBase = 6.0;
  const FULL_TARGET_FACTS = 10;
  const DEMO_TARGET_FACTS = 2;
  let targetFactsCount = FULL_TARGET_FACTS;

  const shuffleLocal = (arr) => {
    const res = arr.slice();
    for (let i = res.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [res[i], res[j]] = [res[j], res[i]];
    }
    return res;
  };

  const pickFactsForMode = (mode) => {
    if (mode === "demo") return CLIMATE_FACTS.slice(0, DEMO_TARGET_FACTS);
    const shuffled = shuffleLocal(CLIMATE_FACTS);
    return shuffled.slice(0, FULL_TARGET_FACTS);
  };

  const setGameMode = (mode) => {
    gameMode = mode;
    if (mode === "demo") {
      MAX_DISTANCE = 20;
      coinSpawnIntervalBase = 2.5;
      targetFactsCount = DEMO_TARGET_FACTS;
      factsPool = pickFactsForMode("demo");
    } else {
      MAX_DISTANCE = 150;
      coinSpawnIntervalBase = 6.0;
      targetFactsCount = FULL_TARGET_FACTS;
      factsPool = pickFactsForMode("full");
    }
    factsShown.clear();
    nextFactIndex = 0;
  };

  const baseScrollSpeed = 1.8;
  let actualScrollSpeed = baseScrollSpeed;
  const maxSpeedupFactor = 0.7;
  const meterCountDivisor = 0.01;
  const groundYAt = (worldX) => {
    const a = Math.sin(worldX * 0.004) * 40;
    const b = Math.sin(worldX * 0.012 + 1.2) * 20;
    const c = Math.sin(worldX * 0.03 + 0.3) * 8;
    return baseGroundY + a + b + c;
  };

  // ----- Player -----
  const seal = { x: Math.round(W * 0.22), y: baseGroundY - 24, r: 18, vy: 0, onGround: false };

  // Sprites
  const sealSprite = new Image();
  const rollSprite = new Image();
  let spritesLoad = false;
  let sealRatio = 1;
  let rollRatio = 1;

  let loadedCount = 0;
  const onSpriteLoad = () => {
    loadedCount++;
    if (loadedCount === 2) {
      spritesLoad = true;
      try { sealRatio = sealSprite.naturalWidth / sealSprite.naturalHeight || 1; } catch (e) { sealRatio = 1; }
      try { rollRatio = rollSprite.naturalWidth / rollSprite.naturalHeight || 1; } catch (e) { rollRatio = 1; }
    }
  };
  sealSprite.onload = onSpriteLoad;
  rollSprite.onload = onSpriteLoad;
  sealSprite.src = sealSpriteSrc;
  rollSprite.src = rollSpriteSrc;

  // ----- Coin System -----
  let coins = [];
  let coinsCollected = 0;
  let lastSpawnDist = -999;
  let nextCoinAt = 4;
  const coinRadius = 12;
  let factsShown = new Set();

  const DEMO_FACTS = CLIMATE_FACTS.slice(0, 2);
  let factsPool = CLIMATE_FACTS.slice();
  let FACT_MODE = "unique";
  let nextFactIndex = 0;

  try {
    const t = trends();
    const dynamicFacts = t
      .map((d) => {
        const last = d.last || {};
        const unitStr = d.unit ? ` ${d.unit}` : "";
        const delta = d.delta != null ? `${d.delta > 0 ? "+" : ""}${d.delta.toFixed(2)}` : "";
        const fact = `${d.dataset} ${last.year ? `(${last.year})` : ""}: ${last.value ?? ""}${unitStr}. Change: ${delta}${unitStr} since first record.`;
        return fact;
      })
      .filter(Boolean);
    if (dynamicFacts.length > 0) {
      factsPool = dynamicFacts.concat(CLIMATE_FACTS.slice()).slice(0, FULL_TARGET_FACTS);
    }
  } catch (e) {
    // ignore
  }

  let pendingWin = false;
  let winStart = 0;
  let winParticles = [];
  let confetti = [];
  let meltParticles = [];
  let titleClickHandler = null;

  const spawnCoin = () => {
    const screenRightWorldX = scroll + W;
    let worldX;
    if (coins.length === 0) {
      const metersAhead = 4 + Math.random() * 2;
      const pixelsPerMeter = 1 / meterCountDivisor;
      worldX = scroll + seal.x + metersAhead * pixelsPerMeter;
      worldX += Math.random() * 40 - 20;
      if (worldX > screenRightWorldX + 120) worldX = screenRightWorldX + 20;
    } else {
      worldX = screenRightWorldX + Math.random() * 60 - 30;
    }
    lastSpawnDist = Math.floor(scroll * meterCountDivisor);
    const groundY = groundYAt(worldX);
    const y = groundY - (40 + Math.random() * 80);
    coins.push({ x: worldX, y: y, r: coinRadius, collected: false });
  };

  // ----- Fact Display -----
  let displayedFact = null;
  let factDisplayTime = 0;
  const factDisplayDuration = 3.5;

  // ----- Controls -----
  let pressed = false;
  let justReleased = false;

  const handleKeyDown = (e) => {
    if (e.code === "Space") {
      e.preventDefault();
      if (gameState === "start") {
        restart("full");
      } else pressed = true;
    }
    if (e.code === "KeyP") togglePause();
  };

  const handleKeyUp = (e) => {
    if (e.code === "Space") {
      e.preventDefault();
      pressed = false;
      justReleased = true;
    }
  };

  const mouseDown = (e) => {
    e.preventDefault();
    if (gameState === "start") restart("full");
    else pressed = true;
  };
  const mouseUp = () => (pressed = false);
  const touchStart = (e) => {
    e.preventDefault();
    if (gameState === "start") restart("full");
    else pressed = true;
  };
  const touchEnd = () => { pressed = false; justReleased = true; };

  window.addEventListener("keydown", handleKeyDown);
  window.addEventListener("keyup", handleKeyUp);

  if (touchBtn) {
    touchBtn.addEventListener("mousedown", mouseDown);
    window.addEventListener("mouseup", mouseUp);
    touchBtn.addEventListener("touchstart", touchStart, { passive: false });
    window.addEventListener("touchend", touchEnd);
    touchBtn.style.display = "none";
  }

  const onCanvasClick = (e) => {
    if (gameState !== "start" && gameState !== "gameover" && gameState !== "gameover-loss") return;
    const rect = canvas.getBoundingClientRect();
    const mx = ((e.clientX - rect.left) * (canvas.width / rect.width)) / (window.devicePixelRatio || 1);
    const my = ((e.clientY - rect.top) * (canvas.height / rect.height)) / (window.devicePixelRatio || 1);

    if (gameState === "gameover") {
      if (mx >= playAgainBtn.x && mx <= playAgainBtn.x + playAgainBtn.w && my >= playAgainBtn.y && my <= playAgainBtn.y + playAgainBtn.h) { restart(gameMode); return; }
    }

    if (gameState === "gameover-loss") {
      if (mx >= tryAgainBtn.x && mx <= tryAgainBtn.x + tryAgainBtn.w && my >= tryAgainBtn.y && my <= tryAgainBtn.y + tryAgainBtn.h) { restart(gameMode); return; }
    }

    if (mx >= startBtn.x && mx <= startBtn.x + startBtn.w && my >= startBtn.y && my <= startBtn.y + startBtn.h) {
      if (gameState === "gameover" || gameState === "gameover-loss") { restart(gameMode); } else { restart("full"); }
    }

    if (gameState === "start" && mx >= demoBtn.x && mx <= demoBtn.x + demoBtn.w && my >= demoBtn.y && my <= demoBtn.y + demoBtn.h) { restart("demo"); }

    if (displayedFact !== null) {
      const boxWidth = Math.min(W * 0.8, 500);
      const boxHeight = 140;
      const boxX = (W - boxWidth) / 2;
      const boxY = H / 2 - boxHeight / 2;
      if (mx >= boxX && mx <= boxX + boxWidth && my >= boxY && my <= boxY + boxHeight) {
        if (pendingWin) { pendingWin = false; gameState = "gameover"; winStart = elapsed; } else { displayedFact = null; }
        return;
      }
    }
  };
  canvas.addEventListener("click", onCanvasClick);

  const onCanvasMouseMove = (e) => {
    if (gameState !== "start" && gameState !== "gameover" && gameState !== "gameover-loss") return;
    const rect = canvas.getBoundingClientRect();
    const mx = ((e.clientX - rect.left) * (canvas.width / rect.width)) / (window.devicePixelRatio || 1);
    const my = ((e.clientY - rect.top) * (canvas.height / rect.height)) / (window.devicePixelRatio || 1);
    startBtn.hover = mx >= startBtn.x && mx <= startBtn.x + startBtn.w && my >= startBtn.y && my <= startBtn.y + startBtn.h;
    demoBtn.hover = gameState === "start" && mx >= demoBtn.x && mx <= demoBtn.x + demoBtn.w && my >= demoBtn.y && my <= demoBtn.y + demoBtn.h;

    if (gameState === "gameover") {
      playAgainBtn.hover = mx >= playAgainBtn.x && mx <= playAgainBtn.x + playAgainBtn.w && my >= playAgainBtn.y && my <= playAgainBtn.y + playAgainBtn.h;
      canvas.style.cursor = playAgainBtn.hover ? "pointer" : "default";
    }

    if (gameState === "gameover-loss") {
      tryAgainBtn.hover = mx >= tryAgainBtn.x && mx <= tryAgainBtn.x + tryAgainBtn.w && my >= tryAgainBtn.y && my <= tryAgainBtn.y + tryAgainBtn.h;
      canvas.style.cursor = tryAgainBtn.hover ? "pointer" : "default";
    }

    canvas.style.cursor = startBtn.hover || demoBtn.hover ? "pointer" : "default";
  };
  canvas.addEventListener("mousemove", onCanvasMouseMove);

  let lastTs = 0;
  let running = true;

  const togglePause = () => {
    running = !running;
    if (pauseBtn) pauseBtn.textContent = running ? "⏸️" : "▶️";
    if (running) lastTs = performance.now();
  };

  const enterFullscreen = async () => {
    try {
      const el = document.documentElement;
      if (el.requestFullscreen) await el.requestFullscreen();
      else if (el.webkitRequestFullscreen) await el.webkitRequestFullscreen();
      else if (el.msRequestFullscreen) await el.msRequestFullscreen();
    } catch (e) {}
  };
  const exitFullscreen = async () => {
    try {
      if (document.exitFullscreen) await document.exitFullscreen();
      else if (document.webkitExitFullscreen) await document.webkitExitFullscreen();
      else if (document.msExitFullscreen) await document.msExitFullscreen();
    } catch (e) {}
  };

  const handleGlobalClick = (e) => {
    try {
      const target = e.target;
      const isFull = document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement;
      if (!isFull) return;
      if (target.closest && target.closest(".title")) return;
      if (target.closest && (target.closest(".control-buttons") || target.closest("#pauseBtn") || target.closest("#restartBtn") || target.closest("#fsBtn"))) return;
      const headerNavClicked = target.closest && (target.closest("a") || target.closest(".gameHeader"));
      if (headerNavClicked) exitFullscreen();
    } catch (e) {}
  };
  document.addEventListener("click", handleGlobalClick);

  const restart = (mode = "full") => {
    setGameMode(mode);
    scroll = 0;
    seal.y = baseGroundY - 24;
    seal.vy = 0;
    elapsed = 0;
    lastTs = performance.now();
    running = true;
    if (pauseBtn) pauseBtn.textContent = "⏸️";
    coins = [];
    coinsCollected = 0;
    displayedFact = null;
    factDisplayTime = 0;
    factsShown.clear();
    lastSpawnDist = -999;
    nextCoinAt = 4 + Math.random() * 2;
    gameState = "playing";
    melt = 0;
    enterFullscreen();
    try { if (startControls) startControls.style.display = "none"; } catch (e) {}
  };

  if (pauseBtn) pauseBtn.addEventListener("click", togglePause);
  const onRestartBtnClick = () => restart(gameMode);
  let crackProgress = 0;
  const onFsToggle = () => {
    const isFull = document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement;
    if (isFull) exitFullscreen(); else enterFullscreen();
  };
  if (fsBtn) fsBtn.addEventListener("click", onFsToggle);
  const onFullChange = () => {
    const isFull = document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement;
    try { if (fsBtn) fsBtn.textContent = isFull ? "⤡" : "⤢"; } catch (e) {}
  };
  document.addEventListener("fullscreenchange", onFullChange);
  document.addEventListener("webkitfullscreenchange", onFullChange);
  try { onFullChange(); } catch (e) {}
  if (restartBtn) restartBtn.addEventListener("click", onRestartBtnClick);

  const onStartOverlayClick = () => restart("full");
  const onDemoOverlayClick = () => restart("demo");
  try { if (startBtnEl) startBtnEl.addEventListener("click", onStartOverlayClick); } catch (e) {}
  try { if (demoBtnEl) demoBtnEl.addEventListener("click", onDemoOverlayClick); } catch (e) {}

  const update = (dt) => {
    const fpsScale = Math.min(60 * dt, 3);
    if (displayedFact !== null) {
      factDisplayTime += dt;
      if (factDisplayTime >= factDisplayDuration) {
        if (pendingWin) {
          pendingWin = false;
          gameState = "gameover";
          confetti = [];
          winParticles = [];
          for (let i = 0; i < 120; i++) { confetti.push({ x: Math.random() * W, y: Math.random() * -H, w: 6 + Math.random() * 6, h: 8 + Math.random() * 8, vy: 1 + Math.random() * 2, color: ["#ff2d55", "#ff9500", "#34c759", "#5856d6", "#ffcc00"][Math.floor(Math.random() * 5)] }); }
          for (let i = 0; i < 40; i++) { winParticles.push({ x: W / 2 + (Math.random() - 0.5) * 60, y: H / 2 + (Math.random() - 0.5) * 30, r: 3 + Math.random() * 5, vy: -0.8 - Math.random() * 1.6, vx: -1 + Math.random() * 2, a: 1, color: ["#fff6b8", "#ffd6a5", "#bde0fe"][Math.floor(Math.random() * 3)] }); }
          winStart = elapsed;
        } else {
          displayedFact = null;
        }
      }
      elapsed += dt;
      return;
    }

    if (gameState === "playing") {
      const distancePercentNow = Math.min(1, Math.max(0, Math.floor(scroll * meterCountDivisor) / MAX_DISTANCE));
      actualScrollSpeed = baseScrollSpeed * (1 + maxSpeedupFactor * distancePercentNow);
      scroll += actualScrollSpeed * fpsScale;
      const currentDistance = Math.floor(scroll * meterCountDivisor);
      if (currentDistance >= MAX_DISTANCE) gameState = "gameover-loss";

      const G = 0.9;
      const MAX_FALL = 18;
      const AIR_DRAG = 0.995;

      seal.vy += G * fpsScale;
      if (seal.vy > MAX_FALL) seal.vy = MAX_FALL;
      if (!seal.onGround) seal.vy *= Math.pow(AIR_DRAG, fpsScale);
      seal.y += seal.vy * fpsScale;

      const worldX = seal.x + scroll;
      const groundY = groundYAt(worldX);
      const nextGroundY = groundYAt(worldX + 2);
      const slope = nextGroundY - groundY;
      const slopeAngle = Math.atan2(slope, 2);

      if (seal.y + seal.r >= groundY) {
        if (pressed) {
          seal.onGround = true;
          seal.y = groundY - seal.r;
          seal.vy = 0;
          scroll += Math.cos(slopeAngle) * scrollSpeed - scrollSpeed;
        } else if (seal.onGround) {
          seal.onGround = false;
          const distancePercentNow = Math.min(1, Math.max(0, Math.floor(scroll * meterCountDivisor) / MAX_DISTANCE));
          const jumpBoost = 1 + 0.12 * distancePercentNow;
          seal.vy = jumpStrength * jumpBoost + Math.min(4, -Math.sin(slopeAngle) * 6);
        } else {
          seal.y = groundY - seal.r;
          if (seal.vy > 0) seal.vy *= -0.18;
        }
      } else {
        seal.onGround = false;
      }

      if (seal.y < 8) { seal.y = 8; seal.vy = Math.max(seal.vy, 0); }
      if (justReleased) justReleased = false;

      if (seal.onGround) {
        const rollSpeedFactor = 2.5;
        const pressedBoost = pressed ? 1.15 : 1;
        const rollAngularVel = actualScrollSpeed * rollSpeedFactor * pressedBoost;
        rollAngle += rollAngularVel * dt;
        if (rollAngle > Math.PI) rollAngle -= Math.PI * 2;
        if (rollAngle < -Math.PI) rollAngle += Math.PI * 2;
      } else { rollAngle = 0; }

      const distanceNow = Math.floor(scroll * meterCountDivisor);
      if (distanceNow - lastSpawnDist > nextCoinAt) {
        spawnCoin();
        lastSpawnDist = distanceNow;
        nextCoinAt = 4 + Math.random() * 2;
      }

      if (gameState === "playing") { melt += 0.0008; if (melt > 1) melt = 1; }

      coins.forEach((coin, idx) => {
        if (coin.x < scroll - 100) { coins.splice(idx, 1); return; }
        const sealWorldX = seal.x + scroll;
        const dx = sealWorldX - coin.x;
        const dy = seal.y - coin.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < seal.r + coin.r) {
          coins.splice(idx, 1);
          const factsSource = gameMode === "demo" ? DEMO_FACTS : factsPool;
          let chosenFact = null;
          if (FACT_MODE === "unique") {
            let attempts = 0;
            while (attempts < factsSource.length) {
              const candidate = factsSource[nextFactIndex % factsSource.length];
              nextFactIndex = (nextFactIndex + 1) % factsSource.length;
              attempts++;
              if (!factsShown.has(candidate)) { chosenFact = candidate; break; }
            }
            if (!chosenFact) chosenFact = factsSource[Math.floor(Math.random() * factsSource.length)];
          } else {
            chosenFact = factsSource[Math.floor(Math.random() * factsSource.length)];
          }
          if (!factsShown.has(chosenFact)) { factsShown.add(chosenFact); coinsCollected++; }
          if (factsShown.size >= targetFactsCount) pendingWin = true;
          displayedFact = chosenFact;
          factAnim = 0;
          factDisplayTime = 0;
        }
      });

      elapsed += dt;
    } else if (gameState === "start") {
      elapsed += dt * 0.5;
    }

    if (scoreDisplay && gameState === "playing") {
      const distance = Math.floor(scroll * meterCountDivisor);
      scoreDisplay.textContent = `${distance}m / ${MAX_DISTANCE}m | 📚 ${coinsCollected}/${targetFactsCount}`;
      if (touchBtn) touchBtn.style.display = "flex";
    } else if (gameState === "start") {
      if (scoreDisplay) scoreDisplay.textContent = `Press Space or Hold to Start`;
      if (touchBtn) touchBtn.style.display = "none";
    } else if (gameState === "gameover") {
      if (scoreDisplay) scoreDisplay.textContent = `🎉 You Won! All ${coinsCollected} facts learned!`;
      if (touchBtn) touchBtn.style.display = "none";
    } else if (gameState === "gameover-loss") {
      const distance = Math.floor(scroll * meterCountDivisor);
      if (scoreDisplay) scoreDisplay.textContent = `❄️ Game Over - Ice melted at ${distance}m! Learn all facts before ${MAX_DISTANCE}m!`;
      if (touchBtn) touchBtn.style.display = "none";
    }
  };

  const startBtn = { x: 0, y: 0, w: 200, h: 60, hover: false };
  const demoBtn = { x: 0, y: 0, w: 200, h: 60, hover: false };
  const playAgainBtn = { x: 0, y: 0, w: 0, h: 0, hover: false };
  const tryAgainBtn = { x: 0, y: 0, w: 0, h: 0, hover: false };

  const goToStart = () => {
    scroll = 0; seal.y = baseGroundY - 24; seal.vy = 0; elapsed = 0; running = true; if (pauseBtn) pauseBtn.textContent = "⏸️"; coins = []; coinsCollected = 0; displayedFact = null; factDisplayTime = 0; factsShown.clear(); pendingWin = false; winParticles = []; setGameMode("full"); gameState = "start"; if (touchBtn) touchBtn.style.display = "none"; winParticles = []; try { if (startControls) startControls.style.display = "flex"; } catch (e) {} try { if (startBtnEl) startBtnEl.focus(); } catch (e) {} };
  let sealBobY = 0;
  let rollAngle = 0;

  const drawStartScreen = () => {
    ctx.fillStyle = COLORS.gameBgSky; ctx.fillRect(0, 0, W, H);
    clouds.forEach((cloud) => { cloud.x -= cloud.speed * 2; if (cloud.x < -100) { cloud.x = W + 100; cloud.y = 40 + Math.random() * 100; } drawCloud(ctx, cloud.x, cloud.y); });
    const waveY = H * 0.45;
    ctx.beginPath(); ctx.moveTo(0, waveY); for (let x = 0; x <= W; x += 40) { const y = waveY + Math.sin((x + elapsed * 120) * 0.01) * 12; ctx.lineTo(x, y); } ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath(); ctx.fillStyle = "#bde7f9"; ctx.fill();
    ctx.fillStyle = COLORS.titleDark; ctx.font = "bold 56px 'Fredoka One', 'Segoe UI', sans-serif"; ctx.textAlign = "center"; ctx.fillText("Save The Seal!", W / 2, H * 0.18);
    sealBobY = Math.sin(elapsed * 2) * 10;
    if (spritesLoad) { ctx.save(); ctx.translate(W / 2, H * 0.38 + sealBobY); ctx.shadowColor = "rgba(0,0,0,0.18)"; ctx.shadowBlur = 25; const drawH = 160; const drawW = drawH * sealRatio; ctx.drawImage(sealSprite, -drawW / 2, -drawH / 2, drawW, drawH); ctx.restore(); }
    const cardW = Math.min(W * 0.78, 680); const cardH = 170; const cardX = (W - cardW) / 2; const cardY = H * 0.5; ctx.save(); ctx.fillStyle = "white"; ctx.shadowColor = "rgba(0,0,0,0.08)"; ctx.shadowBlur = 20; roundRect(ctx, cardX, cardY, cardW, cardH, 18); ctx.fill(); ctx.restore(); ctx.fillStyle = COLORS.titleDark; ctx.font = "20px 'Segoe UI', sans-serif"; ctx.textAlign = "left"; ctx.fillText("🎮 Controls:", cardX + 24, cardY + 40); ctx.fillText("• Hold / Space → Roll & Jump", cardX + 24, cardY + 72); ctx.fillText("• Collect coins → Unlock climate facts!", cardX + 24, cardY + 100); ctx.fillText("• Beat the melting ice before it's too late!", cardX + 24, cardY + 128);
    const btnSpacing = 28; const btnW = 200; const btnH = 60; startBtn.x = W / 2 - btnW - btnSpacing / 2; startBtn.y = cardY + cardH + 32; startBtn.w = btnW; startBtn.h = btnH; demoBtn.x = W / 2 + btnSpacing / 2; demoBtn.y = startBtn.y; demoBtn.w = btnW; demoBtn.h = btnH; drawFancyButton(ctx, startBtn, "Start Game", "#0a82b4", startBtn.hover); drawFancyButton(ctx, demoBtn, "Demo (2 facts)", "#d97706", demoBtn.hover);
  };

  const drawWinScreen = () => {
    ctx.fillStyle = COLORS.gameBgSky; ctx.fillRect(0, 0, W, H);
    clouds.forEach((cloud) => { cloud.x -= cloud.speed * 1.5; if (cloud.x < -100) { cloud.x = W + 100; cloud.y = 40 + Math.random() * 120; } drawCloud(ctx, cloud.x, cloud.y); });
    if (Math.random() < 0.3) { snowflakes.push(spawnSnowflake()); }
    drawSnow(ctx, snowflakes, W, H);
    const waveY = H * 0.45; ctx.beginPath(); ctx.moveTo(0, waveY); for (let x = 0; x <= W; x += 40) { const y = waveY + Math.sin((x + elapsed * 120) * 0.01) * 12; ctx.lineTo(x, y); } ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath(); ctx.fillStyle = "#c6f4d6"; ctx.fill();
    ctx.fillStyle = COLORS.titleDark; ctx.font = "bold 56px 'Fredoka One', 'Segoe UI', sans-serif"; ctx.textAlign = "center"; ctx.fillText("You Saved The Seal! 🎉", W / 2, H * 0.18);
    sealBobY = Math.sin(elapsed * 3) * 12; if (spritesLoad) { ctx.save(); ctx.translate(W / 2, H * 0.38 + sealBobY); ctx.shadowColor = "rgba(0,0,0,0.18)"; ctx.shadowBlur = 25; const drawH = 160; const drawW = drawH * sealRatio; ctx.drawImage(sealSprite, -drawW / 2, -drawH / 2, drawW, drawH); ctx.restore(); }
    const cardW = Math.min(W * 0.75, 680); const cardH = 140; const cardX = (W - cardW) / 2; const cardY = H * 0.53; ctx.save(); ctx.fillStyle = "white"; ctx.shadowColor = "rgba(0,0,0,0.08)"; ctx.shadowBlur = 20; roundRect(ctx, cardX, cardY, cardW, cardH, 18); ctx.fill(); ctx.restore(); ctx.fillStyle = COLORS.titleDark; ctx.font = "22px 'Segoe UI'"; ctx.textAlign = "center"; ctx.fillText(`Coins Collected: ${coinsCollected}`, W / 2, cardY + 48); ctx.fillText("Great job protecting the climate!", W / 2, cardY + 95);
    const btnW = 240; const btnH = 60; playAgainBtn.x = W / 2 - btnW / 2; playAgainBtn.y = cardY + cardH + 40; playAgainBtn.w = btnW; playAgainBtn.h = btnH; drawFancyButton(ctx, playAgainBtn, "Play Again", "#0a82b4", playAgainBtn.hover);
  };

  const drawLossScreen = () => {
    crackProgress += 0.02; if (crackProgress > 1) crackProgress = 1; drawIceCracks(ctx, crackProgress, W, H);
    ctx.fillStyle = COLORS.gameBgSky; ctx.fillRect(0, 0, W, H);
    clouds.forEach((cloud) => { cloud.x -= cloud.speed; if (cloud.x < -100) { cloud.x = W + 100; cloud.y = 40 + Math.random() * 120; } drawCloud(ctx, cloud.x, cloud.y); });
    const waveY = H * 0.45; ctx.beginPath(); ctx.moveTo(0, waveY); for (let x = 0; x <= W; x += 40) { const y = waveY + Math.sin((x + elapsed * 120) * 0.01) * 14; ctx.lineTo(x, y); } ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath(); ctx.fillStyle = "#f7c6c6"; ctx.fill();
    ctx.fillStyle = "#b63a3a"; ctx.font = "bold 54px 'Fredoka One', 'Segoe UI', sans-serif"; ctx.textAlign = "center"; ctx.fillText("The Ice Melted! 💧", W / 2, H * 0.18);
    sealBobY = Math.sin(elapsed * 2) * 8 - 20; if (spritesLoad) { ctx.save(); ctx.translate(W / 2, H * 0.38 + sealBobY); ctx.rotate(-0.25); ctx.shadowColor = "rgba(0,0,0,0.18)"; ctx.shadowBlur = 25; const drawH = 160; const drawW = drawH * sealRatio; ctx.drawImage(sealSprite, -drawW / 2, -drawH / 2, drawW, drawH); ctx.restore(); }
    const cardW = Math.min(W * 0.75, 680); const cardH = 150; const cardX = (W - cardW) / 2; const cardY = H * 0.53; ctx.save(); ctx.fillStyle = "white"; ctx.shadowColor = "rgba(0,0,0,0.08)"; ctx.shadowBlur = 20; roundRect(ctx, cardX, cardY, cardW, cardH, 18); ctx.fill(); ctx.restore(); ctx.fillStyle = COLORS.titleDark; ctx.font = "22px 'Segoe UI'"; ctx.textAlign = "center"; ctx.fillText("The seal couldn't escape the melting ice.", W / 2, cardY + 48); ctx.fillText("Try again and collect more coins!", W / 2, cardY + 95);
    const btnW = 240; const btnH = 60; tryAgainBtn.x = W / 2 - btnW / 2; tryAgainBtn.y = cardY + cardH + 40; tryAgainBtn.w = btnW; tryAgainBtn.h = btnH; drawFancyButton(ctx, tryAgainBtn, "Try Again", "#b63a3a", tryAgainBtn.hover);
  };

  const draw = () => {
    if (gameState === "start") { drawStartScreen(); return; }
    if (gameState === "gameover") { drawWinScreen(); return; }
    if (gameState === "gameover-loss") { drawLossScreen(); return; }
    ctx.fillStyle = COLORS.gameBgLight; ctx.fillRect(0, 0, W, H);
    ctx.beginPath(); ctx.fillStyle = COLORS.sunColor; ctx.arc(W - 80, 80, 36, 0, Math.PI * 2); ctx.fill();
    if (Math.random() < 0.005) { birds.push({ x: W + 40, y: 60 + Math.random() * 100, speed: 2 + Math.random() * 1.5, flapOffset: Math.random() * Math.PI * 2 }); }
    birds.forEach((bird, index) => { bird.x -= bird.speed; drawBird(ctx, bird, elapsed); if (bird.x < -40) birds.splice(index, 1); });
    mountains.forEach((m) => { const mx = ((m.x - scroll * 0.25) % (W + 400)) - 200; ctx.beginPath(); ctx.fillStyle = "#d8eff5"; ctx.moveTo(mx, H); ctx.lineTo(mx + m.w / 2, H - m.h); ctx.lineTo(mx + m.w, H); ctx.closePath(); ctx.fill(); });
    ctx.beginPath(); ctx.fillStyle = COLORS.hillsDistant; ctx.moveTo(0, H); for (let sx = 0; sx <= W; sx += 12) { const worldX = sx + scroll * 0.3; const gy = groundYAt(worldX) + 80; ctx.lineTo(sx, gy); } ctx.lineTo(W, H); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.fillStyle = COLORS.hillsMid; ctx.moveTo(0, H); for (let sx = 0; sx <= W; sx += 10) { const worldX = sx + scroll * 0.5; const gy = groundYAt(worldX) + 40; ctx.lineTo(sx, gy); } ctx.lineTo(W, H); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.fillStyle = COLORS.hillsForeground; ctx.moveTo(0, H); for (let sx = 0; sx <= W; sx += 8) { const worldX = sx + scroll; const gy = groundYAt(worldX); ctx.lineTo(sx, gy); } ctx.lineTo(W, H); ctx.closePath(); ctx.fill();
    if (spritesLoad) { const s = seal; const img = s.onGround ? rollSprite : sealSprite; const drawH = s.r * 2 * 1.25; const ratio = s.onGround ? rollRatio : sealRatio; const drawW = drawH * ratio; ctx.save(); ctx.translate(s.x, s.y); if (s.onGround) { if (pressed) ctx.rotate(rollAngle); else ctx.rotate(Math.sin(elapsed * 6) * 0.03); } else { ctx.rotate(0); } ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH); ctx.restore(); }
    coins.forEach((coin) => { const screenX = coin.x - scroll; if (screenX > -20 && screenX < W + 20) { ctx.save(); ctx.translate(screenX, coin.y); ctx.fillStyle = "rgba(255, 215, 0, 0.3)"; ctx.beginPath(); ctx.arc(0, 0, coin.r * 1.5, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = "#FFD700"; ctx.beginPath(); ctx.arc(0, 0, coin.r, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = "rgba(255, 255, 255, 0.6)"; ctx.beginPath(); ctx.arc(-coin.r * 0.3, -coin.r * 0.3, coin.r * 0.4, 0, Math.PI * 2); ctx.fill(); ctx.restore(); } });
    if (displayedFact !== null) {
      ctx.save(); ctx.fillStyle = "rgba(0, 40, 70, 0.45)"; ctx.fillRect(0, 0, W, H); ctx.restore(); factAnim += 0.08; const popScale = Math.min(1, factAnim); const cardW = Math.min(W * 0.78, 520); const cardH = 200; const cardX = (W - cardW) / 2; const cardY = H * 0.5 - cardH / 2; ctx.save(); ctx.translate(W / 2, H / 2); ctx.scale(popScale, popScale); ctx.translate(-W / 2, -H / 2); ctx.save(); ctx.shadowColor = "rgba(0,0,0,0.14)"; ctx.shadowBlur = 24; ctx.fillStyle = "white"; roundRect(ctx, cardX, cardY, cardW, cardH, 20); ctx.fill(); ctx.restore(); const pillW = 150; const pillH = 36; const pillX = W / 2 - pillW / 2; const pillY = cardY - 22; ctx.save(); ctx.fillStyle = "#0a82b4"; roundRect(ctx, pillX, pillY, pillW, pillH, 18); ctx.fill(); ctx.font = "bold 16px 'Segoe UI'"; ctx.fillStyle = "white"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("🦭 FUN FACT", W / 2, pillY + pillH / 2); ctx.restore(); ctx.fillStyle = COLORS.titleDark; ctx.font = "20px 'Segoe UI', sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; const maxWidth = cardW - 40; const lines = wrapTextToLines(ctx, displayedFact, maxWidth, 2); ctx.fillText(lines[0], W / 2, cardY + cardH / 2 - 20); if (lines[1]) ctx.fillText(lines[1], W / 2, cardY + cardH / 2 + 15); ctx.font = "14px 'Segoe UI'"; ctx.fillStyle = "rgba(0,0,0,0.45)"; ctx.fillText("Click to continue…", W / 2, cardY + cardH - 18); ctx.restore(); }
    const distance = Math.floor(scroll * meterCountDivisor); const distancePercent = distance / MAX_DISTANCE; const meltProgress = Math.min(1, Math.max(0, distancePercent)); const iceMaxHeight = H * 0.22; if (distancePercent > 0.5) { const warningIntensity = Math.max(0, (distancePercent - 0.5) * 2); ctx.fillStyle = `rgba(${parseInt(COLORS.warningRed.slice(1, 3), 16)}, ${parseInt(COLORS.warningRed.slice(3, 5), 16)}, ${parseInt(COLORS.warningRed.slice(5, 7), 16)}, ${COLORS.warningOverlayAlpha * warningIntensity})`; ctx.fillRect(0, 0, W, H); if (distancePercent > 0.75) { ctx.save(); ctx.fillStyle = `rgba(${parseInt(COLORS.warningRed.slice(1, 3), 16)}, ${parseInt(COLORS.warningRed.slice(3, 5), 16)}, ${parseInt(COLORS.warningRed.slice(5, 7), 16)}, ${0.7 * (distancePercent - 0.75) * 4})`; ctx.font = "bold 36px 'Segoe UI', sans-serif"; ctx.textAlign = "center"; ctx.fillText("⚠️ ICE MELTING! ⚠️", W / 2, 80); ctx.restore(); } }
  };

  let rafId;
  const loop = (ts) => {
    if (!lastTs) lastTs = ts;
    const dt = Math.min(0.05, (ts - lastTs) / 1000);
    lastTs = ts;
    if (running) { update(dt); draw(); }
    rafId = requestAnimationFrame(loop);
  };
  lastTs = performance.now();
  rafId = requestAnimationFrame(loop);

  return () => {
    cancelAnimationFrame(rafId);
    window.removeEventListener("resize", resize);
    window.removeEventListener("keydown", handleKeyDown);
    window.removeEventListener("keyup", handleKeyUp);
    if (touchBtn) { touchBtn.removeEventListener("mousedown", mouseDown); touchBtn.removeEventListener("touchstart", touchStart); }
    window.removeEventListener("mouseup", mouseUp);
    window.removeEventListener("touchend", touchEnd);
    canvas.removeEventListener("click", onCanvasClick);
    canvas.removeEventListener("mousemove", onCanvasMouseMove);
    try {
      const headerEl = canvas.parentElement.querySelector(".gameHeader");
      const titleEl = headerEl ? headerEl.querySelector(".title") : null;
      if (titleEl && titleClickHandler) titleEl.removeEventListener("click", titleClickHandler);
    } catch (e) {}
    try { document.removeEventListener("click", handleGlobalClick); } catch (e) {}
    try { document.removeEventListener("fullscreenchange", onFullChange); } catch (e) {}
    try { document.removeEventListener("webkitfullscreenchange", onFullChange); } catch (e) {}
    try { if (pauseBtn) pauseBtn.removeEventListener("click", togglePause); } catch (e) {}
    try { if (restartBtn) restartBtn.removeEventListener("click", onRestartBtnClick); } catch (e) {}
    try { if (fsBtn) fsBtn.removeEventListener("click", onFsToggle); } catch (e) {}
    try { if (startBtnEl) startBtnEl.removeEventListener("click", onStartOverlayClick); } catch (e) {}
    try { if (demoBtnEl) demoBtnEl.removeEventListener("click", onDemoOverlayClick); } catch (e) {}
  };
}
