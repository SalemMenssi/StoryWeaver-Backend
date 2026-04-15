const Choice  = require("../Model/Choice.model");
const Project = require("../Model/Project.model");
const { successResponse, errorResponse } = require("../Utils/apiResponse");

const getChoicesByScene = async (req, res) => {
  try {
    const choices = await Choice.find({ fromScene: req.params.sceneId }).sort("order");
    return successResponse(res, "Choices fetched.", { choices });
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

const getChoicesByProject = async (req, res) => {
  try {
    const choices = await Choice.find({ project: req.params.projectId });
    return successResponse(res, "Choices fetched.", { choices });
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

const createChoice = async (req, res) => {
  try {
    const { label, fromScene, toScene, projectId, variable, delta, order } = req.body;

    const project = await Project.findOne({ _id: projectId, owner: req.user._id });
    if (!project) return errorResponse(res, "Project not found.", 404);

    const choice = await Choice.create({
      label, fromScene, toScene,
      project: projectId,
      variable, delta, order,
    });
    await Project.findByIdAndUpdate(projectId, { $inc: { choiceCount: 1 } });

    return successResponse(res, "Choice created.", { choice }, 201);
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

const updateChoice = async (req, res) => {
  try {
    const choice = await Choice.findByIdAndUpdate(req.params.id, req.body, {
      new: true, runValidators: true,
    });
    if (!choice) return errorResponse(res, "Choice not found.", 404);
    return successResponse(res, "Choice updated.", { choice });
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

const deleteChoice = async (req, res) => {
  try {
    const choice = await Choice.findByIdAndDelete(req.params.id);
    if (!choice) return errorResponse(res, "Choice not found.", 404);
    await Project.findByIdAndUpdate(choice.project, { $inc: { choiceCount: -1 } });
    return successResponse(res, "Choice deleted.");
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

module.exports = { getChoicesByScene, getChoicesByProject, createChoice, updateChoice, deleteChoice };