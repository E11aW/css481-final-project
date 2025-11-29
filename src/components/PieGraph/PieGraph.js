import { useEffect, useMemo, useRef, useState } from "react";
import * as d3 from "d3";
import "./PieGraph.scss";

/**
 * Props:
 *  - years: number[]
 *  - dataByYear: { [year: number]: { label: string, value: number }[] }
 *  - width?: number
 *  - height?: number
 */
export const PieGraph = ({
  years = [],
  dataByYear = {},
  width = 360,
  height = 320,
}) => {
  const ref = useRef(null);
  const [year, setYear] = useState(
    years.length ? years[years.length - 1] : null
  );

  useEffect(() => {
    if (!years.length) return;
    if (year == null || !years.includes(year)) {
      setYear(years[years.length - 1]);
    }
  }, [years, year]);

  const currentData = useMemo(() => {
    if (year == null) return [];
    return dataByYear[year] || [];
  }, [dataByYear, year]);

  useEffect(() => {
    const svg = d3
      .select(ref.current)
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("preserveAspectRatio", "xMidYMid meet");

    svg.selectAll("*").remove();

    if (!currentData.length) return;

    const margin = { top: 8, right: 8, bottom: 8, left: 8 };
    const innerW = width - margin.left - margin.right;
    const innerH = height - margin.top - margin.bottom;
    const radius = Math.min(innerW, innerH) / 2;

    const g = svg
      .append("g")
      .attr(
        "transform",
        `translate(${margin.left + innerW / 2},${margin.top + innerH / 2})`
      );

    const pieGen = d3
      .pie()
      .value((d) => d.value)
      .sort(null);

    const arc = d3
      .arc()
      .innerRadius(radius * 0.45)
      .outerRadius(radius * 0.9);

    const arcHover = d3
      .arc()
      .innerRadius(radius * 0.45)
      .outerRadius(radius * 1.02);

    const labels = currentData.map((d) => d.label);
    const color = d3
      .scaleOrdinal()
      .domain(labels)
      .range([
        "#5C84B6", // DeepBlue
        "#F7C6B0", // LightOrange
        "#f6ae8d", // SunsetOrange
        "#CAD5E4", // SteelGray
        "#907c7c", // Brown-ish
        "#F0EDF3", // OffWhite
      ]);

    const arcs = g
      .selectAll("path")
      .data(pieGen(currentData))
      .enter()
      .append("path")
      .attr("class", "pie-slice")
      .attr("d", arc)
      .attr("fill", (d) => color(d.data.label));

    // Tooltip via <title>
    arcs
      .append("title")
      .text((d) => {
        const total = d3.sum(currentData, (x) => x.value) || 1;
        const pct = (100 * (d.data.value / total)).toFixed(1);
        return `${d.data.label}: ${d.data.value} days (${pct}%)`;
      });

    // Hover enlarge
    arcs
      .on("mouseenter", function (_, d) {
        d3.select(this).transition().duration(150).attr("d", arcHover(d));
      })
      .on("mouseleave", function (_, d) {
        d3.select(this).transition().duration(150).attr("d", arc(d));
      });

    // Center label (dominant slice)
    const total = d3.sum(currentData, (x) => x.value) || 1;
    const top = [...currentData].sort((a, b) => b.value - a.value)[0];

    if (top) {
      const center = g.append("g").attr("class", "pie-center");

      center
        .append("text")
        .attr("class", "pie-center__value")
        .attr("y", -4)
        .text(`${((top.value / total) * 100).toFixed(1)}%`);

      center
        .append("text")
        .attr("class", "pie-center__label")
        .attr("y", 14)
        .text(top.label);
    }

    // Legend
    const legend = svg
      .append("g")
      .attr(
        "transform",
        `translate(${margin.left + 8},${margin.top + innerH - 4})`
      )
      .attr("class", "pie-legend");

    let lx = 0;
    currentData.forEach((d) => {
      const item = legend
        .append("g")
        .attr("transform", `translate(${lx},0)`);

      item
        .append("rect")
        .attr("width", 10)
        .attr("height", 10)
        .attr("rx", 2)
        .attr("class", "pie-legend__swatch")
        .attr("fill", color(d.label));

      item
        .append("text")
        .attr("x", 14)
        .attr("y", 9)
        .attr("class", "pie-legend__label")
        .text(d.label);

      lx += item.node().getBBox().width + 12;
    });
  }, [currentData, width, height]);

  if (!years.length) {
    return null;
  }

  const minYear = years[0];
  const maxYear = years[years.length - 1];

  return (
    <section className="pie-graph">
      <header className="pie-graph__header">
        <div>
          <h2>Yearly Temperature Distribution</h2>
          <p className="pie-graph__subtitle">
            Share of days in each temperature range
          </p>
        </div>
        <div className="pie-graph__controls">
          <label className="pie-graph__slider-label">
            Year: <span>{year}</span>
          </label>
          <input
            type="range"
            min={minYear}
            max={maxYear}
            step={1}
            value={year ?? maxYear}
            onChange={(e) => setYear(Number(e.target.value))}
            className="pie-graph__slider"
          />
        </div>
      </header>
      <svg ref={ref} className="pie-graph__svg" />
    </section>
  );
};

export default PieGraph;
