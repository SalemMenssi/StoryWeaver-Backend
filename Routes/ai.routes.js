const router = require("express").Router();
const { protect } = require("../middlewares/auth");
const { chat, generateGraph, generateChapter } = require("../Controllers/ai.controller");

// POST /api/ai/chat — authenticated users only
router.post("/chat", protect, chat);

// POST /api/ai/generate-graph — authenticated users only
router.post("/generate-graph", protect, generateGraph);

// POST /api/ai/generate-chapter — authenticated users only
router.post("/generate-chapter", protect, generateChapter);

module.exports = router;
