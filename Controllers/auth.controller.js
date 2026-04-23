const jwt  = require("jsonwebtoken");
const User = require("../Model/User.modal");
const { sendTokens, generateAccessToken } = require("../Utils/generateTokens");
const { successResponse, errorResponse }  = require("../Utils/apiResponse");
const { sendOTPEmail } = require("../Utils/email.utils");



const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (await User.findOne({ email }))
      return errorResponse(res, "Email already in use.", 409);

    const user = await User.create({ name, email, password });
    return sendTokens(res, user, 201, "Account created successfully!");
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select("+password");
    if (!user || !(await user.comparePassword(password)))
      return errorResponse(res, "Invalid email or password.", 401);

    if (user.status === "Suspended")
      return errorResponse(res, "Account suspended. Contact support.", 403);

    user.lastActivity = Date.now();
    await user.save({ validateBeforeSave: false });
    return sendTokens(res, user, 200, "Login successful!");
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

const refresh = async (req, res) => {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) return errorResponse(res, "No refresh token.", 401);

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    } catch {
      res.clearCookie("refreshToken");
      return errorResponse(res, "Refresh token expired. Login again.", 401);
    }

    const user = await User.findById(decoded.id);
    if (!user || user.status === "Suspended")
      return errorResponse(res, "User not found.", 401);

    const accessToken = generateAccessToken(user._id, user.role);
    return successResponse(res, "Token refreshed.", { accessToken });
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

const logout = (req, res) => {
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure:   process.env.NODE_ENV === "production",
    sameSite: "Strict",
  });
  return successResponse(res, "Logged out successfully.");
};

const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    return successResponse(res, "User fetched.", { user });
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return errorResponse(res, "User not found.", 404);

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otpCode = otp;
    user.otpExpires = Date.now() + 10 * 60 * 1000;
    await user.save({ validateBeforeSave: false });

    await sendOTPEmail(email, otp);
    return successResponse(res, "Verification code sent to your email.");
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ 
      email, 
      otpCode: otp, 
      otpExpires: { $gt: Date.now() } 
    });

    if (!user) return errorResponse(res, "Invalid or expired code.", 400);

    return successResponse(res, "Code verified.");
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

const resetPassword = async (req, res) => {
  try {
    const { email, otp, password } = req.body;
    const user = await User.findOne({ 
      email, 
      otpCode: otp, 
      otpExpires: { $gt: Date.now() } 
    });

    if (!user) return errorResponse(res, "Invalid or expired session.", 400);

    user.password = password;
    user.otpCode = null;
    user.otpExpires = null;
    await user.save();

    return successResponse(res, "Password reset successfully.");
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

module.exports = { register, login, refresh, logout, getMe, forgotPassword, verifyOTP, resetPassword };