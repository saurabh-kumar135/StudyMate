const nodemailer = require('nodemailer');
require('dotenv').config();

let cachedTransporter = null;

// Create reusable pooled transporter using Gmail OAuth2 (priority) or Gmail App Password (fallback)
const getTransporter = () => {
  if (cachedTransporter) {
    return cachedTransporter;
  }

  const emailUser = process.env.EMAIL_USER || 'saurabhrajput.25072005@gmail.com';
  const poolOptions = {
    service: 'gmail',
    pool: true,
    maxConnections: 3,
    maxMessages: 100,
    connectionTimeout: 8000,
    greetingTimeout: 8000,
    socketTimeout: 10000
  };

  if (process.env.GMAIL_REFRESH_TOKEN && process.env.GMAIL_CLIENT_ID && process.env.GMAIL_CLIENT_SECRET) {
    cachedTransporter = nodemailer.createTransport({
      ...poolOptions,
      auth: {
        type: 'OAuth2',
        user: emailUser,
        clientId: process.env.GMAIL_CLIENT_ID,
        clientSecret: process.env.GMAIL_CLIENT_SECRET,
        refreshToken: process.env.GMAIL_REFRESH_TOKEN
      }
    });
  } else {
    cachedTransporter = nodemailer.createTransport({
      ...poolOptions,
      auth: {
        user: emailUser,
        pass: (process.env.EMAIL_PASS || 'sheleprpeihikkwl').replace(/\s+/g, '')
      }
    });
  }

  return cachedTransporter;
};

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const sendOTPEmail = async (email, otp, firstName) => {
  const senderEmail = process.env.EMAIL_USER || 'saurabhrajput.25072005@gmail.com';
  const transporter = getTransporter();

  const mailOptions = {
    from: `"StudyMate" <${senderEmail}>`,
    to: email,
    subject: 'Complete your StudyMate registration - Verification Code',
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify Your Email - StudyMate</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1e293b; margin: 0; padding: 24px; background-color: #f8fafc;">
        <div style="max-width: 540px; margin: 0 auto; background: #ffffff; padding: 36px 32px; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.08), 0 2px 4px -1px rgba(0, 0, 0, 0.04); border: 1px solid #e2e8f0;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #2563eb 0%, #06b6d4 100%); color: white; padding: 28px; text-align: center; border-radius: 12px; margin-bottom: 28px;">
            <div style="font-size: 32px; margin-bottom: 6px;">🎓</div>
            <h1 style="margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">Welcome to StudyMate!</h1>
            <p style="margin: 6px 0 0 0; font-size: 14px; opacity: 0.9; font-weight: 500;">AI-Powered Personalized Learning Platform</p>
          </div>
          
          <!-- Content -->
          <p style="font-size: 16px; margin-bottom: 12px;">Hi <strong>${firstName || 'there'}</strong>,</p>
          <p style="font-size: 15px; color: #475569; margin-bottom: 24px;">Thank you for registering for StudyMate. Please use the 6-digit verification code below to verify your email address and activate your account:</p>
          
          <!-- OTP Box -->
          <div style="text-align: center; margin: 28px 0; padding: 24px 20px; background: #f0f9ff; border-radius: 12px; border: 2px dashed #38bdf8;">
            <div style="font-size: 38px; font-weight: 800; letter-spacing: 10px; color: #0284c7; font-family: 'Courier New', Courier, monospace;">${otp}</div>
            <p style="margin: 10px 0 0 0; font-size: 13px; color: #64748b; font-weight: 500;">⏱️ Valid for 10 minutes</p>
          </div>
          
          <!-- Warning -->
          <p style="font-size: 13px; color: #94a3b8; line-height: 1.5;">If you did not initiate this request or didn't sign up for StudyMate, please disregard this email. Your email address remains safe.</p>
          
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 28px 0 20px 0;" />
          
          <!-- Footer -->
          <div style="text-align: center; color: #94a3b8; font-size: 12px;">
            <p style="margin: 0;">© ${new Date().getFullYear()} StudyMate AI Platform. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ StudyMate OTP email sent successfully to ${email} (MessageId: ${info.messageId})`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending StudyMate OTP email:', error.message);
    return { success: false, error: error.message };
  }
};

const sendPasswordResetEmail = async (email, resetToken, firstName) => {
  const senderEmail = process.env.EMAIL_USER || 'saurabhrajput.25072005@gmail.com';
  const frontendUrl = process.env.FRONTEND_URL || 'https://study-mate1.vercel.app';
  const resetLink = `${frontendUrl}/reset-password/${resetToken}`;
  const transporter = getTransporter();
  
  const mailOptions = {
    from: `"StudyMate" <${senderEmail}>`,
    to: email,
    subject: 'Reset your StudyMate password 🔑',
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Your Password - StudyMate</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1e293b; margin: 0; padding: 24px; background-color: #f8fafc;">
        <div style="max-width: 540px; margin: 0 auto; background: #ffffff; padding: 36px 32px; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.08), 0 2px 4px -1px rgba(0, 0, 0, 0.04); border: 1px solid #e2e8f0;">
          <div style="background: linear-gradient(135deg, #2563eb 0%, #06b6d4 100%); color: white; padding: 28px; text-align: center; border-radius: 12px; margin-bottom: 24px;">
            <h1 style="margin: 0; font-size: 24px; font-weight: 700;">Password Reset 🔑</h1>
            <p style="margin: 4px 0 0 0; font-size: 14px; opacity: 0.9;">StudyMate Account Security</p>
          </div>
          
          <p style="font-size: 16px;">Hi <strong>${firstName || 'there'}</strong>,</p>
          <p style="font-size: 15px; color: #475569;">We received a request to reset the password for your StudyMate account.</p>
          
          <div style="text-align: center; margin: 28px 0;">
            <a href="${resetLink}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #2563eb 0%, #06b6d4 100%); color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px; box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.3);">Reset My Password</a>
          </div>
          
          <p style="font-size: 13px; color: #64748b; margin-top: 20px;">Or copy and paste this link into your browser:</p>
          <div style="background: #f1f5f9; padding: 12px; border-radius: 8px; word-break: break-all; font-size: 12px; color: #475569;">
            <a href="${resetLink}" style="color: #2563eb; text-decoration: none;">${resetLink}</a>
          </div>
          
          <p style="font-size: 13px; color: #e11d48; margin-top: 20px;"><strong>⏰ This link expires in 1 hour.</strong></p>
          <p style="font-size: 13px; color: #94a3b8;">If you didn't request this password reset, you can safely ignore this email.</p>
          
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
          
          <div style="text-align: center; color: #94a3b8; font-size: 12px;">
            <p style="margin: 0;">© ${new Date().getFullYear()} StudyMate AI Platform. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Password reset email sent successfully to ${email} (MessageId: ${info.messageId})`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending password reset email:', error.message);
    return { success: false, error: error.message };
  }
};

module.exports = {
  generateOTP,
  sendOTPEmail,
  sendPasswordResetEmail
};
