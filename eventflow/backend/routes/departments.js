import { Router } from "express";
import store from "../data/store.js";
import { newId } from "../utils/ids.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();

router.get("/", (req, res) => {
  res.json(store.collection("departments"));
});

router.post("/", requireAuth, requireRole("SUPER_ADMIN"), (req, res) => {
  const { name, kind } = req.body;
  if (!name) return res.status(400).json({ message: "Department name is required" });
  const dept = { id: newId("dept"), name, kind: kind || "DEPARTMENT" };
  store.collection("departments").push(dept);
  store.persist();
  res.status(201).json(dept);
});

export default router;
