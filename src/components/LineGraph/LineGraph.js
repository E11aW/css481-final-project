import { useEffect, useRef } from "react";
import * as d3 from "d3";
import "./LineGrapph.scss"; 

export const LineGraph = ({ width = 640, height = 320 }) => {
  const ref = useRef(null);

  const data = [
    { x: "2010-05", y: 392.5 },
    { x: "2015-05", y: 403.9 },
    { x: "2020-05", y: 416.5 },
    { x: "2023-05", y: 424.0 },
    { x: "2024-05", y: 426.9 },
    { x: "2025-05", y: 429.2 },
  ];

  useEffect(() => {
    const margin = { top: 16, right: 16, bottom: 32, left: 48 };
    const innerW = width - margin.left - margin.right;
    const innerH = height - margin.top - margin.bottom;

    const parseYM = d3.utcParse("%Y-%m");
    const series = data.map(d => ({ date: parseYM(d.x), value: d.y }));

    const svg = d3
      .select(ref.current)
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("preserveAspectRatio", "xMidYMid meet");

    svg.selectAll("*").remove();

    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3.scaleUtc()
      .domain(d3.extent(series, d => d.date))
      .range([0, innerW]);

    const y = d3.scaleLinear()
      .domain(d3.extent(series, d => d.value)).nice()
      .range([innerH, 0]);

    const xAxis = d3.axisBottom(x).ticks(Math.min(6, series.length)).tickFormat(d3.utcFormat("%Y-%m"));
    const yAxis = d3.axisLeft(y).ticks(6);

    g.append("g").attr("class", "axis axis--x").attr("transform", `translate(0,${innerH})`).call(xAxis);
    g.append("g").attr("class", "axis axis--y").call(yAxis);

    // light horizontal grid
    g.append("g")
      .attr("class", "grid")
      .call(d3.axisLeft(y).tickSize(-innerW).tickFormat("").ticks(6))
      .selectAll("line").attr("stroke-dasharray", "3 3");

    const line = d3.line()
      .x(d => x(d.date))
      .y(d => y(d.value));

    g.append("path")
      .datum(series)
      .attr("class", "line-path")
      .attr("fill", "none")
      .attr("d", line);

    // simple dots
    g.selectAll(".dot")
      .data(series)
      .enter()
      .append("circle")
      .attr("class", "dot")
      .attr("r", 3)
      .attr("cx", d => x(d.date))
      .attr("cy", d => y(d.value));
  }, [width, height]);

  return (
    <section className="line-graph">
      <header className="line-graph__header">
        <h2>Atmospheric CO₂</h2>
        <p className="line-graph__subtitle">ppm at selected months (from your JSON)</p>
      </header>
      <svg ref={ref} className="line-graph__svg" />
    </section>
  );
};