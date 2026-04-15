const mongoose = require("mongoose");

const choiceSchema = new mongoose.Schema({
  label: {
    type: String, required: [true, "Choice label required"],
    trim: true, maxlength: 200,
  },
  fromScene: { type: mongoose.Schema.Types.ObjectId, ref: "Scene", required: true },
  toScene:   { type: mongoose.Schema.Types.ObjectId, ref: "Scene", default: null },
  project:   { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },
  variable:  { type: String, default: null },
  delta:     { type: Number, default: 0 },
  order:     { type: Number, default: 0 },
}, { timestamps: true });

choiceSchema.index({ fromScene: 1 });
choiceSchema.index({ project: 1 });

module.exports = mongoose.model("Choice", choiceSchema);