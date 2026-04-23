const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  name: {
    type: String, required: [true, "Name is required"],
    trim: true, minlength: 2, maxlength: 50,
  },
  email: {
    type: String, required: [true, "Email is required"],
    unique: true, lowercase: true, trim: true,
    match: [/^\S+@\S+\.\S+$/, "Invalid email"],
  },
  password: {
    type: String, required: [true, "Password is required"],
    minlength: 6, select: false,
  },
  role: {
    type: String,
    enum: ["user", "moderator", "admin"],
    default: "user",
  },
  status: {
    type: String,
    enum: ["Active", "Pending", "Suspended"],
    default: "Active",
  },
  avatar: { type: String, default: "" },
  bio: { type: String, default: "", maxlength: 300 },
  plan: {
    type: String,
    enum: ["Free", "Pro Monthly", "Pro Annual", "Enterprise"],
    default: "Free",
  },
  lastActivity: { type: Date, default: Date.now },
  otpCode: { type: String, default: null },
  otpExpires: { type: Date, default: null },
}, { timestamps: true });

// Hash password before save
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function (plain) {
  return bcrypt.compare(plain, this.password);
};

module.exports = mongoose.model("User", userSchema);