const { check, validationResult } = require("express-validator");
const User = require("../models/user");
const bcrypt = require("bcryptjs");

exports.getLogin = (req, res, next) => {
  res.json({
    success: true,
    pageTitle: "Login",
    currentPage: "login",
    isLoggedIn: false,
  });
};

exports.getSignup = (req, res, next) => {
  res.json({
    success: true,
    pageTitle: "Signup",
    currentPage: "signup",
    isLoggedIn: false,
  });
};

exports.checkSession = (req, res, next) => {
  if (req.isLoggedIn && req.session.user) {
    res.json({
      success: true,
      isLoggedIn: true,
      user: {
        _id: req.session.user._id,
        firstName: req.session.user.firstName,
        lastName: req.session.user.lastName,
        email: req.session.user.email,
        userType: req.session.user.userType,
      },
    });
  } else {
    res.json({
      success: true,
      isLoggedIn: false,
      user: null,
    });
  }
};

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

exports.postSignup = [
  check("name")
  .trim()
  .isLength({min: 2})
  .withMessage("Name should be atleast 2 characters long"),

  check("email")
  .isEmail()
  .withMessage("Please enter a valid email"),

  check("password")
  .isLength({min: 6})
  .withMessage("Password should be atleast 6 characters long")
  .trim(),
  
  async (req, res, next) => {
    const {name, email, password} = req.body;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const firstMsg = errors.array()[0].msg;
      return res.status(422).json({
        success: false,
        error: firstMsg,
        message: firstMsg,
        errors: errors.array().map(err => err.msg),
      });
    }

    try {
      const normalizedEmail = normalizeUserEmail(email);
      const rawLower = email ? email.trim().toLowerCase() : '';

      // Check if user already exists (check both raw and normalized)
      const existingUser = await User.findOne({
        $or: [
          { email: rawLower },
          { email: normalizedEmail }
        ]
      });

      if (existingUser) {
        return res.status(422).json({
          success: false,
          error: "User with this email already exists",
          message: "User with this email already exists. Please log in instead.",
          errors: ["User with this email already exists"],
        });
      }

      const hashedPassword = await bcrypt.hash(password, 12);
      const user = new User({
        firstName: name.split(' ')[0] || name,
        lastName: name.split(' ').slice(1).join(' ') || '',
        email: normalizedEmail,
        password: hashedPassword,
        userType: 'guest'
      });
      
      await user.save();

      // Auto-login after signup
      req.session.isLoggedIn = true;
      req.session.user = user;
      await req.session.save();

      res.status(201).json({
        success: true,
        message: "User created successfully",
        user: {
          _id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
        },
      });
    } catch (err) {
      console.error('Signup error:', err);
      const errMsg = err.message || "Signup failed. Please try again.";
      return res.status(422).json({
        success: false,
        error: errMsg,
        message: errMsg,
        errors: [errMsg],
      });
    }
  }
]

exports.postLogin = async (req, res, next) => {
  const {email, password} = req.body;
  if (!email || !password) {
    return res.status(422).json({
      success: false,
      error: "Email and password are required",
      message: "Email and password are required",
      errors: ["Email and password are required"],
    });
  }

  const normalizedEmail = normalizeUserEmail(email);
  const rawLower = email.trim().toLowerCase();

  const user = await User.findOne({
    $or: [
      { email: rawLower },
      { email: normalizedEmail }
    ]
  });

  if (!user) {
    return res.status(422).json({
      success: false,
      error: "User does not exist with this email",
      message: "User does not exist with this email. Please check your email or sign up.",
      errors: ["User does not exist with this email"],
      oldInput: {email},
    });
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(422).json({
      success: false,
      error: "Invalid password",
      message: "Invalid password. Please check your credentials.",
      errors: ["Invalid password"],
      oldInput: {email},
    });
  }

  req.session.isLoggedIn = true;
  req.session.user = user;
  await req.session.save();

  res.json({
    success: true,
    message: "Login successful",
    user: {
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      userType: user.userType,
    },
  });
}

exports.postLogout = (req, res, next) => {
  req.session.destroy(() => {
    res.json({
      success: true,
      message: "Logout successful",
    });
  })
}
