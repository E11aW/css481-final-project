// src/pages/game/game.js
import { useEffect, useRef } from "react";
import "./game.scss";
import sealSpriteSrc from "../../assets/Game/SealSprite.png";
import rollSpriteSrc from "../../assets/Game/RollSprite.png";
import { trends } from "../../back-end/dataSource";

// Game Theme Colors (must match game.scss)
const COLORS = {
  gameBgLight: "#cfeefc",
  gameBgSky: "#cbe2e8",
  gameBgGradientTop: "#6ba3c5",
  gameBgGradientBottom: "#a8d8ff",
  sunColor: "#fff6b8",
  hillsDistant: "#d0effb",
  hillsMid: "#b6e3f7",
  hillsForeground: "#89d3f1",
  iceLight: "#eaf6ff",
  iceEdge: "#d7f0ff",
  iceParticleAlpha: 0.6,
  titleDark: "#06414a",
  titleBlue: "#0a82b4",
  lossRed: "#c41e3a",
  lossRedDark: "#8b1428",
  lossRedHover: "#ff3a4a",
  lossRedHoverDark: "#d41c34",
  warningRed: "#c41e3a",
  warningOverlayAlpha: 0.15,
  cloudWhite: "#ffffff",
};

// Climate & seal fun facts
const CLIMATE_FACTS = [
  "🌍 Seals rely on sea ice for resting and raising pups. Climate warming reduces their habitat!",
  "❄️ Arctic sea ice is declining ~13% per decade. Seals need it to survive.",
  "🦭 A seal's blubber can be up to 1.5 inches thick, keeping them warm in cold water.",
  "🌊 Rising ocean temperatures are making seal hunting grounds disappear faster.",
  "🐟 Seals eat 5-7 pounds of fish per day. Overfishing threatens their food supply.",
  "🌡️ The Arctic is warming 2-3x faster than the rest of the planet!",
  "🦭 Seals can dive over 600 meters deep and hold their breath for 30 minutes!",
  "💨 Climate change is causing stronger storms, making it harder for seals to rest.",
  "🌊 Melting glaciers change ocean currents seals depend on for navigation.",
  "🦭 Baby seals depend on sea ice platforms to nurse for 4-6 weeks.",
  "📉 Some seal populations have declined by 80% due to climate change.",
  "☀️ Seals regulate body temperature through their thick fur and blubber layer.",
  "🌍 Ocean acidification from CO₂ is affecting fish populations seals eat.",
  "🧊 Seals haul out on ice to rest, breed, and escape predators.",
];

export const Game = () => {
  const canvasRef = useRef(null);
  const scoreRef = useRef(null);
  const pauseBtnRef = useRef(null);
  const restartBtnRef = useRef(null);
  const touchBtnRef = useRef(null);
  const startControlsRef = useRef(null);
  const startDomRef = useRef(null);
  const demoDomRef = useRef(null);
  const fsBtnRef = useRef(null);
  let snowflakes = [];
  let crackProgress = 0;
  let melt = 0; // 0 = full ice, 1 = fully melted
  const meltSpeed = 0.0008; // adjust for difficulty

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d", { alpha: false });
    const jumpStrength = -16;
    let gameState = "start"; // "start", "playing", "gameover"
    let gameMode = "full"; // "full" or "demo"
    let elapsed = 0;

    // ----- Sizing -----
    let W = 800,
      H = 450; //used to be 800, 450
    // Adding hold button within the canvas (declare early so resize can call it)
    let holdBtn = {
      x: 0,
      y: 0,
      w: 120,
      h: 60,
    };

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
      // update hold button drawing position on resize if helper exists
      if (typeof updateHoldBtnPosition === "function") updateHoldBtnPosition();
    };
    window.addEventListener("resize", resize);
    resize();

    // ----- Start Screen Visuals -----
    let clouds = [];
    for (let i = 0; i < 8; i++) {
      clouds.push({
        x: Math.random() * W + W,
        y: 60 + Math.random() * 80,
        speed: 0.3 + Math.random() * 0.4,
      });
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
        mountains.push({
          x: i * (W / count) + Math.random() * 80 - 40,
          y: H * 0.68 - h,
          w,
          h,
          speed: 0.12 + Math.random() * 0.2,
        });
      }
    };
    const initBirds = () => {
      birds = [];
      for (let i = 0; i < 8; i++) {
        birds.push({
          x: Math.random() * W,
          y: 50 + Math.random() * 110,
          speed: 0.8 + Math.random() * 1.4,
          size: 8 + Math.random() * 10,
        });
      }
    };
    initMountains();
    initBirds();

    // ----- World & Terrain -----
    let scroll = 0;
    const scrollSpeed = 2.0;
    const baseGroundY = H * 0.72;

    // Mode-dependent constants
    let MAX_DISTANCE = 200; // meters - if seal travels this far without winning, ice melts and seal dies
    let coinSpawnIntervalBase = 6.0; // spawn interval (seconds)
    const FULL_TARGET_FACTS = 10; // target facts for full mode
    const DEMO_TARGET_FACTS = 2; // target facts for demo mode (short demo)
    let targetFactsCount = FULL_TARGET_FACTS;

    const shuffle = (arr) => {
      const res = arr.slice();
      for (let i = res.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [res[i], res[j]] = [res[j], res[i]];
      }
      return res;
    };

    const pickFactsForMode = (mode) => {
      if (mode === "demo") {
        return DEMO_FACTS.slice();
      }
      // for full mode pick a shuffled subset of CLIMATE_FACTS, size = FULL_TARGET_FACTS
      const shuffled = shuffle(CLIMATE_FACTS);
      return shuffled.slice(0, FULL_TARGET_FACTS);
    };

    const setGameMode = (mode) => {
      gameMode = mode;
      if (mode === "demo") {
        MAX_DISTANCE = 20; // demo shorter endpoint
        coinSpawnIntervalBase = 2.5; // faster spawn for demo
        targetFactsCount = DEMO_TARGET_FACTS;
        factsPool = pickFactsForMode("demo");
      } else {
        MAX_DISTANCE = 150;
        coinSpawnIntervalBase = 6.0;
        targetFactsCount = FULL_TARGET_FACTS;
        factsPool = pickFactsForMode("full");
      }
      // reset fact tracker
      factsShown.clear();
      nextFactIndex = 0;
    };

    // restore to original speed for seal movement (base) and allow dynamic speed-up
    const baseScrollSpeed = 1.8;
    let actualScrollSpeed = baseScrollSpeed;
    const maxSpeedupFactor = 0.7; // max % to increase speed (e.g. 0.7 => +70% at end)
    const meterCountDivisor = 0.01; // slow down meter counting without affecting seal movement
    const groundYAt = (worldX) => {
      const a = Math.sin(worldX * 0.004) * 40;
      const b = Math.sin(worldX * 0.012 + 1.2) * 20;
      const c = Math.sin(worldX * 0.03 + 0.3) * 8;
      return baseGroundY + a + b + c;
    };

    // ----- Player -----
    const seal = {
      x: Math.round(W * 0.22),
      y: baseGroundY - 24,
      r: 18,
      vy: 0,
      onGround: false,
    };

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
        // compute natural aspect ratios so we don't stretch sprites
        try {
          sealRatio = sealSprite.naturalWidth / sealSprite.naturalHeight || 1;
        } catch (e) {
          sealRatio = 1;
        }
        try {
          rollRatio = rollSprite.naturalWidth / rollSprite.naturalHeight || 1;
        } catch (e) {
          rollRatio = 1;
        }
      }
    };
    sealSprite.onload = onSpriteLoad;
    rollSprite.onload = onSpriteLoad;

    sealSprite.src = sealSpriteSrc;
    rollSprite.src = rollSpriteSrc;

    // ----- Coin System -----
    let coins = [];
    let coinsCollected = 0;
    let lastCoinSpawn = 0;
    let coinSpawnInterval = 6.0; // will be updated by mode
    const coinRadius = 12;
    let factsShown = new Set(); // track which facts have been shown
    let lastSpawnWorldX = -Infinity;
    const minCoinGap = 120; // minimum gap between spawns in world coords

    // Demo mode facts (first 2 facts for shorter demo)
    const DEMO_FACTS = CLIMATE_FACTS.slice(0, 2);

    // factsPool represents the facts available for the current session/mode
    let factsPool = CLIMATE_FACTS.slice();
    // control whether facts are unique or random; default to 'unique' (no repeats)
    let FACT_MODE = "unique"; // 'unique' | 'random' (toggleable)
    let nextFactIndex = 0; // for ordered/unique picks

    // Attempt to build some dynamic facts from climate data if available (after factsPool declared)
    try {
      const t = trends();
      // prefer dynamic trends facts; build short messages
      const dynamicFacts = t
        .map((d) => {
          const last = d.last || {};
          const unitStr = d.unit ? ` ${d.unit}` : "";
          const delta =
            d.delta != null
              ? `${d.delta > 0 ? "+" : ""}${d.delta.toFixed(2)}`
              : "";
          const fact = `${d.dataset} ${last.year ? `(${last.year})` : ""}: ${
            last.value ?? ""
          }${unitStr}. Change: ${delta}${unitStr} since first record.`;
          return fact;
        })
        .filter(Boolean);
      if (dynamicFacts.length > 0) {
        // Use dynamic facts mixed with static ones for variety
        factsPool = dynamicFacts
          .concat(CLIMATE_FACTS.slice())
          .slice(0, FULL_TARGET_FACTS);
      }
    } catch (e) {
      // ignore, keep static facts
    }

    // Pending win flag — when true we show the final fact then transition to win screen
    let pendingWin = false;

    // Win-specific state
    let winStart = 0;
    let winParticles = [];

    // Confetti and melt particles used by win/melt visuals
    let confetti = [];
    let meltParticles = [];

    // Title click handler reference (declared here so cleanup can remove it)
    let titleClickHandler = null;

    const spawnCoin = () => {
      // spawn coins at the right edge of the screen (new terrain appearing)
      const screenRightWorldX = scroll + W; // right edge of visible screen in world space
      let worldX = screenRightWorldX + Math.random() * 60 - 30; // slight variation around right edge
      // enforce minimum gap from last spawn
      if (worldX - lastSpawnWorldX < minCoinGap) {
        worldX = lastSpawnWorldX + minCoinGap + Math.random() * 40;
      }
      lastSpawnWorldX = worldX;
      const groundY = groundYAt(worldX);
      const y = groundY - (Math.random() * 80 + 60); // 60-140 units above ground
      coins.push({
        x: worldX,
        y: y,
        r: coinRadius,
        collected: false,
      });
    };

    // ----- Fact Display -----
    let displayedFact = null;
    let factDisplayTime = 0;
    const factDisplayDuration = 3.5; // show fact for 3.5 seconds

    // gravity is handled inside update() now with frame-rate scaling

    // ----- Controls -----
    let pressed = false;
    let justReleased = false;

    const handleKeyDown = (e) => {
      if (e.code === "Space") {
        e.preventDefault();
        if (gameState === "start") {
          // use restart so the game starts cleanly, enter fullscreen, etc.
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
    const touchEnd = () => {
      pressed = false;
      justReleased = true;
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    const touchBtn = touchBtnRef.current;
    if (touchBtn) {
      touchBtn.addEventListener("mousedown", mouseDown);
      window.addEventListener("mouseup", mouseUp);
      touchBtn.addEventListener("touchstart", touchStart, { passive: false });
      window.addEventListener("touchend", touchEnd);
      // hide hold button until game starts
      touchBtn.style.display = "none";
    }

    // Facts are unique by default; removed facts toggle UI for simplicity

    // Start Button
    const onCanvasClick = (e) => {
      if (
        gameState !== "start" &&
        gameState !== "gameover" &&
        gameState !== "gameover-loss"
      )
        return;

      const rect = canvas.getBoundingClientRect();
      const mx =
        ((e.clientX - rect.left) * (canvas.width / rect.width)) /
        (window.devicePixelRatio || 1);
      const my =
        ((e.clientY - rect.top) * (canvas.height / rect.height)) /
        (window.devicePixelRatio || 1);

      // --- WIN Screen Button Click ---
      if (gameState === "gameover") {
        if (
          mx >= playAgainBtn.x &&
          mx <= playAgainBtn.x + playAgainBtn.w &&
          my >= playAgainBtn.y &&
          my <= playAgainBtn.y + playAgainBtn.h
        ) {
          restart(gameMode); // start same mode again
          return;
        }
      }

      // --- LOSS Screen Button Click ---
      if (gameState === "gameover-loss") {
        if (
          mx >= tryAgainBtn.x &&
          mx <= tryAgainBtn.x + tryAgainBtn.w &&
          my >= tryAgainBtn.y &&
          my <= tryAgainBtn.y + tryAgainBtn.h
        ) {
          restart(gameMode);
          return;
        }
      }

      // Check Start Game Button (full mode)
      if (
        mx >= startBtn.x &&
        mx <= startBtn.x + startBtn.w &&
        my >= startBtn.y &&
        my <= startBtn.y + startBtn.h
      ) {
        if (gameState === "gameover" || gameState === "gameover-loss") {
          // if returning from win/loss, restart in the same mode that was being played
          restart(gameMode);
        } else {
          restart("full");
        }
      }

      // Check Demo Mode Button
      if (
        gameState === "start" &&
        mx >= demoBtn.x &&
        mx <= demoBtn.x + demoBtn.w &&
        my >= demoBtn.y &&
        my <= demoBtn.y + demoBtn.h
      ) {
        restart("demo");
      }
      // If fact is shown, clicking inside the fact box dismisses it
      if (displayedFact !== null) {
        const boxWidth = Math.min(W * 0.8, 500);
        const boxHeight = 140;
        const boxX = (W - boxWidth) / 2;
        const boxY = H / 2 - boxHeight / 2;
        if (
          mx >= boxX &&
          mx <= boxX + boxWidth &&
          my >= boxY &&
          my <= boxY + boxHeight
        ) {
          // clicking the fact dismisses it; if pendingWin, transition to win screen
          if (pendingWin) {
            pendingWin = false;
            gameState = "gameover";
            winStart = elapsed;
          } else {
            displayedFact = null;
          }
          return;
        }
      }
      // No facts toggling; facts remain unique by default
    };
    canvas.addEventListener("click", onCanvasClick);

    //Hover effect for buttons
    const onCanvasMouseMove = (e) => {
      if (
        gameState !== "start" &&
        gameState !== "gameover" &&
        gameState !== "gameover-loss"
      )
        return;
      const rect = canvas.getBoundingClientRect();
      const mx =
        ((e.clientX - rect.left) * (canvas.width / rect.width)) /
        (window.devicePixelRatio || 1);
      const my =
        ((e.clientY - rect.top) * (canvas.height / rect.height)) /
        (window.devicePixelRatio || 1);
      startBtn.hover =
        mx >= startBtn.x &&
        mx <= startBtn.x + startBtn.w &&
        my >= startBtn.y &&
        my <= startBtn.y + startBtn.h;
      demoBtn.hover =
        gameState === "start" &&
        mx >= demoBtn.x &&
        mx <= demoBtn.x + demoBtn.w &&
        my >= demoBtn.y &&
        my <= demoBtn.y + demoBtn.h;

      // WIN hover
      if (gameState === "gameover") {
        playAgainBtn.hover =
          mx >= playAgainBtn.x &&
          mx <= playAgainBtn.x + playAgainBtn.w &&
          my >= playAgainBtn.y &&
          my <= playAgainBtn.y + playAgainBtn.h;

        canvas.style.cursor = playAgainBtn.hover ? "pointer" : "default";
      }

      // LOSS hover
      if (gameState === "gameover-loss") {
        tryAgainBtn.hover =
          mx >= tryAgainBtn.x &&
          mx <= tryAgainBtn.x + tryAgainBtn.w &&
          my >= tryAgainBtn.y &&
          my <= tryAgainBtn.y + tryAgainBtn.h;

        canvas.style.cursor = tryAgainBtn.hover ? "pointer" : "default";
      }

      canvas.style.cursor =
        startBtn.hover || demoBtn.hover ? "pointer" : "default";
    };
    canvas.addEventListener("mousemove", onCanvasMouseMove);

    // ----- Game state -----
    let lastTs = 0;
    let running = true;

    const scoreDisplay = scoreRef.current;
    const pauseBtn = pauseBtnRef.current;
    const restartBtn = restartBtnRef.current;

    const togglePause = () => {
      running = !running;
      pauseBtn.textContent = running ? "⏸️" : "▶️";
      if (running) {
        lastTs = performance.now();
      }
    };

    const enterFullscreen = async () => {
      try {
        const el = document.documentElement; // use whole document for best immersion
        if (el.requestFullscreen) await el.requestFullscreen();
        else if (el.webkitRequestFullscreen) await el.webkitRequestFullscreen();
        else if (el.msRequestFullscreen) await el.msRequestFullscreen();
      } catch (e) {
        // ignore if fullscreen API fails or denied
      }
    };
    const exitFullscreen = async () => {
      try {
        if (document.exitFullscreen) await document.exitFullscreen();
        else if (document.webkitExitFullscreen)
          await document.webkitExitFullscreen();
        else if (document.msExitFullscreen) await document.msExitFullscreen();
      } catch (e) {
        // ignore
      }
    };

    // global click handler: exit fullscreen when clicking header links or other page links
    const handleGlobalClick = (e) => {
      try {
        const target = e.target;
        // if not in fullscreen, nothing to do
        const isFull =
          document.fullscreenElement ||
          document.webkitFullscreenElement ||
          document.msFullscreenElement;
        if (!isFull) return;
        // ignore clicks inside the title element (Save the Seal)
        if (target.closest && target.closest(".title")) return;
        // ignore clicks inside control buttons (pause/restart/fullscreen toggle)
        if (
          target.closest &&
          (target.closest(".control-buttons") ||
            target.closest("#pauseBtn") ||
            target.closest("#restartBtn") ||
            target.closest("#fsBtn"))
        ) {
          return;
        }
        // if click happens on a header nav anchor or somewhere inside the header, exit fullscreen
        const headerNavClicked =
          target.closest &&
          (target.closest("a") || target.closest(".gameHeader"));
        if (headerNavClicked) {
          exitFullscreen();
        }
      } catch (e) {
        // ignore
      }
    };
    document.addEventListener("click", handleGlobalClick);

    const restart = (mode = "full") => {
      setGameMode(mode);
      coinSpawnInterval = coinSpawnIntervalBase;
      scroll = 0;
      seal.y = baseGroundY - 24;
      seal.vy = 0;
      elapsed = 0;
      lastTs = performance.now();
      running = true;
      pauseBtn.textContent = "⏸️";
      coins = [];
      coinsCollected = 0;
      displayedFact = null;
      factDisplayTime = 0;
      factsShown.clear();
      gameState = "playing";
      melt = 0;
      // attempt to enter fullscreen to make the experience immersive
      // only try if user is starting the game interactively
      enterFullscreen();
      // hide the DOM start control if present
      try {
        if (startControlsRef.current)
          startControlsRef.current.style.display = "none";
      } catch (e) {}
    };

    pauseBtn.addEventListener("click", togglePause);
    // restart button should remember the current game mode
    const onRestartBtnClick = () => restart(gameMode);
    // add fullscreen toggle button handler (if exists)
    crackProgress = 0;
    const fsBtn = fsBtnRef.current;
    const onFsToggle = () => {
      const isFull =
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.msFullscreenElement;
      if (isFull) exitFullscreen();
      else enterFullscreen();
    };
    if (fsBtn) fsBtn.addEventListener("click", onFsToggle);
    // update fs button icon on fullscreen changes
    const onFullChange = () => {
      const isFull =
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.msFullscreenElement;
      try {
        if (fsBtn) fsBtn.textContent = isFull ? "⤡" : "⤢";
      } catch (e) {}
    };
    document.addEventListener("fullscreenchange", onFullChange);
    document.addEventListener("webkitfullscreenchange", onFullChange);
    try {
      onFullChange();
    } catch (e) {}
    restartBtn.addEventListener("click", onRestartBtnClick);
    // Attach overlay button handlers (if overlay exists)
    const startBtnEl = startDomRef.current;
    const demoBtnEl = demoDomRef.current;
    const onStartOverlayClick = () => restart("full");
    const onDemoOverlayClick = () => restart("demo");
    if (startBtnEl) startBtnEl.addEventListener("click", onStartOverlayClick);
    if (demoBtnEl) demoBtnEl.addEventListener("click", onDemoOverlayClick);

    // ----- Update / Physics -----
    const update = (dt) => {
      // scale so physics stays consistent across frame rates
      const fpsScale = Math.min(60 * dt, 3);

      // pause game while fact is displayed (and transition to win if pending)
      if (displayedFact !== null) {
        // only update fact display timer, don't update game physics
        factDisplayTime += dt;
        if (factDisplayTime >= factDisplayDuration) {
          // if the final fact was shown, move to win screen; otherwise just clear the fact
          if (pendingWin) {
            pendingWin = false;
            gameState = "gameover";
            // initialize confetti and win particles for win screen
            confetti = [];
            winParticles = [];
            for (let i = 0; i < 120; i++) {
              confetti.push({
                x: Math.random() * W,
                y: Math.random() * -H,
                w: 6 + Math.random() * 6,
                h: 8 + Math.random() * 8,
                vy: 1 + Math.random() * 2,
                color: ["#ff2d55", "#ff9500", "#34c759", "#5856d6", "#ffcc00"][
                  Math.floor(Math.random() * 5)
                ],
              });
            }
            for (let i = 0; i < 40; i++) {
              winParticles.push({
                x: W / 2 + (Math.random() - 0.5) * 60,
                y: H / 2 + (Math.random() - 0.5) * 30,
                r: 3 + Math.random() * 5,
                vy: -0.8 - Math.random() * 1.6,
                vx: -1 + Math.random() * 2,
                a: 1,
                color: ["#fff6b8", "#ffd6a5", "#bde0fe"][
                  Math.floor(Math.random() * 3)
                ],
              });
            }
            // track when win started for animating seal
            winStart = elapsed;
          } else {
            displayedFact = null;
          }
        }
        // update roll angle when pressing and on ground
        if (pressed && seal.onGround) {
          rollAngle += actualScrollSpeed * 0.08 * fpsScale * 60; // scale for a nice roll
        } else {
          // slowly damp roll angle so seal doesn't snap back
          rollAngle *= 0.98;
        }
        elapsed += dt;
        return; // skip all other updates
      }

      if (gameState === "playing") {
        // world scroll (visual movement) keeps original speed, but increases with progress
        const distancePercentNow = Math.min(
          1,
          Math.max(0, Math.floor(scroll * meterCountDivisor) / MAX_DISTANCE)
        );
        // speed scales linearly up to maxSpeedupFactor
        actualScrollSpeed =
          baseScrollSpeed * (1 + maxSpeedupFactor * distancePercentNow);
        scroll += actualScrollSpeed * fpsScale;

        // check if seal has traveled too far (ice has melted)
        const currentDistance = Math.floor(scroll * meterCountDivisor);
        if (currentDistance >= MAX_DISTANCE) {
          gameState = "gameover-loss"; // trigger loss state
        }

        // smoother physics parameters
        const G = 0.9; // gravity per 60fps
        const MAX_FALL = 18;
        const AIR_DRAG = 0.995;

        // apply gravity and integrate velocity/position with scaling
        seal.vy += G * fpsScale;
        // clamp fall speed
        if (seal.vy > MAX_FALL) seal.vy = MAX_FALL;
        // apply air drag when in the air
        if (!seal.onGround) seal.vy *= Math.pow(AIR_DRAG, fpsScale);
        seal.y += seal.vy * fpsScale;

        const worldX = seal.x + scroll;
        const groundY = groundYAt(worldX);
        const nextGroundY = groundYAt(worldX + 2);
        const slope = nextGroundY - groundY;
        const slopeAngle = Math.atan2(slope, 2);

        // ground collision & jumping
        if (seal.y + seal.r >= groundY) {
          // landed or standing on ground
          if (pressed) {
            // pressing keeps the seal grounded (rolling)
            seal.onGround = true;
            seal.y = groundY - seal.r;
            seal.vy = 0;
            // slight speed tweak to follow slope
            scroll += Math.cos(slopeAngle) * scrollSpeed - scrollSpeed;
          } else if (seal.onGround) {
            // initiate a smooth jump when leaving ground
            seal.onGround = false;
            // use jumpStrength with a mild slope modifier; increase jump a bit as speed grows
            const distancePercentNow = Math.min(
              1,
              Math.max(0, Math.floor(scroll * meterCountDivisor) / MAX_DISTANCE)
            );
            const jumpBoost = 1 + 0.12 * distancePercentNow; // small boost at the end
            seal.vy =
              jumpStrength * jumpBoost + Math.min(4, -Math.sin(slopeAngle) * 6);
          } else {
            // landed from air
            seal.y = groundY - seal.r;
            if (seal.vy > 0) seal.vy *= -0.18; // small bounce dampened
          }
        } else {
          // in the air
          seal.onGround = false;
        }

        // keep the seal from going off the top
        if (seal.y < 8) {
          seal.y = 8;
          seal.vy = Math.max(seal.vy, 0);
        }

        if (justReleased) justReleased = false;

        // ----- Coin Spawning -----
        lastCoinSpawn += dt;
        // Only spawn coins if we still need more facts
        if (
          factsShown.size + coins.length < targetFactsCount &&
          lastCoinSpawn >= coinSpawnInterval
        ) {
          spawnCoin();
          lastCoinSpawn = 0;
        }

        if (gameState === "playing") {
          melt += meltSpeed;
          if (melt > 1) melt = 1;
        }

        // ----- Coin Collision Detection -----
        coins.forEach((coin, idx) => {
          // remove coins that scroll off screen to the left
          if (coin.x < scroll - 100) {
            coins.splice(idx, 1);
            return;
          }
          // check collision with seal (convert seal position to world space)
          const sealWorldX = seal.x + scroll;
          const dx = sealWorldX - coin.x;
          const dy = seal.y - coin.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < seal.r + coin.r) {
            // collision!
            coins.splice(idx, 1);
            // get the correct facts array based on game mode
            const factsSource = gameMode === "demo" ? DEMO_FACTS : factsPool;
            let chosenFact = null;
            if (FACT_MODE === "unique") {
              // find next unused fact in order
              let attempts = 0;
              while (attempts < factsSource.length) {
                const candidate =
                  factsSource[nextFactIndex % factsSource.length];
                nextFactIndex = (nextFactIndex + 1) % factsSource.length;
                attempts++;
                if (!factsShown.has(candidate)) {
                  chosenFact = candidate;
                  break;
                }
              }
              // Fallback to random if all were used
              if (!chosenFact)
                chosenFact =
                  factsSource[Math.floor(Math.random() * factsSource.length)];
            } else {
              // random fact selection (may repeat)
              chosenFact =
                factsSource[Math.floor(Math.random() * factsSource.length)];
            }

            // count only if not already shown (unique) or always (random)
            if (!factsShown.has(chosenFact)) {
              factsShown.add(chosenFact);
              coinsCollected++;
            }

            // if we've collected enough target facts, schedule pendingWin
            if (factsShown.size >= targetFactsCount) {
              pendingWin = true;
            }

            // display the fact
            displayedFact = chosenFact;
            factDisplayTime = 0;
          }
        });

        elapsed += dt;
      } else if (gameState === "start") {
        elapsed += dt * 0.5;
      }

      // Update score
      if (scoreDisplay && gameState === "playing") {
        const distance = Math.floor(scroll * meterCountDivisor);
        scoreDisplay.textContent = `${distance}m / ${MAX_DISTANCE}m | 📚 ${coinsCollected}/${targetFactsCount}`;
        // show hold button during gameplay
        if (touchBtn) touchBtn.style.display = "flex";
      } else if (gameState === "start") {
        scoreDisplay.textContent = `Press Space or Hold to Start`;
        // hide hold button on start screen
        if (touchBtn) touchBtn.style.display = "none";
      } else if (gameState === "gameover") {
        scoreDisplay.textContent = `🎉 You Won! All ${coinsCollected} facts learned!`;
        // hide hold button on win screen
        if (touchBtn) touchBtn.style.display = "none";
      } else if (gameState === "gameover-loss") {
        const distance = Math.floor(scroll * meterCountDivisor);
        scoreDisplay.textContent = `❄️ Game Over - Ice melted at ${distance}m! Learn all facts before ${MAX_DISTANCE}m!`;
        // hide hold button on loss screen
        if (touchBtn) touchBtn.style.display = "none";
      }
    };

    const startBtn = { x: 0, y: 0, w: 200, h: 60, hover: false };
    const demoBtn = { x: 0, y: 0, w: 200, h: 60, hover: false };
    const playAgainBtn = { x: 0, y: 0, w: 0, h: 0, hover: false };
    const tryAgainBtn = { x: 0, y: 0, w: 0, h: 0, hover: false };

    // go to start screen without immediately starting the game
    const goToStart = () => {
      // reset gameplay state but remain on start screen
      scroll = 0;
      seal.y = baseGroundY - 24;
      seal.vy = 0;
      elapsed = 0;
      running = true;
      pauseBtn.textContent = "⏸️";
      coins = [];
      coinsCollected = 0;
      displayedFact = null;
      factDisplayTime = 0;
      factsShown.clear();
      pendingWin = false;
      winParticles = [];
      setGameMode("full");
      coinSpawnInterval = coinSpawnIntervalBase;
      gameState = "start";
      if (touchBtn) touchBtn.style.display = "none";
      winParticles = [];
      try {
        if (startControlsRef.current)
          startControlsRef.current.style.display = "flex";
      } catch (e) {}
      try {
        if (startDomRef.current) startDomRef.current.focus();
      } catch (e) {}
    };
    let sealBobY = 0;
    let rollAngle = 0; // rotation for the rolling/pressed pose

    // ----- Draw Start Screen -----
    const drawStartScreen = () => {
      // Sky background
      ctx.fillStyle = COLORS.gameBgSky;
      ctx.fillRect(0, 0, W, H);

      // Moving clouds
      clouds.forEach((cloud) => {
        cloud.x -= cloud.speed * 2;
        if (cloud.x < -100) {
          cloud.x = W + 100;
          cloud.y = 40 + Math.random() * 100;
        }
        drawCloud(cloud.x, cloud.y);
      });

      // --- Playful Wavy Backdrop Behind Seal ---
      const waveY = H * 0.45;
      ctx.beginPath();
      ctx.moveTo(0, waveY);
      for (let x = 0; x <= W; x += 40) {
        const y = waveY + Math.sin((x + elapsed * 120) * 0.01) * 12;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(W, H);
      ctx.lineTo(0, H);
      ctx.closePath();
      ctx.fillStyle = "#bde7f9";
      ctx.fill();

      // --- Title ---
      ctx.fillStyle = COLORS.titleDark;
      ctx.font = "bold 56px 'Fredoka One', 'Segoe UI', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Save The Seal!", W / 2, H * 0.18);

      // --- Seal Sprite (bigger + bounce + cute outline) ---
      sealBobY = Math.sin(elapsed * 2) * 10;
      if (spritesLoad) {
        ctx.save();
        ctx.translate(W / 2, H * 0.38 + sealBobY);
        ctx.shadowColor = "rgba(0,0,0,0.18)";
        ctx.shadowBlur = 25;

        const drawH = 160; // big and cute
        const drawW = drawH * sealRatio;
        ctx.drawImage(sealSprite, -drawW / 2, -drawH / 2, drawW, drawH);

        ctx.restore();
      }

      // --- Instruction Panel (clean, card-style) ---
      const cardW = Math.min(W * 0.78, 680);
      const cardH = 170;
      const cardX = (W - cardW) / 2;
      const cardY = H * 0.5;

      ctx.save();
      ctx.fillStyle = "white";
      ctx.shadowColor = "rgba(0,0,0,0.08)";
      ctx.shadowBlur = 20;
      roundRect(ctx, cardX, cardY, cardW, cardH, 18);
      ctx.fill();
      ctx.restore();

      // Instructions
      ctx.fillStyle = COLORS.titleDark;
      ctx.font = "20px 'Segoe UI', sans-serif";
      ctx.textAlign = "left";
      ctx.fillText("🎮 Controls:", cardX + 24, cardY + 40);
      ctx.fillText("• Hold / Space → Roll & Jump", cardX + 24, cardY + 72);
      ctx.fillText(
        "• Collect coins → Unlock climate facts!",
        cardX + 24,
        cardY + 100
      );
      ctx.fillText(
        "• Beat the melting ice before it's too late!",
        cardX + 24,
        cardY + 128
      );

      // --- Buttons ---
      const btnSpacing = 28;
      const btnW = 200;
      const btnH = 60;

      startBtn.x = W / 2 - btnW - btnSpacing / 2;
      startBtn.y = cardY + cardH + 32;
      startBtn.w = btnW;
      startBtn.h = btnH;

      demoBtn.x = W / 2 + btnSpacing / 2;
      demoBtn.y = startBtn.y;
      demoBtn.w = btnW;
      demoBtn.h = btnH;

      drawFancyButton(startBtn, "Start Game", "#0a82b4", startBtn.hover);
      drawFancyButton(demoBtn, "Demo (2 facts)", "#d97706", demoBtn.hover);
    };

    // Cute rounded rect helper
    function roundRect(ctx, x, y, w, h, r) {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
    }

    // Clean, modern button renderer
    function drawFancyButton(btn, text, color, hover) {
      const scale = hover ? 1.05 : 1;

      ctx.save();
      ctx.translate(btn.x + btn.w / 2, btn.y + btn.h / 2);
      ctx.scale(scale, scale);

      ctx.fillStyle = color;
      ctx.shadowColor = "rgba(0,0,0,0.12)";
      ctx.shadowBlur = hover ? 20 : 10;
      ctx.beginPath();
      ctx.roundRect(-btn.w / 2, -btn.h / 2, btn.w, btn.h, 14);
      ctx.fill();

      ctx.fillStyle = "white";
      ctx.font = "22px 'Segoe UI', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(text, 0, 6);

      ctx.restore();
    }

    // Cloud helper
    function drawCloud(x, y) {
      ctx.fillStyle = COLORS.cloudWhite;
      ctx.beginPath();
      ctx.ellipse(x, y, 30, 20, 0, 0, Math.PI * 2);
      ctx.ellipse(x + 30, y - 10, 30, 20, 0, 0, Math.PI * 2);
      ctx.ellipse(x + 60, y, 30, 20, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // ----- Draw Win Screen -----
    const drawWinScreen = () => {
      // Sky background
      ctx.fillStyle = COLORS.gameBgSky;
      ctx.fillRect(0, 0, W, H);

      clouds.forEach((cloud) => {
        cloud.x -= cloud.speed * 1.5;
        if (cloud.x < -100) {
          cloud.x = W + 100;
          cloud.y = 40 + Math.random() * 120;
        }
        drawCloud(cloud.x, cloud.y);
      });

      // Create snowflakes over time
      if (Math.random() < 0.3) {
        spawnSnowflake();
      }

      // Draw snow
      drawSnow();

      // Wave background
      const waveY = H * 0.45;
      ctx.beginPath();
      ctx.moveTo(0, waveY);
      for (let x = 0; x <= W; x += 40) {
        const y = waveY + Math.sin((x + elapsed * 120) * 0.01) * 12;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(W, H);
      ctx.lineTo(0, H);
      ctx.closePath();
      ctx.fillStyle = "#c6f4d6"; // greenish mint for success
      ctx.fill();

      // Title
      ctx.fillStyle = COLORS.titleDark;
      ctx.font = "bold 56px 'Fredoka One', 'Segoe UI', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("You Saved The Seal! 🎉", W / 2, H * 0.18);

      // Seal bounce on ice
      sealBobY = Math.sin(elapsed * 3) * 12;
      if (spritesLoad) {
        ctx.save();
        ctx.translate(W / 2, H * 0.38 + sealBobY);
        ctx.shadowColor = "rgba(0,0,0,0.18)";
        ctx.shadowBlur = 25;

        const drawH = 160;
        const drawW = drawH * sealRatio;
        ctx.drawImage(sealSprite, -drawW / 2, -drawH / 2, drawW, drawH);

        ctx.restore();
      }

      // Stats Card
      const cardW = Math.min(W * 0.75, 680);
      const cardH = 140;
      const cardX = (W - cardW) / 2;
      const cardY = H * 0.53;

      ctx.save();
      ctx.fillStyle = "white";
      ctx.shadowColor = "rgba(0,0,0,0.08)";
      ctx.shadowBlur = 20;
      roundRect(ctx, cardX, cardY, cardW, cardH, 18);
      ctx.fill();
      ctx.restore();

      ctx.fillStyle = COLORS.titleDark;
      ctx.font = "22px 'Segoe UI'";
      ctx.textAlign = "center";
      ctx.fillText(`Coins Collected: ${coinsCollected}`, W / 2, cardY + 48);
      ctx.fillText("Great job protecting the climate!", W / 2, cardY + 95);

      // Buttons
      const btnW = 240;
      const btnH = 60;

      // Play Again
      playAgainBtn.x = W / 2 - btnW / 2;
      playAgainBtn.y = cardY + cardH + 40;
      playAgainBtn.w = btnW;
      playAgainBtn.h = btnH;

      drawFancyButton(
        playAgainBtn,
        "Play Again",
        "#0a82b4",
        playAgainBtn.hover
      );
    };

    // ----- Snowflake Effects -----
    function spawnSnowflake() {
      snowflakes.push({
        x: Math.random() * W,
        y: -20,
        size: 3 + Math.random() * 4,
        speed: 1 + Math.random() * 1.5,
        drift: (Math.random() - 0.5) * 1.2,
      });
    }

    function drawSnow() {
      ctx.fillStyle = "white";
      snowflakes.forEach((s, i) => {
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fill();

        s.y += s.speed;
        s.x += s.drift;

        if (s.y > H + 20) snowflakes.splice(i, 1);
      });
    }

    // ----- Draw Loss Screen -----
    const drawLossScreen = () => {
      crackProgress += 0.02;
      if (crackProgress > 1) crackProgress = 1;
      drawIceCracks(crackProgress);

      // Sky
      ctx.fillStyle = COLORS.gameBgSky;
      ctx.fillRect(0, 0, W, H);

      clouds.forEach((cloud) => {
        cloud.x -= cloud.speed;
        if (cloud.x < -100) {
          cloud.x = W + 100;
          cloud.y = 40 + Math.random() * 120;
        }
        drawCloud(cloud.x, cloud.y);
      });

      // Melting red wave
      const waveY = H * 0.45;
      ctx.beginPath();
      ctx.moveTo(0, waveY);
      for (let x = 0; x <= W; x += 40) {
        const y = waveY + Math.sin((x + elapsed * 120) * 0.01) * 14;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(W, H);
      ctx.lineTo(0, H);
      ctx.closePath();
      ctx.fillStyle = "#f7c6c6"; // soft red/pink for failure
      ctx.fill();

      // Title
      ctx.fillStyle = "#b63a3a";
      ctx.font = "bold 54px 'Fredoka One', 'Segoe UI', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("The Ice Melted! 💧", W / 2, H * 0.18);

      // Sad Seal (tilt + drop)
      sealBobY = Math.sin(elapsed * 2) * 8 - 20;
      if (spritesLoad) {
        ctx.save();
        ctx.translate(W / 2, H * 0.38 + sealBobY);
        ctx.rotate(-0.25);
        ctx.shadowColor = "rgba(0,0,0,0.18)";
        ctx.shadowBlur = 25;

        const drawH = 160;
        const drawW = drawH * sealRatio;
        ctx.drawImage(sealSprite, -drawW / 2, -drawH / 2, drawW, drawH);

        ctx.restore();
      }

      // Info Card
      const cardW = Math.min(W * 0.75, 680);
      const cardH = 150;
      const cardX = (W - cardW) / 2;
      const cardY = H * 0.53;

      ctx.save();
      ctx.fillStyle = "white";
      ctx.shadowColor = "rgba(0,0,0,0.08)";
      ctx.shadowBlur = 20;
      roundRect(ctx, cardX, cardY, cardW, cardH, 18);
      ctx.fill();
      ctx.restore();

      ctx.fillStyle = COLORS.titleDark;
      ctx.font = "22px 'Segoe UI'";
      ctx.textAlign = "center";
      ctx.fillText(
        "The seal couldn't escape the melting ice.",
        W / 2,
        cardY + 48
      );
      ctx.fillText("Try again and collect more coins!", W / 2, cardY + 95);

      // Button
      const btnW = 240;
      const btnH = 60;

      tryAgainBtn.x = W / 2 - btnW / 2;
      tryAgainBtn.y = cardY + cardH + 40;
      tryAgainBtn.w = btnW;
      tryAgainBtn.h = btnH;

      drawFancyButton(tryAgainBtn, "Try Again", "#b63a3a", tryAgainBtn.hover);
    };

    // Ice crack effect
    function drawIceCracks(t) {
      ctx.save();
      ctx.strokeStyle = `rgba(0, 0, 50, ${0.6 * t})`;
      ctx.lineWidth = 2 + t * 3;

      const cx = W / 2;
      const cy = H * 0.45;

      const cracks = [
        { angle: -0.5, len: 150 },
        { angle: 0.2, len: 180 },
        { angle: 1.0, len: 130 },
        { angle: 2.2, len: 160 },
      ];

      cracks.forEach((c) => {
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        const endX = cx + Math.cos(c.angle) * c.len * t;
        const endY = cy + Math.sin(c.angle) * c.len * t;
        ctx.lineTo(endX, endY);
        ctx.stroke();
      });

      ctx.restore();
    }

    // ----- Draw -----
    const draw = () => {
      if (gameState === "start") {
        drawStartScreen();
        return;
      }

      if (gameState === "gameover") {
        drawWinScreen();
        return;
      }

      if (gameState === "gameover-loss") {
        drawLossScreen();
        return;
      }

      // Clear background
      ctx.fillStyle = COLORS.gameBgLight;
      ctx.fillRect(0, 0, W, H);

      // Draw sun
      ctx.beginPath();
      ctx.fillStyle = COLORS.sunColor;
      ctx.arc(W - 80, 80, 36, 0, Math.PI * 2);
      ctx.fill();

      // Draw birds (subtle, animated)
      function drawBird(bird) {
        const fl = Math.sin(bird.flapOffset + elapsed * 10) * 4; // wing up-down

        ctx.save();
        ctx.translate(bird.x, bird.y);

        ctx.strokeStyle = "#333";
        ctx.lineWidth = 2;

        ctx.beginPath();
        ctx.moveTo(-10, 0);
        ctx.quadraticCurveTo(-20, -10 + fl, 0, -2);
        ctx.quadraticCurveTo(20, -10 - fl, 10, 0);
        ctx.stroke();

        ctx.restore();
      }

      // Spawn new birds occasionally
      if (Math.random() < 0.005) {
        birds.push({
          x: W + 40,
          y: 60 + Math.random() * 100,
          speed: 2 + Math.random() * 1.5,
          flapOffset: Math.random() * Math.PI * 2,
        });
      }

      // Update & draw birds
      birds.forEach((bird, index) => {
        bird.x -= bird.speed;

        drawBird(bird); // <-- CALL THE DRAW FUNCTION YOU DEFINED

        // Remove birds that exit screen
        if (bird.x < -40) {
          birds.splice(index, 1);
        }
      });

      // Mountains (back-most layer)
      mountains.forEach((m) => {
        const mx = ((m.x - scroll * 0.25) % (W + 400)) - 200;
        ctx.beginPath();
        ctx.fillStyle = "#d8eff5";
        ctx.moveTo(mx, H);
        ctx.lineTo(mx + m.w / 2, H - m.h);
        ctx.lineTo(mx + m.w, H);
        ctx.closePath();
        ctx.fill();
      });

      // Distant hills (back layer)
      ctx.beginPath();
      ctx.fillStyle = COLORS.hillsDistant;
      ctx.moveTo(0, H);
      for (let sx = 0; sx <= W; sx += 12) {
        const worldX = sx + scroll * 0.3;
        const gy = groundYAt(worldX) + 80;
        ctx.lineTo(sx, gy);
      }
      ctx.lineTo(W, H);
      ctx.closePath();
      ctx.fill();

      // Midground hills
      ctx.beginPath();
      ctx.fillStyle = COLORS.hillsMid;
      ctx.moveTo(0, H);
      for (let sx = 0; sx <= W; sx += 10) {
        const worldX = sx + scroll * 0.5;
        const gy = groundYAt(worldX) + 40;
        ctx.lineTo(sx, gy);
      }
      ctx.lineTo(W, H);
      ctx.closePath();
      ctx.fill();

      // Foreground ground
      ctx.beginPath();
      ctx.fillStyle = COLORS.hillsForeground;
      ctx.moveTo(0, H);
      for (let sx = 0; sx <= W; sx += 8) {
        const worldX = sx + scroll;
        const gy = groundYAt(worldX);
        ctx.lineTo(sx, gy);
      }
      ctx.lineTo(W, H);
      ctx.closePath();
      ctx.fill();

      // Draw Seal
      if (spritesLoad) {
        const s = seal;
        const img = pressed ? rollSprite : sealSprite;
        // keep the sprite at a consistent height and preserve its natural aspect ratio
        const drawH = s.r * 2 * 1.25;
        const ratio = pressed ? rollRatio : sealRatio;
        const drawW = drawH * ratio;
        ctx.save();
        ctx.translate(s.x, s.y);
        // rotate when pressed (rolling), otherwise slight bob rotation to look lively
        if (pressed && s.onGround) ctx.rotate(rollAngle);
        else ctx.rotate(Math.sin(elapsed * 6) * 0.03);
        ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
        ctx.restore();
      }

      // Draw Coins
      coins.forEach((coin) => {
        const screenX = coin.x - scroll;
        // only draw if on screen
        if (screenX > -20 && screenX < W + 20) {
          ctx.save();
          ctx.translate(screenX, coin.y);
          // glowing coin
          ctx.fillStyle = "rgba(255, 215, 0, 0.3)";
          ctx.beginPath();
          ctx.arc(0, 0, coin.r * 1.5, 0, Math.PI * 2);
          ctx.fill();
          // main coin
          ctx.fillStyle = "#FFD700";
          ctx.beginPath();
          ctx.arc(0, 0, coin.r, 0, Math.PI * 2);
          ctx.fill();
          // coin shine
          ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
          ctx.beginPath();
          ctx.arc(-coin.r * 0.3, -coin.r * 0.3, coin.r * 0.4, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      });

      // Draw Fact Display
      if (displayedFact !== null) {
        const alpha = Math.min(
          1,
          (factDisplayDuration - factDisplayTime) * 0.5
        ); // fade out at end
        ctx.save();
        // semi-transparent background
        ctx.fillStyle = `rgba(20, 100, 150, ${0.85 * alpha})`;
        ctx.fillRect(0, 0, W, H);
        // fact box
        const boxWidth = Math.min(W * 0.8, 500);
        const boxHeight = 140;
        const boxX = (W - boxWidth) / 2;
        const boxY = H / 2 - boxHeight / 2;
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        // add a subtle background with seal icon
        ctx.beginPath();
        roundRect(ctx, boxX, boxY, boxWidth, boxHeight, 12);
        ctx.fill();
        // border
        ctx.strokeStyle = `rgba(15, 154, 214, ${alpha})`;
        ctx.lineWidth = 3;
        ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);
        // text
        ctx.fillStyle = `rgba(${parseInt(
          COLORS.titleDark.slice(1, 3),
          16
        )}, ${parseInt(COLORS.titleDark.slice(3, 5), 16)}, ${parseInt(
          COLORS.titleDark.slice(5, 7),
          16
        )}, ${alpha})`;
        ctx.font = "bold 18px 'Segoe UI', sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        // wrap text to 2 lines max
        const words = displayedFact.split(" ");
        let line1 = "",
          line2 = "";
        words.forEach((word, idx) => {
          if (idx < Math.ceil(words.length / 2)) {
            line1 += word + " ";
          } else {
            line2 += word + " ";
          }
        });
        ctx.fillStyle = `rgba(${parseInt(
          COLORS.titleBlue.slice(1, 3),
          16
        )}, ${parseInt(COLORS.titleBlue.slice(3, 5), 16)}, ${parseInt(
          COLORS.titleBlue.slice(5, 7),
          16
        )}, ${alpha})`;
        ctx.font = "bold 14px 'Segoe UI', sans-serif";
        ctx.fillText("🦭 Fun Fact", boxX + 18, boxY + 28);
        ctx.fillStyle = `rgba(${parseInt(
          COLORS.titleDark.slice(1, 3),
          16
        )}, ${parseInt(COLORS.titleDark.slice(3, 5), 16)}, ${parseInt(
          COLORS.titleDark.slice(5, 7),
          16
        )}, ${alpha})`;
        ctx.font = "bold 18px 'Segoe UI', sans-serif";
        ctx.fillText(line1.trim(), W / 2, boxY + boxHeight / 2 - 20);
        ctx.fillText(line2.trim(), W / 2, boxY + boxHeight / 2 + 20);
        // helper: small rounded rectangle function
        function roundRect(ctx, x, y, width, height, radius) {
          ctx.beginPath();
          ctx.moveTo(x + radius, y);
          ctx.arcTo(x + width, y, x + width, y + height, radius);
          ctx.arcTo(x + width, y + height, x, y + height, radius);
          ctx.arcTo(x, y + height, x, y, radius);
          ctx.arcTo(x, y, x + width, y, radius);
          ctx.closePath();
        }
        ctx.restore();
      }

      // Distance warning indicator (red overlay that intensifies as seal approaches 200m)
      const distance = Math.floor(scroll * meterCountDivisor);
      const distancePercent = distance / MAX_DISTANCE;
      // More realistic melting: ice sheet anchored at BOTTOM and shrinks UPWARD as we near the endpoint
      // at start (distance 0): meltProgress = 0, iceHeight = max → full ice platform at bottom
      // at end (MAX_DISTANCE): meltProgress = 1, iceHeight = 0 → no ice
      const meltProgress = Math.min(1, Math.max(0, distancePercent));
      const iceMaxHeight = H * 0.22;
      const iceHeight = Math.max(0, iceMaxHeight * (1 - meltProgress)); // starts full, melts to 0

      // draw ice sheet overlay (subtle, anchored at BOTTOM) — ice sits on bottom where seal is
      function drawIcePlatform() {
        const baseW = 280;
        const baseH = 30;

        const w = baseW * (1 - melt);
        const h = baseH;

        const x = W / 2 - w / 2;
        const y = H * 0.65;

        ctx.save();
        ctx.fillStyle = "#dff9ff";
        ctx.strokeStyle = "#6ec1d6";
        ctx.lineWidth = 3;

        ctx.beginPath();
        ctx.roundRect(x, y, w, h, 10);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }

      if (distancePercent > 0.5) {
        // Warn when past 50%
        const warningIntensity = Math.max(0, (distancePercent - 0.5) * 2); // 0 to 1
        ctx.fillStyle = `rgba(${parseInt(
          COLORS.warningRed.slice(1, 3),
          16
        )}, ${parseInt(COLORS.warningRed.slice(3, 5), 16)}, ${parseInt(
          COLORS.warningRed.slice(5, 7),
          16
        )}, ${COLORS.warningOverlayAlpha * warningIntensity})`;
        ctx.fillRect(0, 0, W, H);

        // Add warning text when past 75%
        if (distancePercent > 0.75) {
          ctx.save();
          ctx.fillStyle = `rgba(${parseInt(
            COLORS.warningRed.slice(1, 3),
            16
          )}, ${parseInt(COLORS.warningRed.slice(3, 5), 16)}, ${parseInt(
            COLORS.warningRed.slice(5, 7),
            16
          )}, ${0.7 * (distancePercent - 0.75) * 4})`;
          ctx.font = "bold 36px 'Segoe UI', sans-serif";
          ctx.textAlign = "center";
          ctx.fillText("⚠️ ICE MELTING! ⚠️", W / 2, 80);
          ctx.restore();
        }
      }

      /* OLD SECTION */

      /*/ Distant hills (back layer)
      ctx.beginPath();
      ctx.fillStyle = "#d0effb";
      ctx.moveTo(0, H);
      for (let sx = 0; sx <= W; sx += 12) {
        const worldX = sx + scroll * 0.3;
        const gy = groundYAt(worldX) + 80;
        ctx.lineTo(sx, gy);
      }
      ctx.lineTo(W, H);
      ctx.closePath();
      ctx.fill();

      // Midground hills
      ctx.beginPath();
      ctx.fillStyle = "#b6e3f7";
      ctx.moveTo(0, H);
      for (let sx = 0; sx <= W; sx += 10) {
        const worldX = sx + scroll * 0.5;
        const gy = groundYAt(worldX) + 40;
        ctx.lineTo(sx, gy);
      }
      ctx.lineTo(W, H);
      ctx.closePath();
      ctx.fill();

      // Foreground ground
      ctx.beginPath();
      ctx.fillStyle = "#89d3f1";
      ctx.moveTo(0, H);
      for (let sx = 0; sx <= W; sx += 8) {
        const worldX = sx + scroll;
        const gy = groundYAt(worldX);
        ctx.lineTo(sx, gy);
      }
      ctx.lineTo(W, H);
      ctx.closePath();
      ctx.fill();
      */
      /*/ Draw Hills
      ctx.beginPath();
      ctx.fillStyle = "#e6f6fb";
      ctx.moveTo(0, H);
      const stepBack = 14;
      for (let sx = 0; sx <= W; sx += stepBack) {
        const worldX = sx + scroll * 0.6;
        const gy = groundYAt(worldX) + 30;
        ctx.lineTo(sx, gy);
      }
      ctx.lineTo(W, H);
      ctx.closePath();
      ctx.fill();

      // Draw Distant Hills
      ctx.beginPath();
      ctx.fillStyle = "#fff6b8";
      ctx.moveTo(0, H);
      const step = 10;
      for(let sx = 0; sx <= W; sx += step) {
        const worldX = sx + scroll * 0.4;
        const gy = groundYAt(worldX) + 60;
        ctx.lineTo(sx, gy);
      }
      ctx.lineTo(W, H);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "#bcdff5";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw ground grid lines
      ctx.beginPath();
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      for (let sx = 0; sx <= W; sx += 24) {
        const worldX = sx + scroll * 0.8;
        const gy = groundYAt(worldX);
        if(sx === 0) ctx.moveTo(sx, gy);
        else ctx.lineTo(sx, gy);
      }
      ctx.strokeStyle = "rgba(11,64,84,0.05)";
      ctx.lineWidth = 1;
      ctx.stroke();

      // Shadow for seal
      const s = seal;
      const groundYUnder = groundYAt(scroll + s.x);
      ctx.beginPath();
      ctx.ellipse(s.x, groundYUnder - 6, s.r * 0.9, 8, 0, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(6,25,40,0.08)";
      ctx.fill();

      // Draw Seal
      const img = pressed ? rollSprite : sealSprite;
      const drawW = s.r * 2 * 1.6;
      const drawH = s.r * 2 * 1.0;
      ctx.save();
      ctx.translate(s.x, s.y);
      ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
      ctx.restore();

      // Pressed effect
      if (pressed) {
        ctx.fillStyle = "rgba(8,80,120,0.08)";
        ctx.fillRect(0, 0, W, H);
      }
      */

      /*/ Old Seal body (for reference)
      ctx.beginPath();
      ctx.fillStyle = "#2b556b";
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
      

      // Seal sprite
      ctx.beginPath();
      ctx.fillStyle = "#fff";
      ctx.arc(s.x + 6, s.y - 6, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.fillStyle = "#000";
      ctx.arc(s.x + 7.2, s.y - 6, 1.6, 0, Math.PI * 2);
      ctx.fill();

      // Seal flipper
      ctx.beginPath();
      ctx.moveTo(s.x + s.r - 2, s.y - 6);
      ctx.lineTo(s.x + s.r + 12, s.y);
      ctx.lineTo(s.x + s.r - 2, s.y + 6);
      ctx.closePath();
      ctx.fillStyle = "#2b556b";
      ctx.fill();

      // Seal sprite
      ctx.beginPath();
      ctx.fillStyle = "#7fc9e6";
      ctx.ellipse(s.x - 3, s.y + 4, s.r * 0.7, s.r * 0.4, 0, 0, Math.PI * 2);
      ctx.fill();
      */
    };

    // ----- Main loop -----
    let rafId;
    const loop = (ts) => {
      if (!lastTs) lastTs = ts;
      const dt = Math.min(0.05, (ts - lastTs) / 1000);
      lastTs = ts;

      if (running) {
        update(dt);
        draw();
      }
      rafId = requestAnimationFrame(loop);
    };
    lastTs = performance.now();
    rafId = requestAnimationFrame(loop);

    // ----- cleanup on unmount -----
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);

      if (touchBtn) {
        touchBtn.removeEventListener("mousedown", mouseDown);
        touchBtn.removeEventListener("touchstart", touchStart);
      }
      window.removeEventListener("mouseup", mouseUp);
      window.removeEventListener("touchend", touchEnd);

      // Start Button cleanup (remove our click/hover handlers previously registered)
      // remove the specific handlers we added above
      canvas.removeEventListener("click", onCanvasClick);
      canvas.removeEventListener("mousemove", onCanvasMouseMove);

      // remove title click handler if it was attached
      try {
        const headerEl = canvas.parentElement.querySelector(".gameHeader");
        const titleEl = headerEl ? headerEl.querySelector(".title") : null;
        if (titleEl && titleClickHandler)
          titleEl.removeEventListener("click", titleClickHandler);
      } catch (e) {
        // ignore
      }
      // remove global click handler for exiting fullscreen
      try {
        document.removeEventListener("click", handleGlobalClick);
      } catch (e) {
        /* ignore */
      }
      try {
        document.removeEventListener("fullscreenchange", onFullChange);
      } catch (e) {
        /* ignore */
      }
      try {
        document.removeEventListener("webkitfullscreenchange", onFullChange);
      } catch (e) {
        /* ignore */
      }

      // Control buttons cleanup
      pauseBtn.removeEventListener("click", togglePause);
      restartBtn.removeEventListener("click", onRestartBtnClick);
      // cleanup fs and overlay DOM handlers
      try {
        if (fsBtn) fsBtn.removeEventListener("click", onFsToggle);
      } catch (e) {}
      try {
        if (startBtnEl)
          startBtnEl.removeEventListener("click", onStartOverlayClick);
      } catch (e) {}
      try {
        if (demoBtnEl)
          demoBtnEl.removeEventListener("click", onDemoOverlayClick);
      } catch (e) {}
    };
  }, []);

  return (
    <main className="game">
      <div className="gameRoot">
        <header className="gameHeader">
          <div className="title">Save The Seal</div>
          <div id="score-display" ref={scoreRef}></div>
          <div className="control-buttons">
            <button ref={restartBtnRef} id="restartBtn" title="Restart">
              🔄
            </button>
            <button ref={pauseBtnRef} id="pauseBtn" title="Pause/Resume">
              ⏸️
            </button>
            <button
              ref={fsBtnRef}
              className="fs-btn"
              id="fsBtn"
              title="Toggle Fullscreen"
            >
              ⤢
            </button>
          </div>
        </header>

        <canvas ref={canvasRef} id="c" />
        {/* DOM overlay for accessible Start/Demo controls */}
        <div
          ref={startControlsRef}
          className="start-controls"
          role="dialog"
          aria-modal="true"
          style={{ display: "flex" }}
        ></div>
        <div ref={touchBtnRef} id="touchButton" aria-hidden="true">
          HOLD
        </div>

        <div id="toolbar" />
      </div>
    </main>
  );
};
