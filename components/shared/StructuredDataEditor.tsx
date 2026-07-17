import { useEffect, useRef, useState } from "react";
import {
  EditorMode,
  EditorModel,
  EditorCategory,
  EditorItem,
  toEditorModel,
  modelToPayload,
  defaultCategoryName,
  DEFAULT_LABEL_SUGGESTIONS,
  getDefaultValueSuggestions,
  getEditorConfig,
  valuePlaceholder,
  getMenuItemSuggestions,
} from "./structuredDataModel";
import StructuredDataPreview from "./StructuredDataPreview";

interface Props {
  mode: EditorMode;
  value: unknown;
  onChange: (value: string) => void;
  readOnly?: boolean;
  suggestionsEnabled?: boolean;
  labelSuggestions?: string[];
  getValueSuggestions?: (label: string) => string[];
}

function valueToString(value: unknown): string {
  return typeof value === "string" ? value : JSON.stringify(value ?? null);
}

export default function StructuredDataEditor({
  mode,
  value,
  onChange,
  readOnly = false,
  suggestionsEnabled = true,
  labelSuggestions,
  getValueSuggestions,
}: Props) {
  const cfg = getEditorConfig(mode);
  const [model, setModel] = useState<EditorModel>(() => toEditorModel(value, mode));
  const emitted = useRef<string | null>(null);
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [preview, setPreview] = useState(false);

  useEffect(() => {
    const v = valueToString(value);
    if (emitted.current === null || v !== emitted.current) {
      emitted.current = v;
      setModel(toEditorModel(value, mode));
    }
  }, [value, mode]);

  // Seed a sensible starting state for an empty tab: pre-populated default
  // labels for About/Hours, or two empty categories for Menu.
  useEffect(() => {
    if (readOnly) return;
    if (model.categories.length === 0) {
      seedDefault();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [model.categories.length, readOnly]);

  function emit(next: EditorModel) {
    setModel(next);
    const str = JSON.stringify(modelToPayload(next, mode), null, 2);
    emitted.current = str;
    onChange(str);
  }

  function seedDefault() {
    if (mode === "menu") {
      emit({
        categories: [0, 1].map((ci) => ({
          id: `cat-${mode}-${ci}`,
          name:
            DEFAULT_LABEL_SUGGESTIONS.menu[ci] ?? defaultCategoryName(mode),
          items: [
            {
              id: `item-${mode}-${ci}-0`,
              label: "",
              values: [""],
            } as EditorItem,
          ],
        })),
      } as EditorModel);
    } else {
      // About / Business Hours: default labels pre-populated empty.
      emit(toEditorModel("", mode));
    }
  }

  function isOpen(id: string): boolean {
    return open[id] ?? true;
  }

  function toggle(id: string) {
    setOpen((o) => ({ ...o, [id]: !(o[id] ?? true) }));
  }

  // ── Category ops ──
  function updateCategoryName(ci: number, name: string) {
    emit({
      categories: model.categories.map((c, i) =>
        i === ci ? { ...c, name } : c,
      ),
    });
  }
  function addCategory() {
    const ci = model.categories.length;
    emit({
      categories: [
        ...model.categories,
        {
          id: `cat-${mode}-${ci}`,
          name: defaultCategoryName(mode),
          items: [
            { id: `item-${mode}-${ci}-0`, label: "", values: [""] } as EditorItem,
          ],
        } as EditorCategory,
      ],
    });
  }
  function deleteCategory(ci: number) {
    emit({ categories: model.categories.filter((_, i) => i !== ci) });
  }

  // ── Item ops ──
  function addItem(ci: number) {
    emit({
      categories: model.categories.map((c, i) =>
        i === ci
          ? {
              ...c,
              items: [
                ...c.items,
                {
                  id: `item-${mode}-${ci}-${c.items.length}`,
                  label: "",
                  values: [""],
                } as EditorItem,
              ],
            }
          : c,
      ),
    });
  }
  function deleteItem(ci: number, ii: number) {
    emit({
      categories: model.categories.map((c, i) =>
        i === ci ? { ...c, items: c.items.filter((_, j) => j !== ii) } : c,
      ),
    });
  }
  function updateLabel(ci: number, ii: number, label: string) {
    emit({
      categories: model.categories.map((c, i) =>
        i === ci
          ? {
              ...c,
              items: c.items.map((it, j) =>
                j === ii ? { ...it, label } : it,
              ),
            }
          : c,
      ),
    });
  }

  // ── Value ops ──
  function updateValue(ci: number, ii: number, vi: number, val: string) {
    emit({
      categories: model.categories.map((c, i) =>
        i === ci
          ? {
              ...c,
              items: c.items.map((it, j) =>
                j === ii
                  ? {
                      ...it,
                      values: it.values.map((v, k) => (k === vi ? val : v)),
                    }
                  : it,
              ),
            }
          : c,
      ),
    });
  }
  function addValue(ci: number, ii: number) {
    emit({
      categories: model.categories.map((c, i) =>
        i === ci
          ? {
              ...c,
              items: c.items.map((it, j) =>
                j === ii ? { ...it, values: [...it.values, ""] } : it,
              ),
            }
          : c,
      ),
    });
  }
  function deleteValue(ci: number, ii: number, vi: number) {
    emit({
      categories: model.categories.map((c, i) =>
        i === ci
          ? {
              ...c,
              items: c.items.map((it, j) =>
                j === ii
                  ? { ...it, values: it.values.filter((_, k) => k !== vi) }
                  : it,
              ),
            }
          : c,
      ),
    });
  }

  const labels =
    labelSuggestions && labelSuggestions.length
      ? labelSuggestions
      : DEFAULT_LABEL_SUGGESTIONS[mode];

  function renderLeaf(it: EditorItem, ci: number, ii: number) {
    const labelText = it.label.trim();
    const labelList =
      mode === "menu"
        ? `sde-menuitems-${ci}`
        : mode === "about" || mode === "businessHours"
        ? `sde-labels-${mode}`
        : undefined;
    const showValueControls = mode === "about";

    return (
      <div className="sde-leaf" key={it.id}>
        <div className="sde-leaf-main">
          <input
            className="form-input sde-label"
            style={mode === "menu" ? { flex: "1 1 80%" } : { flexBasis: cfg.labelWidth }}
            list={labelList}
            placeholder={cfg.labelPlaceholder}
            value={it.label}
            disabled={readOnly}
            onChange={(e) => updateLabel(ci, ii, e.target.value)}
          />
          <div className="sde-values">
            {it.values.map((v, vi) => (
              <div className="sde-value-row" key={vi}>
                <input
                  className="form-input sde-value"
                  style={mode === "menu" ? { flex: "0 0 20%" } : undefined}
                  list={`sde-values-${mode}-${ci}-${ii}`}
                  placeholder={
                    mode === "about" && labelText
                      ? labelText
                      : valuePlaceholder(mode, vi)
                  }
                  value={v}
                  disabled={readOnly}
                  onChange={(e) => updateValue(ci, ii, vi, e.target.value)}
                />
                {!readOnly && showValueControls && it.values.length > 1 && (
                  <button
                    type="button"
                    className="sde-icon-btn sde-del"
                    title="Remove value"
                    aria-label="Remove value"
                    onClick={() => deleteValue(ci, ii, vi)}
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
            {!readOnly && showValueControls && (
              <button
                type="button"
                className="btn btn-ghost sde-sm sde-add-value"
                onClick={() => addValue(ci, ii)}
              >
                {labelText ? `Add ${labelText}` : "+ Add value"}
              </button>
            )}
          </div>
          {!readOnly && (
            <button
              type="button"
              className="sde-icon-btn sde-del"
              title="Remove item"
              aria-label="Remove item"
              onClick={() => deleteItem(ci, ii)}
            >
              ✕
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="sde">
      {model.categories.length === 0 ? (
        <div className="sde-empty">No data yet.</div>
      ) : cfg.hideCategory ? (
        // Single, hidden category: just the label/value rows.
        <div className="sde-tree sde-leaf-list">
          {model.categories[0]?.items.map((it, ii) => renderLeaf(it, 0, ii))}
          {!readOnly && !cfg.hideAddItem && (
            <button
              type="button"
              className="btn btn-ghost sde-sm sde-add-item"
              onClick={() => addItem(0)}
            >
              + {cfg.addItemLabel}
            </button>
          )}
        </div>
      ) : (
        <div className="sde-tree">
          {model.categories.map((cat, ci) => (
            <div className="sde-node" key={cat.id}>
              <div className="sde-node-head">
                <button
                  type="button"
                  className="sde-caret"
                  aria-label={isOpen(cat.id) ? "Collapse" : "Expand"}
                  onClick={() => toggle(cat.id)}
                >
                  {isOpen(cat.id) ? "▾" : "▸"}
                </button>
                {readOnly ? (
                  <strong className="sde-cat-name">{cat.name}</strong>
                ) : (
                  <input
                    className="form-input sde-cat-input"
                    list={cfg.categorySuggestions ? `sde-cat-${mode}` : undefined}
                    value={cat.name}
                    onChange={(e) => updateCategoryName(ci, e.target.value)}
                  />
                )}
                <span className="sde-count">
                  {cat.items.length} item{cat.items.length === 1 ? "" : "s"}
                </span>
                <span className="sde-spacer" />
                {!readOnly && (
                  <button
                    type="button"
                    className="sde-icon-btn sde-del"
                    title="Delete section"
                    aria-label="Delete section"
                    onClick={() => deleteCategory(ci)}
                  >
                    ✕
                  </button>
                )}
              </div>

              {isOpen(cat.id) && (
                <div className="sde-children">
                  {cat.items.map((it, ii) => renderLeaf(it, ci, ii))}
                  {!readOnly && !cfg.hideAddItem && (
                    <button
                      type="button"
                      className="btn btn-ghost sde-sm sde-add-item"
                      onClick={() => addItem(ci)}
                    >
                      + {cfg.addItemLabel}
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="sde-actions">
        <button
          type="button"
          className="btn btn-ghost sde-sm"
          onClick={() => setPreview(true)}
        >
          Preview
        </button>
        {!readOnly && !cfg.hideAddSection && (
          <button
            type="button"
            className="btn btn-primary sde-sm"
            onClick={addCategory}
          >
            + {cfg.addSectionLabel}
          </button>
        )}
      </div>

      {mode !== "menu" && (
        <datalist id={`sde-labels-${mode}`}>
          {labels.map((l) => (
            <option key={l} value={l} />
          ))}
        </datalist>
      )}
      {cfg.categorySuggestions && (
        <datalist id={`sde-cat-${mode}`}>
          {cfg.categorySuggestions.map((l) => (
            <option key={l} value={l} />
          ))}
        </datalist>
      )}
      {mode === "menu" &&
        model.categories.map((cat, ci) => (
          <datalist id={`sde-menuitems-${ci}`} key={cat.id}>
            {getMenuItemSuggestions(cat.name).map((l) => (
              <option key={l} value={l} />
            ))}
          </datalist>
        ))}
      {suggestionsEnabled &&
        model.categories.map((cat, ci) =>
          cat.items.map((it, ii) => {
            const opts = getValueSuggestions
              ? getValueSuggestions(it.label)
              : getDefaultValueSuggestions(mode, it.label);
            if (!opts.length) return null;
            return (
              <datalist id={`sde-values-${mode}-${ci}-${ii}`} key={it.id}>
                {opts.map((o) => (
                  <option key={o} value={o} />
                ))}
              </datalist>
            );
          }),
        )}

      {preview && (
        <StructuredDataPreview
          mode={mode}
          model={model}
          onClose={() => setPreview(false)}
        />
      )}
    </div>
  );
}
