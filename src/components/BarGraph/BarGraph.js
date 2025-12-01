// src/components/BarGraph/BarGraph.js
import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import "./BarGraph.scss";

/**
 * Props:
 *  - monthlyData: [{ label: string, value: number }]
 *  - yearlyData:  [{ label: string, value: number }]
 *  - decadeData:  [{ label: string, value: number }]
 *  - width?: number
 *  - height?: number
 *  - subtitle?: string
 *  - onBarClick?: (d: { label: string, value: number, granularity: 'month'|'year'|'decade' }) => void
 */
export const BarGraph = ({
  monthlyData = [],
  yearlyData = [],
  decadeData = [],
  width = 640,
  height = 340,
  subtitle = "Arctic temperature (Open-Meteo 2013–2024)",
  onBarClick,
}) => {
  const ref = useRef(null);
  const [mode, setMode] = useState("decade"); // 'month' | 'year' | 'decade'

  useEffect(() => {
    const svg = d3
      .select(ref.current)
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("preserveAspectRatio", "xMidYMid meet");

    svg.selectAll("*").remove();

    const data =
      mode === "month"
        ? monthlyData
        : mode === "year"
        ? yearlyData
        : decadeData;

    if (!data || data.length === 0) return;

    // More bottom margin in month mode for rotated labels
    const margin =
      mode === "month"
        ? { top: 32, right: 16, bottom: 72, left: 56 }
        : { top: 32, right: 16, bottom: 40, left: 56 };

    const innerW = width - margin.left - margin.right;
    const innerH = height - margin.top - margin.bottom;

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // X scale
    const x = d3
      .scaleBand()
      .domain(data.map((d) => d.label))
      .range([0, innerW])
      .padding(0.3);

    // Y scale – zoom into data range a bit so differences pop more
    const values = data.map((d) => d.value);
    const minValue = d3.min(values) ?? 0;
    const maxValue = d3.max(values) ?? 0;

    const span = maxValue - minValue || maxValue || 1;
    const pad = span * 0.1;

    // Keep 0 in view if values cross or touch 0
    const yMin = minValue > 0 ? Math.max(0, minValue - pad) : minValue - pad;
    const yMax = maxValue + pad;

    const y = d3
      .scaleLinear()
      .domain([yMin, yMax])
      .nice()
      .range([innerH, 0]);

    // Axes
    let xAxis = d3.axisBottom(x);

    // For months, only show every Nth label so it doesn't cram
    if (mode === "month") {
      const domain = x.domain();
      const tickValues = domain.filter((_, i) => i % 6 === 0); // every ~6th month
      xAxis = xAxis.tickValues(tickValues);
    }

    const yAxis = d3.axisLeft(y).ticks(6);

    const xAxisG = g
      .append("g")
      .attr("class", "axis axis--x")
      .attr("transform", `translate(0,${innerH})`)
      .call(xAxis);

    if (mode === "month") {
      xAxisG
        .selectAll("text")
        .attr("transform", "rotate(-45)")
        .attr("text-anchor", "end")
        .attr("dx", "-0.4em")
        .attr("dy", "0.25em");
    }

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

    // Bars
    const bars = g
      .selectAll(".bar")
      .data(data)
      .enter()
      .append("rect")
      .attr("class", "bar")
      .attr("x", (d) => x(d.label))
      .attr("y", (d) => y(d.value))
      .attr("width", x.bandwidth())
      .attr("height", (d) => innerH - y(d.value));

    bars
      .append("title")
      .text((d) => `${d.label}: ${d.value.toFixed(2)}`);

    if (onBarClick) {
      bars.style("cursor", "pointer").on("click", (_, d) => {
        onBarClick({ ...d, granularity: mode });
      });
    }
  }, [mode, monthlyData, yearlyData, decadeData, width, height, onBarClick]);

  return (
    <section className="bar-graph">
      <header className="bar-graph__header">
        <div>
          <h2>Temperature Averages</h2>
          {subtitle && (
            <p className="bar-graph__subtitle">{subtitle}</p>
          )}
        </div>
        <div className="bar-graph__controls">
          <button
            type="button"
            className={
              mode === "month"
                ? "bar-graph__btn bar-graph__btn--active"
                : "bar-graph__btn"
            }
            onClick={() => setMode("month")}
          >
            Months
          </button>
          <button
            type="button"
            className={
              mode === "year"
                ? "bar-graph__btn bar-graph__btn--active"
                : "bar-graph__btn"
            }
            onClick={() => setMode("year")}
          >
            Years
          </button>
          <button
            type="button"
            className={
              mode === "decade"
                ? "bar-graph__btn bar-graph__btn--active"
                : "bar-graph__btn"
            }
            onClick={() => setMode("decade")}
          >
            Decades
          </button>
        </div>
      </header>
      <svg ref={ref} className="bar-graph__svg" />
    </section>
  );
};

export default BarGraph;
