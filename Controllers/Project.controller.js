const Project  = require("../Model/Project.model");
const Scene    = require("../Model/Scene.model");
const Choice   = require("../Model/Choice.model");
const Variable = require("../Model/Variable.model");
const { successResponse, errorResponse } = require("../Utils/apiResponse");

// ── ADMIN ─────────────────────────────────────────────────────────

const getAllProjects = async (req, res) => {
  try {
    const { status, resources, search, page = 1, limit = 10 } = req.query;
    const query = {};
    if (status)    query.status    = status;
    if (resources) query.resources = resources;
    if (search) query.$or = [
      { name:        { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
    ];

    const total    = await Project.countDocuments(query);
    const projects = await Project.find(query)
      .populate("owner", "name email avatar")
      .sort("-createdAt")
      .skip((page - 1) * limit)
      .limit(Number(limit));

    return successResponse(res, "Projects fetched.", {
      projects,
      pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

const updateProjectStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ["Active", "Draft", "Flagged", "Archived"];
    if (!allowed.includes(status))
      return errorResponse(res, `Invalid status. Allowed: ${allowed.join(", ")}`, 400);

    const project = await Project.findByIdAndUpdate(
      req.params.id, { status }, { new: true }
    ).populate("owner", "name email");

    if (!project) return errorResponse(res, "Project not found.", 404);
    return successResponse(res, `Status set to ${status}.`, { project });
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

const getProjectStats = async (req, res) => {
  try {
    const [total, active, flagged, archived, draft] = await Promise.all([
      Project.countDocuments(),
      Project.countDocuments({ status: "Active" }),
      Project.countDocuments({ status: "Flagged" }),
      Project.countDocuments({ status: "Archived" }),
      Project.countDocuments({ status: "Draft" }),
    ]);
    return successResponse(res, "Stats fetched.", {
      stats: { total, active, flagged, archived, draft },
    });
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

// ── USER ──────────────────────────────────────────────────────────

const getMyProjects = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 9 } = req.query;
    const query = { owner: req.user._id };
    if (status) query.status = status;
    if (search) query.name   = { $regex: search, $options: "i" };

    const total    = await Project.countDocuments(query);
    const projects = await Project.find(query)
      .sort("-updatedAt")
      .skip((page - 1) * limit)
      .limit(Number(limit));

    return successResponse(res, "Projects fetched.", {
      projects,
      pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

const getProjectById = async (req, res) => {
  try {
    const project = await Project.findOne({
      _id: req.params.id,
      owner: req.user._id,
    });
    if (!project) return errorResponse(res, "Project not found.", 404);
    return successResponse(res, "Project fetched.", { project });
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

const createProject = async (req, res) => {
  try {
    const { name, description, genre, status, image } = req.body;
    const project = await Project.create({
      name, description, genre, status, image,
      owner: req.user._id,
    });
    return successResponse(res, "Project created!", { project }, 201);
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

const updateProject = async (req, res) => {
  try {
    const allowed = ["name", "description", "genre", "status", "image", "resources"];
    const updates = {};
    allowed.forEach((f) => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

    const project = await Project.findOneAndUpdate(
      { _id: req.params.id, owner: req.user._id },
      updates,
      { new: true, runValidators: true }
    );
    if (!project) return errorResponse(res, "Project not found.", 404);
    return successResponse(res, "Project updated.", { project });
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

const deleteProject = async (req, res) => {
  try {
    const filter = req.user.role === "admin"
      ? { _id: req.params.id }
      : { _id: req.params.id, owner: req.user._id };

    const project = await Project.findOne(filter);
    if (!project) return errorResponse(res, "Project not found.", 404);

    await Promise.all([
      Scene.deleteMany({ project: project._id }),
      Choice.deleteMany({ project: project._id }),
      Variable.deleteMany({ project: project._id }),
      Project.findByIdAndDelete(project._id),
    ]);
    return successResponse(res, "Project deleted.");
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

const exportProject = async (req, res) => {
  try {
    const project = await Project.findOne({ _id: req.params.id, owner: req.user._id });
    if (!project) return errorResponse(res, "Project not found.", 404);

    const [scenes, choices, variables] = await Promise.all([
      Scene.find({ project: project._id }),
      Choice.find({ project: project._id }),
      Variable.find({ project: project._id }),
    ]);

    return successResponse(res, "Export ready.", {
      export: { project, scenes, choices, variables },
    });
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

module.exports = {
  getAllProjects, updateProjectStatus, getProjectStats,
  getMyProjects, getProjectById, createProject,
  updateProject, deleteProject, exportProject,
};