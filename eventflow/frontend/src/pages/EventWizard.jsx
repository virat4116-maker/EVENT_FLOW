import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, Save, Send } from "lucide-react";
import api from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import FormBuilder from "../components/FormBuilder.jsx";
import { Spinner } from "../components/Loader.jsx";

const EVENT_TYPES = ["EVENT", "COMPETITION", "CAMPAIGN", "WORKSHOP", "SEMINAR", "SPORTS", "CULTURAL", "OTHER"];
const STEPS = ["Basic Details", "Participation", "Rules & Options", "Custom Questions", "Review"];

const DEFAULT = {
  name: "", type: "EVENT", category: "", department: "", description: "", banner: "",
  date: "", startTime: "", endTime: "", venue: "", rules: "", instructions: "",
  participation: "INDIVIDUAL", teamMin: 2, teamMax: 5, teamLeaderRequired: true,
  payment: "FREE", fee: 0, attendanceRequired: true, qrMode: "INDIVIDUAL",
  certificateEnabled: false, capacityEnabled: false, maxCapacity: 100, capacityType: "PARTICIPANTS",
  registrationDeadline: "", customFields: [],
};

export default function EventWizard() {
  const { id } = useParams();
  const isEdit = !!id;
  const { user } = useAuth();
  const toast = useToast();
  const nav = useNavigate();

  const [step, setStep] = useState(0);
  const [form, setForm] = useState(DEFAULT);
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(!isEdit);

  useEffect(() => {
    if (isEdit) {
      api.get(`/events/${id}`).then((res) => {
        setForm({ ...DEFAULT, ...res.data });
        setLoaded(true);
      });
    }
  }, [id]);

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  const save = async (submitAfter) => {
    setBusy(true);
    try {
      let saved;
      if (isEdit) {
        saved = (await api.put(`/events/${id}`, form)).data;
      } else {
        saved = (await api.post("/events", form)).data;
      }
      if (submitAfter) {
        await api.post(`/events/${saved.id}/submit`);
        toast.success("Event submitted for Main Admin approval.");
      } else {
        toast.success("Saved as draft.");
      }
      nav("/admin");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (!loaded) return <div className="flex h-[60vh] items-center justify-center text-brand-500"><Spinner size={28} /></div>;

  return (
    <div className="mx-auto max-w-3xl px-5 py-10">
      <Link to="/admin" className="mb-5 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-brand-600">
        <ArrowLeft size={15} /> Back to dashboard
      </Link>

      <h1 className="mb-1 font-display text-2xl font-bold text-slate-900">{isEdit ? "Edit Event" : "Create Event"}</h1>
      <p className="mb-6 text-sm text-slate-500">Google-Forms-like control over exactly what your event needs.</p>

      <div className="mb-7 flex items-center gap-1.5">
        {STEPS.map((s, i) => (
          <div key={s} className="flex flex-1 items-center gap-1.5">
            <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${i < step ? "bg-emerald-500 text-white" : i === step ? "bg-brand-600 text-white" : "bg-slate-200 text-slate-500"}`}>
              {i < step ? <Check size={13} /> : i + 1}
            </div>
            {i < STEPS.length - 1 && <div className={`h-0.5 flex-1 rounded ${i < step ? "bg-emerald-400" : "bg-slate-200"}`} />}
          </div>
        ))}
      </div>
      <p className="mb-5 text-xs font-semibold uppercase tracking-wide text-brand-500">{STEPS[step]}</p>

      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-soft md:p-8">
        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.18 }}>
            {step === 0 && <StepBasic form={form} set={set} user={user} />}
            {step === 1 && <StepParticipation form={form} set={set} />}
            {step === 2 && <StepOptions form={form} set={set} />}
            {step === 3 && <StepQuestions form={form} set={set} />}
            {step === 4 && <StepReview form={form} />}
          </motion.div>
        </AnimatePresence>

        <div className="mt-8 flex items-center justify-between border-t border-slate-100 pt-5">
          <button
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 disabled:opacity-40"
          >
            <ArrowLeft size={15} /> Back
          </button>

          {step < STEPS.length - 1 ? (
            <button
              onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}
              disabled={step === 0 && !form.name}
              className="flex items-center gap-1.5 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-40"
            >
              Next <ArrowRight size={15} />
            </button>
          ) : (
            <div className="flex gap-2.5">
              <button onClick={() => save(false)} disabled={busy} className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-60">
                <Save size={15} /> Save Draft
              </button>
              <button onClick={() => save(true)} disabled={busy} className="flex items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60">
                {busy ? <Spinner /> : <Send size={15} />} Submit for Approval
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const input = "w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm focus-ring focus:border-brand-400";
const label = "mb-1.5 block text-sm font-medium text-slate-700";

function StepBasic({ form, set, user }) {
  return (
    <div className="space-y-4">
      <div>
        <label className={label}>Event Name</label>
        <input className={input} value={form.name} onChange={(e) => set({ name: e.target.value })} placeholder="e.g. Hackathon 2026" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={label}>Event Type</label>
          <select className={input} value={form.type} onChange={(e) => set({ type: e.target.value })}>
            {EVENT_TYPES.map((t) => <option key={t} value={t}>{t.charAt(0) + t.slice(1).toLowerCase()}</option>)}
          </select>
        </div>
        <div>
          <label className={label}>Category</label>
          <input className={input} value={form.category} onChange={(e) => set({ category: e.target.value })} placeholder="e.g. Technology" />
        </div>
      </div>
      {user?.role === "SUPER_ADMIN" && (
        <div>
          <label className={label}>Department / Club</label>
          <input className={input} value={form.department} onChange={(e) => set({ department: e.target.value })} placeholder="e.g. Computer Science" />
        </div>
      )}
      <div>
        <label className={label}>Description</label>
        <textarea rows={3} className={input} value={form.description} onChange={(e) => set({ description: e.target.value })} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div><label className={label}>Date</label><input type="date" className={input} value={form.date} onChange={(e) => set({ date: e.target.value })} /></div>
        <div><label className={label}>Venue</label><input className={input} value={form.venue} onChange={(e) => set({ venue: e.target.value })} /></div>
        <div><label className={label}>Start Time</label><input className={input} value={form.startTime} onChange={(e) => set({ startTime: e.target.value })} placeholder="09:00" /></div>
        <div><label className={label}>End Time</label><input className={input} value={form.endTime} onChange={(e) => set({ endTime: e.target.value })} placeholder="17:00" /></div>
      </div>
      <div>
        <label className={label}>Rules & Instructions</label>
        <textarea rows={2} className={input} value={form.rules} onChange={(e) => set({ rules: e.target.value })} />
      </div>
    </div>
  );
}

function StepParticipation({ form, set }) {
  return (
    <div className="space-y-5">
      <div>
        <label className={label}>How can students participate?</label>
        <div className="grid grid-cols-3 gap-2.5">
          {["INDIVIDUAL", "TEAM", "EITHER"].map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => set({ participation: p, qrMode: p === "INDIVIDUAL" ? "INDIVIDUAL" : form.qrMode })}
              className={`rounded-xl border px-3 py-3 text-sm font-semibold transition-colors ${form.participation === p ? "border-brand-500 bg-brand-50 text-brand-700" : "border-slate-200 text-slate-500 hover:border-slate-300"}`}
            >
              {p === "EITHER" ? "Individual or Team" : p.charAt(0) + p.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {form.participation !== "INDIVIDUAL" && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="space-y-4 overflow-hidden rounded-xl bg-slate-50 p-4">
            <div className="grid grid-cols-2 gap-4">
              <div><label className={label}>Minimum Team Size</label><input type="number" min={1} className={input} value={form.teamMin} onChange={(e) => set({ teamMin: Number(e.target.value) })} /></div>
              <div><label className={label}>Maximum Team Size</label><input type="number" min={1} className={input} value={form.teamMax} onChange={(e) => set({ teamMax: Number(e.target.value) })} /></div>
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input type="checkbox" className="accent-brand-600" checked={form.teamLeaderRequired} onChange={(e) => set({ teamLeaderRequired: e.target.checked })} />
              Team Leader Required
            </label>
            <div>
              <label className={label}>QR Attendance Mode</label>
              <div className="grid grid-cols-2 gap-2.5">
                <button type="button" onClick={() => set({ qrMode: "TEAM" })} className={`rounded-lg border px-3 py-2 text-sm font-semibold ${form.qrMode === "TEAM" ? "border-brand-500 bg-brand-50 text-brand-700" : "border-slate-200 text-slate-500"}`}>One QR per team</button>
                <button type="button" onClick={() => set({ qrMode: "INDIVIDUAL" })} className={`rounded-lg border px-3 py-2 text-sm font-semibold ${form.qrMode === "INDIVIDUAL" ? "border-brand-500 bg-brand-50 text-brand-700" : "border-slate-200 text-slate-500"}`}>QR per member</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StepOptions({ form, set }) {
  return (
    <div className="space-y-5">
      <div>
        <label className={label}>Payment</label>
        <div className="grid grid-cols-2 gap-2.5">
          <button type="button" onClick={() => set({ payment: "FREE", fee: 0 })} className={`rounded-xl border px-3 py-3 text-sm font-semibold ${form.payment === "FREE" ? "border-emerald-400 bg-emerald-50 text-emerald-700" : "border-slate-200 text-slate-500"}`}>Free</button>
          <button type="button" onClick={() => set({ payment: "PAID" })} className={`rounded-xl border px-3 py-3 text-sm font-semibold ${form.payment === "PAID" ? "border-purple-400 bg-purple-50 text-purple-700" : "border-slate-200 text-slate-500"}`}>Paid</button>
        </div>
        <AnimatePresence>
          {form.payment === "PAID" && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mt-3 overflow-hidden">
              <label className={label}>Entry Fee (₹)</label>
              <input type="number" min={1} className={input} value={form.fee} onChange={(e) => set({ fee: Number(e.target.value) })} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <label className="flex items-center gap-2 text-sm text-slate-600">
        <input type="checkbox" className="accent-brand-600" checked={form.attendanceRequired} onChange={(e) => set({ attendanceRequired: e.target.checked })} />
        QR Attendance Required
      </label>

      <label className="flex items-center gap-2 text-sm text-slate-600">
        <input type="checkbox" className="accent-brand-600" checked={form.certificateEnabled} onChange={(e) => set({ certificateEnabled: e.target.checked })} />
        Certificate Available
      </label>

      <div>
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input type="checkbox" className="accent-brand-600" checked={form.capacityEnabled} onChange={(e) => set({ capacityEnabled: e.target.checked })} />
          Limit Participants
        </label>
        <AnimatePresence>
          {form.capacityEnabled && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mt-3 grid grid-cols-2 gap-4 overflow-hidden">
              <div><label className={label}>Maximum</label><input type="number" min={1} className={input} value={form.maxCapacity} onChange={(e) => set({ maxCapacity: Number(e.target.value) })} /></div>
              {form.participation !== "INDIVIDUAL" && (
                <div>
                  <label className={label}>Capacity Counts</label>
                  <select className={input} value={form.capacityType} onChange={(e) => set({ capacityType: e.target.value })}>
                    <option value="PARTICIPANTS">Participants</option>
                    <option value="TEAMS">Teams</option>
                  </select>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div>
        <label className={label}>Registration Deadline</label>
        <input className={input} value={form.registrationDeadline} onChange={(e) => set({ registrationDeadline: e.target.value })} placeholder="e.g. September 8, 11:59 PM" />
      </div>
    </div>
  );
}

function StepQuestions({ form, set }) {
  return (
    <div>
      <p className="mb-4 text-sm text-slate-500">Add exactly the fields participants need to fill for this event — like Google Forms.</p>
      <FormBuilder fields={form.customFields} onChange={(customFields) => set({ customFields })} />
    </div>
  );
}

function StepReview({ form }) {
  return (
    <div className="space-y-4 text-sm">
      <div className="rounded-xl bg-slate-50 p-4">
        <p className="font-display text-lg font-bold text-slate-900">{form.name || "Untitled Event"}</p>
        <p className="text-slate-500">{form.type} · {form.department || "—"} · {form.date || "Date TBA"}</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <ReviewRow k="Participation" v={form.participation === "TEAM" ? `Team ${form.teamMin}-${form.teamMax}` : form.participation} />
        <ReviewRow k="Payment" v={form.payment === "FREE" ? "Free" : `₹${form.fee}`} />
        <ReviewRow k="Attendance" v={form.attendanceRequired ? `QR (${form.qrMode})` : "None"} />
        <ReviewRow k="Certificate" v={form.certificateEnabled ? "Enabled" : "Disabled"} />
        <ReviewRow k="Capacity" v={form.capacityEnabled ? `${form.maxCapacity} ${form.capacityType.toLowerCase()}` : "Unlimited"} />
        <ReviewRow k="Custom Questions" v={form.customFields.length} />
      </div>
      <p className="rounded-lg border border-amber-100 bg-amber-50 px-4 py-3 text-xs text-amber-700">
        Submitting sends this event to the Main Admin for review. It stays as "Coming Soon" to students until approved.
      </p>
    </div>
  );
}

function ReviewRow({ k, v }) {
  return (
    <div className="rounded-lg border border-slate-100 px-3.5 py-2.5">
      <p className="text-xs text-slate-400">{k}</p>
      <p className="font-medium text-slate-800">{v}</p>
    </div>
  );
}
