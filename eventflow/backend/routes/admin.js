import { Router } from "express";
import bcrypt from "bcryptjs";
import store from "../data/store.js";
import { newId } from "../utils/ids.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

router.get("/dashboard", requireRole("SUPER_ADMIN", "DEPARTMENT_ADMIN"), (req, res) => {
  const isMain = req.user.role === "SUPER_ADMIN";
  const events = store.collection("events").filter((e) => isMain || e.department === req.user.department);
  const eventIds = new Set(events.map((e) => e.id));
  const registrations = store.collection("registrations").filter((r) => eventIds.has(r.eventId) && r.status === "CONFIRMED");
  const attendance = store.collection("attendance").filter((a) => eventIds.has(a.eventId));
  const payments = store.collection("payments").filter((p) => eventIds.has(p.eventId) && p.status === "SUCCESS");
  const revenue = payments.reduce((s, p) => s + p.amount, 0);
  const activeStatuses = ["REGISTRATION_OPEN", "PUBLISHED", "APPROVED", "ONGOING"];

  const pendingApprovals = isMain
    ? store.collection("events")
        .filter((e) => e.status === "PENDING_APPROVAL")
        .map((e) => ({ ...e, submittedBy: store.collection("users").find((u) => u.id === e.createdBy)?.name }))
    : [];

  res.json({
    scope: isMain ? "PLATFORM" : req.user.department,
    departments: isMain ? store.collection("departments").length : undefined,
    totalEvents: events.length,
    activeEvents: events.filter((e) => activeStatuses.includes(e.status)).length,
    registrations: registrations.length,
    attendance: attendance.length,
    revenue,
    pendingApprovals,
    recentEvents: events.slice().sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || "")).slice(0, 8),
  });
});

// Main admin: manage department admins
router.get("/department-admins", requireRole("SUPER_ADMIN"), (req, res) => {
  const admins = store.collection("users").filter((u) => u.role === "DEPARTMENT_ADMIN");
  res.json(admins.map(({ passwordHash, ...rest }) => rest));
});

router.post("/department-admins", requireRole("SUPER_ADMIN"), async (req, res) => {
  const { name, email, password, department } = req.body;
  if (!name || !email || !password || !department) {
    return res.status(400).json({ message: "Name, email, password and department are all required" });
  }
  const exists = store.collection("users").some((u) => u.email.toLowerCase() === email.toLowerCase());
  if (exists) return res.status(409).json({ message: "An account with that email already exists" });
  const admin = {
    id: newId("usr"),
    name,
    email,
    passwordHash: await bcrypt.hash(password, 10),
    role: "DEPARTMENT_ADMIN",
    department,
    studentId: null,
    createdAt: new Date().toISOString(),
  };
  store.collection("users").push(admin);
  store.persist();
  const { passwordHash, ...rest } = admin;
  res.status(201).json(rest);
});

router.delete("/department-admins/:id", requireRole("SUPER_ADMIN"), (req, res) => {
  const users = store.collection("users");
  const idx = users.findIndex((u) => u.id === req.params.id && u.role === "DEPARTMENT_ADMIN");
  if (idx === -1) return res.status(404).json({ message: "Department admin not found" });
  users.splice(idx, 1);
  store.persist();
  res.status(204).end();
});

// ---- Gate Volunteers ----
// A department admin can hand off entry-scanning to a club/society council
// member without giving them the rest of the admin dashboard. A volunteer
// account can ONLY reach the QR scanner (enforced both by the frontend's
// route guard and by attendance.js scoping scans to the volunteer's own
// department) — they can't create, edit or approve events, see revenue, etc.
//
// Department admins create volunteers for their own department automatically.
// The Main Admin can also create/view/remove volunteers for any department
// (passing `department` explicitly), for oversight.
router.get("/volunteers", requireRole("SUPER_ADMIN", "DEPARTMENT_ADMIN"), (req, res) => {
  const isMain = req.user.role === "SUPER_ADMIN";
  const volunteers = store
    .collection("users")
    .filter((u) => u.role === "VOLUNTEER" && (isMain || u.department === req.user.department));
  res.json(volunteers.map(({ passwordHash, ...rest }) => rest));
});

router.post("/volunteers", requireRole("SUPER_ADMIN", "DEPARTMENT_ADMIN"), async (req, res) => {
  const { name, email, password } = req.body;
  const department = req.user.role === "DEPARTMENT_ADMIN" ? req.user.department : req.body.department;
  if (!name || !email || !password || !department) {
    return res.status(400).json({ message: "Name, email, password and department are all required" });
  }
  const exists = store.collection("users").some((u) => u.email.toLowerCase() === email.toLowerCase());
  if (exists) return res.status(409).json({ message: "An account with that email already exists" });
  const volunteer = {
    id: newId("usr"),
    name,
    email,
    passwordHash: await bcrypt.hash(password, 10),
    role: "VOLUNTEER",
    department,
    studentId: null,
    createdAt: new Date().toISOString(),
  };
  store.collection("users").push(volunteer);
  store.persist();
  const { passwordHash, ...rest } = volunteer;
  res.status(201).json(rest);
});

router.delete("/volunteers/:id", requireRole("SUPER_ADMIN", "DEPARTMENT_ADMIN"), (req, res) => {
  const users = store.collection("users");
  const target = users.find((u) => u.id === req.params.id && u.role === "VOLUNTEER");
  if (!target) return res.status(404).json({ message: "Volunteer not found" });
  if (req.user.role === "DEPARTMENT_ADMIN" && target.department !== req.user.department) {
    return res.status(403).json({ message: "Not your department's volunteer" });
  }
  users.splice(users.indexOf(target), 1);
  store.persist();
  res.status(204).end();
});

export default router;
