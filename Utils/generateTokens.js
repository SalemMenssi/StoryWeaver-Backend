const jwt = require("jsonwebtoken");

const generateAccessToken = (userId, role) =>
  jwt.sign({ id: userId, role }, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES || "15m",
  });

const generateRefreshToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES || "7d",
  });

const sendTokens = (res, user, statusCode = 200, message = "Success") => {
  const accessToken  = generateAccessToken(user._id, user.role);
  const refreshToken = generateRefreshToken(user._id);

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === "production",
    sameSite: "Strict",
    maxAge:   7 * 24 * 60 * 60 * 1000,
  });

  const userObj = user.toObject ? user.toObject() : { ...user };
  delete userObj.password;
  delete userObj.refreshToken;

  return res.status(statusCode).json({ success: true, message, accessToken, user: userObj });
};

module.exports = { generateAccessToken, generateRefreshToken, sendTokens };