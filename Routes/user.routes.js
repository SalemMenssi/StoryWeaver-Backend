const router = require("express").Router();
const { protect, adminOnly } = require("../middlewares/auth");
const {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  suspendUser,
  activateUser,
  deleteUser,
  getUserStats,
  getProfile,
  updateProfile,
  changePassword,
  deleteAccount,
} = require("../Controllers/user.controller");

// ── User profile routes (must be above /:id) ────────────────────
router.get("/profile",           protect, getProfile);
router.put("/profile",           protect, updateProfile);
router.put("/password",          protect, changePassword);
router.delete("/account",        protect, deleteAccount);

// ── Admin routes ──────────────────────────────────────────────────
router.get("/stats",             protect, adminOnly, getUserStats);
router.get("/",                  protect, adminOnly, getAllUsers);
router.post("/",                 protect, adminOnly, createUser);
router.get("/:id",               protect, adminOnly, getUserById);
router.put("/:id",               protect, adminOnly, updateUser);
router.patch("/:id/suspend",     protect, adminOnly, suspendUser);
router.patch("/:id/activate",    protect, adminOnly, activateUser);
router.delete("/:id",            protect, adminOnly, deleteUser);

module.exports = router;