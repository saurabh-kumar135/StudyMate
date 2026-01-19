/**
 * Material Routes - Handle document uploads and processing
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pdfParse = require('pdf-parse');
const { summarizeText } = require('../utils/geminiService');

// Configure multer for document uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/documents';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'doc-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // Accept PDF, DOC, DOCX, TXT files
  const allowedTypes = ['.pdf', '.txt', '.doc', '.docx'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allowedTypes.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF, TXT, DOC, and DOCX files are allowed'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

/**
 * POST /api/materials/upload
 * Upload and process document
 */
router.post('/upload', upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    const filePath = req.file.path;
    const fileExt = path.extname(req.file.originalname).toLowerCase();
    let extractedText = '';

    // Extract text based on file type
    if (fileExt === '.pdf') {
      // Extract text from PDF
      const dataBuffer = fs.readFileSync(filePath);
      const pdfData = await pdfParse(dataBuffer);
      extractedText = pdfData.text;
    } else if (fileExt === '.txt') {
      // Read text file
      extractedText = fs.readFileSync(filePath, 'utf8');
    } else {
      // For DOC/DOCX, return message (would need additional library)
      return res.json({
        success: true,
        text: 'Document uploaded successfully. Please copy and paste the text for summarization.',
        filename: req.file.originalname,
        message: 'DOC/DOCX text extraction coming soon. Please use PDF or TXT files.'
      });
    }

    // Clean up the file after extraction
    fs.unlinkSync(filePath);

    if (!extractedText || extractedText.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Could not extract text from document'
      });
    }

    res.json({
      success: true,
      text: extractedText,
      filename: req.file.originalname
    });

  } catch (error) {
    console.error('Document upload error:', error);
    
    // Clean up file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({
      success: false,
      error: error.message || 'Failed to process document'
    });
  }
});

/**
 * POST /api/materials/upload-and-summarize
 * Upload document and get summary in one step
 */
router.post('/upload-and-summarize', upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    const { length = 'medium' } = req.body;
    const filePath = req.file.path;
    const fileExt = path.extname(req.file.originalname).toLowerCase();
    let extractedText = '';

    // Extract text
    if (fileExt === '.pdf') {
      const dataBuffer = fs.readFileSync(filePath);
      const pdfData = await pdfParse(dataBuffer);
      extractedText = pdfData.text;
    } else if (fileExt === '.txt') {
      extractedText = fs.readFileSync(filePath, 'utf8');
    }

    // Clean up file
    fs.unlinkSync(filePath);

    if (!extractedText || extractedText.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Could not extract text from document'
      });
    }

    // Summarize the extracted text
    const summaryResult = await summarizeText(extractedText, length);

    if (summaryResult.success) {
      res.json({
        success: true,
        text: extractedText,
        summary: summaryResult.summary,
        filename: req.file.originalname
      });
    } else {
      res.json({
        success: true,
        text: extractedText,
        filename: req.file.originalname,
        summaryError: 'Text extracted but summarization failed'
      });
    }

  } catch (error) {
    console.error('Upload and summarize error:', error);
    
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({
      success: false,
      error: error.message || 'Failed to process document'
    });
  }
});

module.exports = router;
