import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { CalendarDays, MapPin, Users, Clock, ShieldCheck, ArrowLeft } from "lucide-react";
import api from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import DynamicForm from "../components/DynamicForm.jsx";
import Modal from "../components/Modal.jsx";
import TicketQR from "../components/TicketQR.jsx";
import { COMING_SOON, formatDate, EVENT_TYPE_EMOJI } from "../utils/statusMeta.js";
import { Spinner } from "../components/Loader.jsx";

export default function EventDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const toast = useToast();
  const nav = useNavigate();

  const [event, setEvent] = useState(null);
  const [myTeamForEvent, setMyTeamForEvent] = useState(null);
  const [showRegister, setShowRegister] = useState(false);
  const [showTeamPicker, setShowTeamPicker] = useState(false);
  const [answers, setAnswers] = useState({});
  const [busy, setBusy] = useState(false);
  const [confirmed, setConfirmed] = useState(null); // { registration } | { payment pending }

  const load = () => {
    api.get(`/events/${id}`).then((res) => setEvent(res.data));
    if (user?.role === "PARTICIPANT") {
      api.get("/teams/my").then((res) => setMyTeamForEvent(res.data.find((t) => t.eventId === id) || null));
    }
  };

  useEffect(load, [id, user]);

  if (!event) {
    return (
      <div className="flex h-[60vh] items-center justify-center text-brand-500">
        <Spinner size={28} />
      </div>
    );
  }

  const isComingSoon = COMING_SOON.has(event.status);
  const canRegisterIndividual = event.participation === "INDIVIDUAL" || event.participation === "EITHER";
  const canRegisterTeam = event.participation === "TEAM" || event.participation === "EITHER";

  const startIndividualRegister = () => {
    if (!user) return nav("/login", { state: { from: `/events/${id}` } });
    if (user.role !== "PARTICIPANT") return toast.info("Log in as a student to register.");
    setAnswers({});
    setShowRegister(true);
  };

  const submitIndividual = async () => {
    setBusy(true);
    try {
      const res = await api.post("/registrations", { eventId: id, answers });
      setShowRegister(false);
      setConfirmed({ registration: res.data, needsPayment: res.data.status === "PENDING_PAYMENT" });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const payDemo = async (registrationId, succeed) => {
    setBusy(true);
    try {
      const res = await api.post(`/payments/${succeed ? "demo-pay" : "demo-fail"}`, { registrationId });
      if (succeed) {
        toast.success("Payment successful — your entry pass is ready.");
        setConfirmed({ registration: res.data.registration, needsPayment: false });
      } else {
        toast.error("Payment failed — no entry pass was generated.");
        setConfirmed({ registration: res.data.registration, needsPayment: true, failed: true });
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-5 py-8">
      <Link to="/events" className="mb-5 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-brand-600">
        <ArrowLeft size={15} /> Back to events
      </Link>

      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-soft">
        <div className="relative flex h-48 items-center justify-center bg-gradient-to-br from-brand-500 via-brand-600 to-electric text-7xl md:h-64">
          {EVENT_TYPE_EMOJI[event.type] || "🎉"}
          <div className="absolute left-4 top-4"><StatusBadge status={event.effectiveStatus} /></div>
          {isComingSoon && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-900/40 text-lg font-semibold uppercase tracking-wide text-white">
              Coming Soon
            </div>
          )}
        </div>

        <div className="p-6 md:p-8">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-500">{event.department} · {event.type}</p>
          <h1 className="mt-1.5 font-display text-2xl font-bold text-slate-900 md:text-3xl">{event.name}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600">{event.description}</p>

          <div className="mt-5 grid grid-cols-2 gap-4 rounded-xl bg-slate-50 p-4 text-sm md:grid-cols-4">
            <Info icon={CalendarDays} label="Date" value={formatDate(event.date)} />
            <Info icon={Clock} label="Time" value={event.startTime || "TBA"} />
            <Info icon={MapPin} label="Venue" value={event.venue || "TBA"} />
            <Info icon={Users} label="Participation" value={event.participation === "INDIVIDUAL" ? "Individual" : event.participation === "TEAM" ? `Team ${event.teamMin}–${event.teamMax}` : "Individual or Team"} />
          </div>

          {event.rules && (
            <div className="mt-5">
              <h3 className="font-display text-sm font-semibold text-slate-800">Rules & Eligibility</h3>
              <p className="mt-1 text-sm leading-relaxed text-slate-500">{event.rules}</p>
            </div>
          )}

          {event.registrationDeadline && (
            <p className="mt-4 text-xs font-medium text-slate-400">Registration closes {event.registrationDeadline}</p>
          )}

          <div className="mt-7 flex flex-col gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <span className={`rounded-full px-3 py-1.5 text-sm font-bold ${event.payment === "FREE" ? "bg-emerald-100 text-emerald-700" : "bg-purple-100 text-purple-700"}`}>
                {event.payment === "FREE" ? "FREE" : `₹${event.fee}`}
              </span>
              {event.capacityEnabled && (
                <span className="ml-3 text-xs font-medium text-slate-400">
                  {event.filled} / {event.maxCapacity} {event.capacityType === "TEAMS" ? "teams" : "seats"} filled
                </span>
              )}
            </div>

            <CTA
              event={event}
              isComingSoon={isComingSoon}
              canRegisterIndividual={canRegisterIndividual}
              canRegisterTeam={canRegisterTeam}
              myTeam={myTeamForEvent}
              onIndividual={startIndividualRegister}
              onTeam={() => (user ? setShowTeamPicker(true) : nav("/login", { state: { from: `/events/${id}` } }))}
            />
          </div>
        </div>
      </div>

      {/* Individual registration modal */}
      <Modal open={showRegister} onClose={() => setShowRegister(false)} title="Register">
        <DynamicForm fields={event.customFields} values={answers} onChange={setAnswers} />
        <button
          disabled={busy}
          onClick={submitIndividual}
          className="mt-5 w-full rounded-xl bg-brand-600 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
        >
          {busy ? <Spinner /> : event.payment === "FREE" ? "Register for Free" : `Continue to Payment ₹${event.fee}`}
        </button>
      </Modal>

      {/* Team picker modal */}
      <Modal open={showTeamPicker} onClose={() => setShowTeamPicker(false)} title="Team registration">
        <p className="mb-4 text-sm text-slate-500">Create a new team or join one using an invite code.</p>
        <div className="flex flex-col gap-2.5">
          <Link
            to={`/events/${id}/create-team`}
            className="rounded-xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm font-semibold text-brand-700 hover:bg-brand-100"
          >
            Create a team
          </Link>
          <Link to="/join-team" className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            Join with an invite code
          </Link>
        </div>
      </Modal>

      {/* Confirmation / payment / QR modal */}
      <Modal open={!!confirmed} onClose={() => { setConfirmed(null); load(); }} title={confirmed?.needsPayment ? (confirmed.failed ? "Payment Failed" : "Complete Payment") : "You're in! 🎉"}>
        {confirmed?.needsPayment ? (
          confirmed.failed ? (
            <div className="text-center">
              <p className="text-sm text-slate-600">Your payment wasn't completed. Your entry pass has not been generated.</p>
              <button onClick={() => payDemo(confirmed.registration.id, true)} disabled={busy} className="mt-5 w-full rounded-xl bg-brand-600 py-2.5 text-sm font-semibold text-white hover:bg-brand-700">
                Try Payment Again
              </button>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-sm text-slate-600">This is Demo Payment Mode — no real card is needed for this class project.</p>
              <p className="mt-2 font-display text-3xl font-bold text-slate-900">₹{event.fee}</p>
              <div className="mt-5 flex gap-2.5">
                <button onClick={() => payDemo(confirmed.registration.id, false)} disabled={busy} className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50">
                  Simulate Failure
                </button>
                <button onClick={() => payDemo(confirmed.registration.id, true)} disabled={busy} className="flex-1 rounded-xl bg-brand-600 py-2.5 text-sm font-semibold text-white hover:bg-brand-700">
                  {busy ? <Spinner /> : `Pay ₹${event.fee}`}
                </button>
              </div>
            </div>
          )
        ) : (
          <div className="flex flex-col items-center text-center">
            <ShieldCheck className="mb-2 text-emerald-500" size={28} />
            <p className="mb-4 text-sm text-slate-600">Your entry pass is ready. Show this QR at the venue.</p>
            <TicketQR token={confirmed?.registration?.qrToken} />
            <Link to="/my-tickets" className="mt-5 text-sm font-semibold text-brand-600 hover:text-brand-700">View all my tickets →</Link>
          </div>
        )}
      </Modal>
    </div>
  );
}

function Info({ icon: Icon, label, value }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-slate-400"><Icon size={13} /><span className="text-xs font-medium">{label}</span></div>
      <p className="mt-0.5 font-medium text-slate-800">{value}</p>
    </div>
  );
}

function CTA({ event, isComingSoon, canRegisterIndividual, canRegisterTeam, myTeam, onIndividual, onTeam }) {
  if (isComingSoon) {
    return <div className="rounded-xl bg-slate-100 px-6 py-3 text-sm font-semibold text-slate-400">Registrations will open shortly</div>;
  }
  if (event.effectiveStatus === "FULL") {
    return <div className="rounded-xl bg-red-50 px-6 py-3 text-sm font-semibold text-red-500">Event Full</div>;
  }
  if (event.effectiveStatus !== "REGISTRATION_OPEN") {
    return <div className="rounded-xl bg-slate-100 px-6 py-3 text-sm font-semibold text-slate-400">Registration unavailable</div>;
  }
  if (event.participation === "TEAM" && myTeam) {
    return (
      <Link to="/my-teams" className="rounded-xl bg-brand-600 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-700">
        View your team →
      </Link>
    );
  }
  return (
    <div className="flex gap-2.5">
      {canRegisterIndividual && (
        <button onClick={onIndividual} className="rounded-xl bg-brand-600 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-700">
          {event.payment === "FREE" ? "Register for Free" : `Register & Pay ₹${event.fee}`}
        </button>
      )}
      {canRegisterTeam && (
        <button onClick={onTeam} className="rounded-xl border border-brand-200 bg-brand-50 px-6 py-3 text-sm font-semibold text-brand-700 hover:bg-brand-100">
          Team Registration
        </button>
      )}
    </div>
  );
}
