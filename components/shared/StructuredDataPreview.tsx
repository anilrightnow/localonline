import { EditorMode, EditorModel } from "./structuredDataModel";
import StructuredDataView from "./StructuredDataView";

interface Props {
  mode: EditorMode;
  model: EditorModel;
  onClose?: () => void;
}

// Modal wrapper around StructuredDataView for the owner "Preview" button.
export default function StructuredDataPreview({ mode, model, onClose }: Props) {
  const title =
    mode === "about"
      ? "About Preview"
      : mode === "businessHours"
        ? "Business Hours Preview"
        : "Menu Preview";

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15,23,42,0.55)",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        padding: "40px 16px",
        overflow: "auto",
        zIndex: 1000,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="app-card"
        style={{ maxWidth: 720, width: "100%" }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 12,
          }}
        >
          <h3 style={{ margin: 0 }}>{title}</h3>
          {onClose && (
            <button className="btn btn-ghost" type="button" onClick={onClose}>
              Close
            </button>
          )}
        </div>
        <StructuredDataView mode={mode} model={model} />
      </div>
    </div>
  );
}
