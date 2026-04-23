const nodemailer = require("nodemailer");

/**
 * Configure the transporter for sending emails.
 */
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/**
 * Sends a 6-digit OTP code to the user's email.
 */
const sendOTPEmail = async (to, otp) => {
  const mailOptions = {
    from: `"Story Weaver" <${process.env.SMTP_USER}>`,
    to,
    subject: "Your Password Reset Code - Story Weaver",
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #0d0d12; color: #f1f5f9;">
        <h2 style="color: #6366f1; text-align: center;">Story Weaver</h2>
        <p style="font-size: 16px; line-height: 1.6;">Hello,</p>
        <p style="font-size: 16px; line-height: 1.6;">You've requested to reset your password. Use the mystical key below to proceed with your narrative journey:</p>
        <div style="text-align: center; margin: 30px 0;">
          <span style="font-size: 32px; font-weight: 800; letter-spacing: 5px; background: #1e1e2e; padding: 10px 20px; border-radius: 8px; border: 1px solid #6366f1; color: #818cf8;">
            ${otp}
          </span>
        </div>
        <p style="font-size: 14px; color: #94a3b8; text-align: center;">This code will expire in 10 minutes for your security.</p>
        <hr style="border: 0; border-top: 1px solid #1e1e2e; margin: 20px 0;" />
        <p style="font-size: 12px; color: #4a4a6a; text-align: center;">If you didn't request this, you can safely ignore this email.</p>
      </div>
    `,
  };

  return transporter.sendMail(mailOptions);
};

module.exports = { sendOTPEmail };
