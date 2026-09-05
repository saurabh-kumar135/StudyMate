const path = require('path');
require('dotenv').config();

const express = require('express');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);
const { default: mongoose } = require('mongoose');
const multer = require('multer');
const cors = require('cors');
const helmet = require('helmet');
const DB_PATH = process.env.MONGODB_URI || "mongodb://localhost:27017/studymate";

const storeRouter = require("./routes/storeRouter")
const hostRouter = require("./routes/hostRouter")
const authRouter = require("./routes/authRouter")
const passwordResetRouter = require("./routes/passwordResetRoutes")
const emailVerificationRouter = require("./routes/emailVerificationRoutes") 
const aiRouter = require("./routes/aiRoutes") 
const materialRouter = require("./routes/materialRoutes") 
const statsRouter = require("./routes/statsRoutes")
const notebookRouter = require("./routes/notebookRoutes")
const agentRouter = require("./routes/agentRoutes")
const rootDir = require("./utils/pathUtil");
const errorsController = require("./controllers/errors");
const { apiLimiter } = require('./middleware/rateLimiter');

const app = express();

app.set('trust proxy', 1);


app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174', 
  'http://localhost:5175',
  'https://havento.vercel.app',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) {
      console.log('✅ CORS: Allowing request with no origin');
      return callback(null, true);
    }
    
    // Allow any vercel.app domain
    if (origin && origin.includes('.vercel.app')) {
      console.log('✅ CORS: Allowing Vercel domain:', origin);
      return callback(null, true);
    }
    
    // Allow any render.com domain (for testing backend directly)
    if (origin && origin.includes('.onrender.com')) {
      console.log('✅ CORS: Allowing Render domain:', origin);
      return callback(null, true);
    }
    
    if (allowedOrigins.includes(origin)) {
      console.log('✅ CORS: Allowing whitelisted origin:', origin);
      callback(null, true);
    } else {
      console.log('❌ CORS Error - Origin not allowed:', origin);
      console.log('📋 Allowed origins:', allowedOrigins);
      console.log('💡 Add this origin to FRONTEND_URL env variable or allowedOrigins array');
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));



const randomString = (length) => {
  const characters = 'abcdefghijklmnopqrstuvwxyz';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, randomString(10) + '-' + file.originalname);
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'image/png' || file.mimetype === 'image/jpg' || file.mimetype === 'image/jpeg') {
    cb(null, true);
  } else {
    cb(null, false);
  }
}

const multerOptions = {
  storage, fileFilter
};

app.use(express.json()); 
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(rootDir, 'public')))
app.use("/uploads", express.static(path.join(rootDir, 'uploads')))
app.use("/host/uploads", express.static(path.join(rootDir, 'uploads')))
app.use("/homes/uploads", express.static(path.join(rootDir, 'uploads')))

app.use(session({
  secret: process.env.SESSION_SECRET || "KnowledgeGate AI with Complete Coding",
  resave: false,
  saveUninitialized: false,

  cookie: {
    maxAge: 1000 * 60 * 60 * 24 * 7,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
  }
}));



app.use((req, res, next) => {
  req.isLoggedIn = req.session.isLoggedIn
  next();
})

// Health check and diagnostic endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    envVarsSet: {
      MONGODB_URI: !!process.env.MONGODB_URI,
      SESSION_SECRET: !!process.env.SESSION_SECRET,
      RESEND_API_KEY: !!process.env.RESEND_API_KEY,
      GEMINI_API_KEY: !!process.env.GEMINI_API_KEY,
      FRONTEND_URL: process.env.FRONTEND_URL || 'not set'
    },
    version: 'v2.0-with-logging' // This helps verify which version is deployed
  });
});

app.use('/api/', apiLimiter);

app.use(authRouter);
app.use('/api/password-reset', passwordResetRouter);
app.use('/api/verify-email', emailVerificationRouter);
app.use('/api/ai', aiRouter);
app.use('/api/materials', materialRouter);
app.use('/api/user', statsRouter);
app.use('/api/notebooks', notebookRouter);
app.use('/api/agent', agentRouter);
 
app.use(storeRouter);
app.use(hostRouter);

app.use(errorsController.pageNotFound);

const PORT = process.env.PORT || 3009;

mongoose.connect(DB_PATH).then(() => {
  console.log('Connected to Mongo');
  app.listen(PORT, () => {
    console.log(`Server running on address http://localhost:${PORT}`);
  });
}).catch(err => {
  console.log('Error while connecting to Mongo: ', err);
});
