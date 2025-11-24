// src/pages/data.js
import React, { useEffect, useState } from 'react';
import './data.scss';

// Adjust these paths to match your project structure
import { fetchDailyClimate, fetchNotes } from '../../back-end/dataSource';
import {
  toLineSeries,
  toMonthlyHeatmapPoints,
  toTableRows,
} from '../../back-end/climateTransforms';

import ActionBar from '../../components/ActionBar/ActionBar';
import  Filters  from '../../components/Filters/Filters';
import  Table  from '../../components/Table/Table';
import  { LineGraph }  from '../../components/LineGraph/LineGraph';
import  { BarGraph }  from '../../components/BarGraph/BarGraph';
import  D3HeatMap  from '../../components/D3HeatMap/D3HeatMap';

const DEFAULT_VARIABLE = 'temperature_2m_mean';

const DEFAULT_QUERY = {
  lat: 78.2,
  lon: 15.6,
  start: '1980-01-01',
  end: '2020-12-31',
  model: 'CMCC_CM2_VHR4',
  variable: DEFAULT_VARIABLE,
};

function Data() {
  const [climate, setClimate] = useState(null);
  const [lineData, setLineData] = useState([]);
  const [heatmapPoints, setHeatmapPoints] = useState([]);
  const [tableRows, setTableRows] = useState([]);
  const [filteredRows, setFilteredRows] = useState([]);
  const [notes, setNotes] = useState([]); // if you want CRUD UI later

  const [queryParams] = useState(DEFAULT_QUERY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);

      try {
        // 1) Get climate data from your backend proxy (Express → Open-Meteo)
        const climateRes = await fetchDailyClimate(queryParams);
        const daily = climateRes.daily || {};
        const variableName = queryParams.variable;

        const line = toLineSeries(daily, variableName);
        const heatmap = toMonthlyHeatmapPoints(daily, variableName);
        const rows = toTableRows(
          daily,
          variableName,
          `lat=${queryParams.lat}, lon=${queryParams.lon}`
        );

        setClimate(climateRes);
        setLineData(line);
        setHeatmapPoints(heatmap);
        setTableRows(rows);
        setFilteredRows(rows);

        // 2) Optional: user notes CRUD
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

  // Hook up to your existing Filters component
  // You can adapt this to whatever shape Filters already uses.
  const handleApplyFilters = (filters) => {
    // Example filter object:
    // { yearMin, yearMax, valueMin, valueMax, textSearch }
    const { yearMin, yearMax, valueMin, valueMax, textSearch } = filters || {};

    const next = tableRows.filter((row) => {
      if (yearMin && row.year < yearMin) return false;
      if (yearMax && row.year > yearMax) return false;
      if (valueMin != null && row.value < valueMin) return false;
      if (valueMax != null && row.value > valueMax) return false;
      if (textSearch && !String(row.location).toLowerCase().includes(textSearch.toLowerCase())) {
        return false;
      }
      return true;
    });

    setFilteredRows(next);
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
      {/* Top action + filter area – aligned with your existing components */}
      <div className="data-page__top-row">
        <ActionBar />
        {/* Make sure Filters calls props.onApply when user submits filters */}
        <Filters onApply={handleApplyFilters} />
      </div>

      {/* Main content sections */}
      <section className="data-page__section data-page__section--graphs">
        <div className="data-page__panel">
          <h2 className="data-page__panel-title">Arctic Temperature Trend</h2>
          {/* Adapt the prop shape to what LineGraph expects */}
          <LineGraph data={lineData} />
        </div>

        <div className="data-page__panel">
          <h2 className="data-page__panel-title">Average Temperature by Decade</h2>
          {/* Example: BarGraph gets { label, value }[] */}
          <BarGraph data={decadeAverages} />
        </div>
      </section>

      <section className="data-page__section">
        <div className="data-page__panel">
          <h2 className="data-page__panel-title">Year × Month Temperature Heatmap</h2>
          {/* If your D3HeatMap previously accepted `points` from antarctica_points.json,
              this will be a drop-in replacement: { nx, ny, value, year, month } */}
          <D3HeatMap points={heatmapPoints} />
        </div>
      </section>

      <section className="data-page__section">
        <div className="data-page__panel data-page__panel--table">
          <h2 className="data-page__panel-title">Daily Climate Data</h2>
          {/* Use your existing Table component. Just feed the rows coming from the real API */}
          <Table rows={filteredRows} />
        </div>
      </section>

      {/* Optional section: wire notes into a CRUD UI if needed for the assignment */}
      {/* <NotesPanel notes={notes} /> */}
    </div>
  );
}

// Helper: group lineData into decadal averages for the bar graph
function computeDecadeAverages(lineData) {
  const byDecade = new Map();

  for (const point of lineData) {
    const [yearStr] = point.date.split('-');
    const year = Number(yearStr);
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