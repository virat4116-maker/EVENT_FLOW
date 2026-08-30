import mongoose from "mongoose";

const TeamSchema = new mongoose.Schema(
  {
    eventId: String,
    name: String,
    leaderId: String,
    memberIds: [String],
    inviteCode: String,
    status: { type: String, enum: ["FORMING", "COMPLETE"], default: "FORMING" },
    answers: Object,
    registrationId: String,
  },
  { timestamps: true }
);

export default mongoose.model("Team", TeamSchema);
