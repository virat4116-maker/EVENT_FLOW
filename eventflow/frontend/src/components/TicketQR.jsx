import { QRCodeCanvas } from "qrcode.react";

export default function TicketQR({ token, size = 180 }) {
  if (!token) return null;
  return (
    <div className="inline-flex flex-col items-center rounded-2xl border border-slate-100 bg-white p-4 shadow-card">
      <QRCodeCanvas value={token} size={size} fgColor="#1e1b4b" level="M" includeMargin />
      <p className="mt-2 font-mono text-[11px] tracking-wide text-slate-400">{token}</p>
    </div>
  );
}
