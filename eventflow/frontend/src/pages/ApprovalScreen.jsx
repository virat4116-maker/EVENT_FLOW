import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, CheckCircle2, XCircle, Edit3 } from "lucide-react";
import api from "../services/api.js";
import { useToast } from "../context/ToastContext.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import Modal from "../components/Modal.jsx";
import { formatDate } from "../utils/statusMeta.js";
import { Spinner } from "../components/Loader.jsx";

export default function ApprovalScreen() {
  const { id } = useParams();
  const nav = useNavigate();
  const toast = useToast();
  const [event, setEvent] = useState(null);
  const [noteModal, setNoteModal] = useState(null); // "reject" | "changes"
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.get(`/events/${id}`).then((res) => setEvent(res.data));
  }, [id]);

  const approve = async () => {
    setBusy(true);
    try {
      await api.post(`/events/${id}/approve`);
      toast.success("Event approved and unlocked for registration.");
      nav("/main-admin");
    } catch (err) { toast.error(err.message); } finally { setBusy(false); }
  };

  const submitNote = async () => {
    setBusy(true);
    try {
      await api.post(`/events/${id}/${noteModal === "reject" ? "reject" : "request-changes"}`, { note });
      toast.info(noteModal === "reject" ? "Event rejected." : "Changes requested.");
      nav("/main-admin");
    } catch (err) { toast.error(err.message); } finally { setBusy(false); }
  };

  if (!event) return <div className="flex h-[60vh] items-center justify-center text-brand-500"><Spinner size={28} /></div>;

  return (
    <div className="mx-auto max-w-3xl px-5 py-10">
      <Link to="/main-admin" className="mb-5 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-brand-600">
        <ArrowLeft size={15} /> Back to dashboard
      </Link>

      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-soft md:p-8">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-500">{event.department} · {event.type}</p>
            <h1 className="mt-1 font-display text-2xl font-bold text-slate-900">{event.name}</h1>
          </div>
          <StatusBadge status={event.status} />
        </div>

        <p className="mt-4 text-sm leading-relaxed text-slate-600">{event.description || "No description provided."}</p>

        <div className="mt-5 grid grid-cols-2 gap-4 rounded-xl bg-slate-50 p-4 text-sm md:grid-cols-3">
          <Field label="Date & Venue" value={`${formatDate(event.date)} · ${event.venue || "TBA"}`} />
          <Field label="Participation" value={event.participation === "TEAM" ? `Team ${event.teamMin}-${event.teamMax}` : event.participation} />
          <Field label="Payment" value={event.payment === "FREE" ? "Free" : `₹${event.fee}`} />
          <Field label="Attendance" value={event.attendanceRequired ? `QR (${event.qrMode})` : "Not required"} />
          <Field label="Certificate" value={event.certificateEnabled ? "Enabled" : "Disabled"} />
          <Field label="Capacity" value={event.capacityEnabled ? `${event.maxCapacity} ${event.capacityType === "TEAMS" ? "teams" : "participants"}` : "Unlimited"} />
        </div>

        {event.rules && (
          <div className="mt-5">
            <h3 className="font-display text-sm font-semibold text-slate-800">Rules</h3>
            <p className="mt-1 text-sm text-slate-500">{event.rules}</p>
          </div>
        )}

        <div className="mt-5">
          <h3 className="mb-2 font-display text-sm font-semibold text-slate-800">Registration Form Preview</h3>
          {event.customFields?.length ? (
            <div className="space-y-2">
              {event.customFields.map((f) => (
                <div key={f.id} className="flex items-center justify-between rounded-lg border border-slate-100 px-3.5 py-2.5 text-sm">
                  <span className="text-slate-700">{f.label} {f.required && <span className="text-red-500">*</span>}</span>
                  <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500">{f.type.replace("_", " ")}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400">No custom questions — default registration only.</p>
          )}
        </div>

        <div className="mt-7 flex flex-wrap gap-2.5 border-t border-slate-100 pt-6">
          <button onClick={approve} disabled={busy} className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60">
            <CheckCircle2 size={16} /> Approve & Unlock
          </button>
          <button onClick={() => { setNoteModal("changes"); setNote(""); }} className="flex items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-700 hover:bg-amber-100">
            <Edit3 size={16} /> Request Changes
          </button>
          <button onClick={() => { setNoteModal("reject"); setNote(""); }} className="flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-100">
            <XCircle size={16} /> Reject
          </button>
        </div>
      </div>

      <Modal open={!!noteModal} onClose={() => setNoteModal(null)} title={noteModal === "reject" ? "Reject Event" : "Request Changes"}>
        <textarea
          rows={4}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Add a note for the department admin..."
          className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm focus-ring focus:border-brand-400"
        />
        <button onClick={submitNote} disabled={busy} className="mt-4 w-full rounded-xl bg-brand-600 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60">
          {busy ? <Spinner /> : "Submit"}
        </button>
      </Modal>
    </div>
  );
}

function Field({ label, value }) {
  return (
    <div>
      <p className="text-xs font-medium text-slate-400">{label}</p>
      <p className="mt-0.5 font-medium text-slate-800">{value}</p>
    </div>
  );
}
