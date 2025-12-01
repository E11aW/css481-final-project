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

function Data() {
  const [tableRows, setTableRows] = useState([]);
  const [lineSeries, setLineSeries] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [queryParams] = useState(DEFAULT_QUERY);

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
      {/* top row: line + bar */}
      <section className="data-page__section data-page__section--graphs">
        <div className="data-page__panel">
          <h2 className="data-page__panel-title">Yearly Temperature Anomaly</h2>
          <p className="data-page__panel-subtitle">
            Difference from 2013–2015 average (°C) at 78.2°N, 15.6°E.
          </p>
          <LineGraph
            data={lineSeries}
            metricLabel="Anomaly vs 2013–2015 (°C)"
          />
        </div>

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
      </section>

      {/* pie with CRUD ranges */}
      <section className="data-page__section">
        <div className="data-page__panel">
          <h2 className="data-page__panel-title">
            Custom Temperature Range Distribution
          </h2>
          <p className="data-page__panel-subtitle">
            Use the controls inside this panel to create, edit, and delete your
            own temperature ranges. The pie chart updates based on your ranges
            (CRUD within the graph).
          </p>
          <PieGraph rows={tableRows} />
        </div>
      </section>
    </div>
  );
}

// ---------- helpers ----------

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

// build anomaly line series from yearly averages
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

export default Data;
