export default function EmptyState({ icon: Icon, title = "Nothing here yet", subtitle, action }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6 rounded-xl2 border border-dashed border-slate-200 bg-white/60">
      {Icon && (
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-500">
          <Icon size={26} />
        </div>
      )}
      <h3 className="font-display text-lg font-semibold text-slate-800">{title}</h3>
      {subtitle && <p className="mt-1.5 max-w-sm text-sm text-slate-500">{subtitle}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
