import mongoose from "mongoose";

const DepartmentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    kind: { type: String, enum: ["DEPARTMENT", "CLUB", "COMMITTEE"], default: "DEPARTMENT" },
  },
  { timestamps: true }
);

export default mongoose.model("Department", DepartmentSchema);
