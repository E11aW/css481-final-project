// src/pages/game/game.js
import { useEffect, useRef } from "react";
import "./game.scss";
import sealSpriteSrc from '../../assets/Game/SealSprite.png';
import rollSpriteSrc from '../../assets/Game/RollSprite.png';

export const Game = () => {
  const canvasRef = useRef(null);
  const scoreRef = useRef(null);
  const pauseBtnRef = useRef(null);
  const restartBtnRef = useRef(null);
  const touchBtnRef = useRef(null);


  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d", { alpha: false });
    const jumpStrength = -16;
    let gameState = "start"; // "start", "playing", "gameover"
    let elapsed = 0;

    // ----- Sizing -----
    let W = 800, H = 450; //used to be 800, 450
    const resize = () => {
      const dpr = Math.max(1, window.devicePixelRatio || 1);
      W = Math.max(700, window.innerWidth); 
      H = Math.max(300, window.innerHeight-180); //used to be 320
      canvas.width = Math.floor(W * dpr);
      canvas.height = Math.floor(H * dpr);
      canvas.style.width = W + "px";
      canvas.style.height = H + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    window.addEventListener("resize", resize);
    resize();

    // ----- Start Screen Visuals -----
    let clouds = [];
    for(let i = 0; i < 8; i++) {
      clouds.push({
        x: Math.random() * W + W,
        y: 60 + Math.random() * 80,
        speed: 0.3 + Math.random() * 0.4,
      });
    }

    // Adding hold button within the canvas
    let holdBtn = {
      x: 0, y: 0, w: 120, h: 60
    };

    const updateHoldBtnPosition = () => {
      holdBtn.x = W / 2 - holdBtn.w / 2;
      holdBtn.y = H - holdBtn.h - 20;
    };
    updateHoldBtnPosition();

    // ----- World & Terrain -----
    let scroll = 0;
    const scrollSpeed = 1.8;
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

    // Sprites
    const sealSprite = new Image();
    const rollSprite = new Image();
    let spritesLoad = false;

    let loadedCount = 0;
    const onSpriteLoad = () => {
      loadedCount++;
      if (loadedCount === 2) spritesLoad = true;
    };
    sealSprite.onload = onSpriteLoad;
    rollSprite.onload = onSpriteLoad;

    sealSprite.src = sealSpriteSrc;
    rollSprite.src = rollSpriteSrc;

    let gravityNormal = 0.42;
    let gravityPressed = 2.6;
    let gravity = gravityNormal;

    // ----- Controls -----
    let pressed = false;
    let justReleased = false;

    const handleKeyDown = (e) => {
      if (e.code === "Space") {
        e.preventDefault();
        if(gameState === "start") gameState = "playing";
        else pressed = true;
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
      if(gameState === "start") gameState = "playing";
      else pressed = true;
    };
    const mouseUp = () => (pressed = false);
    const touchStart = (e) => {
      e.preventDefault();
      pressed = true;
    };
    const touchEnd = () => {
      pressed = false;
      justReleased = true;
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    const touchBtn = touchBtnRef.current;
    if(touchBtn) {
      touchBtn.addEventListener("mousedown", mouseDown);
      window.addEventListener("mouseup", mouseUp);
      touchBtn.addEventListener("touchstart", touchStart, { passive: false });
      window.addEventListener("touchend", touchEnd);
    }

    // Start Button
      canvas.addEventListener("click", (e) => {
        if(gameState !== "start") return;

        const rect = canvas.getBoundingClientRect();
        const mx = (e.clientX - rect.left) * (canvas.width / rect.width) / (window.devicePixelRatio || 1);
        const my = (e.clientY - rect.top) * (canvas.height / rect.height) / (window.devicePixelRatio || 1);

        if(mx >= startBtn.x && mx <= startBtn.x + startBtn.w &&
           my >= startBtn.y && my <= startBtn.y + startBtn.h) {
          gameState = "playing";
          scroll = 0;
          elapsed = 0;
        }
      });
      
      //Hover effect for start button
      canvas.addEventListener("mousemove", (e) => {
        if(gameState !== "start") return;
        const rect = canvas.getBoundingClientRect();
        const mx = (e.clientX - rect.left) * (canvas.width / rect.width) / (window.devicePixelRatio || 1);
        const my = (e.clientY - rect.top) * (canvas.height / rect.height) / (window.devicePixelRatio || 1);
        startBtn.hover = 
          mx >= startBtn.x && mx <= startBtn.x + startBtn.w &&
          my >= startBtn.y && my <= startBtn.y + startBtn.h;
        canvas.style.cursor = startBtn.hover ? "pointer" : "default";
      });

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

    const restart = () => {
      scroll = 0;
      seal.y = baseGroundY - 24;
      seal.vy = 0;
      elapsed = 0;
      lastTs = performance.now();
      running = true;
      pauseBtn.textContent = "⏸️";
    };

    pauseBtn.addEventListener("click", togglePause);
    restartBtn.addEventListener("click", restart);

    // ----- Update / Physics -----
    const update = (dt) => {
      if (gameState === "playing") {
        scroll += scrollSpeed * (60 * dt);

        gravity = pressed ? gravityPressed : gravityNormal;
        seal.vy += gravity;
        seal.y += seal.vy;

        const worldX = seal.x + scroll;
        const groundY = groundYAt(worldX);
        const nextGroundY = groundYAt(worldX + 2);
        const slope = nextGroundY - groundY;
        const slopeAngle = Math.atan2(slope, 2);

        // Game physics
        if(seal.y + seal.r >= groundY) {
          if(pressed) {
            seal.onGround = true;
            seal.y = groundY - seal.r;
            seal.vy = 0;
            scroll += Math.cos(slopeAngle) * scrollSpeed - scrollSpeed;
          } else if(seal.onGround) {
            seal.onGround = false;
            seal.vy = -6 - Math.max(0, Math.sin(slopeAngle) * 10); //purely from copilot
          } else {
            seal.y = groundY - seal.r;
            if(seal.vy > 0) seal.vy *= -0.25;
          }
        } else {
          seal.onGround = false;
          const glideGravity = 0.20;
          const lift = Math.max(0, -Math.sin(slopeAngle) * seal.vy * 0.2); //copilot
          seal.vy += glideGravity;
          seal.y += seal.vy;
        }

        if(seal.y + seal.r > groundYAt(worldX)) {
          seal.y = groundYAt(worldX) - seal.r;
          if(seal.vy > 0) seal.vy = 0;
        }

        if (justReleased) justReleased = false;



        if (seal.y < 8) {
          seal.y = 8;
          seal.vy = Math.max(seal.vy, 0);
        }

        elapsed += dt;
      } else if (gameState === "start") {
        elapsed += dt * 0.5;
      }
      
      // Update score
      if(scoreDisplay && gameState === "playing") {
        const distance = Math.floor(scroll);
        scoreDisplay.textContent = `${distance} m`;
      } else if(gameState === "start") {
        scoreDisplay.textContent = `Press Space or Hold to Start`;
      }
    };

    const startBtn = {x: 0, y: 0, w: 200, h: 60};
    let sealBobY = 0;
    let sealBobDir = 1;
    let sealBobSpeed = 0.4;

    // ----- Draw Start Screen -----
    const drawStartScreen = () => {
      // Clear background
      ctx.fillStyle = '#cbe2e8ff';
      ctx.fillRect(0, 0, W, H);
      
      // Draw clouds (start screen)
      clouds.forEach(cloud => {
        cloud.x -= cloud.speed * 2;
        if(cloud.x < -80) {
          cloud.x = W + 80;
          cloud.y = 60 + Math.random() * 80;
        }
        drawCloud(cloud.x, cloud.y);
      });

      // Seal Bobbing (start screen)
      sealBobY = Math.sin(elapsed * 2) * 6;
      if(spritesLoad) {
        ctx.save();
        ctx.translate(W/2, H/2 - 60 + sealBobY);
        const drawW = seal.r * 2 * 2.2;
        const drawH = seal.r * 2 * 1.3;
        ctx.drawImage(sealSprite, -drawW / 2, -drawH / 2, drawW, drawH);
        ctx.drawImage(sealSprite, -drawW / 2, -drawH / 2, drawW, drawH);
        ctx.restore();
      }

      // Title (start screen)
      ctx.fillStyle = "#06414a";
      ctx.font = "48px 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Save The Seal", W / 2, H / 2 - 100);

      // Start Button (start screen)
      startBtn.x = W / 2 - startBtn.w / 2;
      startBtn.y = H / 2 + 60 - startBtn.h / 2;
      // Animation to add hover pulse to start button
      let hoverScale = 1;
      if(startBtn.hover) {
        hoverScale += 0.05 * Math.sin(elapsed * 10);
      }
      ctx.save();
      ctx.translate(startBtn.x + startBtn.w / 2, startBtn.y + startBtn.h / 2);
      ctx.scale(hoverScale, hoverScale);
      ctx.fillStyle = startBtn.hover ? "#0a82b4" : "#0c3545ff";
      ctx.beginPath();
      ctx.roundRect(-startBtn.w / 2, -startBtn.h / 2, startBtn.w, startBtn.h, 12);
      ctx.shadowColor = startBtn.hover ? "rgba(0,0,0,0.2)" : "rgba(0,0,0,0.1)";
      ctx.shadowBlur = startBtn.hover ? 16 : 8;
      ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.font = "24px 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Start Game", 0, 8);
      ctx.restore();


      
      // Draw Clouds (start screen)
      function drawCloud(x, y) {
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.ellipse(x, y, 30, 20, 0, 0, Math.PI * 2);
        ctx.ellipse(x + 25, y - 10, 30, 20, 0, 0, Math.PI * 2);
        ctx.ellipse(x + 50, y, 30, 20, 0, 0, Math.PI * 2);
        ctx.closePath();
        ctx.fill();
      }
    };

    // ----- Draw -----
    const draw = () => {
      if(gameState === "start") {
        drawStartScreen();
        return;
      } 

      // Clear background
      ctx.fillStyle = "#cfeefc";
      ctx.fillRect(0, 0, W, H);

      // Draw sun
      ctx.beginPath();
      ctx.fillStyle = "#fff6b8";
      ctx.arc(W - 80, 80, 36, 0, Math.PI * 2);
      ctx.fill(); 

      // Distant hills (back layer)
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

      // Draw Seal
      if(spritesLoad) {
        const s = seal;
        const img = pressed ? rollSprite : sealSprite;
        const drawW = s.r * 2 * 1.6;
        const drawH = s.r * 2 * 1.0;
        ctx.save();
        ctx.translate(s.x, s.y);
        ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
        ctx.restore();
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

      if(touchBtn) {
        touchBtn.removeEventListener("mousedown", mouseDown);
        touchBtn.removeEventListener("touchstart", touchStart);
      }
      window.removeEventListener("mouseup", mouseUp);
      window.removeEventListener("touchend", touchEnd);

      // Start Button cleanup
      const handleStartClick = (e) => {
        if(gameState !== "start") return;
        const rect = canvas.getBoundingClientRect();
        const mx = (e.clientX - rect.left) * (canvas.width / rect.width) / (window.devicePixelRatio || 1);
        const my = (e.clientY - rect.top) * (canvas.height / rect.height) / (window.devicePixelRatio || 1);

        if(mx >= startBtn.x && mx <= startBtn.x + startBtn.w &&
           my >= startBtn.y && my <= startBtn.y + startBtn.h) {
          gameState = "playing";
          scroll = 0;
          elapsed = 0;
        }
      };
      canvas.removeEventListener("click", handleStartClick);

      // Control buttons cleanup
      pauseBtn.removeEventListener("click", togglePause);
      restartBtn.removeEventListener("click", restart);
    };
  }, []);

  return (
    <main className="game">
      <div className="gameRoot">
        <header className="gameHeader">
          <div className="title">Save The Seal</div>
          <div id="score-display" ref={scoreRef}></div>
          <div className="control-buttons">
            <button ref={restartBtnRef} id="restartBtn" title="Restart">🔄</button>
            <button ref={pauseBtnRef} id="pauseBtn" title="Pause/Resume">⏸️</button>
          </div>
        </header>


        <canvas ref={canvasRef} id="c" />
       <div ref={touchBtnRef} id="touchButton" aria-hidden="true">HOLD</div>
       
        <div id="toolbar" />
      </div>
    </main>
  );
}