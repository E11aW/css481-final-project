// src/pages/game/game.js
import { useEffect, useRef } from "react";
import "./game.scss";
import sealSpriteSrc from '../../assets/Game/SealSprite.png';
import rollSpriteSrc from '../../assets/Game/RollSprite.png';

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


  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d", { alpha: false });
    const jumpStrength = -16;
    let gameState = "start"; // "start", "playing", "gameover"
    let elapsed = 0;

    // ----- Sizing -----
    let W = 800, H = 450; //used to be 800, 450
    // Adding hold button within the canvas (declare early so resize can call it)
    let holdBtn = {
      x: 0, y: 0, w: 120, h: 60
    };

    const updateHoldBtnPosition = () => {
      holdBtn.x = W / 2 - holdBtn.w / 2;
      holdBtn.y = H - holdBtn.h - 60;
    };

    const resize = () => {
      const dpr = Math.max(1, window.devicePixelRatio || 1);
      const header = canvas.parentElement.querySelector('.gameHeader');
      const headerHeight = header ? header.offsetHeight : 60;
      W = Math.max(700, window.innerWidth); 
      H = Math.max(300, window.innerHeight - headerHeight);
      canvas.width = Math.floor(W * dpr);
      canvas.height = Math.floor(H * dpr);
      canvas.style.width = W + "px";
      canvas.style.height = H + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      // update hold button drawing position on resize if helper exists
      if (typeof updateHoldBtnPosition === 'function') updateHoldBtnPosition();
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

    updateHoldBtnPosition();

    // ----- World & Terrain -----
    let scroll = 0;
    const scrollSpeed = 2.0;
    const baseGroundY = H * 0.72;
    
    // restore to original speed for seal movement
    const actualScrollSpeed = 1.8;
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
    const coinSpawnInterval = 6.0; // spawn every 6 seconds (much less frequent, max 1 on screen)
    const coinRadius = 12;
    let factsShown = new Set(); // track which facts have been shown

    const spawnCoin = () => {
      // spawn coins at the right edge of the screen (new terrain appearing)
      const screenRightWorldX = scroll + W; // right edge of visible screen in world space
      const worldX = screenRightWorldX + Math.random() * 60 - 30; // slight variation around right edge
      const groundY = groundYAt(worldX);
      const y = groundY - (Math.random() * 80 + 60); // 60-140 units above ground
      coins.push({
        x: worldX,
        y: y,
        r: coinRadius,
        collected: false
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
      // hide hold button until game starts
      touchBtn.style.display = "none";
    }

    // Start Button
      canvas.addEventListener("click", (e) => {
        if(gameState !== "start" && gameState !== "gameover") return;

        const rect = canvas.getBoundingClientRect();
        const mx = (e.clientX - rect.left) * (canvas.width / rect.width) / (window.devicePixelRatio || 1);
        const my = (e.clientY - rect.top) * (canvas.height / rect.height) / (window.devicePixelRatio || 1);

        if(mx >= startBtn.x && mx <= startBtn.x + startBtn.w &&
           my >= startBtn.y && my <= startBtn.y + startBtn.h) {
          if(gameState === "gameover") {
            restart();
          } else {
            gameState = "playing";
            scroll = 0;
            elapsed = 0;
          }
        }
      });
      
      //Hover effect for start button
      canvas.addEventListener("mousemove", (e) => {
        if(gameState !== "start" && gameState !== "gameover") return;
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
      coins = [];
      coinsCollected = 0;
      displayedFact = null;
      factDisplayTime = 0;
      factsShown.clear();
      gameState = "playing";
    };

    pauseBtn.addEventListener("click", togglePause);
    restartBtn.addEventListener("click", restart);

    // ----- Update / Physics -----
    const update = (dt) => {
      // scale so physics stays consistent across frame rates
      const fpsScale = Math.min(60 * dt, 3);

      // pause game while fact is displayed
      if (displayedFact !== null) {
        // only update fact display timer, don't update game physics
        factDisplayTime += dt;
        if (factDisplayTime >= factDisplayDuration) {
          displayedFact = null;
        }
        elapsed += dt;
        return; // skip all other updates
      }

      if (gameState === "playing") {
        // world scroll (visual movement) keeps original speed
        scroll += actualScrollSpeed * fpsScale;

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
            // use jumpStrength with a mild slope modifier
            seal.vy = jumpStrength + Math.min(4, -Math.sin(slopeAngle) * 6);
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
        if (lastCoinSpawn >= coinSpawnInterval) {
          spawnCoin();
          lastCoinSpawn = 0;
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
            // show a random fact
            const randomFact = CLIMATE_FACTS[Math.floor(Math.random() * CLIMATE_FACTS.length)];
            
            // only count if fact hasn't been shown before
            if (!factsShown.has(randomFact)) {
              factsShown.add(randomFact);
              coinsCollected++;
              
              // check if all facts have been shown (win condition)
              if (factsShown.size === CLIMATE_FACTS.length) {
                gameState = "gameover"; // trigger win state
              }
            }
            
            displayedFact = randomFact;
            factDisplayTime = 0;
          }
        });

        elapsed += dt;
      } else if (gameState === "start") {
        elapsed += dt * 0.5;
      }
      
      // Update score
      if(scoreDisplay && gameState === "playing") {
        const distance = Math.floor(scroll * meterCountDivisor);
        scoreDisplay.textContent = `${distance} m | � ${coinsCollected}/${CLIMATE_FACTS.length}`;
        // show hold button during gameplay
        if(touchBtn) touchBtn.style.display = "flex";
      } else if(gameState === "start") {
        scoreDisplay.textContent = `Press Space or Hold to Start`;
        // hide hold button on start screen
        if(touchBtn) touchBtn.style.display = "none";
      } else if(gameState === "gameover") {
        scoreDisplay.textContent = `You collected all ${coinsCollected} facts! 🎉`;
        // hide hold button on win screen
        if(touchBtn) touchBtn.style.display = "none";
      }
    };

    const startBtn = {x: 0, y: 0, w: 200, h: 60};
  let sealBobY = 0;

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
        // keep the sprite height similar to previous design but preserve aspect ratio (50% smaller: 2.6 / 2 = 1.3)
        const drawH = seal.r * 2 * 2.0;
        const drawW = drawH * sealRatio;
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

    // ----- Draw Win Screen -----
    const drawWinScreen = () => {
      // Clear background
      ctx.fillStyle = '#cbe2e8ff';
      ctx.fillRect(0, 0, W, H);
      
      // Draw clouds (win screen)
      clouds.forEach(cloud => {
        cloud.x -= cloud.speed * 2;
        if(cloud.x < -80) {
          cloud.x = W + 80;
          cloud.y = 60 + Math.random() * 80;
        }
        drawCloud(cloud.x, cloud.y);
      });

      // Seal Bobbing (win screen)
      sealBobY = Math.sin(elapsed * 2) * 6;
      if(spritesLoad) {
        ctx.save();
        ctx.translate(W/2, H/2 - 60 + sealBobY);
        const drawH = seal.r * 2 * 2.0;
        const drawW = drawH * sealRatio;
        ctx.drawImage(sealSprite, -drawW / 2, -drawH / 2, drawW, drawH);
        ctx.drawImage(sealSprite, -drawW / 2, -drawH / 2, drawW, drawH);
        ctx.restore();
      }

      // Title (win screen)
      ctx.fillStyle = "#06414a";
      ctx.font = "48px 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("🎉 You Won! 🎉", W / 2, H / 2 - 100);

      // Subtitle
      ctx.fillStyle = "#0a82b4";
      ctx.font = "24px 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif";
      ctx.fillText("All climate facts learned!", W / 2, H / 2 - 20);

      // Restart Button (win screen)
      startBtn.x = W / 2 - startBtn.w / 2;
      startBtn.y = H / 2 + 60 - startBtn.h / 2;
      // Animation to add hover pulse to restart button
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
      ctx.fillText("Play Again", 0, 8);
      ctx.restore();

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
      
      if(gameState === "gameover") {
        drawWinScreen();
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
        // keep the sprite at a consistent height and preserve its natural aspect ratio (50% smaller: 2.0 / 2 = 1.0)
        const drawH = s.r * 2 * 1.25;
        const ratio = pressed ? rollRatio : sealRatio;
        const drawW = drawH * ratio;
        ctx.save();
        ctx.translate(s.x, s.y);
        ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
        ctx.restore();
      }

      // Draw Coins
      coins.forEach(coin => {
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
        const alpha = Math.min(1, (factDisplayDuration - factDisplayTime) * 0.5); // fade out at end
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
        ctx.fillRect(boxX, boxY, boxWidth, boxHeight);
        // border
        ctx.strokeStyle = `rgba(15, 154, 214, ${alpha})`;
        ctx.lineWidth = 3;
        ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);
        // text
        ctx.fillStyle = `rgba(6, 65, 74, ${alpha})`;
        ctx.font = "bold 18px 'Segoe UI', sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        // wrap text to 2 lines max
        const words = displayedFact.split(' ');
        let line1 = '', line2 = '';
        words.forEach((word, idx) => {
          if (idx < Math.ceil(words.length / 2)) {
            line1 += word + ' ';
          } else {
            line2 += word + ' ';
          }
        });
        ctx.fillText(line1.trim(), W / 2, boxY + boxHeight / 2 - 20);
        ctx.fillText(line2.trim(), W / 2, boxY + boxHeight / 2 + 20);
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