const Notification = require("../Model/Notification.model");
const { successResponse, errorResponse } = require("../Utils/apiResponse");

const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user._id })
      .populate("sender", "name avatar")
      .sort("-createdAt")
      .limit(50);
    
    const unreadCount = await Notification.countDocuments({ recipient: req.user._id, read: false });
    
    return successResponse(res, "Notifications fetched.", { notifications, unreadCount });
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

const markRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user._id },
      { read: true },
      { new: true }
    );
    if (!notification) return errorResponse(res, "Notification not found.", 404);
    return successResponse(res, "Notification marked as read.", { notification });
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

const markAllRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.user._id, read: false },
      { read: true }
    );
    return successResponse(res, "All notifications marked as read.");
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

const getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({ recipient: req.user._id, read: false });
    return successResponse(res, "Unread count fetched.", { count });
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

module.exports = { getNotifications, markRead, markAllRead, getUnreadCount };
