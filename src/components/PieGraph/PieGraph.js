import { useEffect, useMemo, useRef, useState } from "react";
import * as d3 from "d3";
import "./PieGraph.scss";

/**
 * Props:
 *  - rows: [{ year: number, value: number }]
 *    (you can pass your tableRows; only year + value are used)
 */
export const PieGraph = ({ rows = [], width = 360, height = 320 }) => {
  const svgRef = useRef(null);

  // -------- derive available years from data --------
  const years = useMemo(() => {
    const set = new Set();
    rows.forEach((r) => {
      if (Number.isFinite(r.year)) set.add(r.year);
    });
    return Array.from(set).sort((a, b) => a - b);
  }, [rows]);

  const [year, setYear] = useState(null);

  useEffect(() => {
    if (years.length === 0) return;
    if (year == null || !years.includes(year)) {
      setYear(years[years.length - 1]); // default to last (latest) year
    }
  }, [years, year]);

  // -------- bucket / range CRUD state --------
  const [ranges, setRanges] = useState([]);

  // load saved ranges from localStorage (if any)
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem("pieTemperatureRanges");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setRanges(parsed);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  const saveRangesToStorage = (nextRanges) => {
    setRanges(nextRanges);
    try {
      window.localStorage.setItem(
        "pieTemperatureRanges",
        JSON.stringify(nextRanges)
      );
    } catch {
      // ignore
    }
  };

  // handler: add new blank range
  const handleAddRange = () => {
    const newRange = {
      id: Date.now(),
      label: "New range",
      min: "",
      max: "",
    };
    const next = [...ranges, newRange];
    setRanges(next);
  };

  // handler: update a field of a range
  const handleChangeRangeField = (id, field, value) => {
    const next = ranges.map((r) =>
      r.id === id ? { ...r, [field]: value } : r
    );
    setRanges(next);
  };

  // handler: delete range
  const handleDeleteRange = (id) => {
    const next = ranges.filter((r) => r.id !== id);
    saveRangesToStorage(next);
  };

  // handler: save all ranges (persist to localStorage)
  const handleSaveRanges = () => {
    // sanitize min/max as numbers or null
    const cleaned = ranges
      .map((r) => {
        const minNum =
          r.min === "" || r.min == null ? null : Number(r.min);
        const maxNum =
          r.max === "" || r.max == null ? null : Number(r.max);
        if (
          (minNum != null && Number.isNaN(minNum)) ||
          (maxNum != null && Number.isNaN(maxNum))
        ) {
          return null;
        }
        return {
          id: r.id,
          label: r.label || "Range",
          min: minNum,
          max: maxNum,
        };
      })
      .filter(Boolean);
    saveRangesToStorage(cleaned);
  };

  // -------- compute current year's bucketed data based on ranges --------
  const currentYearData = useMemo(() => {
    if (year == null || rows.length === 0 || ranges.length === 0) return [];

    const yearRows = rows.filter((r) => r.year === year && Number.isFinite(r.value));
    if (yearRows.length === 0) return [];

    const buckets = ranges.map((r) => ({
      id: r.id,
      label: r.label || "Range",
      min: r.min === "" ? null : r.min,
      max: r.max === "" ? null : r.max,
      count: 0,
    }));

    yearRows.forEach((r) => {
      const v = r.value;
      for (const b of buckets) {
        const minOk = b.min == null || v >= b.min;
        const maxOk = b.max == null || v < b.max;
        if (minOk && maxOk) {
          b.count += 1;
          break;
        }
      }
    });

    return buckets.filter((b) => b.count > 0);
  }, [rows, ranges, year]);

  // -------- D3 render --------
  useEffect(() => {
    const svg = d3
      .select(svgRef.current)
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("preserveAspectRatio", "xMidYMid meet");

    svg.selectAll("*").remove();

    if (!currentYearData.length) {
      // nothing to draw
      return;
    }

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
      .value((d) => d.count)
      .sort(null);

    const arc = d3
      .arc()
      .innerRadius(radius * 0.45)
      .outerRadius(radius * 0.9);

    const arcHover = d3
      .arc()
      .innerRadius(radius * 0.45)
      .outerRadius(radius * 1.02);

    const labels = currentYearData.map((d) => d.label);
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
      .data(pieGen(currentYearData))
      .enter()
      .append("path")
      .attr("class", "pie-slice")
      .attr("d", arc)
      .attr("fill", (d) => color(d.data.label));

    // tooltip via <title>
    arcs
      .append("title")
      .text((d) => {
        const total = d3.sum(currentYearData, (x) => x.count) || 1;
        const pct = (100 * (d.data.count / total)).toFixed(1);
        return `${d.data.label}: ${d.data.count} days (${pct}%)`;
      });

    // hover enlarge
    arcs
      .on("mouseenter", function (_, d) {
        d3.select(this).transition().duration(150).attr("d", arcHover(d));
      })
      .on("mouseleave", function (_, d) {
        d3.select(this).transition().duration(150).attr("d", arc(d));
      });

    // center label
    const total = d3.sum(currentYearData, (x) => x.count) || 1;
    const top = [...currentYearData].sort((a, b) => b.count - a.count)[0];

    if (top) {
      const center = g.append("g").attr("class", "pie-center");
      center
        .append("text")
        .attr("class", "pie-center__value")
        .attr("y", -4)
        .text(`${((top.count / total) * 100).toFixed(1)}%`);
      center
        .append("text")
        .attr("class", "pie-center__label")
        .attr("y", 14)
        .text(top.label);
    }

    // simple legend
    const legend = svg
      .append("g")
      .attr(
        "transform",
        `translate(${margin.left + 8},${margin.top + innerH - 4})`
      )
      .attr("class", "pie-legend");

    let lx = 0;
    currentYearData.forEach((d) => {
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
  }, [currentYearData, width, height]);

  if (!years.length) {
    return (
      <section className="pie-graph">
        <header className="pie-graph__header">
          <div>
            <h2>Temperature Distribution</h2>
            <p className="pie-graph__subtitle">
              No climate data available yet.
            </p>
          </div>
        </header>
      </section>
    );
  }

  const minYear = years[0];
  const maxYear = years[years.length - 1];

  const chartHasData =
    currentYearData.length > 0 && ranges.length > 0 && year != null;

  return (
    <section className="pie-graph">
      <header className="pie-graph__header">
        <div>
          <h2>Temperature Distribution by Year</h2>
          <p className="pie-graph__subtitle">
            Start by adding your own temperature ranges below, then use the
            year slider to see the distribution.
          </p>
        </div>
        <div className="pie-graph__controls">
          <label className="pie-graph__slider-label">
            Year: <span>{year ?? maxYear}</span>
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

      <div className="pie-graph__body">
        <div className="pie-graph__chart-area">
          {!chartHasData ? (
            <div className="pie-graph__empty">
              <p>
                No ranges defined or no data for the selected year. Add ranges
                below and click <strong>Save Ranges</strong> to see the chart.
              </p>
            </div>
          ) : (
            <svg ref={svgRef} className="pie-graph__svg" />
          )}
        </div>

        <div className="pie-graph__ranges">
          <h3 className="pie-graph__ranges-title">
            Manage Temperature Ranges (CRUD)
          </h3>
          <p className="pie-graph__ranges-help">
            Each range uses <code>min ≤ value &lt; max</code>. Leave min or max
            blank to make it open-ended.
          </p>

          {ranges.length === 0 ? (
            <p className="pie-graph__ranges-empty">
              No ranges yet. Click <strong>Add Range</strong> to create one.
            </p>
          ) : null}

          {ranges.map((r) => (
            <div key={r.id} className="pie-graph__range-row">
              <input
                className="pie-graph__range-input pie-graph__range-input--label"
                type="text"
                value={r.label}
                onChange={(e) =>
                  handleChangeRangeField(r.id, "label", e.target.value)
                }
                placeholder="Label (e.g. Very cold)"
              />
              <input
                className="pie-graph__range-input"
                type="number"
                value={r.min}
                onChange={(e) =>
                  handleChangeRangeField(r.id, "min", e.target.value)
                }
                placeholder="Min °C"
              />
              <input
                className="pie-graph__range-input"
                type="number"
                value={r.max}
                onChange={(e) =>
                  handleChangeRangeField(r.id, "max", e.target.value)
                }
                placeholder="Max °C"
              />
              <button
                type="button"
                className="pie-graph__btn pie-graph__btn--delete"
                onClick={() => handleDeleteRange(r.id)}
              >
                Delete Range
              </button>
            </div>
          ))}

          <div className="pie-graph__ranges-buttons">
            <button
              type="button"
              className="pie-graph__btn pie-graph__btn--add"
              onClick={handleAddRange}
            >
              Add Range
            </button>
            <button
              type="button"
              className="pie-graph__btn pie-graph__btn--save"
              onClick={handleSaveRanges}
            >
              Save Ranges
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PieGraph;
