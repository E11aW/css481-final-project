import "./Table.scss";

export default function Table({ rows }) {
  return (
    <div className="data__tableWrapper dataTable">
      <table className="data__table" role="table">
        <thead>
          <tr>
            <th>Dataset</th>
            <th>Year</th>
            <th>Month</th>
            <th>Value</th>
            <th>Unit</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td>{r.dataset}</td>
              <td>{r.year}</td>
              <td>{String(r.month).padStart(2, "0")}</td>
              <td>{r.value}</td>
              <td>{r.unit}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}