const mongoose = require("mongoose");

const sceneSchema = new mongoose.Schema({
  title: {
    type: String, required: [true, "Scene title required"],
    trim: true, maxlength: 100,
  },
  content: { type: String, default: "", maxlength: 5000 },
  project: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },
  chapter: { type: mongoose.Schema.Types.ObjectId, ref: "Chapter", default: null },
  
  // New columns
  character:       { type: String, default: "" },
  characterSprite: { type: String, default: "" },
  backgroundImage: { type: String, default: "" },
  color:           { type: String, default: "#10b981" },
  typeLabel:       { type: String, default: "Scene" },
  
  // React Flow Metadata
  nodeId:          { type: String },
  position: {
    x: { type: Number, default: 0 },
    y: { type: Number, default: 0 },
  },

  isStart: { type: Boolean, default: false },
  order:   { type: Number, default: 0 },
}, { timestamps: true });

sceneSchema.index({ project: 1 });
sceneSchema.index({ chapter: 1 });

module.exports = mongoose.model("Scene", sceneSchema);