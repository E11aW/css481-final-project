// React + D3 canvas heatmap overlay for a base PNG image.
// Install: npm i d3
import React, { useEffect, useMemo, useRef, useState } from "react";
import * as d3 from "d3";
import "./D3HeatMap.scss";

export default function D3HeatMap({
  imageSrc,
  points = [],                 // normalized points: { nx, ny, value, label? }
  normalized = true,
  cellSize = 24,               // grid size in IMAGE pixels
  colorScheme = d3.interpolateMagma,
  showLegend = true,
  className,
  style = {},
}) {
  const wrapRef = useRef(null);
  const imgRef = useRef(null);
  const canvasRef = useRef(null);
  const [imgNatural, setImgNatural] = useState({ w: 0, h: 0 });
  const [rect, setRect] = useState(null);
  const [tooltip, setTooltip] = useState(null); // { x, y, point }

  // Observe container size for responsiveness
  useEffect(() => {
    if (!wrapRef.current) return;
    const ro = new ResizeObserver(() => {
      setRect(wrapRef.current.getBoundingClientRect());
    });
    ro.observe(wrapRef.current);
    setRect(wrapRef.current.getBoundingClientRect());
    return () => ro.disconnect();
  }, []);

  // Image natural size
  const onImgLoad = () => {
    if (!imgRef.current) return;
    const w = imgRef.current.naturalWidth;
    const h = imgRef.current.naturalHeight;
    if (w && h) setImgNatural({ w, h });
  };

  // Convert input points -> IMAGE pixels
  const pointsPx = useMemo(() => {
    if (!imgNatural.w || !imgNatural.h) return [];
    if (!normalized) return points.map(p => ({ ...p })); // assume x,y in px
    return points.map(p => ({
      x: Math.round((p.nx ?? 0) * imgNatural.w),
      y: Math.round((p.ny ?? 0) * imgNatural.h),
      value: p.value ?? 0,
      label: p.label,
    }));
  }, [points, normalized, imgNatural]);

  // Bin into grid (in IMAGE space)
  const bins = useMemo(() => {
    const grid = new Map();
    const key = (i, j) => `${i},${j}`;
    for (const p of pointsPx) {
      const i = Math.floor(p.x / cellSize);
      const j = Math.floor(p.y / cellSize);
      const k = key(i, j);
      const cell = grid.get(k) || { i, j, sum: 0, count: 0 };
      cell.sum += p.value;
      cell.count += 1;
      grid.set(k, cell);
    }
    const cells = Array.from(grid.values()).map(c => ({
      ...c,
      val: c.sum / c.count,
    }));
    const min = d3.min(cells, d => d.val) ?? 0;
    const max = d3.max(cells, d => d.val) ?? 1;
    return { cells, min, max };
  }, [pointsPx, cellSize]);

  // Draw heatmap (RENDER space)
  useEffect(() => {
    if (!rect || !canvasRef.current || !imgNatural.w || !imgNatural.h) return;
    const cvs = canvasRef.current;
    const ctx = cvs.getContext("2d");
    if (!ctx) return;

    const containerW = Math.round(rect.width);
    const containerH = Math.round(containerW * (imgNatural.h / imgNatural.w));
    const dpr = window.devicePixelRatio || 1;
    cvs.style.width = `${containerW}px`;
    cvs.style.height = `${containerH}px`;
    cvs.width = Math.round(containerW * dpr);
    cvs.height = Math.round(containerH * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, containerW, containerH);

    const sx = containerW / imgNatural.w;
    const sy = containerH / imgNatural.h;

    const color = d3.scaleSequential(colorScheme).domain([bins.min, bins.max]);

    for (const c of bins.cells) {
      const x = c.i * cellSize * sx;
      const y = c.j * cellSize * sy;
      const w = cellSize * sx;
      const h = cellSize * sy;
      ctx.fillStyle = color(c.val);
      ctx.fillRect(x, y, w, h);
    }
  }, [rect, imgNatural, bins, cellSize, colorScheme]);

  // Hover: nearest point (in IMAGE space)
  function handleMouseMove(e) {
    if (!wrapRef.current || !imgNatural.w || !imgNatural.h) return;
    const bounds = wrapRef.current.getBoundingClientRect();
    const mx = e.clientX - bounds.left;
    const my = e.clientY - bounds.top;

    const containerW = bounds.width;
    const containerH = containerW * (imgNatural.h / imgNatural.w);
    const sx = containerW / imgNatural.w;
    const sy = containerH / imgNatural.h;
    const ix = mx / sx; // IMAGE space x
    const iy = my / sy; // IMAGE space y

    let nearest = null, bestD2 = Infinity;
    for (const p of pointsPx) {
      const dx = p.x - ix, dy = p.y - iy;
      const d2 = dx*dx + dy*dy;
      if (d2 < bestD2) { bestD2 = d2; nearest = p; }
    }
    const threshold = Math.max(24, cellSize * 1.5); // IMAGE px
    if (!nearest || Math.sqrt(bestD2) > threshold) {
      setTooltip(null);
      return;
    }
    setTooltip({ x: mx + 12, y: my + 12, point: nearest });
  }
  function handleMouseLeave() { setTooltip(null); }

  // Legend (same scale)
  function Legend() {
    const ref = useRef(null);
    useEffect(() => {
      if (!ref.current) return;
      const w = 160, h = 10;
      const cvs = ref.current;
      const ctx = cvs.getContext("2d");
      const dpr = window.devicePixelRatio || 1;
      cvs.style.width = `${w}px`;
      cvs.style.height = `${h}px`;
      cvs.width = Math.round(w * dpr);
      cvs.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const color = d3.scaleSequential(colorScheme).domain([0, 1]);
      const grad = ctx.createLinearGradient(0, 0, w, 0);
      for (let i = 0; i <= 10; i++) {
        const t = i / 10;
        grad.addColorStop(t, color(t));
      }
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
    }, []);
    return (
      <div className="legend">
        <span className="legend-min">{bins.min.toFixed(2)}</span>
        <canvas ref={ref} />
        <span className="legend-max">{bins.max.toFixed(2)}</span>
      </div>
    );
  }

  return (
    <div
      ref={wrapRef}
      className={['heatmap-wrap', className].filter(Boolean).join(' ')}
      style={{ position: "relative", width: "100%", ...style }}
    >
      <img
        ref={imgRef}
        src={imageSrc}
        alt="heatmap base"
        onLoad={onImgLoad}
        style={{
          width: "100%",
          height: "auto",
          display: "block",
          userSelect: "none",
          pointerEvents: "none",
          aspectRatio: imgNatural.w && imgNatural.h ? `${imgNatural.w} / ${imgNatural.h}` : undefined,
        }}
      />
      <canvas
        ref={canvasRef}
        className="heatmap-canvas"
        style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
      />
      {/* Transparent pointer layer to capture mouse events */}
      <div
        className="heatmap-pointer"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{ position: "absolute", inset: 0 }}
      />
      {/* Tooltip */}
      {tooltip && (
        <div className="heatmap-tooltip" style={{ left: tooltip.x, top: tooltip.y }}>
          <div className="heatmap-tooltip-title">
            {tooltip.point.label ?? "Data Point"}
          </div>
          <div>Value: {Number.isFinite(tooltip.point.value) ? tooltip.point.value.toFixed(2) : tooltip.point.value}</div>
          <div className="coords">x: {Math.round(tooltip.point.x)}, y: {Math.round(tooltip.point.y)}</div>
        </div>
      )}
      {showLegend && <Legend />}
    </div>
  );
}