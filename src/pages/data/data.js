// src/pages/data.js
import React, { useEffect, useMemo, useState } from 'react';
import './data.scss';

// Adjust these paths to match your project structure
import { fetchDailyClimate, fetchNotes } from '../../back-end/dataSource';
import {
  toLineSeries,
  toMonthlyHeatmapPoints,
  toTableRows,
} from '../../back-end/climateTransforms';

import ActionBar from '../../components/ActionBar/ActionBar';
import Filters from '../../components/Filters/Filters';
import Table from '../../components/Table/Table';
import { LineGraph } from '../../components/LineGraph/LineGraph';
import { BarGraph } from '../../components/BarGraph/BarGraph';
import D3HeatMap from '../../components/D3HeatMap/D3HeatMap';

const DEFAULT_VARIABLE = 'temperature_2m_mean';

// Single dataset for now, but shaped like the old static config
const DATASETS = [
  {
    id: 1,
    name: 'Arctic mean temperature (°C)',
  },
];

const DEFAULT_QUERY = {
  lat: 78.2,
  lon: 15.6,
  start: '2013-01-01',   // within Open-Meteo allowed range
  end: '2024-12-31',
  model: 'CMCC_CM2_VHR4',
  variable: DEFAULT_VARIABLE,
};

// Default filter state matching Filters.js expectations
const DEFAULT_FILTER_STATE = {
  datasetId: 0,                 // 0 = All datasets (per Filters.js)
  month: 0,                     // 0 = All months
  yearMin: 2013,
  yearMax: 2024,
  sort: 'year ASC, month ASC',
};

function Data() {
  const [climate, setClimate] = useState(null);
  const [lineData, setLineData] = useState([]);
  const [heatmapPoints, setHeatmapPoints] = useState([]);
  const [tableRows, setTableRows] = useState([]);
  const [notes, setNotes] = useState([]);

  const [queryParams] = useState(DEFAULT_QUERY);
  const [filterState, setFilterState] = useState(DEFAULT_FILTER_STATE);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load climate data + notes
  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);

      try {
        const climateRes = await fetchDailyClimate(queryParams);
        const daily = climateRes.daily || {};
        const variableName = queryParams.variable;

        const line = toLineSeries(daily, variableName);
        const heatmap = toMonthlyHeatmapPoints(daily, variableName);
        // Just one dataset for now: id = 1
        const rows = toTableRows(
          daily,
          variableName,
          `lat=${queryParams.lat}, lon=${queryParams.lon}`,
          1
        );

        setClimate(climateRes);
        setLineData(line);
        setHeatmapPoints(heatmap);
        setTableRows(rows);

        const notesRes = await fetchNotes();
        setNotes(notesRes);
      } catch (e) {
        console.error(e);
        setError(e.message || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [queryParams]);

  // Derived filtered + sorted rows based on filterState
  const filteredRows = useMemo(() => {
    let rows = [...tableRows];

    // Dataset filter: 0 = All, otherwise match datasetId
    if (filterState.datasetId && filterState.datasetId !== 0) {
      rows = rows.filter(
        (r) => r.datasetId === filterState.datasetId
      );
    }

    // Month filter: 0 = All, otherwise filter by month number
    if (filterState.month && filterState.month !== 0) {
      rows = rows.filter((r) => r.month === filterState.month);
    }

    // Year range filter
    if (filterState.yearMin != null) {
      rows = rows.filter((r) => r.year >= filterState.yearMin);
    }
    if (filterState.yearMax != null) {
      rows = rows.filter((r) => r.year <= filterState.yearMax);
    }

    // Sort
    const sort = filterState.sort || 'year ASC, month ASC';
    rows.sort((a, b) => {
      switch (sort) {
        case 'year DESC, month DESC':
          if (a.year !== b.year) return b.year - a.year;
          return b.month - a.month;
        case 'value ASC':
          return (a.value ?? 0) - (b.value ?? 0);
        case 'value DESC':
          return (b.value ?? 0) - (a.value ?? 0);
        case 'year ASC, month ASC':
        default:
          if (a.year !== b.year) return a.year - b.year;
          return a.month - b.month;
      }
    });

    return rows;
  }, [tableRows, filterState]);

  const handleResetFilters = () => {
    setFilterState(DEFAULT_FILTER_STATE);
  };

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

  const decadeAverages = computeDecadeAverages(lineData);

  return (
    <div className="data-page">
      {/* Top action + filter area */}
      <div className="data-page__top-row">
        <ActionBar />
        {/* Filters now receives the props it expects */}
        <Filters
          datasets={DATASETS}
          state={filterState}
          setState={setFilterState}
          onReset={handleResetFilters}
        />
      </div>

      {/* Graphs */}
      <section className="data-page__section data-page__section--graphs">
        <div className="data-page__panel">
          <h2 className="data-page__panel-title">Arctic Temperature Trend</h2>
          <LineGraph data={lineData} />
        </div>

        <div className="data-page__panel">
          <h2 className="data-page__panel-title">Average Temperature by Decade</h2>
          <BarGraph data={decadeAverages} />
        </div>
      </section>

      {/* Heatmap */}
      <section className="data-page__section">
        <div className="data-page__panel">
          <h2 className="data-page__panel-title">Year × Month Temperature Heatmap</h2>
          <D3HeatMap points={heatmapPoints} />
        </div>
      </section>

      {/* Table */}
      <section className="data-page__section">
        <div className="data-page__panel data-page__panel--table">
          <h2 className="data-page__panel-title">Daily Climate Data</h2>
          <Table rows={filteredRows} />
        </div>
      </section>
    </div>
  );
}

// Helper: group lineData into decadal averages for the bar graph
function computeDecadeAverages(lineData) {
  const byDecade = new Map();

  for (const point of lineData) {
    const [yearStr] = point.date.split('-');
    const year = Number(yearStr);
    if (Number.isNaN(year)) continue;

    const decade = Math.floor(year / 10) * 10;

    if (!byDecade.has(decade)) {
      byDecade.set(decade, { sum: 0, count: 0 });
    }
    const entry = byDecade.get(decade);
    entry.sum += point.value;
    entry.count += 1;
  }

  return Array.from(byDecade.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([decade, { sum, count }]) => ({
      label: `${decade}s`,
      value: count > 0 ? sum / count : 0,
    }));
}

export default Data;