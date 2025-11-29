// src/pages/data.js
import React, { useEffect, useMemo, useState } from 'react';
import './data.scss';

import { fetchDailyClimate } from '../../back-end/dataSource';
import { toTableRows } from '../../back-end/climateTransforms';
import { BarGraph } from '../../components/BarGraph/BarGraph';

const DEFAULT_VARIABLE = 'temperature_2m_mean';

const DEFAULT_QUERY = {
  lat: 78.2,
  lon: 15.6,
  start: '2013-01-01', // within Open-Meteo allowed range
  end: '2024-12-31',
  model: 'CMCC_CM2_VHR4',
  variable: DEFAULT_VARIABLE,
};

function Data() {
  const [tableRows, setTableRows] = useState([]);
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

        // Single datasetId = 1 for now
        const rows = toTableRows(
          daily,
          variableName,
          `lat=${queryParams.lat}, lon=${queryParams.lon}`,
          1
        );

        setTableRows(rows);
      } catch (e) {
        console.error(e);
        setError(e.message || 'Failed to load data');
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
      <section className="data-page__section">
        <div className="data-page__panel">
          <h2 className="data-page__panel-title">
            Temperature Averages – Bar Graph Test
          </h2>
          <p className="data-page__panel-subtitle">
            Mean temperature (°C) from Open-Meteo climate data, aggregated by
            month / year / decade.
          </p>

          <BarGraph
            monthlyData={monthlyAverages}
            yearlyData={yearlyAverages}
            decadeData={decadeAverages}
            subtitle="Mean temperature (°C)"
          />
        </div>
      </section>
    </div>
  );
}

// ---------- helpers to build monthly / yearly / decade datasets ----------

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
    label: `${e.year}-${String(e.month).padStart(2, '0')}`, // e.g. "2013-01"
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

export default Data;
