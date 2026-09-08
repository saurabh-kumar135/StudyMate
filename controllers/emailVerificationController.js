const User = require('../models/user');
const bcrypt = require('bcryptjs');
const { generateOTP, sendOTPEmail } = require('../utils/otpService');
const { 
  storePendingVerification, 
  getPendingVerification, 
  removePendingVerification 
} = require('../utils/otpStorage');

function normalizeUserEmail(rawEmail) {
  if (!rawEmail || typeof rawEmail !== 'string') return '';
  const trimmed = rawEmail.trim().toLowerCase();
  const parts = trimmed.split('@');
  if (parts.length === 2 && (parts[1] === 'gmail.com' || parts[1] === 'googlemail.com')) {
    const cleanUser = parts[0].split('+')[0].replace(/\./g, '');
    return `${cleanUser}@gmail.com`;
  }
  return trimmed;
}

exports.sendOTP = async (req, res) => {
  try {
    const { email, firstName, lastName, password, userType } = req.body;

    console.log('📧 Signup attempt with OTP for:', email);

    // Validate required fields
    if (!email || !firstName || !password) {
      console.log('❌ Missing required fields for OTP');
      return res.status(400).json({
        success: false,
        error: 'All fields are required',
        errors: ['All fields are required']
      });
    }

    const normalizedEmail = normalizeUserEmail(email);
    const rawLower = email ? email.trim().toLowerCase() : '';

    const existingUser = await User.findOne({
      $or: [
        { email: rawLower },
        { email: normalizedEmail }
      ]
    });

    if (existingUser && existingUser.emailVerified) {
      console.log('❌ Email already registered and verified:', email);
      return res.status(400).json({
        success: false,
        error: 'Email already registered. Please log in.',
        errors: ['Email already registered. Please log in.']
      });
    }

    const otp = generateOTP();
    const otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes validity

    console.log('🔐 Hashing password for pending registration...');
    const hashedPassword = await bcrypt.hash(password, 12);

    console.log('💾 Storing pending verification for:', normalizedEmail);
    storePendingVerification(normalizedEmail, {
      firstName: firstName.trim(),
      lastName: (lastName || '').trim(),
      password: hashedPassword,
      userType: userType || 'guest',
      rawEmail: email
    }, otp, otpExpires);

    console.log('📨 Dispatching OTP email to:', email);
    const emailResult = await sendOTPEmail(email, otp, firstName);

    if (!emailResult.success) {
      console.error('❌ Email dispatch failed:', emailResult.error);
      removePendingVerification(normalizedEmail);
      return res.status(500).json({
        success: false,
        error: `Failed to send verification email: ${emailResult.error || 'Please try again later'}`,
        errors: [`Failed to send verification email: ${emailResult.error || 'Please try again later'}`]
      });
    }

    console.log('✅ OTP email sent successfully to:', email);
    res.json({
      success: true,
      message: 'Verification code sent to your email! Please check your inbox.'
    });

  } catch (error) {
    console.error('❌ Send OTP error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'An error occurred while sending verification code.',
      errors: [error.message || 'An error occurred while sending verification code.']
    });
  }
};

exports.verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        error: 'Email and verification code are required',
        errors: ['Email and verification code are required']
      });
    }

    const normalizedEmail = normalizeUserEmail(email);
    const cleanOtp = String(otp).trim();

    // Check pending verification by normalized email or raw email
    const pendingData = getPendingVerification(normalizedEmail) || getPendingVerification(email);

    if (!pendingData) {
      return res.status(400).json({
        success: false,
        error: 'Verification session expired. Please sign up again.',
        errors: ['Verification session expired. Please sign up again.']
      });
    }

    if (Date.now() > pendingData.expiresAt) {
      removePendingVerification(normalizedEmail);
      removePendingVerification(email);
      return res.status(400).json({
        success: false,
        error: 'Verification code expired. Please request a new one.',
        errors: ['Verification code expired. Please request a new one.']
      });
    }

    if (pendingData.otp !== cleanOtp) {
      return res.status(400).json({
        success: false,
        error: 'Invalid verification code. Please check and try again.',
        errors: ['Invalid verification code. Please check and try again.']
      });
    }

    // Check if user already exists
    let user = await User.findOne({
      $or: [
        { email: pendingData.rawEmail?.toLowerCase() },
        { email: normalizedEmail }
      ]
    });

    if (user) {
      user.firstName = pendingData.firstName;
      user.lastName = pendingData.lastName;
      user.password = pendingData.password;
      user.emailVerified = true;
      user.emailVerificationOTP = undefined;
      user.emailVerificationExpires = undefined;
      await user.save();
    } else {
      user = new User({
        firstName: pendingData.firstName,
        lastName: pendingData.lastName,
        email: normalizedEmail,
        password: pendingData.password, 
        userType: pendingData.userType || 'guest',
        emailVerified: true 
      });
      await user.save();
    }

    removePendingVerification(normalizedEmail);
    removePendingVerification(email);

    // Establish session
    req.session.isLoggedIn = true;
    const sessionUser = user.toObject ? user.toObject() : { ...user };
    delete sessionUser.password;
    req.session.user = sessionUser;
    await req.session.save();

    console.log(`✅ User registered and verified successfully: ${user.email} (ID: ${user._id})`);

    res.json({
      success: true,
      message: 'Email verified successfully! Welcome to StudyMate.',
      user: {
        id: user._id,
        _id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        userType: user.userType
      }
    });

  } catch (error) {
    console.error('❌ Verify OTP error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'An error occurred during verification.',
      errors: [error.message || 'An error occurred during verification.']
    });
  }
};

exports.resendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required',
        errors: ['Email is required']
      });
    }

    const normalizedEmail = normalizeUserEmail(email);
    const pendingData = getPendingVerification(normalizedEmail) || getPendingVerification(email);

    if (!pendingData) {
      return res.status(400).json({
        success: false,
        error: 'Verification session expired. Please start registration again.',
        errors: ['Verification session expired. Please start registration again.']
      });
    }

    const otp = generateOTP();
    const otpExpires = Date.now() + 10 * 60 * 1000; 

    storePendingVerification(normalizedEmail, {
      ...pendingData
    }, otp, otpExpires);

    const recipient = pendingData.rawEmail || email;
    const emailResult = await sendOTPEmail(recipient, otp, pendingData.firstName);

    if (!emailResult.success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to send verification email. Please try again.',
        errors: ['Failed to send verification email. Please try again.']
      });
    }

    console.log(`✅ Resent OTP successfully to ${recipient}`);
    res.json({
      success: true,
      message: 'A new 6-digit verification code has been sent to your email!'
    });

  } catch (error) {
    console.error('❌ Resend OTP error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'An error occurred while resending code.',
      errors: [error.message || 'An error occurred while resending code.']
    });
  }
};
