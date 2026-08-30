import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ["SUPER_ADMIN", "DEPARTMENT_ADMIN", "VOLUNTEER", "PARTICIPANT"],
      default: "PARTICIPANT",
    },
    department: { type: String, default: null }, // set for DEPARTMENT_ADMIN and VOLUNTEER
    studentId: { type: String, default: null },
  },
  { timestamps: true }
);

export default mongoose.model("User", UserSchema);
