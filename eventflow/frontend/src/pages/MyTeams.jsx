import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Users, Copy, CheckCircle2, Circle } from "lucide-react";
import api from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import EmptyState from "../components/EmptyState.jsx";
import Modal from "../components/Modal.jsx";
import DynamicForm from "../components/DynamicForm.jsx";
import TicketQR from "../components/TicketQR.jsx";
import { CardSkeleton, Spinner } from "../components/Loader.jsx";

export default function MyTeams() {
  const { user } = useAuth();
  const toast = useToast();
  const [teams, setTeams] = useState(null);
  const [finalizeTeam, setFinalizeTeam] = useState(null);
  const [answers, setAnswers] = useState({});
  const [busy, setBusy] = useState(false);
  const [qrView, setQrView] = useState(null);
  const [payReg, setPayReg] = useState(null);

  const load = () => api.get("/teams/my").then((res) => setTeams(res.data));
  useEffect(load, []);

  const copyCode = (code) => {
    navigator.clipboard?.writeText(code);
    toast.success(`Invite code ${code} copied`);
  };

  const finalize = async () => {
    setBusy(true);
    try {
      const res = await api.post(`/teams/${finalizeTeam.id}/finalize`, { answers });
      setFinalizeTeam(null);
      load();
      if (res.data.registration.status === "CONFIRMED") {
        toast.success("Team registered — entry pass is ready!");
        setQrView(res.data.registration.qrToken);
      } else {
        setPayReg({ registration: res.data.registration, fee: finalizeTeam.event.fee });
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-5 py-10">
      <h1 className="font-display text-2xl font-bold text-slate-900">My Teams</h1>
      <p className="mt-1 text-sm text-slate-500">Teams you've created or joined for competitions.</p>

      <div className="mt-6 space-y-4">
        {teams === null ? (
          Array.from({ length: 2 }).map((_, i) => <CardSkeleton key={i} />)
        ) : teams.length === 0 ? (
          <EmptyState icon={Users} title="No teams yet" subtitle="Join a team-based event to create or join a squad." action={<Link to="/events" className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">Browse events</Link>} />
        ) : (
          teams.map((t) => (
            <div key={t.id} className="rounded-xl2 border border-slate-100 bg-white p-5 shadow-card">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-brand-500">{t.event?.name}</p>
                  <h3 className="mt-0.5 font-display text-lg font-bold text-slate-900">{t.name}</h3>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${t.status === "COMPLETE" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                  {t.status === "COMPLETE" ? "Team Complete" : "Forming"}
                </span>
              </div>

              <div className="mt-4 space-y-1.5">
                {Array.from({ length: t.event?.teamMax || t.members.length }).map((_, i) => {
                  const m = t.members[i];
                  return (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      {m ? <CheckCircle2 size={15} className="text-emerald-500" /> : <Circle size={15} className="text-slate-300" />}
                      <span className={m ? "text-slate-700" : "text-slate-400"}>
                        {m ? `${m.name}${m.id === t.leaderId ? " (Leader)" : ""}` : `Waiting for member ${i + 1}`}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2.5 border-t border-slate-100 pt-4">
                {!t.registrationId && (
                  <button onClick={() => copyCode(t.inviteCode)} className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50">
                    <Copy size={12} /> {t.inviteCode}
                  </button>
                )}
                {t.registrationId ? (
                  <button onClick={() => setQrView(t.qrToken)} className="rounded-lg bg-brand-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-brand-700">
                    View Team QR
                  </button>
                ) : t.status === "COMPLETE" && t.leaderId === user.id ? (
                  <button onClick={() => { setFinalizeTeam(t); setAnswers({}); }} className="rounded-lg bg-brand-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-brand-700">
                    Complete Registration
                  </button>
                ) : t.status !== "COMPLETE" ? (
                  <span className="text-xs text-slate-400">Only the leader can finalize once the team is complete.</span>
                ) : null}
              </div>
            </div>
          ))
        )}
      </div>

      <Modal open={!!finalizeTeam} onClose={() => setFinalizeTeam(null)} title={`Finalize "${finalizeTeam?.name}"`}>
        <DynamicForm fields={finalizeTeam?.event?.customFields || []} values={answers} onChange={setAnswers} />
        <button disabled={busy} onClick={finalize} className="mt-5 w-full rounded-xl bg-brand-600 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60">
          {busy ? <Spinner /> : finalizeTeam?.event?.payment === "FREE" ? "Confirm Team Registration" : `Continue to Payment ₹${finalizeTeam?.event?.fee}`}
        </button>
      </Modal>

      <Modal open={!!payReg} onClose={() => setPayReg(null)} title="Complete Payment">
        <div className="text-center">
          <p className="text-sm text-slate-600">This is Demo Payment Mode — no real card is needed for this class project.</p>
          <p className="mt-2 font-display text-3xl font-bold text-slate-900">₹{payReg?.fee}</p>
          <div className="mt-5 flex gap-2.5">
            <button
              onClick={async () => {
                setBusy(true);
                try {
                  await api.post("/payments/demo-fail", { registrationId: payReg.registration.id });
                  toast.error("Payment failed — no entry pass was generated.");
                } finally { setBusy(false); }
              }}
              disabled={busy}
              className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
            >
              Simulate Failure
            </button>
            <button
              onClick={async () => {
                setBusy(true);
                try {
                  const res = await api.post("/payments/demo-pay", { registrationId: payReg.registration.id });
                  toast.success("Payment successful — team entry pass is ready.");
                  setPayReg(null);
                  setQrView(res.data.registration.qrToken);
                  load();
                } catch (err) { toast.error(err.message); } finally { setBusy(false); }
              }}
              disabled={busy}
              className="flex-1 rounded-xl bg-brand-600 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
            >
              {busy ? <Spinner /> : `Pay ₹${payReg?.fee}`}
            </button>
          </div>
        </div>
      </Modal>

      <Modal open={!!qrView} onClose={() => setQrView(null)} title="Team Entry Pass">
        <div className="flex flex-col items-center text-center">
          <TicketQR token={qrView} size={200} />
          <p className="mt-3 text-xs text-slate-400">One scan checks the whole team in.</p>
        </div>
      </Modal>
    </div>
  );
}
