const mongoose = require("mongoose");

const variableSchema = new mongoose.Schema({
  name: {
    type: String, required: [true, "Variable name required"],
    trim: true, maxlength: 50,
  },
  type: {
    type: String, enum: ["number", "boolean", "string"], default: "number",
  },
  defaultValue: { type: mongoose.Schema.Types.Mixed, default: 0 },
  description:  { type: String, default: "" },
  project: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },
}, { timestamps: true });

variableSchema.index({ project: 1 });

module.exports = mongoose.model("Variable", variableSchema);