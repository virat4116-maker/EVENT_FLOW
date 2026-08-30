import { useEffect, useState } from "react";
import { Award, Download } from "lucide-react";
import api from "../services/api.js";
import EmptyState from "../components/EmptyState.jsx";
import { formatDate } from "../utils/statusMeta.js";
import { CardSkeleton } from "../components/Loader.jsx";

export default function Certificates() {
  const [certs, setCerts] = useState(null);

  useEffect(() => {
    api.get("/certificates/my").then((res) => setCerts(res.data));
  }, []);

  return (
    <div className="mx-auto max-w-3xl px-5 py-10">
      <h1 className="font-display text-2xl font-bold text-slate-900">Certificates</h1>
      <p className="mt-1 text-sm text-slate-500">Issued automatically for completed events you attended.</p>

      <div className="mt-6 space-y-4">
        {certs === null ? (
          Array.from({ length: 2 }).map((_, i) => <CardSkeleton key={i} />)
        ) : certs.length === 0 ? (
          <EmptyState icon={Award} title="Nothing here yet" subtitle="Certificates appear once an event you checked into is marked completed." />
        ) : (
          certs.map((c) => (
            <div key={c.id} className="rounded-2xl border border-slate-100 bg-gradient-to-br from-white to-brand-50/60 p-6 shadow-card">
              <div className="flex items-center justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-600 text-white"><Award size={20} /></div>
                <span className="font-mono text-xs text-slate-400">{c.certificateId}</span>
              </div>
              <h3 className="mt-4 font-display text-lg font-bold text-slate-900">Certificate of Participation</h3>
              <p className="mt-1 text-sm text-slate-500">Awarded to <span className="font-semibold text-slate-800">{c.participantName}</span> for participating in</p>
              <p className="font-display text-base font-semibold text-brand-700">{c.event?.name}</p>
              <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
                <span>{c.event?.department} · {formatDate(c.event?.date)}</span>
                <button className="flex items-center gap-1 font-semibold text-brand-600 hover:text-brand-700">
                  <Download size={13} /> Download
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
