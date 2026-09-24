const nodemailer = require('nodemailer');
require('dotenv').config();

const cleanEnv = (val, fallback = '') => {
  if (!val || typeof val !== 'string') return fallback;
  return val.trim();
};

const createTransporter = () => {
  const user = cleanEnv(process.env.EMAIL_USER || process.env.GMAIL_USER, 'saurabhrajput.25072005@gmail.com');
  const pass = cleanEnv(process.env.EMAIL_PASS || process.env.GMAIL_APP_PASSWORD, 'sheleprpeihikkwl').replace(/\s+/g, '');

  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
    connectionTimeout: 8000,
    greetingTimeout: 8000,
    socketTimeout: 8000
  });
};

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const sendOTPEmail = async (email, otp, firstName) => {
  const senderEmail = cleanEnv(process.env.EMAIL_USER || process.env.GMAIL_USER, 'saurabhrajput.25072005@gmail.com');
  const greetingName = firstName || 'there';

  const htmlContent = '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Verify Your Email</title></head>' +
    '<body style="font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1e293b; margin: 0; padding: 24px; background-color: #f8fafc;">' +
    '<div style="max-width: 540px; margin: 0 auto; background: #ffffff; padding: 36px 32px; border-radius: 16px; border: 1px solid #e2e8f0;">' +
    '<div style="background: linear-gradient(135deg, #2563eb 0%, #06b6d4 100%); color: white; padding: 28px; text-align: center; border-radius: 12px; margin-bottom: 28px;">' +
    '<div style="font-size: 32px; margin-bottom: 6px;">🎓</div>' +
    '<h1 style="margin: 0; font-size: 24px; font-weight: 800;">Welcome to StudyMate!</h1>' +
    '<p style="margin: 6px 0 0 0; font-size: 14px; opacity: 0.9;">AI-Powered Personalized Learning Platform</p>' +
    '</div>' +
    '<p style="font-size: 16px; margin-bottom: 12px;">Hi <strong>' + greetingName + '</strong>,</p>' +
    '<p style="font-size: 15px; color: #475569; margin-bottom: 24px;">Thank you for registering for StudyMate. Please use the 6-digit verification code below to verify your email address and activate your account:</p>' +
    '<div style="text-align: center; margin: 28px 0; padding: 24px 20px; background: #f0f9ff; border-radius: 12px; border: 2px dashed #38bdf8;">' +
    '<div style="font-size: 38px; font-weight: 800; letter-spacing: 10px; color: #0284c7; font-family: monospace;">' + otp + '</div>' +
    '<p style="margin: 10px 0 0 0; font-size: 13px; color: #64748b; font-weight: 500;">⏱️ Valid for 10 minutes</p>' +
    '</div>' +
    '<p style="font-size: 13px; color: #94a3b8;">If you did not initiate this request, please disregard this email.</p>' +
    '<hr style="border: none; border-top: 1px solid #e2e8f0; margin: 28px 0 20px 0;" />' +
    '<div style="text-align: center; color: #94a3b8; font-size: 12px;">' +
    '<p style="margin: 0;">© 2026 StudyMate AI Platform. All rights reserved.</p>' +
    '</div></div></body></html>';

  const mailOptions = {
    from: '"StudyMate" <' + senderEmail + '>',
    to: email,
    subject: 'Verify Your Email - StudyMate Registration',
    html: htmlContent
  };

  try {
    const transporter = createTransporter();
    const info = await Promise.race([
      transporter.sendMail(mailOptions),
      new Promise((_, reject) => setTimeout(() => reject(new Error('SMTP timeout')), 8000))
    ]);
    console.log('✅ StudyMate OTP email sent successfully to ' + email + ' (MessageId: ' + info.messageId + ')');
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error('❌ Error sending OTP email:', err.message);
    return { success: false, error: err.message };
  }
};

const sendPasswordResetEmail = async (email, resetToken, firstName) => {
  const senderEmail = cleanEnv(process.env.EMAIL_USER || process.env.GMAIL_USER, 'saurabhrajput.25072005@gmail.com');
  const frontendUrl = cleanEnv(process.env.FRONTEND_URL, 'https://study-mate1.vercel.app');
  const resetLink = frontendUrl + '/reset-password/' + resetToken;
  const greetingName = firstName || 'there';

  const htmlContent = '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Reset Password</title></head>' +
    '<body style="font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1e293b; margin: 0; padding: 24px; background-color: #f8fafc;">' +
    '<div style="max-width: 540px; margin: 0 auto; background: #ffffff; padding: 36px 32px; border-radius: 16px; border: 1px solid #e2e8f0;">' +
    '<h1 style="font-size: 24px; font-weight: 700;">Password Reset 🔑</h1>' +
    '<p>Hi <strong>' + greetingName + '</strong>,</p>' +
    '<p>Click the link below to reset your StudyMate password:</p>' +
    '<p><a href="' + resetLink + '" style="display: inline-block; padding: 12px 24px; background: #2563eb; color: #ffffff; text-decoration: none; border-radius: 8px;">Reset Password</a></p>' +
    '<p style="font-size: 12px; color: #94a3b8;">This link expires in 1 hour.</p>' +
    '</div></body></html>';

  const mailOptions = {
    from: '"StudyMate" <' + senderEmail + '>',
    to: email,
    subject: 'Reset your StudyMate password 🔑',
    html: htmlContent
  };

  try {
    const transporter = createTransporter();
    const info = await Promise.race([
      transporter.sendMail(mailOptions),
      new Promise((_, reject) => setTimeout(() => reject(new Error('SMTP timeout')), 8000))
    ]);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

module.exports = {
  generateOTP,
  sendOTPEmail,
  sendPasswordResetEmail
};
