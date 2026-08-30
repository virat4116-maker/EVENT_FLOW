// Renders whatever custom fields an admin configured for an event's
// registration — the "Google Forms-like" participant-facing side of the builder.
export default function DynamicForm({ fields = [], values, onChange }) {
  const set = (id, v) => onChange({ ...values, [id]: v });

  if (!fields.length) return null;

  return (
    <div className="space-y-4">
      {fields.map((f) => (
        <div key={f.id}>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            {f.label} {f.required && <span className="text-red-500">*</span>}
          </label>
          {renderField(f, values[f.id], (v) => set(f.id, v))}
        </div>
      ))}
    </div>
  );
}

function renderField(f, value, set) {
  const base =
    "w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus-ring focus:border-brand-400";
  switch (f.type) {
    case "LONG_ANSWER":
      return (
        <textarea rows={3} className={base} placeholder={f.placeholder} value={value || ""} onChange={(e) => set(e.target.value)} required={f.required} />
      );
    case "EMAIL":
      return <input type="email" className={base} placeholder={f.placeholder} value={value || ""} onChange={(e) => set(e.target.value)} required={f.required} />;
    case "PHONE":
      return <input type="tel" className={base} placeholder={f.placeholder} value={value || ""} onChange={(e) => set(e.target.value)} required={f.required} />;
    case "NUMBER":
      return <input type="number" className={base} placeholder={f.placeholder} value={value || ""} onChange={(e) => set(e.target.value)} required={f.required} />;
    case "DATE":
      return <input type="date" className={base} value={value || ""} onChange={(e) => set(e.target.value)} required={f.required} />;
    case "DROPDOWN":
      return (
        <select className={base} value={value || ""} onChange={(e) => set(e.target.value)} required={f.required}>
          <option value="" disabled>Select an option</option>
          {(f.options || []).map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
      );
    case "MULTIPLE_CHOICE":
      return (
        <div className="flex flex-col gap-2">
          {(f.options || []).map((o) => (
            <label key={o} className="flex items-center gap-2 text-sm text-slate-700">
              <input type="radio" name={f.id} className="accent-brand-600" checked={value === o} onChange={() => set(o)} />
              {o}
            </label>
          ))}
        </div>
      );
    case "CHECKBOXES": {
      const arr = Array.isArray(value) ? value : [];
      return (
        <div className="flex flex-col gap-2">
          {(f.options || []).map((o) => (
            <label key={o} className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                className="accent-brand-600"
                checked={arr.includes(o)}
                onChange={(e) => set(e.target.checked ? [...arr, o] : arr.filter((x) => x !== o))}
              />
              {o}
            </label>
          ))}
        </div>
      );
    }
    case "FILE_UPLOAD":
      return (
        <input
          type="file"
          className="w-full text-sm text-slate-500 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-brand-700 hover:file:bg-brand-100"
          onChange={(e) => set(e.target.files?.[0]?.name || "")}
        />
      );
    default:
      return <input type="text" className={base} placeholder={f.placeholder} value={value || ""} onChange={(e) => set(e.target.value)} required={f.required} />;
  }
}
