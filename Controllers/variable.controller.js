const Variable = require("../Model/Variable.model");
const Project  = require("../Model/Project.model");
const { successResponse, errorResponse } = require("../Utils/apiResponse");

const getVariablesByProject = async (req, res) => {
  try {
    const variables = await Variable.find({ project: req.params.projectId });
    return successResponse(res, "Variables fetched.", { variables });
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

const createVariable = async (req, res) => {
  try {
    const { name, type, defaultValue, description, projectId } = req.body;

    const project = await Project.findOne({ _id: projectId, owner: req.user._id });
    if (!project) return errorResponse(res, "Project not found.", 404);

    const variable = await Variable.create({
      name, type, defaultValue, description,
      project: projectId,
    });
    return successResponse(res, "Variable created.", { variable }, 201);
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

const updateVariable = async (req, res) => {
  try {
    const variable = await Variable.findByIdAndUpdate(req.params.id, req.body, {
      new: true, runValidators: true,
    });
    if (!variable) return errorResponse(res, "Variable not found.", 404);
    return successResponse(res, "Variable updated.", { variable });
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

const deleteVariable = async (req, res) => {
  try {
    const variable = await Variable.findByIdAndDelete(req.params.id);
    if (!variable) return errorResponse(res, "Variable not found.", 404);
    return successResponse(res, "Variable deleted.");
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

module.exports = { getVariablesByProject, createVariable, updateVariable, deleteVariable };