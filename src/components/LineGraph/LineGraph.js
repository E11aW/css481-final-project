import { useEffect, useRef } from "react";
import * as d3 from "d3";
import "./LineGraph.scss";

/**
 * Props:
 *  - data: [{ date: "YYYY-MM-DD", value: number }]
 *      (here we use one point per year, with date like "2013-01-01")
 *  - metricLabel?: string
 *  - width?: number
 *  - height?: number
 *  - onPointClick?: (date: string, value: number) => void
 */
export const LineGraph = ({
  data = [],
  metricLabel = "Temperature anomaly (°C)",
  width = 640,
  height = 320,
  onPointClick,
}) => {
  const ref = useRef(null);

  useEffect(() => {
    const svg = d3
      .select(ref.current)
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("preserveAspectRatio", "xMidYMid meet");

    svg.selectAll("*").remove();

    if (!data || data.length === 0) return;

    const parseDate = d3.utcParse("%Y-%m-%d");
    const formatYear = d3.utcFormat("%Y");

    const series = data
      .map((d) => {
        const parsed = parseDate(d.date);
        return {
          rawDate: d.date,
          date: parsed || new Date(d.date),
          value: d.value,
        };
      })
      .filter((d) => d.date instanceof Date && !Number.isNaN(d.date));

    if (series.length === 0) return;

    const margin = { top: 16, right: 16, bottom: 40, left: 56 };
    const innerW = width - margin.left - margin.right;
    const innerH = height - margin.top - margin.bottom;

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // X scale (time)
    const x = d3
      .scaleUtc()
      .domain(d3.extent(series, (d) => d.date))
      .range([0, innerW]);

    // Y scale with padding so differences show clearly
    const values = series.map((d) => d.value);
    const minValue = d3.min(values) ?? 0;
    const maxValue = d3.max(values) ?? 0;
    const span = maxValue - minValue || maxValue || 1;
    const pad = span * 0.2;

    const y = d3
      .scaleLinear()
      .domain([minValue - pad, maxValue + pad])
      .nice()
      .range([innerH, 0]);

    // Axes
    const xAxis = d3
      .axisBottom(x)
      .ticks(Math.min(8, series.length))
      .tickFormat((d) => formatYear(d));

    const yAxis = d3.axisLeft(y).ticks(6);

    g.append("g")
      .attr("class", "axis axis--x")
      .attr("transform", `translate(0,${innerH})`)
      .call(xAxis);

    g.append("g").attr("class", "axis axis--y").call(yAxis);

    // Grid
    g.append("g")
      .attr("class", "grid")
      .call(
        d3
          .axisLeft(y)
          .tickSize(-innerW)
          .tickFormat("")
          .ticks(6)
      )
      .selectAll("line")
      .attr("stroke-dasharray", "3 3");

    // Horizontal reference line at 0 anomaly
    if (y(0) >= 0 && y(0) <= innerH) {
      g.append("line")
        .attr("class", "zero-line")
        .attr("x1", 0)
        .attr("x2", innerW)
        .attr("y1", y(0))
        .attr("y2", y(0));
    }

    // Line path
    const line = d3
      .line()
      .x((d) => x(d.date))
      .y((d) => y(d.value));

    g.append("path")
      .datum(series)
      .attr("class", "line-path")
      .attr("fill", "none")
      .attr("d", line);

    // Dots
    const dots = g
      .selectAll(".dot")
      .data(series)
      .enter()
      .append("circle")
      .attr("class", "dot")
      .attr("r", 3)
      .attr("cx", (d) => x(d.date))
      .attr("cy", (d) => y(d.value));

    // INTERACTIVITY: hover focus (circle + label)
    const focusG = g
      .append("g")
      .attr("class", "focus")
      .style("display", "none");

    focusG
      .append("circle")
      .attr("r", 4)
      .attr("class", "focus-dot");

    const focusLabelBg = focusG
      .append("rect")
      .attr("class", "focus-label-bg")
      .attr("rx", 4)
      .attr("ry", 4);

    const focusLabel = focusG
      .append("text")
      .attr("class", "focus-label")
      .attr("x", 0)
      .attr("y", -10);

    const bisectDate = d3.bisector((d) => d.date).center;

    function onMouseMove(event) {
      const [mx] = d3.pointer(event);
      const hoveredDate = x.invert(mx);
      const idx = bisectDate(series, hoveredDate);
      const d = series[idx];
      if (!d) return;

      const cx = x(d.date);
      const cy = y(d.value);

      focusG.style("display", null).attr("transform", `translate(${cx},${cy})`);

      const labelText = `${formatYear(d.date)}: ${d.value.toFixed(2)} °C`;
      focusLabel.text(labelText);

      const bbox = focusLabel.node().getBBox();
      focusLabelBg
        .attr("x", bbox.x - 6)
        .attr("y", bbox.y - 4)
        .attr("width", bbox.width + 12)
        .attr("height", bbox.height + 8);
    }

    function onMouseLeave() {
      focusG.style("display", "none");
    }

    // Transparent overlay for mouse tracking
    g.append("rect")
      .attr("class", "hover-overlay")
      .attr("width", innerW)
      .attr("height", innerH)
      .attr("fill", "none")
      .attr("pointer-events", "all")
      .on("mousemove", onMouseMove)
      .on("mouseleave", onMouseLeave)
      .on("click", (event) => {
        if (!onPointClick) return;
        const [mx] = d3.pointer(event);
        const hoveredDate = x.invert(mx);
        const idx = bisectDate(series, hoveredDate);
        const d = series[idx];
        if (!d) return;
        onPointClick(d.rawDate, d.value);
      });

    // Also allow clicking directly on dots
    if (onPointClick) {
      dots.style("cursor", "pointer").on("click", (_, d) => {
        onPointClick(d.rawDate, d.value);
      });
    }
  }, [data, metricLabel, width, height, onPointClick]);

  return (
    <section className="line-graph">
      <header className="line-graph__header">
        <h2>Temperature Anomaly Over Time</h2>
        <p className="line-graph__subtitle">{metricLabel}</p>
      </header>
      <svg ref={ref} className="line-graph__svg" />
    </section>
  );
};

export default LineGraph;
