import mongoose from "mongoose";

const PaymentSchema = new mongoose.Schema(
  {
    registrationId: String,
    eventId: String,
    userId: String,
    amount: Number,
    status: { type: String, enum: ["SUCCESS", "FAILED", "PENDING"], default: "PENDING" },
    method: { type: String, default: "DEMO" }, // swap for "RAZORPAY" in production
  },
  { timestamps: true }
);

export default mongoose.model("Payment", PaymentSchema);
