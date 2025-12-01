// Utility helpers and constants for the game
export const CLIMATE_FACTS = [
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

export function shuffle(arr) {
  const res = arr.slice();
  for (let i = res.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [res[i], res[j]] = [res[j], res[i]];
  }
  return res;
}

export function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function drawFancyButton(ctx, btn, text, color, hover) {
  const scale = hover ? 1.05 : 1;
  ctx.save();
  ctx.translate(btn.x + btn.w / 2, btn.y + btn.h / 2);
  ctx.scale(scale, scale);
  ctx.fillStyle = color;
  ctx.shadowColor = "rgba(0,0,0,0.12)";
  ctx.shadowBlur = hover ? 20 : 10;
  // use roundRect helper to make a rounded rect path
  roundRect(ctx, -btn.w / 2, -btn.h / 2, btn.w, btn.h, 14);
  ctx.fill();
  ctx.fillStyle = "white";
  ctx.font = "22px 'Segoe UI', sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(text, 0, 6);
  ctx.restore();
}

export function drawCloud(ctx, x, y) {
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.ellipse(x, y, 30, 20, 0, 0, Math.PI * 2);
  ctx.ellipse(x + 30, y - 10, 30, 20, 0, 0, Math.PI * 2);
  ctx.ellipse(x + 60, y, 30, 20, 0, 0, Math.PI * 2);
  ctx.fill();
}

export function spawnSnowflake() {
  return {
    x: Math.random() * 1200,
    y: -20,
    size: 3 + Math.random() * 4,
    speed: 1 + Math.random() * 1.5,
    drift: (Math.random() - 0.5) * 1.2,
  };
}

export function drawSnow(ctx, snowflakes, W, H) {
  ctx.fillStyle = "white";
  for (let i = snowflakes.length - 1; i >= 0; i--) {
    const s = snowflakes[i];
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
    ctx.fill();
    s.y += s.speed;
    s.x += s.drift;
    if (s.y > H + 20) snowflakes.splice(i, 1);
  }
}

export function drawIceCracks(ctx, t, W, H) {
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

export function wrapTextToLines(ctx, text, maxWidth, maxLines = 2) {
  const words = text.split(" ");
  const lines = [""];
  let lineIndex = 0;
  for (let w of words) {
    const testLine = lines[lineIndex] + w + " ";
    const width = ctx.measureText(testLine).width;
    if (width > maxWidth && lineIndex < maxLines - 1) {
      lineIndex++;
      lines[lineIndex] = w + " ";
    } else {
      lines[lineIndex] = testLine;
    }
  }
  return lines.map((l) => l.trim());
}

export function drawBird(ctx, bird, elapsed) {
  const fl = Math.sin((bird.flapOffset || 0) + elapsed * 10) * 4;
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

export default null;
