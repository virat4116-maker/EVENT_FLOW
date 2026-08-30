import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api from "../services/api.js";
import { useToast } from "../context/ToastContext.jsx";
import { Spinner } from "../components/Loader.jsx";
import { ArrowLeft, Users } from "lucide-react";

export default function CreateTeam() {
  const { id } = useParams();
  const nav = useNavigate();
  const toast = useToast();
  const [event, setEvent] = useState(null);
  const [teamName, setTeamName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.get(`/events/${id}`).then((res) => setEvent(res.data));
  }, [id]);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await api.post("/teams", { eventId: id, teamName });
      toast.success(`Team "${res.data.name}" created — share your invite code!`);
      nav("/my-teams");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (!event) return null;

  return (
    <div className="mx-auto max-w-md px-5 py-10">
      <Link to={`/events/${id}`} className="mb-5 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-brand-600">
        <ArrowLeft size={15} /> Back to event
      </Link>
      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-soft">
        <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-50 text-brand-600"><Users size={20} /></div>
        <h1 className="font-display text-xl font-bold text-slate-900">Create your team</h1>
        <p className="mt-1 text-sm text-slate-500">For {event.name} · {event.teamMin}–{event.teamMax} members</p>
        <form onSubmit={submit} className="mt-5 space-y-3.5">
          <input
            required
            placeholder="Team name"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm focus-ring focus:border-brand-400"
          />
          <button disabled={busy} className="flex w-full items-center justify-center rounded-xl bg-brand-600 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60">
            {busy ? <Spinner /> : "Create Team"}
          </button>
        </form>
      </div>
    </div>
  );
}
