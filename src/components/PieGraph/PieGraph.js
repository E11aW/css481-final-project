// src/components/PieGraph/PieGraph.js
import { useEffect, useMemo, useRef, useState } from "react";
import * as d3 from "d3";
import "./PieGraph.scss";

/**
 * Props:
 *  - rows: [{ year: number, value: number }]
 */
export const PieGraph = ({ rows = [], width = 360, height = 320 }) => {
  const svgRef = useRef(null);

  // ---------- years from data ----------
  const years = useMemo(() => {
    const set = new Set();
    rows.forEach((r) => {
      if (Number.isFinite(r.year)) set.add(r.year);
    });
    return Array.from(set).sort((a, b) => a - b);
  }, [rows]);

  const [year, setYear] = useState(null);

  useEffect(() => {
    if (!years.length) return;
    if (year == null || !years.includes(year)) {
      setYear(years[years.length - 1]);
    }
  }, [years, year]);

  // ---------- ranges + errors ----------
  const [ranges, setRanges] = useState([]);
  const [rangesError, setRangesError] = useState(null);

  // load saved ranges
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

  const saveRangesToStorage = (next) => {
    setRanges(next);
    try {
      window.localStorage.setItem(
        "pieTemperatureRanges",
        JSON.stringify(next)
      );
    } catch {
      // ignore
    }
  };

  // helper: pretty default label from min/max
  function formatRangeLabel(min, max) {
    const hasMin = min != null;
    const hasMax = max != null;
    if (hasMin && hasMax) return `${min} to ${max}°C`;
    if (hasMin && !hasMax) return `≥ ${min}°C`;
    if (!hasMin && hasMax) return `< ${max}°C`;
    return "All temperatures";
  }

  // ---------- CRUD handlers ----------
  const handleAddRange = () => {
    setRangesError(null);
    const newRange = {
      id: Date.now(),
      label: "New range",
      min: "",
      max: "",
    };
    setRanges((prev) => [...prev, newRange]);
  };

  const handleChangeRangeField = (id, field, value) => {
    setRangesError(null);
    setRanges((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    );
  };

  const handleDeleteRange = (id) => {
    setRangesError(null);
    const next = ranges.filter((r) => r.id !== id);
    saveRangesToStorage(next);
  };

  const handleSaveRanges = () => {
    setRangesError(null);

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
          setRangesError("Min and Max must be valid numbers or blank.");
          return null;
        }

        if (minNum != null && maxNum != null && minNum >= maxNum) {
          setRangesError("For each range, Min must be less than Max.");
          return null;
        }

        const trimmedLabel = (r.label || "").trim();
        const label =
          trimmedLabel && trimmedLabel !== "New range"
            ? trimmedLabel
            : formatRangeLabel(minNum, maxNum);

        return {
          id: r.id,
          label,
          min: minNum,
          max: maxNum,
        };
      })
      .filter(Boolean);

    if (!cleaned.length) {
      saveRangesToStorage([]);
      return;
    }

    // no-overlap check (no range within / overlapping another)
    const intervals = cleaned
      .map((r) => ({
        ...r,
        effMin: r.min == null ? -Infinity : r.min,
        effMax: r.max == null ? Infinity : r.max,
      }))
      .sort((a, b) => a.effMin - b.effMin);

    for (let i = 1; i < intervals.length; i++) {
      if (intervals[i].effMin < intervals[i - 1].effMax) {
        setRangesError(
          "Ranges cannot overlap or sit inside each other. Adjust Min/Max so each range is distinct."
        );
        return;
      }
    }

    saveRangesToStorage(cleaned);
  };

  // ---------- compute bucketed data ----------
  const currentYearData = useMemo(() => {
    if (year == null || !rows.length || !ranges.length) return [];

    const yearRows = rows.filter(
      (r) => r.year === year && Number.isFinite(r.value)
    );
    if (!yearRows.length) return [];

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

  // ---------- D3 render ----------
  useEffect(() => {
    const svg = d3
      .select(svgRef.current)
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("preserveAspectRatio", "xMidYMid meet");

    svg.selectAll("*").remove();

    if (!currentYearData.length) return;

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

    const total = d3.sum(currentYearData, (x) => x.count) || 1;
    const percentByLabel = new Map(
      currentYearData.map((d) => [d.label, (d.count / total) * 100])
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

    arcs
      .append("title")
      .text((d) => {
        const pct = percentByLabel.get(d.data.label) || 0;
        return `${d.data.label}: ${d.data.count} days (${pct.toFixed(1)}%)`;
      });

    arcs
      .on("mouseenter", function (_, d) {
        d3.select(this).transition().duration(150).attr("d", arcHover(d));
      })
      .on("mouseleave", function (_, d) {
        d3.select(this).transition().duration(150).attr("d", arc(d));
      });

    const top = [...currentYearData].sort((a, b) => b.count - a.count)[0];

    if (top) {
      const center = g.append("g").attr("class", "pie-center");
      const pct = percentByLabel.get(top.label) || 0;

      center
        .append("text")
        .attr("class", "pie-center__value")
        .attr("y", -4)
        .text(`${pct.toFixed(1)}%`);

      center
        .append("text")
        .attr("class", "pie-center__label")
        .attr("y", 14)
        .text(top.label);
    }

    // legend with explicit percentages
    const legend = svg
      .append("g")
      .attr(
        "transform",
        `translate(${margin.left + 8},${margin.top + innerH - 4})`
      )
      .attr("class", "pie-legend");

    let lx = 0;
    currentYearData.forEach((d) => {
      const pct = percentByLabel.get(d.label) || 0;

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
        .text(`${d.label} – ${pct.toFixed(1)}%`);

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
            Add ranges below, then use the year slider to see what percentage of
            days fall into each range.
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
                No matching data for the selected year and ranges. Add ranges
                and click <strong>Save Ranges</strong>, then check the year.
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
            Ranges cannot overlap. Each range uses{" "}
            <code>min ≤ value &lt; max</code>. Leave Min or Max blank to make it
            open-ended.
          </p>

          {rangesError && (
            <p className="pie-graph__ranges-error">{rangesError}</p>
          )}

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
