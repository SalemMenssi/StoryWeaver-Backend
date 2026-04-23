const express = require("express");
const router = express.Router();
const { getNotifications, markRead, markAllRead, getUnreadCount } = require("../Controllers/Notification.controller");
const { protect } = require("../middlewares/auth");

router.use(protect);

router.get("/", getNotifications);
router.get("/unread/count", getUnreadCount);
router.put("/mark-all-read", markAllRead);
router.put("/:id/read", markRead);

module.exports = router;
