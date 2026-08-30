import { useEffect, useState } from "react";
import { Wallet, CheckCircle2, XCircle } from "lucide-react";
import api from "../services/api.js";
import EmptyState from "../components/EmptyState.jsx";
import { formatDate } from "../utils/statusMeta.js";
import { CardSkeleton } from "../components/Loader.jsx";

export default function PaymentHistory() {
  const [payments, setPayments] = useState(null);

  useEffect(() => {
    api.get("/payments/my").then((res) => setPayments(res.data));
  }, []);

  return (
    <div className="mx-auto max-w-2xl px-5 py-10">
      <h1 className="font-display text-2xl font-bold text-slate-900">Payment History</h1>
      <p className="mt-1 text-sm text-slate-500">Every payment attempt across the events you've registered for.</p>

      <div className="mt-6 space-y-2.5">
        {payments === null ? (
          Array.from({ length: 3 }).map((_, i) => <CardSkeleton key={i} />)
        ) : payments.length === 0 ? (
          <EmptyState icon={Wallet} title="No payments yet" subtitle="Paid event registrations will show up here." />
        ) : (
          payments.map((p) => (
            <div key={p.id} className="flex items-center justify-between rounded-xl2 border border-slate-100 bg-white p-4 shadow-card">
              <div>
                <p className="font-display text-sm font-semibold text-slate-900">{p.event?.name}</p>
                <p className="mt-0.5 text-xs text-slate-400">{formatDate(p.createdAt)}</p>
              </div>
              <div className="text-right">
                <p className="font-display text-base font-bold text-slate-900">₹{p.amount}</p>
                <span className={`mt-0.5 inline-flex items-center gap-1 text-xs font-semibold ${p.status === "SUCCESS" ? "text-emerald-600" : "text-red-500"}`}>
                  {p.status === "SUCCESS" ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                  {p.status === "SUCCESS" ? "Paid" : "Failed"}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
