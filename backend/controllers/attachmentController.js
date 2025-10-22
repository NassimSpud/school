import Attachment from '../models/attachmentModel.js';
import User from '../models/userModel.js';
import { deleteFile, getFileUrl, formatFileSize } from '../utils/fileUtils.js';
import path from 'path';
import fs from 'fs';

// Upload single file
export const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const { uploadType, description, tags, relatedModel, relatedId, isPublic } = req.body;

    // Create attachment record
    const attachment = new Attachment({
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      path: req.file.path,
      url: getFileUrl(req.file.filename, uploadType),
      uploadedBy: req.user._id,
      attachmentType: uploadType,
      relatedModel: relatedModel || undefined,
      relatedId: relatedId || undefined,
      description: description || '',
      tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
      isPublic: isPublic === 'true',
      isScanned: req.file.isScanned || false,
      scanResult: req.file.scanResult || 'pending'
    });

    await attachment.save();

    // Update user profile picture if applicable
    if (uploadType === 'profile_picture') {
      // Remove old profile picture
      const oldAttachment = await Attachment.findOne({
        uploadedBy: req.user._id,
        attachmentType: 'profile_picture',
        _id: { $ne: attachment._id }
      });

      if (oldAttachment) {
        await deleteFile(oldAttachment.path);
        await oldAttachment.deleteOne();
      }

      // Update user model with new profile picture
      await User.findByIdAndUpdate(req.user._id, {
        profilePicture: attachment._id
      });
    }

    res.status(201).json({
      message: 'File uploaded successfully',
      attachment: {
        id: attachment._id,
        filename: attachment.filename,
        originalName: attachment.originalName,
        size: attachment.size,
        formattedSize: attachment.formattedSize,
        url: attachment.url,
        uploadedAt: attachment.createdAt,
        attachmentType: attachment.attachmentType
      }
    });
  } catch (error) {
    // Clean up uploaded file on error
    if (req.file && fs.existsSync(req.file.path)) {
      await deleteFile(req.file.path);
    }
    
    console.error('Upload error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Upload multiple files
export const uploadMultipleFiles = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    const { uploadType, description, tags, relatedModel, relatedId, isPublic } = req.body;
    const uploadedAttachments = [];

    for (const file of req.files) {
      const attachment = new Attachment({
        filename: file.filename,
        originalName: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        path: file.path,
        url: getFileUrl(file.filename, uploadType),
        uploadedBy: req.user._id,
        attachmentType: uploadType,
        relatedModel: relatedModel || undefined,
        relatedId: relatedId || undefined,
        description: description || '',
        tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
        isPublic: isPublic === 'true',
        isScanned: file.isScanned || false,
        scanResult: file.scanResult || 'pending'
      });

      await attachment.save();
      uploadedAttachments.push({
        id: attachment._id,
        filename: attachment.filename,
        originalName: attachment.originalName,
        size: attachment.size,
        formattedSize: attachment.formattedSize,
        url: attachment.url,
        uploadedAt: attachment.createdAt,
        attachmentType: attachment.attachmentType
      });
    }

    res.status(201).json({
      message: `${uploadedAttachments.length} files uploaded successfully`,
      attachments: uploadedAttachments
    });
  } catch (error) {
    // Clean up uploaded files on error
    if (req.files) {
      for (const file of req.files) {
        if (fs.existsSync(file.path)) {
          await deleteFile(file.path);
        }
      }
    }
    
    console.error('Multiple upload error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get user's attachments
export const getUserAttachments = async (req, res) => {
  try {
    const { type, page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const query = { uploadedBy: req.user._id };
    if (type) query.attachmentType = type;

    const attachments = await Attachment.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('uploadedBy', 'name email');

    const total = await Attachment.countDocuments(query);

    res.json({
      attachments,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total,
        hasNext: skip + attachments.length < total,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get user attachments error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get attachment by ID
export const getAttachment = async (req, res) => {
  try {
    const attachment = await Attachment.findById(req.params.id)
      .populate('uploadedBy', 'name email');

    if (!attachment) {
      return res.status(404).json({ message: 'Attachment not found' });
    }

    // Check access permissions
    if (!attachment.canAccess(req.user)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(attachment);
  } catch (error) {
    console.error('Get attachment error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Download attachment
export const downloadAttachment = async (req, res) => {
  try {
    const attachment = await Attachment.findById(req.params.id);

    if (!attachment) {
      return res.status(404).json({ message: 'Attachment not found' });
    }

    // Check access permissions
    if (!attachment.canAccess(req.user)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Check if file exists
    if (!fs.existsSync(attachment.path)) {
      return res.status(404).json({ message: 'File not found on server' });
    }

    // Record download
    await attachment.recordDownload();

    // Set headers for download
    res.setHeader('Content-Disposition', `attachment; filename="${attachment.originalName}"`);
    res.setHeader('Content-Type', attachment.mimetype);
    res.setHeader('Content-Length', attachment.size);

    // Stream file
    const fileStream = fs.createReadStream(attachment.path);
    fileStream.pipe(res);
  } catch (error) {
    console.error('Download attachment error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Delete attachment
export const deleteAttachment = async (req, res) => {
  try {
    const attachment = await Attachment.findById(req.params.id);

    if (!attachment) {
      return res.status(404).json({ message: 'Attachment not found' });
    }

    // Check permissions (owner or admin)
    if (attachment.uploadedBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Delete file from filesystem
    await deleteFile(attachment.path);

    // Delete thumbnail if exists
    if (attachment.thumbnailPath) {
      await deleteFile(attachment.thumbnailPath);
    }

    // Delete compressed version if exists
    if (attachment.compressedPath) {
      await deleteFile(attachment.compressedPath);
    }

    // Remove from database
    await attachment.deleteOne();

    // If it was a profile picture, update user
    if (attachment.attachmentType === 'profile_picture') {
      await User.findByIdAndUpdate(attachment.uploadedBy, {
        $unset: { profilePicture: 1 }
      });
    }

    res.json({ message: 'Attachment deleted successfully' });
  } catch (error) {
    console.error('Delete attachment error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Update attachment metadata
export const updateAttachment = async (req, res) => {
  try {
    const { description, tags, isPublic } = req.body;
    const attachment = await Attachment.findById(req.params.id);

    if (!attachment) {
      return res.status(404).json({ message: 'Attachment not found' });
    }

    // Check permissions (owner or admin)
    if (attachment.uploadedBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Update fields
    if (description !== undefined) attachment.description = description;
    if (tags !== undefined) attachment.tags = tags.split(',').map(tag => tag.trim());
    if (isPublic !== undefined) attachment.isPublic = isPublic;

    await attachment.save();

    res.json({
      message: 'Attachment updated successfully',
      attachment
    });
  } catch (error) {
    console.error('Update attachment error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get attachments for a specific entity
export const getEntityAttachments = async (req, res) => {
  try {
    const { model, entityId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const attachments = await Attachment.find({
      relatedModel: model,
      relatedId: entityId
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('uploadedBy', 'name email');

    // Check if user has access to at least one attachment
    const accessibleAttachments = attachments.filter(attachment => 
      attachment.canAccess(req.user)
    );

    const total = await Attachment.countDocuments({
      relatedModel: model,
      relatedId: entityId
    });

    res.json({
      attachments: accessibleAttachments,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total,
        hasNext: skip + attachments.length < total,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get entity attachments error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get attachment statistics
export const getAttachmentStats = async (req, res) => {
  try {
    const userId = req.user._id;
    const isAdmin = req.user.role === 'admin';

    let matchQuery = {};
    if (!isAdmin) {
      matchQuery.uploadedBy = userId;
    }

    const stats = await Attachment.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$attachmentType',
          count: { $sum: 1 },
          totalSize: { $sum: '$size' },
          avgSize: { $avg: '$size' }
        }
      }
    ]);

    const totalStats = await Attachment.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          totalFiles: { $sum: 1 },
          totalSize: { $sum: '$size' },
          avgSize: { $avg: '$size' }
        }
      }
    ]);

    res.json({
      byType: stats,
      total: totalStats[0] || { totalFiles: 0, totalSize: 0, avgSize: 0 }
    });
  } catch (error) {
    console.error('Get attachment stats error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Search attachments
export const searchAttachments = async (req, res) => {
  try {
    const { q, type, tags, page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    let query = {};

    // User can only search their own files unless admin
    if (req.user.role !== 'admin') {
      query.$or = [
        { uploadedBy: req.user._id },
        { isPublic: true },
        { allowedUsers: req.user._id },
        { allowedRoles: req.user.role }
      ];
    }

    // Text search
    if (q) {
      query.$and = query.$and || [];
      query.$and.push({
        $or: [
          { originalName: { $regex: q, $options: 'i' } },
          { description: { $regex: q, $options: 'i' } },
          { tags: { $in: [new RegExp(q, 'i')] } }
        ]
      });
    }

    // Filter by type
    if (type) {
      query.attachmentType = type;
    }

    // Filter by tags
    if (tags) {
      const tagArray = tags.split(',').map(tag => tag.trim());
      query.tags = { $in: tagArray };
    }

    const attachments = await Attachment.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('uploadedBy', 'name email');

    const total = await Attachment.countDocuments(query);

    res.json({
      attachments,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total,
        hasNext: skip + attachments.length < total,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Search attachments error:', error);
    res.status(500).json({ message: error.message });
  }
};
