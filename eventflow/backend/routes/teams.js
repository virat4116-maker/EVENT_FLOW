import { Router } from "express";
import store from "../data/store.js";
import { newId, inviteCode } from "../utils/ids.js";
import { generateTicketQR } from "../utils/qr.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

function teamFill(event) {
  return store.collection("teams").filter((t) => t.eventId === event.id && t.registrationId).length;
}
function capacityOk(event) {
  if (!event.capacityEnabled) return true;
  if (event.capacityType === "TEAMS") return teamFill(event) < event.maxCapacity;
  const regs = store.collection("registrations").filter((r) => r.eventId === event.id && r.status === "CONFIRMED");
  return regs.length < event.maxCapacity;
}

router.post("/", requireRole("PARTICIPANT"), (req, res) => {
  const { eventId, teamName } = req.body;
  const event = store.collection("events").find((e) => e.id === eventId);
  if (!event) return res.status(404).json({ message: "Event not found" });
  if (event.status !== "REGISTRATION_OPEN") return res.status(400).json({ message: "Registration isn't open for this event" });
  if (event.participation !== "TEAM" && event.participation !== "EITHER") {
    return res.status(400).json({ message: "This event doesn't use team registration" });
  }
  if (!teamName || !teamName.trim()) return res.status(400).json({ message: "Give your team a name" });

  const team = {
    id: newId("team"),
    eventId,
    name: teamName.trim(),
    leaderId: req.user.id,
    memberIds: [req.user.id],
    inviteCode: inviteCode(teamName),
    status: (event.teamMin || 2) <= 1 ? "COMPLETE" : "FORMING",
    answers: {},
    registrationId: null,
    createdAt: new Date().toISOString(),
  };
  store.collection("teams").push(team);
  store.persist();
  res.status(201).json(team);
});

router.get("/my", (req, res) => {
  const teams = store.collection("teams").filter((t) => t.memberIds.includes(req.user.id));
  const users = store.collection("users");
  res.json(
    teams.map((t) => ({
      ...t,
      event: store.collection("events").find((e) => e.id === t.eventId),
      members: t.memberIds.map((id) => {
        const u = users.find((x) => x.id === id);
        return u ? { id: u.id, name: u.name, email: u.email } : { id, name: "Unknown" };
      }),
    }))
  );
});

router.get("/lookup/:inviteCode", (req, res) => {
  const team = store.collection("teams").find((t) => t.inviteCode === req.params.inviteCode.toUpperCase());
  if (!team) return res.status(404).json({ message: "Invalid invite code" });
  const event = store.collection("events").find((e) => e.id === team.eventId);
  res.json({ team, event });
});

router.post("/join/:inviteCode", requireRole("PARTICIPANT"), (req, res) => {
  const team = store.collection("teams").find((t) => t.inviteCode === req.params.inviteCode.toUpperCase());
  if (!team) return res.status(404).json({ message: "Invalid invite code" });
  const event = store.collection("events").find((e) => e.id === team.eventId);
  if (team.status === "COMPLETE") return res.status(400).json({ message: "This team is already complete" });
  if (team.memberIds.includes(req.user.id)) return res.status(409).json({ message: "You're already in this team" });
  if (team.memberIds.length >= (event.teamMax || 5)) {
    return res.status(400).json({ message: "This team is already at maximum size" });
  }
  const alreadyOnAnother = store.collection("teams").find(
    (t) => t.eventId === event.id && t.memberIds.includes(req.user.id)
  );
  if (alreadyOnAnother) return res.status(409).json({ message: "You're already on a team for this event" });

  team.memberIds.push(req.user.id);
  if (team.memberIds.length >= (event.teamMin || 2)) team.status = "COMPLETE";
  store.persist();
  res.json(team);
});

// Leader finalizes: submits registration answers and locks the team roster in.
router.post("/:id/finalize", requireRole("PARTICIPANT"), async (req, res) => {
  const team = store.collection("teams").find((t) => t.id === req.params.id);
  if (!team) return res.status(404).json({ message: "Team not found" });
  if (team.leaderId !== req.user.id) return res.status(403).json({ message: "Only the team leader can finalize registration" });
  const event = store.collection("events").find((e) => e.id === team.eventId);
  if (team.status !== "COMPLETE") {
    return res.status(400).json({ message: `Waiting for ${event.teamMin - team.memberIds.length} more member(s) to join` });
  }
  if (team.registrationId) return res.status(409).json({ message: "This team is already registered" });
  if (!capacityOk(event)) return res.status(400).json({ message: "This event is full" });

  team.answers = req.body.answers || {};

  const registration = {
    id: newId("reg"),
    eventId: event.id,
    userId: team.leaderId,
    teamId: team.id,
    answers: team.answers,
    status: event.payment === "FREE" ? "CONFIRMED" : "PENDING_PAYMENT",
    qrToken: null,
    checkedIn: false,
    createdAt: new Date().toISOString(),
  };

  if (event.payment === "FREE") {
    const { token } = await generateTicketQR({ registrationId: registration.id, teamId: team.id });
    registration.qrToken = token;
  }

  store.collection("registrations").push(registration);
  team.registrationId = registration.id;
  store.persist();
  res.status(201).json({ team, registration });
});

export default router;
