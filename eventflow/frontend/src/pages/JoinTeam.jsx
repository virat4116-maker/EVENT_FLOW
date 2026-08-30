import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../services/api.js";
import { useToast } from "../context/ToastContext.jsx";
import { Spinner } from "../components/Loader.jsx";
import { ArrowLeft, KeyRound } from "lucide-react";

export default function JoinTeam() {
  const nav = useNavigate();
  const toast = useToast();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await api.post(`/teams/join/${code.trim().toUpperCase()}`);
      toast.success(`You've joined "${res.data.name}"!`);
      nav("/my-teams");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-5 py-10">
      <Link to="/events" className="mb-5 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-brand-600">
        <ArrowLeft size={15} /> Back
      </Link>
      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-soft">
        <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-50 text-brand-600"><KeyRound size={20} /></div>
        <h1 className="font-display text-xl font-bold text-slate-900">Join a team</h1>
        <p className="mt-1 text-sm text-slate-500">Enter the invite code your teammate shared with you.</p>
        <form onSubmit={submit} className="mt-5 space-y-3.5">
          <input
            required
            placeholder="e.g. CW-82K7A"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm uppercase tracking-wide focus-ring focus:border-brand-400"
          />
          <button disabled={busy} className="flex w-full items-center justify-center rounded-xl bg-brand-600 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60">
            {busy ? <Spinner /> : "Join Team"}
          </button>
        </form>
      </div>
    </div>
  );
}
