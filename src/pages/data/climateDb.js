// src/pages/data/climateDb.js
// Browser-native SQL via AlaSQL (no WASM, no Node polyfills).
import alasql from "alasql";

// Initialize a single in-memory DB
let booted = false;

function seed() {
  if (booted) return;

  try {
    // DDL
    alasql(`
      CREATE TABLE datasets (
        id INT PRIMARY KEY,
        name STRING,
        unit STRING,
        region STRING,
        notes STRING
      )
    `);

    // NOTE: use 'val' instead of 'value' (reserved word in AlaSQL)
    alasql(`
      CREATE TABLE measurements (
        id INT PRIMARY KEY AUTOINCREMENT,
        dataset_id INT,
        year INT,
        month INT,
        val NUMBER
      )
    `);

    // Datasets
    alasql(`
      INSERT INTO datasets VALUES
        (1, 'Arctic Sea Ice Extent', 'million km^2', 'Arctic',
         'Monthly mean extent (illustrative sample). Smaller is worse.'),
        (2, 'Antarctic Sea Ice Extent', 'million km^2', 'Antarctic',
         'Monthly mean extent (illustrative sample).'),
        (3, 'Global Mean Surface Temperature Anomaly', '°C vs 1951–1980',
         'Global', 'Illustrative monthly samples. Larger is warmer.'),
        (4, 'Atmospheric CO₂', 'ppm', 'Global', 'Illustrative monthly samples.')
    `);

    // Arctic (Sep minima proxy)
    alasql(`
      INSERT INTO measurements(dataset_id, year, month, val) VALUES
        (1,2010,9,4.9),(1,2012,9,3.6),(1,2016,9,4.1),
        (1,2020,9,3.8),(1,2023,9,4.2),(1,2024,9,4.0)
    `);

    // Antarctic (Sep maxima proxy)
    alasql(`
      INSERT INTO measurements(dataset_id, year, month, val) VALUES
        (2,2010,9,19.2),(2,2014,9,20.1),(2,2017,9,18.6),
        (2,2020,9,18.8),(2,2023,9,16.8),(2,2024,9,17.2)
    `);

    // Global Temp Anomaly
    alasql(`
      INSERT INTO measurements(dataset_id, year, month, val) VALUES
        (3,2010,1,0.70),(3,2015,12,0.95),(3,2016,2,1.20),
        (3,2020,7,0.92),(3,2023,7,1.19),(3,2024,7,1.27)
    `);

    // CO₂ ppm
    alasql(`
      INSERT INTO measurements(dataset_id, year, month, val) VALUES
        (4,2010,5,392.5),(4,2015,5,403.9),(4,2020,5,416.5),
        (4,2023,5,424.0),(4,2024,5,426.9),(4,2025,5,429.2)
    `);

    // Mark boot complete only if everything succeeded
    booted = true;
  } catch (e) {
    booted = false;
    throw e;
  }
}

export async function listDatasets() {
  seed();
  return alasql("SELECT id, name, unit, region FROM datasets ORDER BY id");
}

export async function searchMeasurements({
  datasetId,
  yearMin,
  yearMax,
  month,             // 1–12, or undefined to ignore
  sort = "year ASC, month ASC",
  page = 1,
  pageSize = 10,
}) {
  seed();

  // Build WHERE + params
  const where = [];
  const params = [];

  if (datasetId) { where.push("m.dataset_id = ?"); params.push(datasetId); }
  if (yearMin != null) { where.push("m.year >= ?"); params.push(yearMin); }
  if (yearMax != null) { where.push("m.year <= ?"); params.push(yearMax); }
  if (month != null) { where.push("m.month = ?"); params.push(month); }

  const whereSql = where.length ? "WHERE " + where.join(" AND ") : "";

  // Count
  const total = alasql(`SELECT VALUE COUNT(*) FROM measurements m ${whereSql}`, params);

  // Map sort strings that reference 'value' (UI) to the real column 'val'
  const sortMap = {
    "year ASC, month ASC": "m.year ASC, m.month ASC",
    "year DESC, month DESC": "m.year DESC, m.month DESC",
    "value ASC": "m.val ASC",
    "value DESC": "m.val DESC",
  };
  const sortSql = sortMap[sort] || "m.year ASC, m.month ASC";

  const offset = (page - 1) * pageSize;

  // Use bracket-quoted alias to avoid VALUE keyword conflict
  const rows = alasql(
    `
    SELECT m.id, m.dataset_id, m.year, m.month, m.val AS [value],
           d.name AS dataset, d.unit
    FROM measurements m
    JOIN datasets d ON d.id = m.dataset_id
    ${whereSql}
    ORDER BY ${sortSql}
    LIMIT ${pageSize} OFFSET ${offset}
    `,
    params
  );

  return {
    rows,
    total,
    page,
    pageSize,
    pages: Math.max(1, Math.ceil(total / pageSize)),
  };
}