import { useEffect, useRef, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Html5Qrcode } from "html5-qrcode";
import { ArrowLeft, ScanLine, CheckCircle2, XCircle, AlertTriangle, Users, Camera, Keyboard, CameraOff } from "lucide-react";
import api from "../services/api.js";
import { Spinner } from "../components/Loader.jsx";

const READER_ID = "ef-qr-reader";

export default function QRScanner() {
  const [events, setEvents] = useState([]);
  const [eventId, setEventId] = useState("");
  const [token, setToken] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [stats, setStats] = useState(null);
  const [mode, setMode] = useState("camera"); // "camera" | "manual"
  const [cameraError, setCameraError] = useState(null);
  const [cameraRunning, setCameraRunning] = useState(false);

  const scannerRef = useRef(null);
  const busyRef = useRef(false); // guards against the camera firing repeatedly on the same frame

  useEffect(() => {
    api.get("/events").then((res) => {
      const scannable = res.data.filter((e) => e.attendanceRequired && ["REGISTRATION_OPEN", "REGISTRATION_CLOSED", "ONGOING", "FULL"].includes(e.status));
      setEvents(scannable);
      if (scannable[0]) setEventId(scannable[0].id);
    });
  }, []);

  useEffect(() => {
    if (eventId) api.get(`/attendance/event/${eventId}`).then((res) => setStats(res.data));
  }, [eventId, result]);

  const submitToken = useCallback(async (raw) => {
    const value = raw.trim();
    if (!value || busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    try {
      const res = await api.post("/attendance/scan", { qrToken: value });
      setResult({ ok: true, ...res.data });
    } catch (err) {
      const isDup = err.message.includes("already been used");
      setResult({ ok: false, dup: isDup, message: err.message });
    } finally {
      setBusy(false);
      // Brief cooldown so a QR still in front of the camera doesn't get
      // re-submitted on the very next decoded frame.
      setTimeout(() => { busyRef.current = false; }, 1500);
    }
  }, []);

  const onManualSubmit = (e) => {
    e.preventDefault();
    submitToken(token);
    setToken("");
  };

  // --- Camera lifecycle ---
  useEffect(() => {
    if (mode !== "camera") return;
    let cancelled = false;
    const el = document.getElementById(READER_ID);
    if (!el) return;
    const instance = new Html5Qrcode(READER_ID, { verbose: false });
    scannerRef.current = instance;

    instance
      .start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 240, height: 240 } },
        (decodedText) => {
          if (!cancelled) submitToken(decodedText);
        },
        () => {} // per-frame "no QR found" — expected constantly, ignore
      )
      .then(() => !cancelled && setCameraRunning(true))
      .catch((err) => {
        if (cancelled) return;
        setCameraError(
          String(err).toLowerCase().includes("permission")
            ? "Camera permission was denied. Allow camera access, or switch to Type / Paste below."
            : "Couldn't access a camera on this device. Switch to Type / Paste below."
        );
        setMode("manual");
      });

    return () => {
      cancelled = true;
      setCameraRunning(false);
      const inst = scannerRef.current;
      scannerRef.current = null;
      if (inst) {
        inst.stop().then(() => inst.clear()).catch(() => {});
      }
    };
  }, [mode, submitToken]);

  return (
    <div className="mx-auto max-w-2xl px-5 py-10">
      <Link to="/admin" className="mb-5 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-brand-600">
        <ArrowLeft size={15} /> Back to dashboard
      </Link>

      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-soft md:p-8">
        <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-600 text-white"><ScanLine size={22} /></div>
        <h1 className="font-display text-xl font-bold text-slate-900">Entry Scanner</h1>
        <p className="mt-1 text-sm text-slate-500">Point the camera at a participant's QR pass to check them in.</p>

        <select value={eventId} onChange={(e) => setEventId(e.target.value)} className="mt-5 w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm focus-ring focus:border-brand-400">
          {events.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
        </select>

        <div className="mt-4 flex rounded-lg bg-slate-100 p-1 text-sm font-medium">
          <button onClick={() => { setCameraError(null); setMode("camera"); }} className={`flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 transition-colors ${mode === "camera" ? "bg-white shadow-sm text-brand-700" : "text-slate-500"}`}>
            <Camera size={14} /> Camera
          </button>
          <button onClick={() => setMode("manual")} className={`flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 transition-colors ${mode === "manual" ? "bg-white shadow-sm text-brand-700" : "text-slate-500"}`}>
            <Keyboard size={14} /> Type / Paste
          </button>
        </div>

        {mode === "camera" ? (
          <div className="mt-4">
            <div id={READER_ID} className="min-h-[280px] overflow-hidden rounded-xl border border-slate-200 bg-slate-900" />
            {!cameraRunning && !cameraError && (
              <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-400"><Spinner size={12} /> Starting camera…</p>
            )}
            {cameraError && (
              <p className="mt-2 flex items-center gap-1.5 text-xs text-red-500"><CameraOff size={13} /> {cameraError}</p>
            )}
            <p className="mt-2 text-xs text-slate-400">Works on the device's default (usually rear) camera. Requires camera permission and HTTPS or localhost.</p>
          </div>
        ) : (
          <form onSubmit={onManualSubmit} className="mt-4 flex gap-2.5">
            <input
              autoFocus
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Paste ticket token (e.g. TKT_xxxxxxxx)"
              className="flex-1 rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm font-mono focus-ring focus:border-brand-400"
            />
            <button disabled={busy} className="rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60">
              {busy ? <Spinner /> : "Scan"}
            </button>
          </form>
        )}

        <AnimatePresence mode="wait">
          {result && (
            <motion.div
              key={result.message || result.ticketId}
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className={`mt-5 rounded-xl border p-5 text-center ${
                result.ok ? "border-emerald-200 bg-emerald-50" : result.dup ? "border-amber-200 bg-amber-50" : "border-red-200 bg-red-50"
              }`}
            >
              {result.ok ? (
                <>
                  <CheckCircle2 className="mx-auto mb-2 text-emerald-500" size={30} />
                  <p className="font-display text-lg font-bold text-emerald-700">Entry Approved</p>
                  <p className="mt-1 text-sm text-emerald-700">
                    {result.isTeam && <Users size={13} className="mr-1 inline" />}
                    {result.participant} · {result.event}
                  </p>
                  {result.isTeam && <p className="text-xs text-emerald-600">{result.memberCount} team members</p>}
                </>
              ) : result.dup ? (
                <>
                  <AlertTriangle className="mx-auto mb-2 text-amber-500" size={30} />
                  <p className="font-display text-lg font-bold text-amber-700">Already Checked In</p>
                  <p className="mt-1 text-sm text-amber-700">{result.message}</p>
                </>
              ) : (
                <>
                  <XCircle className="mx-auto mb-2 text-red-500" size={30} />
                  <p className="font-display text-lg font-bold text-red-700">Entry Denied</p>
                  <p className="mt-1 text-sm text-red-700">{result.message}</p>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {stats && (
          <div className="mt-6 grid grid-cols-2 gap-3 border-t border-slate-100 pt-5 text-center md:grid-cols-4">
            {"teamsRegistered" in stats ? (
              <>
                <MiniStat label="Teams Registered" v={stats.teamsRegistered} />
                <MiniStat label="Teams Checked In" v={stats.teamsCheckedIn} />
                <MiniStat label="Members Registered" v={stats.membersRegistered} />
                <MiniStat label="Members Checked In" v={stats.membersCheckedIn} />
              </>
            ) : (
              <>
                <MiniStat label="Registered" v={stats.registered} />
                <MiniStat label="Checked In" v={stats.checkedIn} />
                <MiniStat label="Absent" v={stats.absent} />
                <MiniStat label="Rate" v={`${stats.rate}%`} />
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function MiniStat({ label, v }) {
  return (
    <div>
      <p className="font-display text-xl font-bold text-slate-900">{v}</p>
      <p className="text-xs text-slate-400">{label}</p>
    </div>
  );
}
