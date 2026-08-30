import { Router } from "express";
import store from "../data/store.js";
import { newId } from "../utils/ids.js";
import { generateTicketQR } from "../utils/qr.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

function currentFill(event) {
  const regs = store.collection("registrations").filter((r) => r.eventId === event.id && r.status === "CONFIRMED");
  if (event.participation === "TEAM" && event.capacityType === "TEAMS") {
    return store.collection("teams").filter((t) => t.eventId === event.id && t.registrationId).length;
  }
  return regs.length;
}

function capacityOk(event) {
  if (!event.capacityEnabled) return true;
  return currentFill(event) < event.maxCapacity;
}

// ---- Individual registration ----
router.post("/", requireRole("PARTICIPANT"), async (req, res) => {
  const { eventId, answers } = req.body;
  const event = store.collection("events").find((e) => e.id === eventId);
  if (!event) return res.status(404).json({ message: "Event not found" });
  if (event.status !== "REGISTRATION_OPEN") {
    return res.status(400).json({ message: "Registration isn't open for this event" });
  }
  if (event.participation === "TEAM") {
    return res.status(400).json({ message: "This is a team event — create or join a team instead" });
  }
  if (!capacityOk(event)) return res.status(400).json({ message: "This event is full" });

  const already = store.collection("registrations").find(
    (r) => r.eventId === eventId && r.userId === req.user.id && r.status !== "CANCELLED"
  );
  if (already) return res.status(409).json({ message: "You're already registered for this event" });

  const registration = {
    id: newId("reg"),
    eventId,
    userId: req.user.id,
    teamId: null,
    answers: answers || {},
    status: event.payment === "FREE" ? "CONFIRMED" : "PENDING_PAYMENT",
    qrToken: null,
    checkedIn: false,
    createdAt: new Date().toISOString(),
  };

  if (event.payment === "FREE") {
    const { token } = await generateTicketQR({ registrationId: registration.id });
    registration.qrToken = token;
  }

  store.collection("registrations").push(registration);
  store.persist();
  res.status(201).json(registration);
});

router.get("/my", (req, res) => {
  const regs = store.collection("registrations").filter((r) => r.userId === req.user.id);
  const enriched = regs.map((r) => ({
    ...r,
    event: store.collection("events").find((e) => e.id === r.eventId),
  }));
  res.json(enriched);
});

// ---- Organizer view of an event's registrations ----
router.get("/event/:eventId", requireRole("SUPER_ADMIN", "DEPARTMENT_ADMIN"), (req, res) => {
  const event = store.collection("events").find((e) => e.id === req.params.eventId);
  if (!event) return res.status(404).json({ message: "Event not found" });
  if (req.user.role === "DEPARTMENT_ADMIN" && event.department !== req.user.department) {
    return res.status(403).json({ message: "Not your department's event" });
  }
  const regs = store.collection("registrations").filter((r) => r.eventId === event.id);
  const users = store.collection("users");
  res.json(
    regs.map((r) => ({
      ...r,
      participant: users.find((u) => u.id === r.userId),
      team: r.teamId ? store.collection("teams").find((t) => t.id === r.teamId) : null,
    }))
  );
});

export default router;
