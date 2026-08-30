import { Plus, Trash2, ChevronUp, ChevronDown, GripVertical } from "lucide-react";

const FIELD_TYPES = [
  "SHORT_ANSWER", "LONG_ANSWER", "EMAIL", "PHONE", "NUMBER",
  "DROPDOWN", "MULTIPLE_CHOICE", "CHECKBOXES", "DATE", "FILE_UPLOAD",
];

const LABELS = {
  SHORT_ANSWER: "Short Answer", LONG_ANSWER: "Long Answer", EMAIL: "Email", PHONE: "Phone",
  NUMBER: "Number", DROPDOWN: "Dropdown", MULTIPLE_CHOICE: "Multiple Choice",
  CHECKBOXES: "Checkboxes", DATE: "Date", FILE_UPLOAD: "File Upload",
};

const NEEDS_OPTIONS = new Set(["DROPDOWN", "MULTIPLE_CHOICE", "CHECKBOXES"]);

// Simple, stable "Add field + move up/down" builder — deliberately not
// drag-and-drop, per the brief's own guidance to favor stability over polish here.
export default function FormBuilder({ fields, onChange }) {
  const addField = (type) => {
    onChange([
      ...fields,
      { id: `f_${Date.now()}`, type, label: `New ${LABELS[type]} question`, placeholder: "", required: false, options: NEEDS_OPTIONS.has(type) ? ["Option 1"] : [] },
    ]);
  };
  const update = (id, patch) => onChange(fields.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  const remove = (id) => onChange(fields.filter((f) => f.id !== id));
  const move = (idx, dir) => {
    const next = [...fields];
    const target = idx + dir;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    onChange(next);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {FIELD_TYPES.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => addField(t)}
            className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700 focus-ring"
          >
            <Plus size={12} /> {LABELS[t]}
          </button>
        ))}
      </div>

      {fields.length === 0 && (
        <p className="rounded-lg border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-400">
          No custom questions yet — add fields above to collect exactly what this event needs.
        </p>
      )}

      <div className="space-y-3">
        {fields.map((f, idx) => (
          <div key={f.id} className="rounded-xl border border-slate-200 bg-white p-3.5">
            <div className="flex items-start gap-2">
              <GripVertical size={16} className="mt-2.5 shrink-0 text-slate-300" />
              <div className="flex-1 space-y-2.5">
                <div className="flex items-center gap-2">
                  <input
                    className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium focus-ring focus:border-brand-400"
                    value={f.label}
                    onChange={(e) => update(f.id, { label: e.target.value })}
                  />
                  <span className="whitespace-nowrap rounded-md bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-500">{LABELS[f.type]}</span>
                </div>
                {!NEEDS_OPTIONS.has(f.type) && f.type !== "FILE_UPLOAD" && f.type !== "DATE" && (
                  <input
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-500 focus-ring focus:border-brand-400"
                    placeholder="Placeholder text (optional)"
                    value={f.placeholder || ""}
                    onChange={(e) => update(f.id, { placeholder: e.target.value })}
                  />
                )}
                {NEEDS_OPTIONS.has(f.type) && (
                  <div className="space-y-1.5">
                    {(f.options || []).map((opt, oi) => (
                      <div key={oi} className="flex items-center gap-2">
                        <input
                          className="flex-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs focus-ring focus:border-brand-400"
                          value={opt}
                          onChange={(e) => {
                            const options = [...f.options];
                            options[oi] = e.target.value;
                            update(f.id, { options });
                          }}
                        />
                        <button type="button" onClick={() => update(f.id, { options: f.options.filter((_, i) => i !== oi) })} className="text-slate-300 hover:text-red-500">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => update(f.id, { options: [...(f.options || []), `Option ${(f.options || []).length + 1}`] })}
                      className="text-xs font-medium text-brand-600 hover:text-brand-700"
                    >
                      + Add option
                    </button>
                  </div>
                )}
                <label className="flex items-center gap-1.5 text-xs text-slate-500">
                  <input type="checkbox" className="accent-brand-600" checked={!!f.required} onChange={(e) => update(f.id, { required: e.target.checked })} />
                  Required
                </label>
              </div>
              <div className="flex flex-col items-center gap-1">
                <button type="button" onClick={() => move(idx, -1)} disabled={idx === 0} className="text-slate-300 hover:text-slate-600 disabled:opacity-30">
                  <ChevronUp size={16} />
                </button>
                <button type="button" onClick={() => move(idx, 1)} disabled={idx === fields.length - 1} className="text-slate-300 hover:text-slate-600 disabled:opacity-30">
                  <ChevronDown size={16} />
                </button>
                <button type="button" onClick={() => remove(f.id)} className="mt-1 text-slate-300 hover:text-red-500">
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
