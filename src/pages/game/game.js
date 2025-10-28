// src/pages/game/game.js
import { useEffect, useRef } from "react";
import "./game.scss";

export const Game = () => {
  const canvasRef = useRef(null);
  const scoreRef = useRef(null);
  const pauseBtnRef = useRef(null);
  const restartBtnRef = useRef(null);
  const touchBtnRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d", { alpha: false });

    // ----- Sizing -----
    let W = 800, H = 450;
    const resize = () => {
      const dpr = Math.max(1, window.devicePixelRatio || 1);
      W = Math.max(600, Math.min(window.innerWidth, 1200));
      H = Math.max(320, window.innerHeight - 110);
      canvas.width = Math.floor(W * dpr);
      canvas.height = Math.floor(H * dpr);
      canvas.style.width = W + "px";
      canvas.style.height = H + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    window.addEventListener("resize", resize);
    resize();

    // ----- World & Terrain -----
    let scroll = 0;
    const scrollSpeed = 2.2;
    const baseGroundY = H * 0.72;
    const groundYAt = (worldX) => {
      const a = Math.sin(worldX * 0.004) * 60;
      const b = Math.sin(worldX * 0.012 + 1.2) * 30;
      const c = Math.sin(worldX * 0.03 + 0.3) * 12;
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

    let gravityNormal = 0.42;
    let gravityPressed = 2.6;
    let gravity = gravityNormal;

    // ----- Controls -----
    let pressed = false;
    const handleKeyDown = (e) => {
      if (e.code === "Space") {
        e.preventDefault();
        pressed = true;
      }
      if (e.code === "KeyP") togglePause();
    };
    const handleKeyUp = (e) => {
      if (e.code === "Space") {
        e.preventDefault();
        pressed = false;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    const touchBtn = touchBtnRef.current;
    const mouseDown = (e) => {
      e.preventDefault();
      pressed = true;
    };
    const mouseUp = () => (pressed = false);
    const touchStart = (e) => {
      e.preventDefault();
      pressed = true;
    };
    const touchEnd = () => (pressed = false);

    touchBtn.addEventListener("mousedown", mouseDown);
    window.addEventListener("mouseup", mouseUp);
    touchBtn.addEventListener("touchstart", touchStart, { passive: false });
    window.addEventListener("touchend", touchEnd);

    // ----- Game state -----
    let lastTs = 0;
    let running = true;
    let elapsed = 0;

    const scoreDisplay = scoreRef.current;
    const pauseBtn = pauseBtnRef.current;
    const restartBtn = restartBtnRef.current;

    const togglePause = () => {
      running = !running;
      pauseBtn.textContent = running ? "Pause" : "Resume";
      if (running) {
        lastTs = performance.now();
      }
    };

    const restart = () => {
      scroll = 0;
      seal.y = baseGroundY - 24;
      seal.vy = 0;
      elapsed = 0;
      lastTs = performance.now();
      if (!running) {
        running = true;
        pauseBtn.textContent = "Pause";
      }
    };

    pauseBtn.addEventListener("click", togglePause);
    restartBtn.addEventListener("click", restart);

    // ----- Update / Physics -----
    const update = (dt) => {
      scroll += scrollSpeed * (60 * dt);

      gravity = pressed ? gravityPressed : gravityNormal;
      seal.vy += gravity;
      seal.y += seal.vy;

      const worldXUnderSeal = seal.x + scroll;
      const groundY = groundYAt(worldXUnderSeal);

      if (seal.y + seal.r > groundY) {
        seal.y = groundY - seal.r;
        if (seal.vy > 0) seal.vy = 0;
        if (pressed) {
          seal.vy = 0;
          seal.onGround = true;
          seal.y = groundY - seal.r;
        } else {
          seal.onGround = true;
          seal.vy *= 0;
        }
      } else {
        seal.onGround = false;
      }

      if (!pressed && seal.onGround) {
        const nextGroundY = groundYAt(worldXUnderSeal + 6);
        const slope = nextGroundY - groundY;
        if (slope > 6) {
          seal.vy -= 0.6;
          seal.onGround = false;
        }
      }

      if (seal.y < 8) {
        seal.y = 8;
        seal.vy = Math.max(seal.vy, 0);
      }

      elapsed += dt;
      scoreDisplay.textContent = `Time: ${elapsed.toFixed(1)}s`;
    };

    // ----- Draw -----
    const draw = () => {
      ctx.fillStyle = "#cfeefc";
      ctx.fillRect(0, 0, W, H);

      ctx.beginPath();
      ctx.fillStyle = "#fff6b8";
      ctx.arc(W - 80, 80, 36, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#dbeff7";
      ctx.strokeStyle = "#bcdff5";
      ctx.lineWidth = 2;
      ctx.beginPath();
      const step = 10;
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

      ctx.beginPath();
      for (let sx = 0; sx <= W; sx += 24) {
        const worldX = sx + scroll * 0.8;
        const gy = groundYAt(worldX);
        if (sx === 0) ctx.moveTo(sx, gy);
        else ctx.lineTo(sx, gy);
      }
      ctx.strokeStyle = "rgba(11,64,84,0.05)";
      ctx.lineWidth = 1;
      ctx.stroke();

      const s = seal;
      ctx.beginPath();
      ctx.fillStyle = "#2b556b";
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.fillStyle = "#fff";
      ctx.arc(s.x + 6, s.y - 6, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.fillStyle = "#000";
      ctx.arc(s.x + 7.2, s.y - 6, 1.6, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(s.x + s.r - 2, s.y - 6);
      ctx.lineTo(s.x + s.r + 12, s.y);
      ctx.lineTo(s.x + s.r - 2, s.y + 6);
      ctx.closePath();
      ctx.fillStyle = "#2b556b";
      ctx.fill();

      ctx.beginPath();
      ctx.fillStyle = "#7fc9e6";
      ctx.ellipse(s.x - 3, s.y + 4, s.r * 0.7, s.r * 0.4, 0, 0, Math.PI * 2);
      ctx.fill();

      const groundYUnder = groundYAt(scroll + s.x);
      ctx.beginPath();
      ctx.ellipse(s.x, groundYUnder - 6, s.r * 0.9, 8, 0, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(6,25,40,0.08)";
      ctx.fill();

      if (pressed) {
        ctx.fillStyle = "rgba(8,80,120,0.08)";
        ctx.fillRect(0, 0, W, H);
      }
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

      touchBtn.removeEventListener("mousedown", mouseDown);
      window.removeEventListener("mouseup", mouseUp);
      touchBtn.removeEventListener("touchstart", touchStart);
      window.removeEventListener("touchend", touchEnd);

      pauseBtn.removeEventListener("click", togglePause);
      restartBtn.removeEventListener("click", restart);
    };
  }, []);

  return (
    <main className="game">
      <div className="gameRoot">
        <header className="gameHeader">
          <div className="title">Arctic Seal — Prototype</div>
          <div className="controls">
            <div ref={scoreRef} id="scoreDisplay">Time: 0.0s</div>
            <button ref={restartBtnRef} className="secondary">Restart</button>
            <button ref={pauseBtnRef}>Pause</button>
          </div>
        </header>

        <canvas ref={canvasRef} id="c" />

        <div ref={touchBtnRef} id="touchButton" aria-hidden="true">HOLD</div>
        <div id="toolbar" />
        <div id="message">Hold space / hold the button to stick to hills</div>
      </div>
    </main>
  );
}