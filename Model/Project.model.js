const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema({
  name: {
    type: String, required: [true, "Project name required"],
    trim: true, minlength: 2, maxlength: 100,
  },
  description: { type: String, default: "", maxlength: 500 },
  genre: {
    type: String,
    enum: ["RPG", "visualnovel", "thriller", "fantasy", "scifi", "horror", "other"],
    default: "other",
  },
  status: {
    type: String,
    enum: ["Active", "Draft", "Flagged", "Archived", "LIVE"],
    default: "Draft",
  },
  resources: {
    type: String, enum: ["LOW", "MEDIUM", "HIGH"], default: "LOW",
  },
  image: { type: String, default: "" },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  
  // Graph Persistence
  nodes:      { type: Array, default: [] },
  edges:      { type: Array, default: [] },
  gameType:   { type: String, default: "Linear" },
  characters: { type: Array, default: [] },

  // Chapters (sidebar navigation items)
  chapters: [{
    id:      { type: String, required: true },
    title:   { type: String, default: "Untitled Chapter" },
    summary: { type: String, default: "" },
    color:   { type: String, default: "#6366f1" },
  }],

  nodeCount:  { type: Number, default: 0 },
  sceneCount: { type: Number, default: 0 },
  choiceCount:{ type: Number, default: 0 },
}, { timestamps: true });

projectSchema.index({ owner: 1 });
projectSchema.index({ status: 1 });
projectSchema.index({ name: "text", description: "text" });

module.exports = mongoose.model("Project", projectSchema);