const router = require("express").Router();
const { protect } = require("../middlewares/auth");
const { 
  getChaptersByProject, 
  getChapterByNodeId 
} = require("../Controllers/chapter.controller");

router.get("/project/:projectId", protect, getChaptersByProject);
router.get("/project/:projectId/node/:nodeId", protect, getChapterByNodeId);

module.exports = router;
