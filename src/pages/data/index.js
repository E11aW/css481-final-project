// src/pages/data/index.js
import { useEffect, useMemo, useState } from "react";
import "./data.scss";

import { Layout } from "../../components/Layout/Layout";
import { MaxWidth } from "../../components/MaxWidth/MaxWidth";
import { Button } from "../../components/Button/Button";

import Filters from "../../components/Filters/Filters";
import Table from "../../components/Table/Table";

import { listDatasets, searchMeasurements } from "./climateDb";

export default function DataPage() {
  // dropdown items
  const [datasets, setDatasets] = useState([]);
  // filter/pagination state
  const [state, setState] = useState({
    datasetId: 0,            // 0 = All datasets
    month: "All",            // "All" or 1–12
    yearMin: null,           // number | null
    yearMax: null,           // number | null
    sort: "year ASC, month ASC",
    page: 1,
    pageSize: 10,
  });
  // query results
  const [data, setData] = useState({ rows: [], total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const { datasetId, month, yearMin, yearMax, sort, page, pageSize } = state;

  // Load datasets for the filter
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const ds = await listDatasets();
        if (alive) setDatasets(ds);
      } catch (e) {
        if (alive) setErr("Failed to load datasets.");
        // eslint-disable-next-line no-console
        console.error(e);
      }
    })();
    return () => { alive = false; };
  }, []);

  // Run the data query whenever filters/pagination change
  useEffect(() => {
    let alive = true;
    setLoading(true);
    setErr("");
    (async () => {
      try {
        const res = await searchMeasurements({
          datasetId: datasetId || undefined,
          month: month === "All" ? undefined : month,
          yearMin,
          yearMax,
          sort,
          page,
          pageSize,
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

  const nextPage = () =>
    setState((s) => ({ ...s, page: Math.min(s.page + 1, data.pages) }));

  const prevPage = () =>
    setState((s) => ({ ...s, page: Math.max(1, s.page - 1) }));

  const title = useMemo(() => "Climate & Ice Data", []);

  return (
    <Layout>
      <MaxWidth>
        <section className="data">
          <header className="data__header">
            <h1>{title}</h1>
            <p className="data__sub">
              Explore (seeded) Arctic/Antarctic sea-ice, global temperature anomaly, and CO₂ data using SQL in the browser.
            </p>
          </header>

          <Filters
            datasets={datasets}
            state={state}
            setState={setState}
            onReset={reset}
          />

          <div className="data__meta">
            {loading ? (
              <span>Loading…</span>
            ) : (
              <>
                <span>
                  Showing <strong>{data.rows.length}</strong> of{" "}
                  <strong>{data.total}</strong>
                </span>
                <span>
                  Page {state.page} / {data.pages}
                </span>
              </>
            )}
          </div>

          {err ? (
            <p style={{ color: "crimson", marginTop: "0.5rem" }}>{err}</p>
          ) : (
            <Table rows={data.rows} />
          )}

          <div className="data__pagination">
            <Button onClick={prevPage} disabled={state.page === 1 || loading}>
              ‹ Prev
            </Button>
            <Button onClick={nextPage} disabled={state.page === data.pages || loading}>
              Next ›
            </Button>
          </div>
        </section>
      </MaxWidth>
    </Layout>
  );
}