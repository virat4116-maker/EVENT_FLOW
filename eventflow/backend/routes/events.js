import { Router } from "express";
import store from "../data/store.js";
import { newId } from "../utils/ids.js";
import { requireAuth, requireRole, canManageEvent } from "../middleware/auth.js";

const router = Router();

// Attach the logged-in user when a valid token is present, without requiring
// one — this router serves both anonymous browsing and authenticated actions.
router.use((req, res, next) => {
  const header = req.headers.authorization || "";
  if (!header.startsWith("Bearer ")) return next();
  requireAuth(req, res, next);
});

// Statuses a student is allowed to even see. DRAFT and REJECTED are internal only.
const STUDENT_VISIBLE = [
  "PENDING_APPROVAL", "CHANGES_REQUESTED", "APPROVED", "PUBLISHED",
  "REGISTRATION_OPEN", "REGISTRATION_CLOSED", "FULL", "ONGOING", "COMPLETED",
];

// Statuses where registration is actually open.
const REGISTRABLE = ["REGISTRATION_OPEN"];

function withComputed(event) {
  const regs = store.collection("registrations").filter(
    (r) => r.eventId === event.id && r.status === "CONFIRMED"
  );
  const teams = store.collection("teams").filter((t) => t.eventId === event.id);
  let filled = 0;
  if (event.participation === "TEAM") {
    filled = event.capacityType === "TEAMS" ? teams.filter((t) => t.registrationId).length : regs.length;
  } else {
    filled = regs.length;
  }
  const isFull = event.capacityEnabled && filled >= event.maxCapacity;
  const effectiveStatus = isFull && event.status === "REGISTRATION_OPEN" ? "FULL" : event.status;
  const registrable = REGISTRABLE.includes(event.status) && !isFull;
  return { ...event, filled, isFull, effectiveStatus, registrable };
}

// ---- Public / student list ----
router.get("/", (req, res) => {
  const { user } = req; // may be undefined for anonymous browsing
  let events = store.collection("events");
  if (!req.user || req.user.role === "PARTICIPANT") {
    events = events.filter((e) => STUDENT_VISIBLE.includes(e.status));
  } else if (["DEPARTMENT_ADMIN", "VOLUNTEER"].includes(req.user.role)) {
    events = events.filter((e) => e.department === req.user.department);
  }
  res.json(events.map(withComputed).sort((a, b) => (a.date || "").localeCompare(b.date || "")));
});

router.get("/:id", (req, res) => {
  const event = store.collection("events").find((e) => e.id === req.params.id);
  if (!event) return res.status(404).json({ message: "Event not found" });
  res.json(withComputed(event));
});

// ---- Admin: create / edit ----
router.post("/", requireRole("SUPER_ADMIN", "DEPARTMENT_ADMIN"), (req, res) => {
  const body = req.body;
  const department = req.user.role === "DEPARTMENT_ADMIN" ? req.user.department : body.department;
  const event = {
    id: newId("evt"),
    name: body.name || "Untitled Event",
    type: body.type || "EVENT",
    category: body.category || "",
    department,
    description: body.description || "",
    banner: body.banner || "",
    date: body.date || "",
    startTime: body.startTime || "",
    endTime: body.endTime || "",
    venue: body.venue || "",
    rules: body.rules || "",
    instructions: body.instructions || "",
    participation: body.participation || "INDIVIDUAL",
    teamMin: body.teamMin || 2,
    teamMax: body.teamMax || 5,
    teamLeaderRequired: body.teamLeaderRequired !== false,
    payment: body.payment || "FREE",
    fee: body.payment === "PAID" ? Number(body.fee) || 0 : 0,
    attendanceRequired: body.attendanceRequired !== false,
    qrMode: body.qrMode || "INDIVIDUAL",
    certificateEnabled: !!body.certificateEnabled,
    capacityEnabled: !!body.capacityEnabled,
    maxCapacity: body.capacityEnabled ? Number(body.maxCapacity) || 0 : null,
    capacityType: body.capacityType || "PARTICIPANTS",
    registrationDeadline: body.registrationDeadline || "",
    customFields: body.customFields || [],
    status: "DRAFT",
    reviewNote: "",
    createdBy: req.user.id,
    createdAt: new Date().toISOString(),
  };
  store.collection("events").push(event);
  store.persist();
  res.status(201).json(withComputed(event));
});

router.put("/:id", requireRole("SUPER_ADMIN", "DEPARTMENT_ADMIN"), (req, res) => {
  const event = store.collection("events").find((e) => e.id === req.params.id);
  if (!event) return res.status(404).json({ message: "Event not found" });
  if (!canManageEvent(event, req.user)) return res.status(403).json({ message: "Not your department's event" });
  if (!["DRAFT", "CHANGES_REQUESTED"].includes(event.status) && req.user.role !== "SUPER_ADMIN") {
    return res.status(400).json({ message: "This event can no longer be edited directly" });
  }
  Object.assign(event, req.body, { id: event.id, status: event.status });
  store.persist();
  res.json(withComputed(event));
});

router.post("/:id/submit", requireRole("SUPER_ADMIN", "DEPARTMENT_ADMIN"), (req, res) => {
  const event = store.collection("events").find((e) => e.id === req.params.id);
  if (!event) return res.status(404).json({ message: "Event not found" });
  if (!canManageEvent(event, req.user)) return res.status(403).json({ message: "Not your department's event" });
  event.status = "PENDING_APPROVAL";
  store.persist();
  res.json(withComputed(event));
});

router.post("/:id/approve", requireRole("SUPER_ADMIN"), (req, res) => {
  const event = store.collection("events").find((e) => e.id === req.params.id);
  if (!event) return res.status(404).json({ message: "Event not found" });
  event.status = "REGISTRATION_OPEN";
  event.reviewNote = "";
  store.persist();
  res.json(withComputed(event));
});

router.post("/:id/reject", requireRole("SUPER_ADMIN"), (req, res) => {
  const event = store.collection("events").find((e) => e.id === req.params.id);
  if (!event) return res.status(404).json({ message: "Event not found" });
  event.status = "REJECTED";
  event.reviewNote = req.body.note || "";
  store.persist();
  res.json(withComputed(event));
});

router.post("/:id/request-changes", requireRole("SUPER_ADMIN"), (req, res) => {
  const event = store.collection("events").find((e) => e.id === req.params.id);
  if (!event) return res.status(404).json({ message: "Event not found" });
  event.status = "CHANGES_REQUESTED";
  event.reviewNote = req.body.note || "Please review and resubmit.";
  store.persist();
  res.json(withComputed(event));
});

router.post("/:id/close", requireRole("SUPER_ADMIN", "DEPARTMENT_ADMIN"), (req, res) => {
  const event = store.collection("events").find((e) => e.id === req.params.id);
  if (!event) return res.status(404).json({ message: "Event not found" });
  if (!canManageEvent(event, req.user)) return res.status(403).json({ message: "Not your department's event" });
  event.status = "REGISTRATION_CLOSED";
  store.persist();
  res.json(withComputed(event));
});

router.post("/:id/complete", requireRole("SUPER_ADMIN", "DEPARTMENT_ADMIN"), (req, res) => {
  const event = store.collection("events").find((e) => e.id === req.params.id);
  if (!event) return res.status(404).json({ message: "Event not found" });
  if (!canManageEvent(event, req.user)) return res.status(403).json({ message: "Not your department's event" });
  event.status = "COMPLETED";
  store.persist();
  res.json(withComputed(event));
});

export default router;
