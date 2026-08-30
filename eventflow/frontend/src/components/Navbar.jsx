import { Link, NavLink, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Menu, X, Sparkles, LogOut, LayoutDashboard, ScanLine } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";

const studentLinks = [
  { to: "/events", label: "Events" },
  { to: "/my-tickets", label: "My Tickets" },
  { to: "/my-teams", label: "My Teams" },
  { to: "/certificates", label: "Certificates" },
  { to: "/payments", label: "Payments" },
];

function navLinksFor(user) {
  if (!user || user.role === "PARTICIPANT") return studentLinks;
  // Gate volunteers only ever see the scanner — no dashboard, no event
  // management, nothing else. This is enforced again server-side and by
  // ProtectedRoute, not just hidden here.
  if (user.role === "VOLUNTEER") return [{ to: "/admin/scanner", label: "Scanner", icon: ScanLine }];
  return [{ to: user.role === "SUPER_ADMIN" ? "/main-admin" : "/admin", label: "Dashboard", icon: LayoutDashboard }];
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const nav = useNavigate();

  const links = navLinksFor(user);

  return (
    <header className="sticky top-0 z-40 glass border-b border-slate-100">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3.5">
        <Link to="/" className="flex items-center gap-2 font-display text-lg font-bold text-slate-900">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-electric text-white">
            <Sparkles size={16} />
          </span>
          Event<span className="gradient-text">Flow</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                `flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-ring ${
                  isActive ? "bg-brand-50 text-brand-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`
              }
            >
              {l.icon && <l.icon size={15} />} {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {user ? (
            <>
              <span className="text-sm text-slate-500">
                Hi, <span className="font-semibold text-slate-800">{user.name.split(" ")[0]}</span>
                {user.role === "VOLUNTEER" && <span className="ml-1.5 rounded-full bg-brand-100 px-2 py-0.5 text-[11px] font-semibold text-brand-700">Gate Volunteer</span>}
              </span>
              <button
                onClick={() => {
                  logout();
                  nav("/login");
                }}
                className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 focus-ring"
              >
                <LogOut size={14} /> Log out
              </button>
            </>
          ) : (
            <Link
              to="/login"
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700 focus-ring"
            >
              Log in
            </Link>
          )}
        </div>

        <button className="md:hidden text-slate-600" onClick={() => setOpen((o) => !o)}>
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {open && (
        <div className="border-t border-slate-100 bg-white px-5 py-3 md:hidden">
          <div className="flex flex-col gap-1">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                {l.label}
              </NavLink>
            ))}
            {user ? (
              <button
                onClick={() => {
                  logout();
                  nav("/login");
                  setOpen(false);
                }}
                className="mt-1 flex items-center gap-1.5 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-red-500 hover:bg-red-50"
              >
                <LogOut size={14} /> Log out
              </button>
            ) : (
              <Link to="/login" onClick={() => setOpen(false)} className="mt-1 rounded-lg bg-brand-600 px-3 py-2.5 text-center text-sm font-semibold text-white">
                Log in
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
