const User = require('../models/user');
const bcrypt = require('bcryptjs');
const { generateOTP, sendPhoneOTP } = require('../utils/smsService');
const { 
  storePendingVerification, 
  getPendingVerification, 
  removePendingVerification 
} = require('../utils/otpStorage');

exports.sendPhoneOTP = async (req, res) => {
  try {
    const { phoneNumber, firstName, lastName, password, userType } = req.body;

    if (!phoneNumber || phoneNumber.length < 10) {
      return res.status(400).json({
        success: false,
        errors: ['Please enter a valid phone number']
      });
    }

    const existingUser = await User.findOne({ phoneNumber });
    if (existingUser && existingUser.phoneVerified) {
      return res.status(400).json({
        success: false,
        errors: ['Phone number already registered']
      });
    }

    const otp = generateOTP();
    const otpExpires = Date.now() + 5 * 60 * 1000; 

    const hashedPassword = await bcrypt.hash(password, 10);

    storePendingVerification(phoneNumber, {
      firstName,
      lastName,
      password: hashedPassword,
      userType,
      authMethod: 'phone'
    }, otp, otpExpires);

    const smsResult = await sendPhoneOTP(phoneNumber, otp, firstName);

    if (!smsResult.success) {
      
      removePendingVerification(phoneNumber);
      return res.status(500).json({
        success: false,
        errors: ['Failed to send verification code. Please try again.']
      });
    }

    res.json({
      success: true,
      message: 'Verification code sent to your phone!',
      consoleMode: smsResult.consoleMode || false
    });

  } catch (error) {
    console.error('Send phone OTP error:', error);
    res.status(500).json({
      success: false,
      errors: ['An error occurred. Please try again.']
    });
  }
};

exports.verifyPhoneOTP = async (req, res) => {
  try {
    const { phoneNumber, otp } = req.body;

    const pendingData = getPendingVerification(phoneNumber);

    if (!pendingData) {
      return res.status(400).json({
        success: false,
        errors: ['Verification session expired. Please sign up again.']
      });
    }

    if (Date.now() > pendingData.expiresAt) {
      removePendingVerification(phoneNumber);
      return res.status(400).json({
        success: false,
        errors: ['Verification code expired. Please request a new one.']
      });
    }

    if (pendingData.otp !== otp) {
      return res.status(400).json({
        success: false,
        errors: ['Invalid verification code']
      });
    }

    const existingUser = await User.findOne({ phoneNumber });
    if (existingUser && existingUser.phoneVerified) {
      removePendingVerification(phoneNumber);
      return res.status(400).json({
        success: false,
        errors: ['Phone number already verified. Please login.']
      });
    }

    const newUser = new User({
      firstName: pendingData.firstName,
      lastName: pendingData.lastName,
      phoneNumber: phoneNumber,
      password: pendingData.password, 
      userType: pendingData.userType,
      phoneVerified: true, 
      authProvider: 'phone',
      authMethod: 'phone'
    });
    await newUser.save();

    removePendingVerification(phoneNumber);

    req.session.isLoggedIn = true;
    req.session.user = newUser;

    res.json({
      success: true,
      message: 'Phone verified successfully!',
      user: {
        id: newUser._id,
        phoneNumber: newUser.phoneNumber,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        userType: newUser.userType
      }
    });

  } catch (error) {
    console.error('Verify phone OTP error:', error);
    res.status(500).json({
      success: false,
      errors: ['An error occurred. Please try again.']
    });
  }
};

exports.resendPhoneOTP = async (req, res) => {
  try {
    const { phoneNumber } = req.body;

    const pendingData = getPendingVerification(phoneNumber);

    if (!pendingData) {
      return res.status(400).json({
        success: false,
        errors: ['Verification session expired. Please sign up again.']
      });
    }

    const otp = generateOTP();
    const otpExpires = Date.now() + 5 * 60 * 1000; 

    storePendingVerification(phoneNumber, {
      firstName: pendingData.firstName,
      lastName: pendingData.lastName,
      password: pendingData.password,
      userType: pendingData.userType,
      authMethod: 'phone'
    }, otp, otpExpires);

    const smsResult = await sendPhoneOTP(phoneNumber, otp, pendingData.firstName);

    if (!smsResult.success) {
      return res.status(500).json({
        success: false,
        errors: ['Failed to send verification code. Please try again.']
      });
    }

    res.json({
      success: true,
      message: 'New verification code sent to your phone!',
      consoleMode: smsResult.consoleMode || false
    });

  } catch (error) {
    console.error('Resend phone OTP error:', error);
    res.status(500).json({
      success: false,
      errors: ['An error occurred. Please try again.']
    });
  }
};
