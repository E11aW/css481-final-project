import raw from "./climateData.json";

// normalize once
const datasetsById = new Map(raw.datasets.map(d => [d.id, d]));
const measurements = raw.measurements.map(m => ({
  ...m,
  dataset: datasetsById.get(m.dataset_id)?.name || "Unknown",
  unit: datasetsById.get(m.dataset_id)?.unit || "",
}));

export async function listDatasets() {
  // return as-is; already normalized
  return raw.datasets.map(d => ({ id: d.id, name: d.name, unit: d.unit, region: d.region }));
}

export async function searchMeasurements({
  datasetId,
  yearMin,
  yearMax,
  month,             // 1–12
  sort = "year ASC, month ASC",
  page = 1,
  pageSize = 10,
}) {
  // filter (map/filter)
  let rows = measurements.filter(r => {
    if (datasetId && r.dataset_id !== datasetId) return false;
    if (yearMin != null && r.year < yearMin) return false;
    if (yearMax != null && r.year > yearMax) return false;
    if (month != null && r.month !== month) return false;
    return true;
  });

  // sort
  const compare = {
    "year ASC, month ASC": (a, b) => a.year - b.year || a.month - b.month,
    "year DESC, month DESC": (a, b) => b.year - a.year || b.month - a.month,
    "value ASC": (a, b) => a.value - b.value,
    "value DESC": (a, b) => b.value - a.value
  }[sort] || ((a, b) => a.year - b.year || a.month - b.month);
  rows = rows.slice().sort(compare);

  // paginate
  const total = rows.length;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const start = (page - 1) * pageSize;
  const pageRows = rows.slice(start, start + pageSize);

  return { rows: pageRows, total, page, pageSize, pages };
}

// --- Extra helpers used by the dashboard buttons/sections ---

export function latestYear() {
  return measurements.reduce((max, r) => Math.max(max, r.year), -Infinity);
}

export function groupByDataset() {
  // reduce: group -> { name, unit, values: [...] }
  return measurements.reduce((acc, r) => {
    const key = r.dataset_id;
    acc[key] ||= { dataset_id: key, dataset: r.dataset, unit: r.unit, values: [] };
    acc[key].values.push(r);
    return acc;
  }, {});
}

export function extremes() {
  // reduce: min/max per dataset
  const byDs = groupByDataset();
  return Object.values(byDs).map(group => {
    const min = group.values.reduce((m, r) => (r.value < m.value ? r : m), group.values[0]);
    const max = group.values.reduce((m, r) => (r.value > m.value ? r : m), group.values[0]);
    return { dataset: group.dataset, unit: group.unit, min, max };
  });
}

export function trends() {
  // very simple linear trend: last - first for each dataset
  const byDs = groupByDataset();
  return Object.values(byDs).map(group => {
    const sorted = group.values.slice().sort((a,b)=> a.year - b.year || a.month - b.month);
    const first = sorted[0], last = sorted[sorted.length - 1];
    const delta = last.value - first.value;
    return { dataset: group.dataset, unit: group.unit, first, last, delta };
  });
}

export function summaryStats() {
  // reduce overall stats
  const count = measurements.length;
  const avg = (measurements.reduce((s, r) => s + r.value, 0) / count).toFixed(2);
  const years = [...new Set(measurements.map(r => r.year))].sort((a,b)=>a-b);
  return { count, avg: Number(avg), minYear: years[0], maxYear: years[years.length-1] };
}