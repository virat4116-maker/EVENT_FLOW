import { useEffect, useMemo, useState } from "react";
import { Search, Filter } from "lucide-react";
import api from "../services/api.js";
import EventCard from "../components/EventCard.jsx";
import { CardSkeleton } from "../components/Loader.jsx";
import EmptyState from "../components/EmptyState.jsx";

const FILTERS = ["All", "Free", "Paid", "Competitions", "Workshops", "Sports", "Cultural", "Campaigns"];

const MATCH = {
  Free: (e) => e.payment === "FREE",
  Paid: (e) => e.payment === "PAID",
  Competitions: (e) => e.type === "COMPETITION",
  Workshops: (e) => e.type === "WORKSHOP" || e.type === "SEMINAR",
  Sports: (e) => e.type === "SPORTS",
  Cultural: (e) => e.type === "CULTURAL",
  Campaigns: (e) => e.type === "CAMPAIGN",
};

export default function Events() {
  const [events, setEvents] = useState(null);
  const [filter, setFilter] = useState("All");
  const [query, setQuery] = useState("");

  useEffect(() => {
    api.get("/events").then((res) => setEvents(res.data));
  }, []);

  const filtered = useMemo(() => {
    if (!events) return [];
    return events
      .filter((e) => (filter === "All" ? true : MATCH[filter](e)))
      .filter((e) => (query ? (e.name + e.department).toLowerCase().includes(query.toLowerCase()) : true));
  }, [events, filter, query]);

  return (
    <div className="mx-auto max-w-6xl px-5 py-10">
      <div className="mb-7">
        <h1 className="font-display text-2xl font-bold text-slate-900 md:text-3xl">Explore campus events</h1>
        <p className="mt-1 text-sm text-slate-500">Competitions, workshops, campaigns and more — all in one feed.</p>
      </div>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:w-72">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search events or departments"
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm focus-ring focus:border-brand-400"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                filter === f ? "bg-brand-600 text-white" : "bg-white text-slate-600 border border-slate-200 hover:border-brand-300"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {events === null ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={Filter} title="Nothing here yet" subtitle="Try a different filter or check back soon for new events." />
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((e) => <EventCard key={e.id} event={e} />)}
        </div>
      )}
    </div>
  );
}
