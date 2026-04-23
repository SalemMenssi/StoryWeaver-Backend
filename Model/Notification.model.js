const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  sender:    { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  type:      { 
    type: String, 
    enum: ["MESSAGE", "TICKET_UPDATE", "SYSTEM", "PROJECT_SHARED"], 
    default: "MESSAGE" 
  },
  content:   { type: String, required: true },
  data:      { type: mongoose.Schema.Types.Mixed, default: {} },
  read:      { type: Boolean, default: false },
}, { timestamps: true });

notificationSchema.index({ recipient: 1, read: 1 });
notificationSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Notification", notificationSchema);
