import { useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles, ArrowRight } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";

const DEMOS = [
  { label: "Main Admin", email: "admin@eventflow.com" },
  { label: "CSE Admin", email: "cse@eventflow.com" },
  { label: "Cultural Admin", email: "cultural@eventflow.com" },
  { label: "Gate Volunteer", email: "volunteer@eventflow.com" },
  { label: "Student", email: "student@eventflow.com" },
];

export default function Login() {
  const { login, register } = useAuth();
  const toast = useToast();
  const nav = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("123456");
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");

  const routeAfterLogin = (user) => {
    const from = location.state?.from;
    if (from) return nav(from);
    if (user.role === "SUPER_ADMIN") return nav("/main-admin");
    if (user.role === "DEPARTMENT_ADMIN") return nav("/admin");
    if (user.role === "VOLUNTEER") return nav("/admin/scanner");
    nav("/events");
  };

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const user = mode === "login" ? await login(email, password) : await register({ name, email, password });
      toast.success(mode === "login" ? `Welcome back, ${user.name.split(" ")[0]}!` : `Welcome to EventFlow, ${user.name.split(" ")[0]}!`);
      routeAfterLogin(user);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="hero-gradient flex min-h-screen items-center justify-center px-5 py-10">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="mb-7 flex flex-col items-center text-center">
          <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-electric text-white shadow-glow">
            <Sparkles size={20} />
          </span>
          <h1 className="font-display text-2xl font-bold text-slate-900">
            Event<span className="gradient-text">Flow</span>
          </h1>
          <p className="mt-1 text-sm text-slate-500">Your campus, one place to register, pay and show up.</p>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-soft">
          <div className="mb-5 flex rounded-lg bg-slate-100 p-1 text-sm font-medium">
            <button onClick={() => setMode("login")} className={`flex-1 rounded-md py-1.5 transition-colors ${mode === "login" ? "bg-white shadow-sm text-brand-700" : "text-slate-500"}`}>
              Log in
            </button>
            <button onClick={() => setMode("signup")} className={`flex-1 rounded-md py-1.5 transition-colors ${mode === "signup" ? "bg-white shadow-sm text-brand-700" : "text-slate-500"}`}>
              Student sign up
            </button>
          </div>

          <form onSubmit={submit} className="space-y-3.5">
            {mode === "signup" && (
              <input
                required
                placeholder="Full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm focus-ring focus:border-brand-400"
              />
            )}
            <input
              required
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm focus-ring focus:border-brand-400"
            />
            <input
              required
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm focus-ring focus:border-brand-400"
            />
            <button
              disabled={busy}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-brand-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700 disabled:opacity-60"
            >
              {mode === "login" ? "Log in" : "Create account"} <ArrowRight size={15} />
            </button>
          </form>
        </div>

        {mode === "login" && (
          <div className="mt-5 rounded-2xl border border-dashed border-slate-200 bg-white/70 p-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Demo accounts · password 123456</p>
            <div className="flex flex-wrap gap-2">
              {DEMOS.map((d) => (
                <button
                  key={d.email}
                  onClick={() => setEmail(d.email)}
                  className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:border-brand-300 hover:text-brand-700"
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <p className="mt-5 text-center text-xs text-slate-400">
          <Link to="/events" className="hover:text-brand-600">Browse events without logging in →</Link>
        </p>
      </motion.div>
    </div>
  );
}
