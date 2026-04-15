const jwt  = require("jsonwebtoken");

const { errorResponse } = require("../Utils/apiResponse");
const UserModal = require("../Model/User.modal");

const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer "))
      return errorResponse(res, "Access denied. No token provided.", 401);

    const token = authHeader.split(" ")[1];
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    } catch (err) {
      if (err.name === "TokenExpiredError")
        return errorResponse(res, "Token expired. Please refresh.", 401);
      return errorResponse(res, "Invalid token.", 401);
    }

    const user = await UserModal.findById(decoded.id).select("-password");
    if (!user) return errorResponse(res, "User no longer exists.", 401);
    if (user.status === "Suspended")
      return errorResponse(res, "Account suspended.", 403);

    await UserModal.findByIdAndUpdate(decoded.id, { lastActivity: Date.now() });
    req.user = user;
    next();
  } catch (err) {
    return errorResponse(res, "Authentication error.", 500);
  }
};

const adminOnly = (req, res, next) => {
  if (req.user?.role === "admin") return next();
  return errorResponse(res, "Admins only.", 403);
};

const moderatorOrAdmin = (req, res, next) => {
  if (["admin", "moderator"].includes(req.user?.role)) return next();
  return errorResponse(res, "Insufficient permissions.", 403);
};

module.exports = { protect, adminOnly, moderatorOrAdmin };