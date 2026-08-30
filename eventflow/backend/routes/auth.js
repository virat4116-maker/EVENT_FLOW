import { Router } from "express";
import bcrypt from "bcryptjs";
import store from "../data/store.js";
import { newId } from "../utils/ids.js";
import { signToken } from "../utils/token.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

function publicUser(u) {
  const { passwordHash, ...rest } = u;
  return rest;
}

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const user = store.collection("users").find((u) => u.email.toLowerCase() === (email || "").toLowerCase());
  if (!user) return res.status(401).json({ message: "No account found with that email" });
  const ok = await bcrypt.compare(password || "", user.passwordHash);
  if (!ok) return res.status(401).json({ message: "Incorrect password" });
  const token = signToken(user);
  res.json({ token, user: publicUser(user) });
});

router.post("/register", async (req, res) => {
  const { name, email, password, studentId } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ message: "Name, email and password are required" });
  }
  const exists = store.collection("users").some((u) => u.email.toLowerCase() === email.toLowerCase());
  if (exists) return res.status(409).json({ message: "An account with that email already exists" });
  const passwordHash = await bcrypt.hash(password, 10);
  const user = {
    id: newId("usr"),
    name,
    email,
    passwordHash,
    role: "PARTICIPANT",
    department: null,
    studentId: studentId || null,
    createdAt: new Date().toISOString(),
  };
  store.collection("users").push(user);
  store.persist();
  const token = signToken(user);
  res.status(201).json({ token, user: publicUser(user) });
});

router.get("/me", requireAuth, (req, res) => {
  res.json({ user: publicUser(req.user) });
});

export default router;
