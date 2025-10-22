import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// File type configurations
const FILE_TYPES = {
  profile_picture: {
    allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'],
    maxSize: 5 * 1024 * 1024, // 5MB
    maxFiles: 1
  },
  assignment_submission: {
    allowedTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'application/zip',
      'application/x-rar-compressed',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ],
    maxSize: 50 * 1024 * 1024, // 50MB
    maxFiles: 10
  },
  shared_document: {
    allowedTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ],
    maxSize: 100 * 1024 * 1024, // 100MB
    maxFiles: 5
  },
  report_attachment: {
    allowedTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ],
    maxSize: 25 * 1024 * 1024, // 25MB
    maxFiles: 5
  },
  homework_file: {
    allowedTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'image/jpeg',
      'image/jpg',
      'image/png'
    ],
    maxSize: 20 * 1024 * 1024, // 20MB
    maxFiles: 3
  }
};

// Create upload directories
const createUploadDirs = () => {
  const baseDir = path.join(__dirname, '..', 'uploads');
  const dirs = ['profiles', 'assignments', 'documents', 'reports', 'homework', 'temp'];
  
  dirs.forEach(dir => {
    const fullPath = path.join(baseDir, dir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
    }
  });
};

// Initialize upload directories
createUploadDirs();

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadType = req.body.uploadType || req.params.uploadType || 'temp';
    let folder = 'temp';
    
    switch (uploadType) {
      case 'profile_picture':
        folder = 'profiles';
        break;
      case 'assignment_submission':
        folder = 'assignments';
        break;
      case 'shared_document':
        folder = 'documents';
        break;
      case 'report_attachment':
        folder = 'reports';
        break;
      case 'homework_file':
        folder = 'homework';
        break;
    }
    
    const uploadPath = path.join(__dirname, '..', 'uploads', folder);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = crypto.randomBytes(16).toString('hex');
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    const sanitizedName = name.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 50);
    
    const filename = `${Date.now()}_${uniqueSuffix}_${sanitizedName}${ext}`;
    cb(null, filename);
  }
});

// File filter function
const fileFilter = (req, file, cb) => {
  const uploadType = req.body.uploadType || req.params.uploadType || 'assignment_submission';
  const config = FILE_TYPES[uploadType];
  
  if (!config) {
    return cb(new Error('Invalid upload type'), false);
  }
  
  if (!config.allowedTypes.includes(file.mimetype)) {
    const allowedExtensions = config.allowedTypes
      .map(type => {
        const ext = type.split('/')[1];
        return ext === 'vnd.openxmlformats-officedocument.wordprocessingml.document' ? 'docx' :
               ext === 'vnd.openxmlformats-officedocument.presentationml.presentation' ? 'pptx' :
               ext === 'vnd.openxmlformats-officedocument.spreadsheetml.sheet' ? 'xlsx' :
               ext === 'msword' ? 'doc' :
               ext === 'vnd.ms-powerpoint' ? 'ppt' :
               ext === 'vnd.ms-excel' ? 'xls' :
               ext === 'x-rar-compressed' ? 'rar' :
               ext;
      })
      .join(', ');
    
    return cb(new Error(`File type not allowed. Allowed types: ${allowedExtensions}`), false);
  }
  
  cb(null, true);
};

// Create multer instance
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB max (will be checked per upload type)
    files: 20 // Max files per request
  }
});

// Middleware to validate file size and count per upload type
export const validateUpload = (uploadType) => {
  return (req, res, next) => {
    const config = FILE_TYPES[uploadType];
    if (!config) {
      return res.status(400).json({ message: 'Invalid upload type' });
    }
    
    // Check file count
    const fileCount = req.files ? req.files.length : 0;
    if (fileCount > config.maxFiles) {
      return res.status(400).json({ 
        message: `Too many files. Maximum ${config.maxFiles} files allowed for ${uploadType}` 
      });
    }
    
    // Check individual file sizes
    if (req.files) {
      for (const file of req.files) {
        if (file.size > config.maxSize) {
          return res.status(400).json({ 
            message: `File ${file.originalname} is too large. Maximum size: ${Math.round(config.maxSize / (1024 * 1024))}MB` 
          });
        }
      }
    }
    
    next();
  };
};

// Security middleware to scan files (basic implementation)
export const scanFiles = async (req, res, next) => {
  if (!req.files || req.files.length === 0) {
    return next();
  }
  
  try {
    // Basic security checks
    for (const file of req.files) {
      // Check for suspicious file extensions in filename
      const suspiciousExtensions = ['.exe', '.bat', '.cmd', '.scr', '.pif', '.com', '.vbs', '.js'];
      const filename = file.originalname.toLowerCase();
      
      if (suspiciousExtensions.some(ext => filename.includes(ext))) {
        // Remove the uploaded file
        fs.unlinkSync(file.path);
        return res.status(400).json({ 
          message: `File ${file.originalname} contains suspicious content and has been rejected` 
        });
      }
      
      // Check file size vs content (basic check)
      if (file.size === 0) {
        fs.unlinkSync(file.path);
        return res.status(400).json({ 
          message: `File ${file.originalname} is empty` 
        });
      }
    }
    
    // Mark files as scanned (in a real implementation, you'd use a proper antivirus)
    req.files.forEach(file => {
      file.scanResult = 'clean';
      file.isScanned = true;
    });
    
    next();
  } catch (error) {
    console.error('File scanning error:', error);
    
    // Clean up uploaded files on error
    if (req.files) {
      req.files.forEach(file => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
    }
    
    res.status(500).json({ message: 'File scanning failed' });
  }
};

// Cleanup middleware for failed uploads
export const cleanupOnError = (err, req, res, next) => {
  if (req.files) {
    req.files.forEach(file => {
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
    });
  }
  next(err);
};

// Export upload configurations
export const uploadSingle = (uploadType) => [
  upload.single('file'),
  validateUpload(uploadType),
  scanFiles
];

export const uploadMultiple = (uploadType, maxCount = null) => [
  upload.array('files', maxCount || FILE_TYPES[uploadType]?.maxFiles || 10),
  validateUpload(uploadType),
  scanFiles
];

export const uploadFields = (fields) => [
  upload.fields(fields),
  scanFiles
];

export { FILE_TYPES };
export default upload;
