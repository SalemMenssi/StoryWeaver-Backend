const mongoose = require("mongoose");

const choiceSchema = new mongoose.Schema({
  text: {
    type: String, required: [true, "Choice text required"],
    trim: true, maxlength: 200,
  },
  fromNodeId: { type: String }, // React Flow node ID of the source scene
  toNodeId:   { type: String }, // React Flow node ID of the target scene
  
  // Relational refs (if used)
  fromScene: { type: mongoose.Schema.Types.ObjectId, ref: "Scene", default: null },
  toScene:   { type: mongoose.Schema.Types.ObjectId, ref: "Scene", default: null },
  project:   { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },
  
  variable:  { type: String, default: null },
  delta:     { type: Number, default: 0 },
  order:     { type: Number, default: 0 },
}, { timestamps: true });

choiceSchema.index({ project: 1 });

module.exports = mongoose.model("Choice", choiceSchema);