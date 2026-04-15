const router = require("express").Router();
const { protect } = require("../middlewares/auth");
const {
  getScenesByProject,
  getSceneById,
  createScene,
  updateScene,
  deleteScene,
} = require("../Controllers/scene.controller");

router.get("/project/:projectId",        protect, getScenesByProject);
router.get("/:id",                       protect, getSceneById);
router.post("/",                         protect, createScene);
router.put("/:id",                       protect, updateScene);
router.delete("/:id",                    protect, deleteScene);

module.exports = router;