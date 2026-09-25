/**
 * Material Routes - Handle document uploads and processing
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { summarizeText } = require('../utils/geminiService');

// Robust PDF text extractor supporting both pdf-parse v1 and v2
async function extractPdfText(filePath) {
  const dataBuffer = fs.readFileSync(filePath);
  const pdfParsePkg = require('pdf-parse');

  if (pdfParsePkg && typeof pdfParsePkg.PDFParse === 'function') {
    const uint8 = new Uint8Array(dataBuffer);
    const parser = new pdfParsePkg.PDFParse(uint8);
    await parser.load();
    const result = await parser.getText();
    return typeof result === 'string' ? result : (result.text || '');
  }

  if (typeof pdfParsePkg === 'function') {
    const pdfData = await pdfParsePkg(dataBuffer);
    return pdfData.text || '';
  }

  if (pdfParsePkg && typeof pdfParsePkg.default === 'function') {
    const pdfData = await pdfParsePkg.default(dataBuffer);
    return pdfData.text || '';
  }

  throw new Error('Unsupported pdf-parse module format');
}

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
      extractedText = await extractPdfText(filePath);
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
    if (fs.existsSync(filePath)) {
      try { fs.unlinkSync(filePath); } catch (e) { console.warn('Could not unlink temp file:', e); }
    }

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
      extractedText = await extractPdfText(filePath);
    } else if (fileExt === '.txt') {
      extractedText = fs.readFileSync(filePath, 'utf8');
    }

    // Clean up file
    if (fs.existsSync(filePath)) {
      try { fs.unlinkSync(filePath); } catch (e) { console.warn('Could not unlink temp file:', e); }
    }

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
