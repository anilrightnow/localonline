import { EditorMode, EditorModel } from "./structuredDataModel";

interface Props {
  mode: EditorMode;
  model: EditorModel;
}

// Readable, public-facing rendering of the structured data. No chrome,
// so it can be embedded inline (e.g. admin review) or inside a modal.
export default function StructuredDataView({ mode, model }: Props) {
  const hasContent = model.categories.some((c) => c.items.length > 0);

  if (!hasContent) {
    return <p className="app-muted">Nothing to show.</p>;
  }

  return (
    <>
      {model.categories.map((cat) => (
        <div key={cat.id} style={{ marginBottom: 18 }}>
          <h4 style={{ margin: "0 0 8px", color: "#1f3a5f" }}>{cat.name}</h4>

          {mode === "businessHours" ? (
            <table className="pub-table">
              <thead>
                <tr>
                  <th>Day</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {cat.items.map((it) => (
                  <tr key={it.id}>
                    <td>{it.label || "—"}</td>
                    <td>{it.values.filter(Boolean).join(" / ") || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : mode === "menu" ? (
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {cat.items.map((it) => (
                <li key={it.id} style={{ marginBottom: 6 }}>
                  <strong>{it.label || "Item"}</strong>
                  {it.values[0] ? (
                    <span className="app-muted"> — ₹{it.values[0]}</span>
                  ) : null}
                  {it.values.slice(1).filter(Boolean).length ? (
                    <div className="app-muted">
                      {it.values.slice(1).filter(Boolean).join(" ")}
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : (
            <dl style={{ margin: 0 }}>
              {cat.items.map((it) => (
                <div key={it.id} style={{ marginBottom: 8 }}>
                  <dt style={{ fontWeight: 600 }}>{it.label || "—"}</dt>
                  <dd style={{ margin: "2px 0 0", color: "#444" }}>
                    {it.values.filter(Boolean).join(", ") || "—"}
                  </dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      ))}
    </>
  );
}
