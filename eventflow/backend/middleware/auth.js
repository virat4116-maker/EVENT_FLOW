import { verifyToken } from "../utils/token.js";
import store from "../data/store.js";

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ message: "Not authenticated" });
  try {
    const decoded = verifyToken(token);
    const user = store.collection("users").find((u) => u.id === decoded.id);
    if (!user) return res.status(401).json({ message: "Not authenticated" });
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ message: "Session expired, please log in again" });
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: "You don't have access to this action" });
    }
    next();
  };
}

// A department admin may only touch events in their own department.
// A super admin may touch anything.
export function canManageEvent(event, user) {
  if (user.role === "SUPER_ADMIN") return true;
  if (user.role === "DEPARTMENT_ADMIN") return event.department === user.department;
  return false;
}
