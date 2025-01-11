import mongoose from "mongoose";

const allowedEmailSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  role: {
    type: String,
    required: true,
    enum: ["user", "admin"],
  },
  addedAt: {
    type: Date,
    default: Date.now,
  },
});

const AllowedEmail = mongoose.model("AllowedEmail", allowedEmailSchema);

export { AllowedEmail };
