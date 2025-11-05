import { useEffect, useRef } from "react";
import * as d3 from "d3";
import "./BarGrapph.scss"; 

export const BarGraph = ({ width = 640, height = 340 }) => {
  const ref = useRef(null);

  const years = [2010, 2020, 2023, 2024];
  const series = [
    { key: 'Arctic', values: [4.9, 3.8, 4.2, 4.0] },
    { key: 'Antarctic', values: [19.2, 18.8, 16.8, 17.2] },
  ];

  useEffect(() => {
    const margin = { top: 16, right: 16, bottom: 40, left: 56 };
    const innerW = width - margin.left - margin.right;
    const innerH = height - margin.top - margin.bottom;

    const svg = d3
      .select(ref.current)
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("preserveAspectRatio", "xMidYMid meet");

    svg.selectAll("*").remove();

    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    const x0 = d3.scaleBand().domain(years.map(String)).range([0, innerW]).padding(0.2);
    const x1 = d3.scaleBand().domain(series.map(s => s.key)).range([0, x0.bandwidth()]).padding(0.1);

    const allValues = series.flatMap(s => s.values);
    const y = d3.scaleLinear().domain([0, d3.max(allValues)]).nice().range([innerH, 0]);

    const xAxis = d3.axisBottom(x0);
    const yAxis = d3.axisLeft(y).ticks(6);

    g.append("g").attr("class", "axis axis--x").attr("transform", `translate(0,${innerH})`).call(xAxis);
    g.append("g").attr("class", "axis axis--y").call(yAxis);

    // grid
    g.append("g")
      .attr("class", "grid")
      .call(d3.axisLeft(y).tickSize(-innerW).tickFormat("").ticks(6))
      .selectAll("line").attr("stroke-dasharray", "3 3");

    // groups by year
    const yearG = g.selectAll(".year-group").data(years).enter().append("g")
      .attr("class", "year-group")
      .attr("transform", d => `translate(${x0(String(d))},0)`);

    // bars per series
    yearG.selectAll("rect")
      .data((yr, i) => series.map(s => ({ series: s.key, value: s.values[i] })))
      .enter()
      .append("rect")
      .attr("class", d => `bar bar--${d.series.toLowerCase()}`)
      .attr("x", d => x1(d.series))
      .attr("y", d => y(d.value))
      .attr("width", x1.bandwidth())
      .attr("height", d => innerH - y(d.value));

    // simple legend
    const legend = g.append("g").attr("class", "legend").attr("transform", `translate(0,${-8})`);
    const items = [
      { key: 'Arctic', cls: 'bar--arctic', label: 'Arctic' },
      { key: 'Antarctic', cls: 'bar--antarctic', label: 'Antarctic' },
    ];
    let lx = 0;
    items.forEach(it => {
      const item = legend.append("g").attr("transform", `translate(${lx},0)`);
      item.append("rect").attr("class", `legend-swatch ${it.cls}`).attr("width", 12).attr("height", 12).attr("rx", 2);
      item.append("text").attr("x", 16).attr("y", 10).text(it.label).attr("class", "legend-label");
      lx += item.node().getBBox().width + 16;
    });
  }, [width, height]);

  return (
    <section className="bar-graph">
      <header className="bar-graph__header">
        <h2>September Sea Ice Extent</h2>
        <p className="bar-graph__subtitle">Arctic vs Antarctic (million km²)</p>
      </header>
      <svg ref={ref} className="bar-graph__svg" />
    </section>
  );
};