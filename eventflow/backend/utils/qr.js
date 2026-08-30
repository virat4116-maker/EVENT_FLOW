import QRCode from "qrcode";
import { newId } from "./ids.js";

// Generates a unique, unguessable ticket token and a scannable QR data URL
// encoding it. The token itself carries no meaning — it's just a lookup key —
// so a scanned code is only ever as valid as the registration it points to.
export async function generateTicketQR(payload) {
  const token = newId("TKT");
  const dataUrl = await QRCode.toDataURL(token, {
    margin: 1,
    width: 320,
    color: { dark: "#1e1b4b", light: "#ffffff" },
  });
  return { token, dataUrl, payload };
}
