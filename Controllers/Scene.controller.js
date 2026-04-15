const Scene   = require("../Model/Scene.model");
const Project = require("../Model/Project.model");
const Choice  = require("../Model/Choice.model");
const { successResponse, errorResponse } = require("../Utils/apiResponse");

const getScenesByProject = async (req, res) => {
  try {
    const scenes = await Scene.find({ project: req.params.projectId }).sort("order");
    return successResponse(res, "Scenes fetched.", { scenes });
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

const getSceneById = async (req, res) => {
  try {
    const scene = await Scene.findById(req.params.id);
    if (!scene) return errorResponse(res, "Scene not found.", 404);
    return successResponse(res, "Scene fetched.", { scene });
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

const createScene = async (req, res) => {
  try {
    const { title, text, projectId, isStart, order } = req.body;

    const project = await Project.findOne({ _id: projectId, owner: req.user._id });
    if (!project) return errorResponse(res, "Project not found.", 404);

    const scene = await Scene.create({ title, text, project: projectId, isStart, order });
    await Project.findByIdAndUpdate(projectId, { $inc: { sceneCount: 1, nodeCount: 1 } });

    return successResponse(res, "Scene created.", { scene }, 201);
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

const updateScene = async (req, res) => {
  try {
    const scene = await Scene.findByIdAndUpdate(req.params.id, req.body, {
      new: true, runValidators: true,
    });
    if (!scene) return errorResponse(res, "Scene not found.", 404);
    return successResponse(res, "Scene updated.", { scene });
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

const deleteScene = async (req, res) => {
  try {
    const scene = await Scene.findByIdAndDelete(req.params.id);
    if (!scene) return errorResponse(res, "Scene not found.", 404);

    await Choice.deleteMany({ fromScene: scene._id });
    await Project.findByIdAndUpdate(scene.project, {
      $inc: { sceneCount: -1, nodeCount: -1 },
    });

    return successResponse(res, "Scene deleted.");
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

module.exports = { getScenesByProject, getSceneById, createScene, updateScene, deleteScene };