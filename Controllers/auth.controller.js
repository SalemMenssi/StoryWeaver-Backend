const jwt  = require("jsonwebtoken");
const User = require("../Model/User.modal");
const { sendTokens, generateAccessToken } = require("../Utils/generateTokens");
const { successResponse, errorResponse }  = require("../Utils/apiResponse");
const { sendOTPEmail } = require("../Utils/email.utils");
const { OAuth2Client } = require("google-auth-library");
const axios = require("axios");

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const githubLogin = async (req, res) => {
  try {
    const { code } = req.body;
    
    // 1. Exchange code for access token
    const tokenRes = await axios.post("https://github.com/login/oauth/access_token", {
      client_id:     process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code
    }, {
      headers: { Accept: "application/json" }
    });

    const accessToken = tokenRes.data.access_token;
    if (!accessToken) return errorResponse(res, "GitHub token exchange failed.", 401);

    // 2. Fetch user profile
    const userRes = await axios.get("https://api.github.com/user", {
      headers: { Authorization: `token ${accessToken}` }
    });
    const { login, email, avatar_url, id: githubId } = userRes.data;

    // Use login as name if name is missing
    const name = userRes.data.name || login;

    // GitHub doesn't always return the email if it's private. 
    // We might need to fetch emails specifically if email is null.
    let userEmail = email;
    if (!userEmail) {
      const emailsRes = await axios.get("https://api.github.com/user/emails", {
        headers: { Authorization: `token ${accessToken}` }
      });
      userEmail = emailsRes.data.find(e => e.primary && e.verified)?.email || emailsRes.data[0].email;
    }

    let user = await User.findOne({ email: userEmail });

    if (user) {
      if (!user.githubId) {
        user.githubId = githubId;
        user.avatar = user.avatar || avatar_url;
        await user.save({ validateBeforeSave: false });
      }
    } else {
      user = await User.create({
        name,
        email: userEmail,
        githubId,
        avatar: avatar_url,
        password: Math.random().toString(36).slice(-10),
        status: "Active"
      });
    }

    user.lastActivity = Date.now();
    await user.save({ validateBeforeSave: false });

    return sendTokens(res, user, 200, "GitHub login successful!");
  } catch (err) {
    return errorResponse(res, "GitHub authentication failed: " + err.message, 401);
  }
};

const googleLogin = async (req, res) => {
  try {
    const { idToken } = req.body;
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const { email, name, picture, sub: googleId } = ticket.getPayload();

    let user = await User.findOne({ email });

    if (user) {
      if (!user.googleId) {
        user.googleId = googleId;
        user.avatar = user.avatar || picture;
        await user.save({ validateBeforeSave: false });
      }
    } else {
      // Create new user if doesn't exist
      user = await User.create({
        name,
        email,
        googleId,
        avatar: picture,
        password: Math.random().toString(36).slice(-10), // Random password for social accounts
        status: "Active"
      });
    }

    user.lastActivity = Date.now();
    await user.save({ validateBeforeSave: false });

    return sendTokens(res, user, 200, "Google login successful!");
  } catch (err) {
    return errorResponse(res, "Google authentication failed: " + err.message, 401);
  }
};



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

module.exports = { register, login, refresh, logout, getMe, forgotPassword, verifyOTP, resetPassword, googleLogin, githubLogin };