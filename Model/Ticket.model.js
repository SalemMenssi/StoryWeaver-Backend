const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  sender: { type: String, enum: ["user", "agent"], required: true },
  text:   { type: String, required: true, maxlength: 2000 },
  senderRef: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
}, { timestamps: true });

const ticketSchema = new mongoose.Schema({
  ticketId:    { type: String, unique: true },
  title:       { type: String, required: true, trim: true, maxlength: 150 },
  description: { type: String, default: "", maxlength: 1000 },
  status: {
    type: String, enum: ["Open", "In Progress", "Closed"], default: "Open",
  },
  tag: {
    type: String,
    enum: ["BILLING", "TECHNICAL", "ACCOUNT", "GENERAL", "DIRECT_CHAT"],
    default: "GENERAL",
  },
  priority: {
    type: String, enum: ["Low", "Medium", "High", "Critical"], default: "Medium",
  },
  owner:      { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  messages:   [messageSchema],
  resolvedAt: { type: Date, default: null },
}, { timestamps: true });

// Auto-generate ticketId
ticketSchema.pre("save", async function (next) {
  if (!this.ticketId) {
    const count = await mongoose.model("Ticket").countDocuments();
    this.ticketId = `TIC-${1000 + count + 1}`;
  }
  next();
});

ticketSchema.index({ owner: 1 });
ticketSchema.index({ status: 1 });

module.exports = mongoose.model("Ticket", ticketSchema);