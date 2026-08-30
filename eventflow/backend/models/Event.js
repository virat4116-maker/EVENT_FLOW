import mongoose from "mongoose";

const FieldSchema = new mongoose.Schema(
  {
    id: String,
    type: {
      type: String,
      enum: [
        "SHORT_ANSWER", "LONG_ANSWER", "EMAIL", "PHONE", "NUMBER",
        "DROPDOWN", "MULTIPLE_CHOICE", "CHECKBOXES", "DATE", "FILE_UPLOAD",
      ],
    },
    label: String,
    placeholder: String,
    required: Boolean,
    options: [String],
  },
  { _id: false }
);

const EventSchema = new mongoose.Schema(
  {
    name: String,
    type: { type: String, enum: ["EVENT", "COMPETITION", "CAMPAIGN", "WORKSHOP", "SEMINAR", "SPORTS", "CULTURAL", "OTHER"] },
    category: String,
    department: String,
    description: String,
    banner: String,
    date: String,
    startTime: String,
    endTime: String,
    venue: String,
    rules: String,
    instructions: String,
    participation: { type: String, enum: ["INDIVIDUAL", "TEAM", "EITHER"], default: "INDIVIDUAL" },
    teamMin: Number,
    teamMax: Number,
    teamLeaderRequired: { type: Boolean, default: true },
    payment: { type: String, enum: ["FREE", "PAID"], default: "FREE" },
    fee: { type: Number, default: 0 },
    attendanceRequired: { type: Boolean, default: true },
    qrMode: { type: String, enum: ["INDIVIDUAL", "TEAM"], default: "INDIVIDUAL" },
    certificateEnabled: { type: Boolean, default: false },
    capacityEnabled: { type: Boolean, default: false },
    maxCapacity: Number,
    capacityType: { type: String, enum: ["PARTICIPANTS", "TEAMS"], default: "PARTICIPANTS" },
    registrationDeadline: String,
    customFields: [FieldSchema],
    status: {
      type: String,
      enum: [
        "DRAFT", "PENDING_APPROVAL", "CHANGES_REQUESTED", "APPROVED", "PUBLISHED",
        "REGISTRATION_OPEN", "REGISTRATION_CLOSED", "FULL", "ONGOING", "COMPLETED", "REJECTED",
      ],
      default: "DRAFT",
    },
    reviewNote: String,
    createdBy: String,
  },
  { timestamps: true }
);

export default mongoose.model("Event", EventSchema);
