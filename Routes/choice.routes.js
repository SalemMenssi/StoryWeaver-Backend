const router = require("express").Router();
const { protect } = require("../middlewares/auth");
const {
  getChoicesByScene,
  getChoicesByProject,
  createChoice,
  updateChoice,
  deleteChoice,
} = require("../Controllers/choice.controller");

router.get("/scene/:sceneId",            protect, getChoicesByScene);
router.get("/project/:projectId",        protect, getChoicesByProject);
router.post("/",                         protect, createChoice);
router.put("/:id",                       protect, updateChoice);
router.delete("/:id",                    protect, deleteChoice);

module.exports = router;