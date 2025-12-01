// src/pages/data.js
import React, { useEffect, useMemo, useState } from 'react';
import './data.scss';

import { fetchDailyClimate } from '../../back-end/dataSource';
import { toTableRows } from '../../back-end/climateTransforms';

import { LineGraph } from '../../components/LineGraph/LineGraph';
import { BarGraph } from '../../components/BarGraph/BarGraph';
import { PieGraph } from '../../components/PieGraph/PieGraph';

const DEFAULT_VARIABLE = 'temperature_2m_mean';

const DEFAULT_QUERY = {
  lat: 78.2,
  lon: 15.6,
  start: '2013-01-01',
  end: '2024-12-31',
  model: 'CMCC_CM2_VHR4',
  variable: DEFAULT_VARIABLE,
};

// ---------- localStorage helpers for saved views ----------
const VIEWS_STORAGE_KEY = 'climateDashboardViews';

function loadViewsFromStorage() {
  try {
    const raw = window.localStorage.getItem(VIEWS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

function saveViewsToStorage(views) {
  try {
    window.localStorage.setItem(VIEWS_STORAGE_KEY, JSON.stringify(views));
  } catch {
    // ignore
  }
}

function Data() {
  const [tableRows, setTableRows] = useState([]);
  const [lineSeries, setLineSeries] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [queryParams] = useState(DEFAULT_QUERY);

  // Which graphs are currently visible
  const [showLineGraph, setShowLineGraph] = useState(true);
  const [showBarGraph, setShowBarGraph] = useState(true);
  const [showPieGraph, setShowPieGraph] = useState(true);

  // Saved views (CRUD)
  const [views, setViews] = useState([]);
  const [selectedViewId, setSelectedViewId] = useState(null);
  const [viewDraftName, setViewDraftName] = useState('');
  const [viewsError, setViewsError] = useState(null);

  // Load saved views once
  useEffect(() => {
    const stored = loadViewsFromStorage();
    setViews(stored);
  }, []);

  // Load climate data
  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);

      try {
        const climateRes = await fetchDailyClimate(queryParams);
        const daily = climateRes.daily || {};
        const variableName = queryParams.variable;

        const rows = toTableRows(
          daily,
          variableName,
          `lat=${queryParams.lat}, lon=${queryParams.lon}`,
          1
        );

        setTableRows(rows);

        const yearly = computeYearlyAveragesFromRows(rows);
        const anomalies = buildAnomalySeries(yearly);
        setLineSeries(anomalies);
      } catch (e) {
        console.error(e);
        setError(e.message || 'Failed to load climate data');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [queryParams]);

  const monthlyAverages = useMemo(
    () => computeMonthlyAveragesFromRows(tableRows),
    [tableRows]
  );

  const yearlyAverages = useMemo(
    () => computeYearlyAveragesFromRows(tableRows),
    [tableRows]
  );

  const decadeAverages = useMemo(
    () => computeDecadeAveragesFromRows(tableRows),
    [tableRows]
  );

  const { pieYears, pieDataByYear } = useMemo(
    () => buildPieDataFromRows(tableRows),
    [tableRows]
  );

  // ---------- Saved views CRUD logic ----------

  // A "view" is: which graphs are visible
  // {
  //   id: number,
  //   name: string,
  //   showLine: boolean,
  //   showBar: boolean,
  //   showPie: boolean,
  //   createdAt: string
  // }

  function handleSaveView() {
    setViewsError(null);

    const trimmedName = viewDraftName.trim();
    if (!trimmedName) {
      setViewsError('Please provide a name for the view.');
      return;
    }

    const now = new Date().toISOString();

    if (selectedViewId == null) {
      // CREATE
      const newView = {
        id: Date.now(),
        name: trimmedName,
        showLine: showLineGraph,
        showBar: showBarGraph,
        showPie: showPieGraph,
        createdAt: now,
      };
      const next = [...views, newView];
      setViews(next);
      saveViewsToStorage(next);
      setSelectedViewId(newView.id);
    } else {
      // UPDATE existing
      const next = views.map((v) =>
        v.id === selectedViewId
          ? {
              ...v,
              name: trimmedName,
              showLine: showLineGraph,
              showBar: showBarGraph,
              showPie: showPieGraph,
            }
          : v
      );
      setViews(next);
      saveViewsToStorage(next);
    }
  }

  function handleSelectView(id) {
    setViewsError(null);
    setSelectedViewId(id);
    const v = views.find((view) => view.id === id);
    if (!v) return;
    setViewDraftName(v.name);
    setShowLineGraph(v.showLine);
    setShowBarGraph(v.showBar);
    setShowPieGraph(v.showPie);
  }

  function handleDeleteView(id) {
    setViewsError(null);
    const next = views.filter((v) => v.id !== id);
    setViews(next);
    saveViewsToStorage(next);
    if (selectedViewId === id) {
      setSelectedViewId(null);
      setViewDraftName('');
    }
  }

  function handleNewViewDraft() {
    setViewsError(null);
    setSelectedViewId(null);
    setViewDraftName('');
  }

  // ---------- page states ----------

  if (loading) {
    return (
      <div className="data-page data-page--loading">
        <p>Loading climate data…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="data-page data-page--error">
        <p className="data-page__error-message">{error}</p>
      </div>
    );
  }

  return (
    <div className="data-page">
      {/* graph row */}
      <section className="data-page__section data-page__section--graphs">
        {showLineGraph && (
          <div className="data-page__panel">
            <h2 className="data-page__panel-title">
              Yearly Temperature Anomaly
            </h2>
            <p className="data-page__panel-subtitle">
              Difference from 2013–2015 average (°C) at 78.2°N, 15.6°E.
            </p>
            <LineGraph
              data={lineSeries}
              metricLabel="Anomaly vs 2013–2015 (°C)"
            />
          </div>
        )}

        {showBarGraph && (
          <div className="data-page__panel">
            <h2 className="data-page__panel-title">
              Temperature Averages – Months / Years / Decades
            </h2>
            <BarGraph
              monthlyData={monthlyAverages}
              yearlyData={yearlyAverages}
              decadeData={decadeAverages}
              subtitle="Mean temperature (°C)"
            />
          </div>
        )}
      </section>

      {showPieGraph && (
        <section className="data-page__section">
          <div className="data-page__panel">
            <h2 className="data-page__panel-title">
              Temperature Distribution by Year
            </h2>
            <p className="data-page__panel-subtitle">
              For each year, the share of days falling in different temperature
              ranges.
            </p>
            <PieGraph years={pieYears} dataByYear={pieDataByYear} />
          </div>
        </section>
      )}

      {/* Saved Views (CRUD) */}
      <section className="data-page__section">
        <div className="data-page__panel data-page__panel--views">
          <h2 className="data-page__panel-title">Saved Dashboard Views</h2>
          <p className="data-page__panel-subtitle">
            Configure which graphs are visible, then save that setup as a view.
            You can create, read, update, and delete these views below.
          </p>

          {viewsError && (
            <p className="data-page__views-error">{viewsError}</p>
          )}

          <div className="data-page__views-layout">
            {/* Left: current config + form */}
            <div className="data-page__views-config">
              <h3 className="data-page__views-subtitle">
                Current Graph Selection
              </h3>

              <div className="data-page__views-toggles">
                <label>
                  <input
                    type="checkbox"
                    checked={showLineGraph}
                    onChange={(e) => setShowLineGraph(e.target.checked)}
                  />
                  Line graph: anomaly over time
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={showBarGraph}
                    onChange={(e) => setShowBarGraph(e.target.checked)}
                  />
                  Bar graph: monthly/yearly/decade averages
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={showPieGraph}
                    onChange={(e) => setShowPieGraph(e.target.checked)}
                  />
                  Pie chart: temperature distribution by year
                </label>
              </div>

              <div className="data-page__views-form">
                <h3 className="data-page__views-subtitle">
                  {selectedViewId == null ? 'Create New View' : 'Edit View'}
                </h3>
                <label className="data-page__views-label">
                  View name
                  <input
                    type="text"
                    placeholder="e.g. Line + Pie only"
                    value={viewDraftName}
                    onChange={(e) => setViewDraftName(e.target.value)}
                  />
                </label>

                <div className="data-page__views-buttons">
                  <button type="button" onClick={handleSaveView}>
                    {selectedViewId == null ? 'Save View' : 'Update View'}
                  </button>
                  <button
                    type="button"
                    className="secondary"
                    onClick={handleNewViewDraft}
                  >
                    New
                  </button>
                </div>
              </div>
            </div>

            {/* Right: list of saved views */}
            <div className="data-page__views-list">
              <h3 className="data-page__views-subtitle">Saved Views</h3>
              {views.length === 0 ? (
                <p className="data-page__views-empty">
                  No saved views yet. Configure which graphs you want to see,
                  give it a name, and click "Save View".
                </p>
              ) : (
                views
                  .slice()
                  .sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || ''))
                  .map((view) => (
                    <article
                      key={view.id}
                      className={
                        view.id === selectedViewId
                          ? 'data-page__view-card data-page__view-card--active'
                          : 'data-page__view-card'
                      }
                    >
                      <header className="data-page__view-header">
                        <span className="data-page__view-name">
                          {view.name}
                        </span>
                        <div className="data-page__view-actions">
                          <button
                            type="button"
                            onClick={() => handleSelectView(view.id)}
                          >
                            Apply
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteView(view.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </header>
                      <p className="data-page__view-detail">
                        {view.showLine ? 'Line' : ''}
                        {view.showBar ? (view.showLine ? ' · Bar' : 'Bar') : ''}
                        {view.showPie
                          ? (view.showLine || view.showBar
                              ? ' · Pie'
                              : 'Pie')
                          : ''}
                      </p>
                    </article>
                  ))
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

// ---------- helpers (same as before) ----------

function computeYearlyAveragesFromRows(rows) {
  const byYear = new Map();

  rows.forEach((r) => {
    if (!Number.isFinite(r.value)) return;
    if (!byYear.has(r.year)) {
      byYear.set(r.year, { sum: 0, count: 0 });
    }
    const e = byYear.get(r.year);
    e.sum += r.value;
    e.count += 1;
  });

  return Array.from(byYear.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([year, { sum, count }]) => ({
      label: String(year),
      value: count > 0 ? sum / count : 0,
    }));
}

function computeMonthlyAveragesFromRows(rows) {
  const byYearMonth = new Map();

  rows.forEach((r) => {
    if (!Number.isFinite(r.value)) return;
    const key = `${r.year}-${r.month}`;
    if (!byYearMonth.has(key)) {
      byYearMonth.set(key, {
        year: r.year,
        month: r.month,
        sum: 0,
        count: 0,
      });
    }
    const e = byYearMonth.get(key);
    e.sum += r.value;
    e.count += 1;
  });

  const entries = Array.from(byYearMonth.values()).sort(
    (a, b) => a.year - b.year || a.month - b.month
  );

  return entries.map((e) => ({
    label: `${e.year}-${String(e.month).padStart(2, '0')}`,
    value: e.count > 0 ? e.sum / e.count : 0,
  }));
}

function computeDecadeAveragesFromRows(rows) {
  const byDecade = new Map();

  rows.forEach((r) => {
    if (!Number.isFinite(r.value)) return;
    const decade = Math.floor(r.year / 10) * 10;
    if (!byDecade.has(decade)) {
      byDecade.set(decade, { sum: 0, count: 0 });
    }
    const e = byDecade.get(decade);
    e.sum += r.value;
    e.count += 1;
  });

  return Array.from(byDecade.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([decade, { sum, count }]) => ({
      label: `${decade}s`,
      value: count > 0 ? sum / count : 0,
    }));
}

function buildAnomalySeries(yearly) {
  if (!yearly || yearly.length === 0) return [];

  const baselineCount = Math.min(3, yearly.length);
  const baselineSlice = yearly.slice(0, baselineCount);
  const baselineAvg =
    baselineSlice.reduce((acc, d) => acc + d.value, 0) / baselineCount;

  return yearly.map((d) => ({
    date: `${d.label}-01-01`,
    value: d.value - baselineAvg,
  }));
}

function buildPieDataFromRows(rows) {
  const byYearBuckets = new Map();

  rows.forEach((r) => {
    if (!Number.isFinite(r.value)) return;
    const year = r.year;
    if (!byYearBuckets.has(year)) {
      byYearBuckets.set(year, {
        '< -15°C': 0,
        '-15 to -5°C': 0,
        '-5 to 0°C': 0,
        '0 to 5°C': 0,
        '5 to 10°C': 0,
        '≥ 10°C': 0,
      });
    }
    const buckets = byYearBuckets.get(year);
    const v = r.value;

    if (v < -15) buckets['< -15°C'] += 1;
    else if (v < -5) buckets['-15 to -5°C'] += 1;
    else if (v < 0) buckets['-5 to 0°C'] += 1;
    else if (v < 5) buckets['0 to 5°C'] += 1;
    else if (v < 10) buckets['5 to 10°C'] += 1;
    else buckets['≥ 10°C'] += 1;
  });

  const years = Array.from(byYearBuckets.keys()).sort((a, b) => a - b);
  const dataByYear = {};

  years.forEach((year) => {
    const buckets = byYearBuckets.get(year);
    dataByYear[year] = Object.entries(buckets)
      .filter(([, value]) => value > 0)
      .map(([label, value]) => ({ label, value }));
  });

  return { pieYears: years, pieDataByYear: dataByYear };
}

export default Data;
