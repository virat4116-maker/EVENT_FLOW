import { STATUS_META } from "../utils/statusMeta.js";

export default function StatusBadge({ status, className = "" }) {
  const meta = STATUS_META[status] || { label: status, cls: "bg-slate-100 text-slate-600" };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${meta.cls} ${className}`}>
      {meta.label}
    </span>
  );
}
