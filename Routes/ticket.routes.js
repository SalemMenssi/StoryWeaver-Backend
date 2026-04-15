const router = require("express").Router();
const { protect, moderatorOrAdmin } = require("../middlewares/auth");
const {
  getAllTickets,
  getTicketById,
  createTicket,
  sendMessage,
  updateTicketStatus,
  assignTicket,
  replyToTicket,
  deleteTicket,
  getTicketStats,
  getMyTickets,
  getDirectChat,
  sendDirectMessage
} = require("../Controllers/ticket.controller");

// ── Admin/Moderator routes ────────────────────────────────────────
router.get("/stats",             protect, moderatorOrAdmin, getTicketStats);
router.get("/admin/all",         protect, moderatorOrAdmin, getAllTickets);
router.patch("/:id/status",      protect, moderatorOrAdmin, updateTicketStatus);
router.patch("/:id/assign",      protect, moderatorOrAdmin, assignTicket);
router.post("/:id/reply",        protect, moderatorOrAdmin, replyToTicket);
router.delete("/admin/:id",      protect, moderatorOrAdmin, deleteTicket);

// ── User / General Chat routes ──────────────────────────────────────
router.get("/chat/:userId",      protect, getDirectChat);
router.post("/chat/:userId",     protect, sendDirectMessage);

// ── User ticket routes ────────────────────────────────────────────
router.get("/",                  protect, getMyTickets);
router.post("/",                 protect, createTicket);
router.get("/:id",               protect, getTicketById);
router.post("/:id/message",      protect, sendMessage);
router.delete("/:id",            protect, deleteTicket);

module.exports = router;