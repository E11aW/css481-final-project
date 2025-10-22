import "./Filters.scss";
import { Button } from '../Button/Button';

export default function Filters({ datasets, state, setState, onReset }) {
  const set = (k) => (v) => setState((s) => ({ ...s, [k]: v }));

  return (
    <div className="data__controls filters">
      <select
        className="data__select"
        value={state.datasetId}
        onChange={(e) => set("datasetId")(Number(e.target.value))}
        aria-label="Dataset"
      >
        <option value={0}>All datasets</option>
        {datasets.map((d) => (
          <option key={d.id} value={d.id}>
            {d.name}
          </option>
        ))}
      </select>

      <select
        className="data__select"
        value={state.month}
        onChange={(e) => {
          const v = e.target.value;
          set("month")(v === "All" ? "All" : Number(v));
        }}
        aria-label="Month"
      >
        <option value="All">All months</option>
        {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
          <option key={m} value={m}>
            {m}
          </option>
        ))}
      </select>

      <input
        className="data__search"
        type="number"
        placeholder="Year min"
        value={state.yearMin ?? ""}
        onChange={(e) => set("yearMin")(e.target.value ? Number(e.target.value) : null)}
      />

      <input
        className="data__search"
        type="number"
        placeholder="Year max"
        value={state.yearMax ?? ""}
        onChange={(e) => set("yearMax")(e.target.value ? Number(e.target.value) : null)}
      />

      <select
        className="data__select"
        value={state.sort}
        onChange={(e) => set("sort")(e.target.value)}
        aria-label="Sort"
      >
        <option value="year ASC, month ASC">Oldest → Newest</option>
        <option value="year DESC, month DESC">Newest → Oldest</option>
        <option value="value ASC">Value ↑</option>
        <option value="value DESC">Value ↓</option>
      </select>

      <Button onClick={onReset}>Reset</Button>
    </div>
  );
}