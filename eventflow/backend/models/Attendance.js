import mongoose from "mongoose";

const AttendanceSchema = new mongoose.Schema(
  {
    registrationId: String,
    eventId: String,
    userId: String,
    teamId: { type: String, default: null },
    scannedBy: String,
    scannedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.model("Attendance", AttendanceSchema);
