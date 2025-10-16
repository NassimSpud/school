import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// File size formatting
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Get file extension
export const getFileExtension = (filename) => {
  return path.extname(filename).toLowerCase().substring(1);
};

// Get file type category
export const getFileCategory = (mimetype) => {
  if (mimetype.startsWith('image/')) return 'image';
  if (mimetype.startsWith('video/')) return 'video';
  if (mimetype.startsWith('audio/')) return 'audio';
  if (mimetype.includes('pdf')) return 'pdf';
  if (mimetype.includes('word') || mimetype.includes('document')) return 'document';
  if (mimetype.includes('spreadsheet') || mimetype.includes('excel')) return 'spreadsheet';
  if (mimetype.includes('presentation') || mimetype.includes('powerpoint')) return 'presentation';
  if (mimetype.includes('zip') || mimetype.includes('rar') || mimetype.includes('compressed')) return 'archive';
  if (mimetype.includes('text')) return 'text';
  return 'other';
};

// Generate unique filename
export const generateUniqueFilename = (originalName) => {
  const ext = path.extname(originalName);
  const name = path.basename(originalName, ext);
  const sanitizedName = name.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 50);
  const uniqueSuffix = crypto.randomBytes(16).toString('hex');
  
  return `${Date.now()}_${uniqueSuffix}_${sanitizedName}${ext}`;
};

// Check if file exists
export const fileExists = (filePath) => {
  try {
    return fs.existsSync(filePath);
  } catch (error) {
    return false;
  }
};

// Delete file safely
export const deleteFile = async (filePath) => {
  try {
    if (fileExists(filePath)) {
      await fs.promises.unlink(filePath);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error deleting file:', error);
    return false;
  }
};

// Move file
export const moveFile = async (sourcePath, destinationPath) => {
  try {
    // Ensure destination directory exists
    const destDir = path.dirname(destinationPath);
    if (!fs.existsSync(destDir)) {
      await fs.promises.mkdir(destDir, { recursive: true });
    }
    
    await fs.promises.rename(sourcePath, destinationPath);
    return true;
  } catch (error) {
    console.error('Error moving file:', error);
    return false;
  }
};

// Copy file
export const copyFile = async (sourcePath, destinationPath) => {
  try {
    // Ensure destination directory exists
    const destDir = path.dirname(destinationPath);
    if (!fs.existsSync(destDir)) {
      await fs.promises.mkdir(destDir, { recursive: true });
    }
    
    await fs.promises.copyFile(sourcePath, destinationPath);
    return true;
  } catch (error) {
    console.error('Error copying file:', error);
    return false;
  }
};

// Get file stats
export const getFileStats = async (filePath) => {
  try {
    const stats = await fs.promises.stat(filePath);
    return {
      size: stats.size,
      created: stats.birthtime,
      modified: stats.mtime,
      accessed: stats.atime,
      isFile: stats.isFile(),
      isDirectory: stats.isDirectory()
    };
  } catch (error) {
    console.error('Error getting file stats:', error);
    return null;
  }
};

// Create directory if it doesn't exist
export const ensureDirectory = async (dirPath) => {
  try {
    if (!fs.existsSync(dirPath)) {
      await fs.promises.mkdir(dirPath, { recursive: true });
    }
    return true;
  } catch (error) {
    console.error('Error creating directory:', error);
    return false;
  }
};

// Get directory size
export const getDirectorySize = async (dirPath) => {
  try {
    let totalSize = 0;
    const files = await fs.promises.readdir(dirPath);
    
    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const stats = await fs.promises.stat(filePath);
      
      if (stats.isFile()) {
        totalSize += stats.size;
      } else if (stats.isDirectory()) {
        totalSize += await getDirectorySize(filePath);
      }
    }
    
    return totalSize;
  } catch (error) {
    console.error('Error calculating directory size:', error);
    return 0;
  }
};

// Clean up old files (older than specified days)
export const cleanupOldFiles = async (dirPath, daysOld = 30) => {
  try {
    const files = await fs.promises.readdir(dirPath);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    
    let deletedCount = 0;
    let deletedSize = 0;
    
    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const stats = await fs.promises.stat(filePath);
      
      if (stats.isFile() && stats.mtime < cutoffDate) {
        deletedSize += stats.size;
        await fs.promises.unlink(filePath);
        deletedCount++;
      }
    }
    
    return { deletedCount, deletedSize };
  } catch (error) {
    console.error('Error cleaning up old files:', error);
    return { deletedCount: 0, deletedSize: 0 };
  }
};

// Validate file type
export const validateFileType = (mimetype, allowedTypes) => {
  return allowedTypes.includes(mimetype);
};

// Validate file size
export const validateFileSize = (size, maxSize) => {
  return size <= maxSize;
};

// Generate file hash
export const generateFileHash = async (filePath) => {
  try {
    const fileBuffer = await fs.promises.readFile(filePath);
    const hashSum = crypto.createHash('sha256');
    hashSum.update(fileBuffer);
    return hashSum.digest('hex');
  } catch (error) {
    console.error('Error generating file hash:', error);
    return null;
  }
};

// Check for duplicate files by hash
export const findDuplicateFiles = async (dirPath) => {
  try {
    const files = await fs.promises.readdir(dirPath);
    const fileHashes = new Map();
    const duplicates = [];
    
    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const stats = await fs.promises.stat(filePath);
      
      if (stats.isFile()) {
        const hash = await generateFileHash(filePath);
        if (hash) {
          if (fileHashes.has(hash)) {
            duplicates.push({
              original: fileHashes.get(hash),
              duplicate: filePath
            });
          } else {
            fileHashes.set(hash, filePath);
          }
        }
      }
    }
    
    return duplicates;
  } catch (error) {
    console.error('Error finding duplicate files:', error);
    return [];
  }
};

// Get upload path for specific type
export const getUploadPath = (uploadType) => {
  const baseDir = path.join(__dirname, '..', 'uploads');
  
  switch (uploadType) {
    case 'profile_picture':
      return path.join(baseDir, 'profiles');
    case 'assignment_submission':
      return path.join(baseDir, 'assignments');
    case 'shared_document':
      return path.join(baseDir, 'documents');
    case 'report_attachment':
      return path.join(baseDir, 'reports');
    case 'homework_file':
      return path.join(baseDir, 'homework');
    default:
      return path.join(baseDir, 'temp');
  }
};

// Get file URL
export const getFileUrl = (filename, uploadType) => {
  const folder = uploadType === 'profile_picture' ? 'profiles' :
                 uploadType === 'assignment_submission' ? 'assignments' :
                 uploadType === 'shared_document' ? 'documents' :
                 uploadType === 'report_attachment' ? 'reports' :
                 uploadType === 'homework_file' ? 'homework' : 'temp';
  
  return `/uploads/${folder}/${filename}`;
};

// Sanitize filename
export const sanitizeFilename = (filename) => {
  // Remove or replace dangerous characters
  return filename
    .replace(/[<>:"/\\|?*]/g, '_')  // Replace dangerous characters
    .replace(/\s+/g, '_')           // Replace spaces with underscores
    .replace(/_{2,}/g, '_')         // Replace multiple underscores with single
    .replace(/^_+|_+$/g, '')       // Remove leading/trailing underscores
    .substring(0, 255);             // Limit length
};

// Check disk space
export const checkDiskSpace = async (dirPath) => {
  try {
    const stats = await fs.promises.statvfs ? fs.promises.statvfs(dirPath) : null;
    if (stats) {
      return {
        free: stats.bavail * stats.frsize,
        total: stats.blocks * stats.frsize,
        used: (stats.blocks - stats.bavail) * stats.frsize
      };
    }
    return null;
  } catch (error) {
    console.error('Error checking disk space:', error);
    return null;
  }
};

export default {
  formatFileSize,
  getFileExtension,
  getFileCategory,
  generateUniqueFilename,
  fileExists,
  deleteFile,
  moveFile,
  copyFile,
  getFileStats,
  ensureDirectory,
  getDirectorySize,
  cleanupOldFiles,
  validateFileType,
  validateFileSize,
  generateFileHash,
  findDuplicateFiles,
  getUploadPath,
  getFileUrl,
  sanitizeFilename,
  checkDiskSpace
};
