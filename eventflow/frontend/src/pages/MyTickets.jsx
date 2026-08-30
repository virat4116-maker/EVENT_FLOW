import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Ticket, CheckCircle2 } from "lucide-react";
import api from "../services/api.js";
import EmptyState from "../components/EmptyState.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import TicketQR from "../components/TicketQR.jsx";
import Modal from "../components/Modal.jsx";
import { formatDate } from "../utils/statusMeta.js";
import { CardSkeleton } from "../components/Loader.jsx";

export default function MyTickets() {
  const [regs, setRegs] = useState(null);
  const [active, setActive] = useState(null);

  useEffect(() => {
    api.get("/registrations/my").then((res) => setRegs(res.data));
  }, []);

  return (
    <div className="mx-auto max-w-3xl px-5 py-10">
      <h1 className="font-display text-2xl font-bold text-slate-900">My Tickets</h1>
      <p className="mt-1 text-sm text-slate-500">Every event you've registered for, in one place.</p>

      <div className="mt-6 space-y-3">
        {regs === null ? (
          Array.from({ length: 3 }).map((_, i) => <CardSkeleton key={i} />)
        ) : regs.length === 0 ? (
          <EmptyState icon={Ticket} title="No tickets yet" subtitle="Register for an event to see your entry pass here." action={<Link to="/events" className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">Browse events</Link>} />
        ) : (
          regs.map((r) => (
            <button
              key={r.id}
              onClick={() => r.qrToken && setActive(r)}
              className="flex w-full items-center justify-between rounded-xl2 border border-slate-100 bg-white p-4 text-left shadow-card transition-shadow hover:shadow-glow focus-ring"
            >
              <div>
                <p className="font-display text-sm font-semibold text-slate-900">{r.event?.name}</p>
                <p className="mt-1 text-xs text-slate-500">{formatDate(r.event?.date)} · {r.event?.venue}</p>
                <div className="mt-2 flex items-center gap-2">
                  <StatusBadge status={r.status === "CONFIRMED" ? "REGISTRATION_OPEN" : "PENDING_APPROVAL"} className={r.status === "CONFIRMED" ? "" : "!bg-amber-100 !text-amber-700"} />
                  {r.checkedIn && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                      <CheckCircle2 size={12} /> Checked in
                    </span>
                  )}
                </div>
              </div>
              {r.qrToken && <Ticket className="text-brand-400" size={22} />}
            </button>
          ))
        )}
      </div>

      <Modal open={!!active} onClose={() => setActive(null)} title={active?.event?.name}>
        <div className="flex flex-col items-center text-center">
          <TicketQR token={active?.qrToken} size={200} />
          <p className="mt-3 text-xs text-slate-400">Show this at the entry gate for scanning.</p>
        </div>
      </Modal>
    </div>
  );
}
