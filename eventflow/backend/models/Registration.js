import mongoose from "mongoose";

const RegistrationSchema = new mongoose.Schema(
  {
    eventId: String,
    userId: String, // participant, or team leader for team registrations
    teamId: { type: String, default: null },
    answers: Object,
    status: { type: String, enum: ["PENDING_PAYMENT", "CONFIRMED", "CANCELLED"], default: "PENDING_PAYMENT" },
    qrToken: { type: String, default: null },
    checkedIn: { type: Boolean, default: false },
    checkedInAt: Date,
  },
  { timestamps: true }
);

export default mongoose.model("Registration", RegistrationSchema);
