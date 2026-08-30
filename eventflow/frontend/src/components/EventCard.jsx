import { Link } from "react-router-dom";
import { MapPin, CalendarDays, Users } from "lucide-react";
import StatusBadge from "./StatusBadge.jsx";
import { EVENT_TYPE_EMOJI, formatDate, COMING_SOON } from "../utils/statusMeta.js";

export default function EventCard({ event }) {
  const isComingSoon = COMING_SOON.has(event.status);
  const isFull = event.effectiveStatus === "FULL";
  const seatsLabel =
    event.capacityEnabled &&
    (event.participation === "TEAM" && event.capacityType === "TEAMS"
      ? `${event.filled} / ${event.maxCapacity} teams`
      : `${event.filled} / ${event.maxCapacity} seats`);

  return (
    <Link
      to={`/events/${event.id}`}
      className="group flex flex-col overflow-hidden rounded-xl2 border border-slate-100 bg-white shadow-card transition-all hover:-translate-y-0.5 hover:shadow-glow focus-ring"
    >
      <div className="relative flex h-36 items-center justify-center bg-gradient-to-br from-brand-500 via-brand-600 to-electric text-5xl">
        <span className="drop-shadow-sm">{EVENT_TYPE_EMOJI[event.type] || "🎉"}</span>
        <div className="absolute left-3 top-3">
          <StatusBadge status={isComingSoon ? "PUBLISHED" : event.effectiveStatus} className={isComingSoon ? "!bg-white/90 !text-brand-700" : ""} />
        </div>
        {isComingSoon && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900/35 text-sm font-semibold uppercase tracking-wide text-white">
            Coming Soon
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-brand-500">{event.department}</p>
        <h3 className="mt-1 font-display text-base font-semibold leading-snug text-slate-900">{event.name}</h3>

        <div className="mt-2.5 space-y-1 text-sm text-slate-500">
          <div className="flex items-center gap-1.5">
            <CalendarDays size={14} /> {formatDate(event.date)}
          </div>
          {event.venue && (
            <div className="flex items-center gap-1.5">
              <MapPin size={14} /> {event.venue}
            </div>
          )}
          {event.participation !== "INDIVIDUAL" && (
            <div className="flex items-center gap-1.5">
              <Users size={14} /> Team: {event.teamMin}–{event.teamMax}
            </div>
          )}
        </div>

        <div className="mt-3 flex items-center justify-between">
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-bold ${
              event.payment === "FREE" ? "bg-emerald-100 text-emerald-700" : "bg-purple-100 text-purple-700"
            }`}
          >
            {event.payment === "FREE" ? "FREE" : `₹${event.fee}`}
          </span>
          {seatsLabel && <span className="text-xs font-medium text-slate-400">{seatsLabel}</span>}
        </div>

        <div className="mt-4">
          {isComingSoon ? (
            <div className="w-full rounded-xl bg-slate-100 py-2.5 text-center text-sm font-semibold text-slate-400">Coming Soon</div>
          ) : isFull ? (
            <div className="w-full rounded-xl bg-red-50 py-2.5 text-center text-sm font-semibold text-red-500">Sold Out</div>
          ) : event.effectiveStatus === "REGISTRATION_OPEN" ? (
            <div className="w-full rounded-xl bg-brand-600 py-2.5 text-center text-sm font-semibold text-white transition-colors group-hover:bg-brand-700">
              {event.payment === "FREE" ? "Register for Free" : `Register & Pay ₹${event.fee}`}
            </div>
          ) : (
            <div className="w-full rounded-xl bg-slate-100 py-2.5 text-center text-sm font-semibold text-slate-400">
              {event.effectiveStatus === "COMPLETED" ? "Event Completed" : "Registration Closed"}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
