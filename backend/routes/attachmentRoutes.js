import express from 'express';
import {
  uploadFile,
  uploadMultipleFiles,
  getUserAttachments,
  getAttachment,
  downloadAttachment,
  deleteAttachment,
  updateAttachment,
  getEntityAttachments,
  getAttachmentStats,
  searchAttachments
} from '../controllers/attachmentController.js';
import { protect, admin, teacher, student } from '../middleware/authMiddleware.js';
import { uploadSingle, uploadMultiple } from '../middleware/uploadMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Upload routes
router.post('/upload/single/:uploadType', (req, res, next) => {
  const uploadType = req.params.uploadType;
  uploadSingle(uploadType)[0](req, res, (err) => {
    if (err) return next(err);
    uploadSingle(uploadType)[1](req, res, (err) => {
      if (err) return next(err);
      uploadSingle(uploadType)[2](req, res, next);
    });
  });
}, uploadFile);

router.post('/upload/multiple/:uploadType', (req, res, next) => {
  const uploadType = req.params.uploadType;
  uploadMultiple(uploadType)[0](req, res, (err) => {
    if (err) return next(err);
    uploadMultiple(uploadType)[1](req, res, (err) => {
      if (err) return next(err);
      uploadMultiple(uploadType)[2](req, res, next);
    });
  });
}, uploadMultipleFiles);

// Get user's attachments
router.get('/my-files', getUserAttachments);

// Search attachments
router.get('/search', searchAttachments);

// Get attachment statistics
router.get('/stats', getAttachmentStats);

// Get attachments for a specific entity (homework, report, etc.)
router.get('/entity/:model/:entityId', getEntityAttachments);

// Get specific attachment
router.get('/:id', getAttachment);

// Download attachment
router.get('/:id/download', downloadAttachment);

// Update attachment metadata
router.put('/:id', updateAttachment);

// Delete attachment
router.delete('/:id', deleteAttachment);

export default router;
