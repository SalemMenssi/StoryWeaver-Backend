const router = require("express").Router();
const { protect, adminOnly } = require("../middlewares/auth");
const {
  getAllProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  updateProjectStatus,
  getProjectStats,
  exportProject,
  getMyProjects,
} = require("../Controllers/project.controller");

// ── Admin routes ──────────────────────────────────────────────────
router.get("/stats",             protect, adminOnly, getProjectStats);
router.get("/admin/all",         protect, adminOnly, getAllProjects);
router.patch("/:id/status",      protect, adminOnly, updateProjectStatus);
router.delete("/admin/:id",      protect, adminOnly, deleteProject);

// ── User routes ───────────────────────────────────────────────────
router.get("/",                  protect, getMyProjects);
router.post("/",                 protect, createProject);
router.get("/:id",               protect, getProjectById);
router.put("/:id",               protect, updateProject);
router.delete("/:id",            protect, deleteProject);
router.get("/:id/export",        protect, exportProject);

module.exports = router;