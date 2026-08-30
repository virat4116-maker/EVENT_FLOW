import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, CalendarCheck2, Users2, Wallet, TrendingUp, QrCode, Send, Lock, CheckCircle2, ShieldCheck, Trash2, UserPlus } from "lucide-react";
import api from "../services/api.js";
import { useToast } from "../context/ToastContext.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import Modal from "../components/Modal.jsx";
import { formatDate } from "../utils/statusMeta.js";
import { CardSkeleton, Spinner } from "../components/Loader.jsx";

export default function AdminDashboard() {
  const toast = useToast();
  const [dash, setDash] = useState(null);
  const [events, setEvents] = useState(null);
  const [volunteers, setVolunteers] = useState(null);
  const [showVolunteerModal, setShowVolunteerModal] = useState(false);
  const [vForm, setVForm] = useState({ name: "", email: "", password: "123456" });
  const [busy, setBusy] = useState(false);

  const load = () => {
    api.get("/admin/dashboard").then((res) => setDash(res.data));
    api.get("/events").then((res) => setEvents(res.data));
    api.get("/admin/volunteers").then((res) => setVolunteers(res.data));
  };
  useEffect(load, []);

  const submitForApproval = async (id) => {
    try {
      await api.post(`/events/${id}/submit`);
      toast.success("Submitted for Main Admin review.");
      load();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const closeReg = async (id) => {
    try {
      await api.post(`/events/${id}/close`);
      toast.info("Registration closed.");
      load();
    } catch (err) { toast.error(err.message); }
  };

  const complete = async (id) => {
    try {
      await api.post(`/events/${id}/complete`);
      toast.success("Event marked completed — certificates can now be claimed.");
      load();
    } catch (err) { toast.error(err.message); }
  };

  const createVolunteer = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.post("/admin/volunteers", vForm);
      toast.success(`${vForm.name} can now log in and scan entries for your department.`);
      setShowVolunteerModal(false);
      setVForm({ name: "", email: "", password: "123456" });
      load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const removeVolunteer = async (id) => {
    try {
      await api.delete(`/admin/volunteers/${id}`);
      toast.info("Volunteer access revoked.");
      load();
    } catch (err) { toast.error(err.message); }
  };

  return (
    <div className="mx-auto max-w-6xl px-5 py-10">
      <div className="mb-7 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">{dash?.scope || "Department"} Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">Manage your events, approvals and attendance.</p>
        </div>
        <div className="flex gap-2.5">
          <Link to="/admin/scanner" className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            <QrCode size={16} /> Scanner
          </Link>
          <Link to="/admin/events/new" className="flex items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700">
            <Plus size={16} /> New Event
          </Link>
        </div>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        <Stat icon={CalendarCheck2} label="Total Events" value={dash?.totalEvents} />
        <Stat icon={TrendingUp} label="Active Events" value={dash?.activeEvents} />
        <Stat icon={Users2} label="Registrations" value={dash?.registrations} />
        <Stat icon={Wallet} label="Revenue" value={dash ? `₹${dash.revenue.toLocaleString("en-IN")}` : undefined} />
      </div>

      <h2 className="mb-3 font-display text-lg font-bold text-slate-900">Your Events</h2>
      <div className="mb-9 overflow-hidden rounded-xl2 border border-slate-100 bg-white shadow-card">
        {events === null ? (
          <div className="p-5"><CardSkeleton /></div>
        ) : events.length === 0 ? (
          <p className="p-8 text-center text-sm text-slate-400">No events yet — create your first one.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3">Event</th>
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {events.map((e) => (
                <tr key={e.id} className="hover:bg-slate-50/60">
                  <td className="px-5 py-3.5 font-medium text-slate-800">{e.name}</td>
                  <td className="px-5 py-3.5 text-slate-500">{formatDate(e.date)}</td>
                  <td className="px-5 py-3.5"><StatusBadge status={e.effectiveStatus} /></td>
                  <td className="px-5 py-3.5">
                    <div className="flex justify-end gap-2 text-xs font-semibold">
                      {["DRAFT", "CHANGES_REQUESTED"].includes(e.status) && (
                        <>
                          <Link to={`/admin/events/${e.id}/edit`} className="text-slate-500 hover:text-brand-600">Edit</Link>
                          <button onClick={() => submitForApproval(e.id)} className="flex items-center gap-1 text-brand-600 hover:text-brand-700"><Send size={12} /> Submit</button>
                        </>
                      )}
                      {["REGISTRATION_OPEN", "PUBLISHED", "APPROVED"].includes(e.status) && (
                        <>
                          <Link to={`/admin/events/${e.id}/registrations`} className="text-slate-500 hover:text-brand-600">Registrations</Link>
                          <button onClick={() => closeReg(e.id)} className="flex items-center gap-1 text-amber-600 hover:text-amber-700"><Lock size={12} /> Close</button>
                        </>
                      )}
                      {e.status === "REGISTRATION_CLOSED" && (
                        <button onClick={() => complete(e.id)} className="flex items-center gap-1 text-emerald-600 hover:text-emerald-700"><CheckCircle2 size={12} /> Mark Completed</button>
                      )}
                      {e.status === "PENDING_APPROVAL" && <span className="text-slate-400">Awaiting review</span>}
                      {e.status === "COMPLETED" && <Link to={`/admin/events/${e.id}/registrations`} className="text-slate-500 hover:text-brand-600">View</Link>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="mb-3 flex items-center justify-between">
        <div>
          <h2 className="font-display text-lg font-bold text-slate-900">Gate Volunteers</h2>
          <p className="text-sm text-slate-500">Hand off entry scanning to a club or society council member — they only get scanner access, nothing else.</p>
        </div>
        <button onClick={() => setShowVolunteerModal(true)} className="flex shrink-0 items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700">
          <UserPlus size={16} /> Add Volunteer
        </button>
      </div>
      <div className="overflow-hidden rounded-xl2 border border-slate-100 bg-white shadow-card">
        {volunteers === null ? (
          <div className="p-5"><CardSkeleton /></div>
        ) : volunteers.length === 0 ? (
          <p className="p-8 text-center text-sm text-slate-400">No gate volunteers yet. Add one so they can log in and scan entries at the gate.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr><th className="px-5 py-3">Name</th><th className="px-5 py-3">Email</th><th className="px-5 py-3">Access</th><th className="px-5 py-3"></th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {volunteers.map((v) => (
                <tr key={v.id}>
                  <td className="px-5 py-3.5 font-medium text-slate-800">{v.name}</td>
                  <td className="px-5 py-3.5 text-slate-500">{v.email}</td>
                  <td className="px-5 py-3.5">
                    <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700">
                      <ShieldCheck size={12} /> Scanner only
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <button onClick={() => removeVolunteer(v.id)} className="text-slate-300 hover:text-red-500"><Trash2 size={15} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal open={showVolunteerModal} onClose={() => setShowVolunteerModal(false)} title="Add Gate Volunteer">
        <p className="mb-4 text-sm text-slate-500">
          They'll be able to log in and use the QR scanner for your department's events only — no dashboard, no event editing, no revenue.
        </p>
        <form onSubmit={createVolunteer} className="space-y-3.5">
          <input required placeholder="Full name" value={vForm.name} onChange={(e) => setVForm({ ...vForm, name: e.target.value })} className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm focus-ring focus:border-brand-400" />
          <input required type="email" placeholder="Email" value={vForm.email} onChange={(e) => setVForm({ ...vForm, email: e.target.value })} className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm focus-ring focus:border-brand-400" />
          <input required placeholder="Temporary password" value={vForm.password} onChange={(e) => setVForm({ ...vForm, password: e.target.value })} className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm focus-ring focus:border-brand-400" />
          <button disabled={busy} className="flex w-full items-center justify-center rounded-xl bg-brand-600 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60">
            {busy ? <Spinner /> : "Grant Scanner Access"}
          </button>
        </form>
      </Modal>
    </div>
  );
}

function Stat({ icon: Icon, label, value }) {
  return (
    <div className="rounded-xl2 border border-slate-100 bg-white p-4 shadow-card">
      <div className="flex items-center gap-1.5 text-slate-400"><Icon size={14} /><span className="text-xs font-medium">{label}</span></div>
      <p className="mt-2 font-display text-2xl font-bold text-slate-900">{value ?? <span className="skeleton inline-block h-6 w-12 align-middle" />}</p>
    </div>
  );
}
