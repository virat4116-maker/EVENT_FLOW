import { Router } from "express";
import store from "../data/store.js";
import { newId, certificateId } from "../utils/ids.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

// Certificates are lazily generated the first time a participant checks their
// list, for any completed event they attended where the organizer enabled them.
router.get("/my", requireRole("PARTICIPANT"), (req, res) => {
  const regs = store.collection("registrations").filter(
    (r) => r.userId === req.user.id && r.status === "CONFIRMED" && r.checkedIn
  );
  const certs = store.collection("certificates");
  const result = [];

  for (const reg of regs) {
    const event = store.collection("events").find((e) => e.id === reg.eventId);
    if (!event || !event.certificateEnabled || event.status !== "COMPLETED") continue;
    let cert = certs.find((c) => c.registrationId === reg.id);
    if (!cert) {
      cert = {
        id: newId("cert"),
        registrationId: reg.id,
        eventId: event.id,
        userId: req.user.id,
        certificateId: certificateId(),
        issuedAt: new Date().toISOString(),
      };
      certs.push(cert);
      store.persist();
    }
    result.push({ ...cert, event, participantName: req.user.name });
  }
  res.json(result);
});

export default router;
