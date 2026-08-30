import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Users, Wallet } from "lucide-react";
import api from "../services/api.js";
import StatusBadge from "../components/StatusBadge.jsx";
import { CardSkeleton } from "../components/Loader.jsx";

export default function EventRegistrations() {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [regs, setRegs] = useState(null);
  const [revenue, setRevenue] = useState(null);

  useEffect(() => {
    api.get(`/events/${id}`).then((res) => setEvent(res.data));
    api.get(`/registrations/event/${id}`).then((res) => setRegs(res.data));
    api.get(`/payments/event/${id}`).then((res) => setRevenue(res.data.revenue)).catch(() => {});
  }, [id]);

  return (
    <div className="mx-auto max-w-5xl px-5 py-10">
      <Link to="/admin" className="mb-5 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-brand-600">
        <ArrowLeft size={15} /> Back to dashboard
      </Link>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">{event?.name || "Loading..."}</h1>
          <p className="mt-1 text-sm text-slate-500 flex items-center gap-3">
            <span className="flex items-center gap-1"><Users size={13} /> {regs?.length ?? "…"} registrations</span>
            {revenue != null && <span className="flex items-center gap-1"><Wallet size={13} /> ₹{revenue.toLocaleString("en-IN")} revenue</span>}
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl2 border border-slate-100 bg-white shadow-card">
        {regs === null ? (
          <div className="p-5"><CardSkeleton /></div>
        ) : regs.length === 0 ? (
          <p className="p-8 text-center text-sm text-slate-400">No registrations yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3">Participant / Team</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Checked In</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {regs.map((r) => (
                <tr key={r.id}>
                  <td className="px-5 py-3.5 font-medium text-slate-800">{r.team ? `${r.team.name} (${r.team.memberIds.length})` : r.participant?.name}</td>
                  <td className="px-5 py-3.5"><StatusBadge status={r.status === "CONFIRMED" ? "REGISTRATION_OPEN" : "PENDING_APPROVAL"} /></td>
                  <td className="px-5 py-3.5">{r.checkedIn ? <span className="font-semibold text-emerald-600">Yes</span> : <span className="text-slate-400">No</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
