import { Router } from "express";
import store from "../data/store.js";
import { newId } from "../utils/ids.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

// Scan flow: validate -> check payment (implicit in status===CONFIRMED) ->
// check event -> check duplicate -> approve -> mark attendance.
router.post("/scan", requireRole("SUPER_ADMIN", "DEPARTMENT_ADMIN", "VOLUNTEER"), (req, res) => {
  const { qrToken } = req.body;
  const registration = store.collection("registrations").find((r) => r.qrToken === qrToken);
  if (!registration) {
    return res.status(404).json({ result: "INVALID", message: "This entry pass isn't recognized" });
  }
  const event = store.collection("events").find((e) => e.id === registration.eventId);
  // Both department admins and gate volunteers are scoped to their own
  // department's events — a volunteer can never scan tickets outside it.
  if (["DEPARTMENT_ADMIN", "VOLUNTEER"].includes(req.user.role) && event.department !== req.user.department) {
    return res.status(403).json({ result: "DENIED", message: "This pass belongs to another department's event" });
  }
  if (registration.status !== "CONFIRMED") {
    return res.status(400).json({ result: "DENIED", message: "Payment was never completed for this pass" });
  }
  if (registration.checkedIn) {
    return res.status(409).json({
      result: "ALREADY_CHECKED_IN",
      message: "This pass has already been used",
      checkedInAt: registration.checkedInAt,
    });
  }

  registration.checkedIn = true;
  registration.checkedInAt = new Date().toISOString();

  const user = store.collection("users").find((u) => u.id === registration.userId);
  const team = registration.teamId ? store.collection("teams").find((t) => t.id === registration.teamId) : null;

  const attendance = {
    id: newId("att"),
    registrationId: registration.id,
    eventId: event.id,
    userId: registration.userId,
    teamId: registration.teamId,
    scannedBy: req.user.id,
    scannedAt: registration.checkedInAt,
  };
  store.collection("attendance").push(attendance);
  store.persist();

  res.json({
    result: "APPROVED",
    ticketId: registration.id,
    event: event.name,
    participant: team ? team.name : user?.name,
    isTeam: !!team,
    memberCount: team ? team.memberIds.length : 1,
    time: registration.checkedInAt,
  });
});

router.get("/event/:eventId", requireRole("SUPER_ADMIN", "DEPARTMENT_ADMIN", "VOLUNTEER"), (req, res) => {
  const event = store.collection("events").find((e) => e.id === req.params.eventId);
  if (!event) return res.status(404).json({ message: "Event not found" });
  if (["DEPARTMENT_ADMIN", "VOLUNTEER"].includes(req.user.role) && event.department !== req.user.department) {
    return res.status(403).json({ message: "Not your department's event" });
  }
  const regs = store.collection("registrations").filter((r) => r.eventId === event.id && r.status === "CONFIRMED");
  const checkedIn = regs.filter((r) => r.checkedIn);

  if (event.participation === "TEAM") {
    const teams = store.collection("teams").filter((t) => t.eventId === event.id && t.registrationId);
    const teamsCheckedIn = teams.filter((t) => {
      const r = regs.find((x) => x.teamId === t.id);
      return r?.checkedIn;
    });
    const totalMembers = teams.reduce((s, t) => s + t.memberIds.length, 0);
    const checkedInMembers = teamsCheckedIn.reduce((s, t) => s + t.memberIds.length, 0);
    return res.json({
      teamsRegistered: teams.length,
      teamsCheckedIn: teamsCheckedIn.length,
      membersRegistered: totalMembers,
      membersCheckedIn: checkedInMembers,
    });
  }

  res.json({
    registered: regs.length,
    checkedIn: checkedIn.length,
    absent: regs.length - checkedIn.length,
    rate: regs.length ? Math.round((checkedIn.length / regs.length) * 1000) / 10 : 0,
  });
});

export default router;
