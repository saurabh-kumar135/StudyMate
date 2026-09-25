// External Module
const express = require("express");
const hostRouter = express.Router();

const multer = require("multer");
const path = require("path");
const fs = require("fs");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'home-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedExts = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedExts.includes(ext) || (file.mimetype && file.mimetype.startsWith('image/'))) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

const uploadPhotos = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }
});

const hostController = require("../controllers/hostController");

hostRouter.get("/api/host/add-home", hostController.getAddHome);
hostRouter.post("/api/host/add-home", uploadPhotos.array("photos", 10), hostController.postAddHome);
hostRouter.get("/api/host/host-home-list", hostController.getHostHomes);
hostRouter.get("/api/host/edit-home/:homeId", hostController.getEditHome);
hostRouter.post("/api/host/edit-home", uploadPhotos.array("photos", 10), hostController.postEditHome);
hostRouter.post("/api/host/delete-home/:homeId", hostController.postDeleteHome);

module.exports = hostRouter;
