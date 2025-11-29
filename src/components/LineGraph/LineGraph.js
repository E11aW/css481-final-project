import { useEffect, useRef } from "react";
import * as d3 from "d3";
import "./LineGraph.scss";

/**
 * Props:
 *  - data: [{ date: "YYYY-MM-DD", value: number }]
 *  - metricLabel?: string (e.g. "Mean temperature (°C)")
 *  - width?: number
 *  - height?: number
 *  - onPointClick?: (date: string, value: number) => void
 */
export const LineGraph = ({
  data = [],
  metricLabel = "Value",
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
    const formatDate = d3.utcFormat("%Y-%m-%d");

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

    const margin = { top: 16, right: 16, bottom: 36, left: 56 };
    const innerW = width - margin.left - margin.right;
    const innerH = height - margin.top - margin.bottom;

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // X scale
    const x = d3
      .scaleUtc()
      .domain(d3.extent(series, (d) => d.date))
      .range([0, innerW]);

    // Y scale with padding for better visual separation
    const values = series.map((d) => d.value);
    const minValue = d3.min(values) ?? 0;
    const maxValue = d3.max(values) ?? 0;
    const span = maxValue - minValue || maxValue || 1;
    const pad = span * 0.1;

    const y = d3
      .scaleLinear()
      .domain([minValue - pad, maxValue + pad])
      .nice()
      .range([innerH, 0]);

    // Axes
    const xAxis = d3
      .axisBottom(x)
      .ticks(6)
      .tickFormat(d3.utcFormat("%Y"));

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

    // Line
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

    // Tooltip via <title>
    dots
      .append("title")
      .text(
        (d) =>
          `${formatDate(d.date)}\n${metricLabel}: ${d.value.toFixed(2)}`
      );

    // Click → bubble up to parent
    if (onPointClick) {
      dots.style("cursor", "pointer").on("click", (_, d) => {
        onPointClick(d.rawDate, d.value);
      });
    }
  }, [data, metricLabel, width, height, onPointClick]);

  return (
    <section className="line-graph">
      <header className="line-graph__header">
        <h2>Temperature Over Time</h2>
        <p className="line-graph__subtitle">{metricLabel}</p>
      </header>
      <svg ref={ref} className="line-graph__svg" />
    </section>
  );
};

export default LineGraph;
