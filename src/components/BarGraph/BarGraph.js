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

    if (!data || data.length === 0) {
      return;
    }

    const margin = { top: 32, right: 16, bottom: 40, left: 56 };
    const innerW = width - margin.left - margin.right;
    const innerH = height - margin.top - margin.bottom;

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Scales
    const x = d3
      .scaleBand()
      .domain(data.map((d) => d.label))
      .range([0, innerW])
      .padding(0.3);

    const maxValue = d3.max(data, (d) => d.value) ?? 0;
    const y = d3
      .scaleLinear()
      .domain([0, maxValue])
      .nice()
      .range([innerH, 0]);

    // Axes
    const xAxis = d3.axisBottom(x);
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

    // Native tooltip
    bars
      .append("title")
      .text((d) => `${d.label}: ${d.value.toFixed(2)}`);

    // Click → bubble up with granularity info
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
