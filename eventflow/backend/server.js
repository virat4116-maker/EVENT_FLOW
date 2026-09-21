import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

import authRoutes from "./routes/auth.js";
import eventRoutes from "./routes/events.js";
import registrationRoutes from "./routes/registrations.js";
import teamRoutes from "./routes/teams.js";
import paymentRoutes from "./routes/payments.js";
import attendanceRoutes from "./routes/attendance.js";
import certificateRoutes from "./routes/certificates.js";
import adminRoutes from "./routes/admin.js";
import departmentRoutes from "./routes/departments.js";
import store from "./data/store.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(cors());
app.use(express.json({ limit: "5mb" }));

app.get("/api/health", (req, res) => res.json({ ok: true, service: "eventflow-api" }));

app.use("/api/auth", authRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/registrations", registrationRoutes);
app.use("/api/teams", teamRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/certificates", certificateRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/departments", departmentRoutes);


// Serve frontend
const frontendPath = path.join(__dirname, "../frontend/dist");

app.use(express.static(frontendPath));

// Send React app for frontend routes
app.use((req, res, next) => {
  if (req.method === "GET" && !req.path.startsWith("/api/")) {
    return res.sendFile(path.join(frontendPath, "index.html"));
  }
  next();
});

app.use((req, res) => res.status(404).json({ message: "Not found" }));
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: "Something went wrong on the server" });
});

const PORT = process.env.PORT || 5000;

// Auto-seed on first boot so the demo works immediately after `npm install`.
// (store.js creates an empty db.json on first import, so we check for actual
// content — not just file existence — before deciding to seed.)
if (store.collection("users").length === 0) {
  console.log("No data found — running first-time seed...");
  const { seed } = await import("./data/seed.js");
  await seed();
  store.reload();
}

app.listen(PORT, "0.0.0.0", () =>
  console.log(`EventFlow API running on port ${PORT}`)
);
