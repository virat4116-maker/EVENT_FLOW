import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET || "eventflow_super_secret_change_me";
const EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

export function signToken(user) {
  return jwt.sign(
    { id: user.id, role: user.role, department: user.department || null },
    SECRET,
    { expiresIn: EXPIRES_IN }
  );
}

export function verifyToken(token) {
  return jwt.verify(token, SECRET);
}
