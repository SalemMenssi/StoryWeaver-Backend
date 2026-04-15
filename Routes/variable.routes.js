const router = require("express").Router();
const { getVariablesByProject, createVariable, updateVariable, deleteVariable } = require("../Controllers/variable.controller");
const { protect } = require("../middlewares/auth");


router.get("/project/:projectId",        protect, getVariablesByProject);
router.post("/",                         protect, createVariable);
router.put("/:id",                       protect, updateVariable);
router.delete("/:id",                    protect, deleteVariable);

module.exports = router;