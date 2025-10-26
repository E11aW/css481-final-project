import { useEffect, useMemo, useState } from "react";
import "./data.scss";

import { Button } from "../../components/Button/Button";
import Filters from "../../components/Filters/Filters";
import Table from "../../components/Table/Table";

import {
  listDatasets,
  searchMeasurements,
  latestYear,
  groupByDataset,
  extremes,
  trends,
  summaryStats
} from "./dataSource";

export default function DataPage() {
  const [datasets, setDatasets] = useState([]);
  const [state, setState] = useState({
    datasetId: 0,
    month: "All",
    yearMin: null,
    yearMax: null,
    sort: "year ASC, month ASC",
    page: 1,
    pageSize: 10,
  });
  const [data, setData] = useState({ rows: [], total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // Derived views (for 5+ sections)
  const [view, setView] = useState("all"); // 'all' | 'latest' | 'byDataset' | 'extremes' | 'trends' | 'summary'

  const [latestRows, setLatestRows] = useState([]);
  const [byDataset, setByDataset] = useState([]);
  const [extremeRows, setExtremeRows] = useState([]);
  const [trendRows, setTrendRows] = useState([]);
  const [stats, setStats] = useState(null);

  const { datasetId, month, yearMin, yearMax, sort, page, pageSize } = state;

  useEffect(() => {
    let alive = true;
    (async () => {
      const ds = await listDatasets();
      if (!alive) return;
      setDatasets(ds);

      // precompute section data
      const ly = latestYear();
      const g = groupByDataset();
      const latest = Object.values(g).flatMap(group =>
        group.values.filter(r => r.year === ly)
      ).sort((a,b)=>a.dataset_id-b.dataset_id);

      setLatestRows(latest);
      setByDataset(Object.values(g));
      setExtremeRows(extremes());
      setTrendRows(trends());
      setStats(summaryStats());
    })();
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setErr("");
    (async () => {
      try {
        const res = await searchMeasurements({
          datasetId: datasetId || undefined,
          month: month === "All" ? undefined : month,
          yearMin, yearMax, sort, page, pageSize
        });
        if (alive) setData(res);
      } catch (e) {
        if (alive) setErr("Failed to load data.");
        // eslint-disable-next-line no-console
        console.error(e);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [datasetId, month, yearMin, yearMax, sort, page, pageSize]);

  const reset = () =>
    setState({
      datasetId: 0,
      month: "All",
      yearMin: null,
      yearMax: null,
      sort: "year ASC, month ASC",
      page: 1,
      pageSize: 10,
    });

  const nextPage = () => setState(s => ({ ...s, page: Math.min(s.page + 1, data.pages) }));
  const prevPage = () => setState(s => ({ ...s, page: Math.max(1, s.page - 1) }));

  const title = useMemo(() => "Climate & Ice Dashboard", []);

  // dynamic color helper (styling requirement)
  const valueColor = (datasetName, value) => {
    if (datasetName.includes("CO₂")) return value >= 420 ? "#b91c1c" : "#14532d";                   // red vs green
    if (datasetName.includes("Temperature")) return value >= 1.0 ? "#b91c1c" : "#ca8a04";          // red vs amber
    if (datasetName.includes("Arctic Sea Ice")) return value <= 4.0 ? "#b91c1c" : "#1d4ed8";       // red vs blue
    if (datasetName.includes("Antarctic Sea Ice")) return value <= 18.0 ? "#b91c1c" : "#1d4ed8";   // red vs blue
    return "#374151";
  };

  return (
    <section className="data" id="dashboard">
      <header className="data__header">
        <h1>{title}</h1>
        <p className="data__sub">
          Explore JSON-backed indicators: Arctic/Antarctic sea ice, global temperature anomaly, and atmospheric CO₂.
        </p>
      </header>

      {/* ===== Buttons (≥5) ===== */}
      <div className="data__actions" role="group" aria-label="Dashboard actions">
        <Button onClick={() => setView("all")}>Show All (table)</Button>
        <Button onClick={() => setView("latest")}>Latest Year</Button>
        <Button onClick={() => setView("byDataset")}>By Dataset</Button>
        <Button onClick={() => setView("extremes")}>Extremes</Button>
        <Button onClick={() => setView("trends")}>Trends</Button>
        <Button onClick={() => setView("summary")}>Summary</Button>
        <Button onClick={reset} variant="secondary">Reset Filters</Button>
      </div>

      {/* ===== Filters (affect the table view) ===== */}
      <Filters datasets={datasets} state={state} setState={setState} onReset={reset} />

      {/* ===== Meta / Pagination ===== */}
      <div className="data__meta">
        {loading ? (
          <span>Loading…</span>
        ) : (
          <>
            <span>Showing <strong>{data.rows.length}</strong> of <strong>{data.total}</strong></span>
            <span>Page {state.page} / {data.pages}</span>
          </>
        )}
      </div>

      {/* ===== 5+ Sections (by id) ===== */}
      <div className="data__sections">
        {/* 1) Full table */}
        {view === "all" && (
          <section id="section-table">
            <h2>All Data</h2>
            {err ? <p style={{ color: "crimson" }}>{err}</p> : <Table rows={data.rows} />}
            <div className="data__pagination">
              <Button onClick={prevPage} disabled={state.page === 1 || loading}>‹ Prev</Button>
              <Button onClick={nextPage} disabled={state.page === data.pages || loading}>Next ›</Button>
            </div>
          </section>
        )}

        {/* 2) Latest year snapshot */}
        {view === "latest" && (
          <section id="section-latest">
            <h2>Latest Year Snapshot</h2>
            <div className="cards">
              {latestRows.map(r => (
                <div key={`${r.dataset_id}-${r.year}-${r.month}`} className="card"
                     style={{ borderColor: valueColor(r.dataset, r.value) }}>
                  <h3>{r.dataset}</h3>
                  <p><strong>{r.year}-{String(r.month).padStart(2,"0")}</strong></p>
                  <p style={{ color: valueColor(r.dataset, r.value) }}>
                    {r.value} {r.unit}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 3) By dataset (grouped) */}
        {view === "byDataset" && (
          <section id="section-by-dataset">
            <h2>By Dataset</h2>
            <div className="groups">
              {byDataset.map(g => (
                <div key={g.dataset_id} className="group">
                  <h3>{g.dataset} <small>({g.unit})</small></h3>
                  <div className="chips">
                    {g.values
                      .slice()
                      .sort((a,b)=>a.year-b.year||a.month-b.month)
                      .map(v => (
                        <span
                          key={`${g.dataset_id}-${v.year}-${v.month}`}
                          className="chip"
                          style={{ background: "#f3f4f6", color: valueColor(g.dataset, v.value), borderColor: valueColor(g.dataset, v.value) }}
                        >
                          {v.year}-{String(v.month).padStart(2,"0")}: {v.value}
                        </span>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 4) Extremes (min/max) */}
        {view === "extremes" && (
          <section id="section-extremes">
            <h2>Extremes</h2>
            <div className="cards wide">
              {extremeRows.map(x => (
                <div key={x.dataset} className="card">
                  <h3>{x.dataset}</h3>
                  <div className="row">
                    <div>
                      <p className="label">Min</p>
                      <p style={{ color: valueColor(x.dataset, x.min.value) }}>
                        {x.min.value} {x.unit}
                      </p>
                      <small>{x.min.year}-{String(x.min.month).padStart(2,"0")}</small>
                    </div>
                    <div>
                      <p className="label">Max</p>
                      <p style={{ color: valueColor(x.dataset, x.max.value) }}>
                        {x.max.value} {x.unit}
                      </p>
                      <small>{x.max.year}-{String(x.max.month).padStart(2,"0")}</small>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 5) Trends (first->last delta) */}
        {view === "trends" && (
          <section id="section-trends">
            <h2>Trends</h2>
            <ul className="trendlist">
              {trendRows.map(t => (
                <li key={t.dataset}>
                  <strong>{t.dataset}:</strong>{" "}
                  {t.first.year}→{t.last.year} Δ{" "}
                  <span style={{ color: valueColor(t.dataset, t.delta >= 0 ? t.last.value : t.first.value) }}>
                    {t.delta.toFixed(2)} {t.unit}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* 6) Summary */}
        {view === "summary" && stats && (
          <section id="section-summary">
            <h2>Summary</h2>
            <p>Total measurements: <strong>{stats.count}</strong></p>
            <p>Average value (all rows): <strong>{stats.avg}</strong></p>
            <p>Coverage: <strong>{stats.minYear}</strong> to <strong>{stats.maxYear}</strong></p>
          </section>
        )}
      </div>
    </section>
  );
}