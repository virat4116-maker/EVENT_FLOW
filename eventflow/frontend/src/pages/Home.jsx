import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Ticket, ShieldCheck, QrCode, Users } from "lucide-react";
import { useEffect, useState } from "react";
import api from "../services/api.js";
import EventCard from "../components/EventCard.jsx";
import { CardSkeleton } from "../components/Loader.jsx";

const PILLARS = [
  { icon: Ticket, title: "One place to register", body: "Every club, department and committee lists events in a single feed — no more scattered forms." },
  { icon: Users, title: "Built for teams", body: "Create a team, share an invite code, and register together — the platform tracks who's still missing." },
  { icon: ShieldCheck, title: "Payments that hold up", body: "A QR pass is only ever issued after payment actually succeeds — verified on the server, every time." },
  { icon: QrCode, title: "Tap-in attendance", body: "One scan checks payment, checks duplicates, and marks attendance — no spreadsheets at the door." },
];

export default function Home() {
  const [featured, setFeatured] = useState(null);

  useEffect(() => {
    api.get("/events").then((res) => setFeatured(res.data.slice(0, 4)));
  }, []);

  return (
    <div>
      <section className="hero-gradient border-b border-slate-100 px-5 pb-16 pt-16 md:pt-24">
        <div className="mx-auto max-w-5xl text-center">
          <motion.span
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-5 inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-brand-700"
          >
            The campus event OS
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="font-display text-4xl font-bold leading-[1.1] text-slate-900 md:text-6xl"
          >
            Discover. Register. <span className="gradient-text">Participate.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mx-auto mt-5 max-w-xl text-base text-slate-500 md:text-lg"
          >
            Everything happening across your campus, in one place.
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="mt-8 flex justify-center gap-3">
            <Link to="/events" className="flex items-center gap-1.5 rounded-xl bg-brand-600 px-6 py-3 text-sm font-semibold text-white shadow-glow transition-colors hover:bg-brand-700">
              Browse events <ArrowRight size={16} />
            </Link>
            <Link to="/login" className="rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              Admin / Organizer login
            </Link>
          </motion.div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-14">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {PILLARS.map((p) => (
            <div key={p.title} className="rounded-xl2 border border-slate-100 bg-white p-5 shadow-card">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                <p.icon size={18} />
              </div>
              <h3 className="font-display text-sm font-semibold text-slate-900">{p.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-500">{p.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-20">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-display text-xl font-bold text-slate-900">Featured on campus</h2>
          <Link to="/events" className="text-sm font-semibold text-brand-600 hover:text-brand-700">See all →</Link>
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {featured === null
            ? Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)
            : featured.map((e) => <EventCard key={e.id} event={e} />)}
        </div>
      </section>
    </div>
  );
}
