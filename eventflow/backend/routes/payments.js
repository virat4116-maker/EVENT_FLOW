import { Router } from "express";
import store from "../data/store.js";
import { newId } from "../utils/ids.js";
import { generateTicketQR } from "../utils/qr.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

// Demo Payment Mode: no real gateway credentials needed for the class demo.
// The architecture below is Razorpay-ready — swap this handler for a
// razorpay order/verify pair and the rest of the flow (registration status,
// QR generation gating) needs no changes, because they only ever key off
// payment.status, never off anything the frontend claims.
async function settle(req, res, forcedStatus) {
  const { registrationId } = req.body;
  const registration = store.collection("registrations").find((r) => r.id === registrationId);
  if (!registration) return res.status(404).json({ message: "Registration not found" });
  if (registration.userId !== req.user.id && req.user.role === "PARTICIPANT") {
    return res.status(403).json({ message: "This isn't your registration" });
  }
  const event = store.collection("events").find((e) => e.id === registration.eventId);
  if (event.payment !== "PAID") return res.status(400).json({ message: "This event doesn't require payment" });
  if (registration.status === "CONFIRMED") {
    return res.status(409).json({ message: "This registration is already confirmed" });
  }

  const payment = {
    id: newId("pay"),
    registrationId: registration.id,
    eventId: event.id,
    userId: registration.userId,
    amount: event.fee,
    status: forcedStatus,
    method: "DEMO",
    createdAt: new Date().toISOString(),
  };
  store.collection("payments").push(payment);

  // The single gate that matters: only a SUCCESS payment can ever confirm a
  // registration or mint a QR. Nothing on the client side is trusted here.
  if (payment.status === "SUCCESS") {
    registration.status = "CONFIRMED";
    const { token } = await generateTicketQR({ registrationId: registration.id });
    registration.qrToken = token;
  } else {
    registration.status = "PENDING_PAYMENT";
    registration.qrToken = null;
  }

  store.persist();
  res.json({ payment, registration });
}

router.post("/demo-pay", requireRole("PARTICIPANT"), (req, res) => settle(req, res, "SUCCESS"));
router.post("/demo-fail", requireRole("PARTICIPANT"), (req, res) => settle(req, res, "FAILED"));

router.get("/my", requireRole("PARTICIPANT"), (req, res) => {
  const payments = store.collection("payments").filter((p) => p.userId === req.user.id);
  res.json(
    payments.map((p) => ({ ...p, event: store.collection("events").find((e) => e.id === p.eventId) }))
  );
});

router.get("/event/:eventId", requireRole("SUPER_ADMIN", "DEPARTMENT_ADMIN"), (req, res) => {
  const event = store.collection("events").find((e) => e.id === req.params.eventId);
  if (!event) return res.status(404).json({ message: "Event not found" });
  if (req.user.role === "DEPARTMENT_ADMIN" && event.department !== req.user.department) {
    return res.status(403).json({ message: "Not your department's event" });
  }
  const payments = store.collection("payments").filter((p) => p.eventId === event.id);
  const revenue = payments.filter((p) => p.status === "SUCCESS").reduce((s, p) => s + p.amount, 0);
  res.json({ payments, revenue });
});

export default router;
