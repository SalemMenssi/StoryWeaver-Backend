const mongoose = require("mongoose");

const chapterSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "Chapter title required"],
    trim: true,
    maxlength: 100,
  },
  description: { type: String, default: "", maxlength: 2000 },
  project: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },
  nodeId: { type: String, required: true }, // The chapter ID from frontend (e.g. "ch-123456")
  color: { type: String, default: "#6366f1" },
  
  // Scenes belonging to this chapter
  scenes: [{
    nodeId: { type: String },            // React Flow node ID
    title: { type: String, default: "" },
    content: { type: String, default: "" },
    character: { type: String, default: "" },
    characterSprite: { type: String, default: "" },
    color: { type: String, default: "#10b981" },
    typeLabel: { type: String, default: "Scene" },
    backgroundImage: { type: String, default: "" },
    position: {
      x: { type: Number, default: 0 },
      y: { type: Number, default: 0 },
    },
    previousNodeId: { type: String, default: null }, // ID of the node leading to this one
    nextNodeId: { type: String, default: null },     // ID of the next node (primary sequence)
    choices: [{
      id: { type: String },
      text: { type: String, default: "" },
      targetNodeId: { type: String, default: null },
    }],
  }],

}, { timestamps: true });

// Ensure we can quickly find all chapters for a project
chapterSchema.index({ project: 1 });
// Ensure we can quickly find a specific chapter by its node ID within a project
chapterSchema.index({ project: 1, nodeId: 1 }, { unique: true });

module.exports = mongoose.model("Chapter", chapterSchema);
