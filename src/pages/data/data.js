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

  const { pieYears, pieDataByYear } = useMemo(
    () => buildPieDataFromRows(tableRows),
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
      <section className="data-page__section data-page__section--graphs">
        <div className="data-page__panel">
          <h2 className="data-page__panel-title">
            Yearly Temperature Anomaly
          </h2>
          <LineGraph
            data={lineSeries}
            metricLabel="Difference from 2013–2015 average (°C)"
            onPointClick={(date, value) => {
              console.log('Line point clicked:', date, value);
            }}
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
            onBarClick={(d) => {
              console.log('Bar clicked:', d);
            }}
          />
        </div>
      </section>

      <section className="data-page__section">
        <div className="data-page__panel">
          <h2 className="data-page__panel-title">
            Temperature Distribution by Year
          </h2>
          <PieGraph years={pieYears} dataByYear={pieDataByYear} />
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

// build anomaly series for line graph
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

// pie data: distribution of days in temperature buckets per year
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
      .filter(([, count]) => count > 0)
      .map(([label, count]) => ({ label, value: count }));
  });

  return { pieYears: years, pieDataByYear: dataByYear };
}

export default Data;
