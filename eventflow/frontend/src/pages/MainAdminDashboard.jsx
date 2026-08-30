import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Building2, CalendarCheck2, Users2, Wallet, TrendingUp, ShieldCheck, Plus, Trash2, QrCode } from "lucide-react";
import api from "../services/api.js";
import { useToast } from "../context/ToastContext.jsx";
import Modal from "../components/Modal.jsx";
import { formatDate } from "../utils/statusMeta.js";
import { Spinner } from "../components/Loader.jsx";

export default function MainAdminDashboard() {
  const toast = useToast();
  const [dash, setDash] = useState(null);
  const [admins, setAdmins] = useState(null);
  const [depts, setDepts] = useState([]);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "123456", department: "" });
  const [busy, setBusy] = useState(false);

  const load = () => {
    api.get("/admin/dashboard").then((res) => setDash(res.data));
    api.get("/admin/department-admins").then((res) => setAdmins(res.data));
    api.get("/departments").then((res) => setDepts(res.data));
  };
  useEffect(load, []);

  const createAdmin = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.post("/admin/department-admins", form);
      toast.success(`${form.name} added as ${form.department} admin.`);
      setShowAdminModal(false);
      setForm({ name: "", email: "", password: "123456", department: "" });
      load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const removeAdmin = async (id) => {
    try {
      await api.delete(`/admin/department-admins/${id}`);
      toast.info("Department admin removed.");
      load();
    } catch (err) { toast.error(err.message); }
  };

  return (
    <div className="mx-auto max-w-6xl px-5 py-10">
      <div className="mb-7 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">Main Admin</h1>
          <p className="mt-1 text-sm text-slate-500">Platform-wide control over departments, approvals and analytics.</p>
        </div>
        <Link to="/admin/scanner" className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
          <QrCode size={16} /> Scanner
        </Link>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        <Stat icon={Building2} label="Departments" value={dash?.departments} />
        <Stat icon={CalendarCheck2} label="Total Events" value={dash?.totalEvents} />
        <Stat icon={TrendingUp} label="Active Events" value={dash?.activeEvents} />
        <Stat icon={Users2} label="Registrations" value={dash?.registrations} />
      </div>
      <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        <Stat icon={Wallet} label="Revenue" value={dash ? `₹${dash.revenue.toLocaleString("en-IN")}` : undefined} />
        <Stat icon={ShieldCheck} label="Attendance Logged" value={dash?.attendance} />
      </div>

      <div className="mb-8">
        <h2 className="mb-3 font-display text-lg font-bold text-slate-900">Pending Approvals</h2>
        <div className="space-y-2.5">
          {dash?.pendingApprovals?.length ? (
            dash.pendingApprovals.map((e) => (
              <div key={e.id} className="flex items-center justify-between rounded-xl2 border border-amber-100 bg-amber-50/60 p-4">
                <div>
                  <p className="font-display text-sm font-semibold text-slate-900">{e.name}</p>
                  <p className="text-xs text-slate-500">{e.department} · submitted by {e.submittedBy}</p>
                </div>
                <Link to={`/main-admin/review/${e.id}`} className="rounded-lg bg-brand-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-brand-700">
                  Review
                </Link>
              </div>
            ))
          ) : (
            <p className="rounded-xl2 border border-dashed border-slate-200 p-6 text-center text-sm text-slate-400">Nothing pending review right now.</p>
          )}
        </div>
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-slate-900">Department Admins</h2>
          <button onClick={() => setShowAdminModal(true)} className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-brand-700">
            <Plus size={14} /> Add Admin
          </button>
        </div>
        <div className="overflow-hidden rounded-xl2 border border-slate-100 bg-white shadow-card">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr><th className="px-5 py-3">Name</th><th className="px-5 py-3">Email</th><th className="px-5 py-3">Department</th><th className="px-5 py-3"></th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {admins?.map((a) => (
                <tr key={a.id}>
                  <td className="px-5 py-3 font-medium text-slate-800">{a.name}</td>
                  <td className="px-5 py-3 text-slate-500">{a.email}</td>
                  <td className="px-5 py-3 text-slate-500">{a.department}</td>
                  <td className="px-5 py-3 text-right">
                    <button onClick={() => removeAdmin(a.id)} className="text-slate-300 hover:text-red-500"><Trash2 size={15} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={showAdminModal} onClose={() => setShowAdminModal(false)} title="Add Department Admin">
        <form onSubmit={createAdmin} className="space-y-3.5">
          <input required placeholder="Full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm focus-ring focus:border-brand-400" />
          <input required type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm focus-ring focus:border-brand-400" />
          <input required placeholder="Temporary password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm focus-ring focus:border-brand-400" />
          <select required value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm focus-ring focus:border-brand-400">
            <option value="" disabled>Select department / club</option>
            {depts.map((d) => <option key={d.id} value={d.name}>{d.name}</option>)}
          </select>
          <button disabled={busy} className="flex w-full items-center justify-center rounded-xl bg-brand-600 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60">
            {busy ? <Spinner /> : "Create Admin"}
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
