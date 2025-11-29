// src/components/BarGraph/BarGraph.js
import { useEffect, useRef } from "react";
import * as d3 from "d3";
import "./BarGraph.scss";

/**
 * Props:
 *  - data: [{ label: string, value: number }]
 *      e.g. [{ label: "2010s", value: 3.1 }, { label: "2020s", value: 4.2 }]
 *  - width?: number
 *  - height?: number
 *  - title?: string
 *  - subtitle?: string
 *  - onBarClick?: (d: { label: string, value: number }) => void
 */
export const BarGraph = ({
  data = [],
  width = 640,
  height = 340,
  title = "Average Climate Metric by Decade",
  subtitle = "",
  onBarClick,
}) => {
  const ref = useRef(null);

  useEffect(() => {
    if (!data || data.length === 0) return;

    const margin = { top: 32, right: 16, bottom: 40, left: 56 };
    const innerW = width - margin.left - margin.right;
    const innerH = height - margin.top - margin.bottom;

    const svg = d3
      .select(ref.current)
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("preserveAspectRatio", "xMidYMid meet");

    // Clear previous render
    svg.selectAll("*").remove();

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

    // Click interactivity
    if (onBarClick) {
      bars.style("cursor", "pointer").on("click", (_, d) => {
        onBarClick(d);
      });
    }
  }, [data, width, height, onBarClick]);

  return (
    <section className="bar-graph">
      <header className="bar-graph__header">
        <h2>{title}</h2>
        {subtitle && (
          <p className="bar-graph__subtitle">{subtitle}</p>
        )}
      </header>
      <svg ref={ref} className="bar-graph__svg" />
    </section>
  );
};

export default BarGraph;
