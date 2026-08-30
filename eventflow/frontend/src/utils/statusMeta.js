export const STATUS_META = {
  DRAFT: { label: "Draft", cls: "bg-slate-100 text-slate-600" },
  PENDING_APPROVAL: { label: "Pending Approval", cls: "bg-amber-100 text-amber-700" },
  CHANGES_REQUESTED: { label: "Changes Requested", cls: "bg-amber-100 text-amber-700" },
  APPROVED: { label: "Approved", cls: "bg-brand-100 text-brand-700" },
  PUBLISHED: { label: "Published", cls: "bg-brand-100 text-brand-700" },
  REGISTRATION_OPEN: { label: "Registration Open", cls: "bg-emerald-100 text-emerald-700" },
  REGISTRATION_CLOSED: { label: "Registration Closed", cls: "bg-slate-200 text-slate-600" },
  FULL: { label: "Full", cls: "bg-red-100 text-red-700" },
  ONGOING: { label: "Ongoing", cls: "bg-brand-100 text-brand-700" },
  COMPLETED: { label: "Completed", cls: "bg-slate-200 text-slate-600" },
  REJECTED: { label: "Rejected", cls: "bg-red-100 text-red-700" },
};

export const COMING_SOON = new Set(["PENDING_APPROVAL", "CHANGES_REQUESTED", "APPROVED", "PUBLISHED"]);

export const EVENT_TYPE_EMOJI = {
  EVENT: "🎉",
  COMPETITION: "🏆",
  CAMPAIGN: "🌱",
  WORKSHOP: "💻",
  SEMINAR: "🎤",
  SPORTS: "⚽",
  CULTURAL: "🎭",
  OTHER: "✨",
};

export function formatDate(dateStr) {
  if (!dateStr) return "Date TBA";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}
