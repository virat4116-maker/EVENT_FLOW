export function CardSkeleton() {
  return (
    <div className="rounded-xl2 border border-slate-100 bg-white p-4 shadow-card">
      <div className="skeleton h-36 w-full mb-4" />
      <div className="skeleton h-4 w-2/3 mb-2" />
      <div className="skeleton h-3 w-1/2 mb-4" />
      <div className="skeleton h-9 w-full" />
    </div>
  );
}

export function Spinner({ size = 18 }) {
  return (
    <span
      className="inline-block animate-spin rounded-full border-2 border-current border-t-transparent"
      style={{ width: size, height: size }}
    />
  );
}
