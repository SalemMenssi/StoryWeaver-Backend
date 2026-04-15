const router = require("express").Router();
const { protect } = require("../middlewares/auth");
const { chat } = require("../Controllers/ai.controller");

// POST /api/ai/chat — authenticated users only
router.post("/chat", protect, chat);

module.exports = router;
