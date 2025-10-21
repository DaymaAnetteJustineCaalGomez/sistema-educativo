// backend/models/OTPCode.js
import mongoose from "mongoose";

const OTPSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, lowercase: true, index: true },
    role: { type: String, required: true, enum: ["DOCENTE", "ADMIN"] },
    code: { type: String, required: true }, // 6 dígitos
    used: { type: Boolean, default: false },
    attempts: { type: Number, default: 0 },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

// TTL para eliminar cuando expire
OTPSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model("OTPCode", OTPSchema);
