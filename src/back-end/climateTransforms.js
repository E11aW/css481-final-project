// src/climateTransforms.js

// daily: { time: [...], [variableName]: [...] }
export function toLineSeries(daily, variableName) {
  const times = daily.time || [];
  const values = daily[variableName] || [];

  return times.map((date, i) => ({
    date,               // "YYYY-MM-DD"
    value: values[i],
  }));
}

// Build monthly averages for a year × month heatmap
export function toMonthlyHeatmapPoints(daily, variableName) {
  const times = daily.time || [];
  const values = daily[variableName] || [];

  const byYearMonth = new Map();

  times.forEach((date, i) => {
    const [yStr, mStr] = date.split('-');
    const year = Number(yStr);
    const month = Number(mStr); // 1–12
    const key = `${year}-${month}`;

    if (!byYearMonth.has(key)) {
      byYearMonth.set(key, { year, month, sum: 0, count: 0 });
    }
    const entry = byYearMonth.get(key);
    entry.sum += values[i];
    entry.count += 1;
  });

  const entries = Array.from(byYearMonth.values())
    .filter(e => e.count > 0)
    .sort((a, b) => a.year - b.year || a.month - b.month);

  const years = Array.from(new Set(entries.map(e => e.year))).sort();
  const yearIndex = new Map(years.map((y, i) => [y, i]));

  const totalYears = years.length;
  const totalMonths = 12;

  return entries.map(e => {
    const yi = yearIndex.get(e.year);
    return {
      year: e.year,
      month: e.month,
      value: e.sum / e.count,
      // Normalize to 0–1 to mimic your antarctica_points.json format
      nx: totalYears > 1 ? yi / (totalYears - 1) : 0,
      ny: totalMonths > 1 ? (e.month - 1) / (totalMonths - 1) : 0,
    };
  });
}

// Table rows: one row per day
export function toTableRows(daily, variableName, locationLabel) {
  const times = daily.time || [];
  const values = daily[variableName] || [];

  return times.map((date, i) => {
    const [yearStr, monthStr, dayStr] = date.split('-');
    return {
      id: i,
      date,
      year: Number(yearStr),
      month: Number(monthStr),
      day: Number(dayStr),
      value: values[i],
      location: locationLabel,
    };
  });
}