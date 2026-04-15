const User = require("../Model/User.modal");
const bcrypt = require("bcryptjs");
const { successResponse, errorResponse } = require("../Utils/apiResponse");

// ── ADMIN ─────────────────────────────────────────────────────────

const getAllUsers = async (req, res) => {
  try {
    const { status, role, search, page = 1, limit = 10, sort = "-createdAt" } = req.query;
    const query = {};
    if (status) query.status = status;
    if (role)   query.role   = role;
    if (search) query.$or = [
      { name:  { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
    ];

    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(Number(limit));

    return successResponse(res, "Users fetched.", {
      users,
      pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return errorResponse(res, "User not found.", 404);
    return successResponse(res, "User fetched.", { user });
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

const createUser = async (req, res) => {
  try {
    const { name, email, password, role, plan } = req.body;
    if (await User.findOne({ email }))
      return errorResponse(res, "Email already in use.", 409);

    const user = await User.create({ name, email, password, role, plan });
    return successResponse(res, "User created.", { user }, 201);
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

const updateUser = async (req, res) => {
  try {
    const allowed = ["name", "email", "role", "status", "plan", "bio", "avatar"];
    const updates = {};
    allowed.forEach((f) => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    if (!user) return errorResponse(res, "User not found.", 404);
    return successResponse(res, "User updated.", { user });
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

const suspendUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { status: "Suspended" }, { new: true });
    if (!user) return errorResponse(res, "User not found.", 404);
    return successResponse(res, `${user.name} suspended.`, { user });
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

const activateUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { status: "Active" }, { new: true });
    if (!user) return errorResponse(res, "User not found.", 404);
    return successResponse(res, `${user.name} activated.`, { user });
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return errorResponse(res, "User not found.", 404);
    return successResponse(res, "User deleted.");
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

const getUserStats = async (req, res) => {
  try {
    const [total, active, suspended, pending, admins, moderators] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ status: "Active" }),
      User.countDocuments({ status: "Suspended" }),
      User.countDocuments({ status: "Pending" }),
      User.countDocuments({ role: "admin" }),
      User.countDocuments({ role: "moderator" }),
    ]);
    return successResponse(res, "Stats fetched.", {
      stats: { total, active, suspended, pending, admins, moderators },
    });
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

// ── USER PROFILE ──────────────────────────────────────────────────

const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    return successResponse(res, "Profile fetched.", { user });
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

const updateProfile = async (req, res) => {
  try {
    const allowed = ["name", "bio", "avatar"];
    const updates = {};
    allowed.forEach((f) => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true });
    return successResponse(res, "Profile updated.", { user });
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword)
      return errorResponse(res, "Both passwords required.", 400);
    if (newPassword.length < 6)
      return errorResponse(res, "New password min 6 characters.", 400);

    const user = await User.findById(req.user._id).select("+password");
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) return errorResponse(res, "Current password incorrect.", 401);

    user.password = newPassword;
    await user.save();
    return successResponse(res, "Password changed successfully.");
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

const deleteAccount = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { status: "Suspended" });
    res.clearCookie("refreshToken");
    return successResponse(res, "Account deactivated.");
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

module.exports = {
  getAllUsers, getUserById, createUser, updateUser,
  suspendUser, activateUser, deleteUser, getUserStats,
  getProfile, updateProfile, changePassword, deleteAccount,
};