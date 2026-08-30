import mongoose from "mongoose";

const CertificateSchema = new mongoose.Schema(
  {
    registrationId: String,
    eventId: String,
    userId: String,
    certificateId: String,
    issuedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.model("Certificate", CertificateSchema);
