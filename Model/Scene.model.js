const mongoose = require("mongoose");

const sceneSchema = new mongoose.Schema({
  title: {
    type: String, required: [true, "Scene title required"],
    trim: true, maxlength: 100,
  },
  text:    { type: String, default: "", maxlength: 5000 },
  project: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },
  isStart: { type: Boolean, default: false },
  order:   { type: Number, default: 0 },
}, { timestamps: true });

sceneSchema.index({ project: 1 });

module.exports = mongoose.model("Scene", sceneSchema);