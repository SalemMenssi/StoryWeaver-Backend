const router = require("express").Router();
const { protect, adminOnly } = require("../middlewares/auth");
const { getDashboardStats } = require("../Controllers/admin.controller");

router.get("/stats", protect, adminOnly, getDashboardStats);

module.exports = router;
