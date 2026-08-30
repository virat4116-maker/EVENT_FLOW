import { v4 as uuidv4 } from "uuid";

export const newId = (prefix) => `${prefix}_${uuidv4().slice(0, 8)}`;

export const inviteCode = (teamName = "TEAM") => {
  const base = teamName.replace(/[^a-zA-Z]/g, "").toUpperCase().slice(0, 2) || "TM";
  const suffix = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `${base}-${suffix}`;
};

export const certificateId = () =>
  `EF-CERT-${new Date().getFullYear()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
