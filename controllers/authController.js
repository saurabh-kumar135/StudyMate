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

exports.postSignup = [
  check("name")
  .trim()
  .isLength({min: 2})
  .withMessage("Name should be atleast 2 characters long"),

  check("email")
  .isEmail()
  .withMessage("Please enter a valid email")
  .normalizeEmail(),

  check("password")
  .isLength({min: 6})
  .withMessage("Password should be atleast 6 characters long")
  .trim(),
  
  async (req, res, next) => {
    const {name, email, password} = req.body;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({
        success: false,
        error: errors.array()[0].msg,
        errors: errors.array().map(err => err.msg),
      });
    }

    try {
      // Check if user already exists
      const existingUser = await User.findOne({email});
      if (existingUser) {
        return res.status(422).json({
          success: false,
          error: "User with this email already exists",
        });
      }

      const hashedPassword = await bcrypt.hash(password, 12);
      const user = new User({
        firstName: name.split(' ')[0] || name,
        lastName: name.split(' ').slice(1).join(' ') || '',
        email,
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
      return res.status(422).json({
        success: false,
        error: err.message || "Signup failed. Please try again.",
      });
    }
  }
]

exports.postLogin = async (req, res, next) => {
  const {email, password} = req.body;
  const user = await User.findOne({email});
  if (!user) {
    return res.status(422).json({
      success: false,
      errors: ["User does not exist"],
      oldInput: {email},
    });
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(422).json({
      success: false,
      errors: ["Invalid Password"],
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
