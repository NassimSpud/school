import mongoose from 'mongoose';

const attachmentSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: [true, 'Filename is required']
  },
  originalName: {
    type: String,
    required: [true, 'Original filename is required']
  },
  mimetype: {
    type: String,
    required: [true, 'File type is required']
  },
  size: {
    type: Number,
    required: [true, 'File size is required']
  },
  path: {
    type: String,
    required: [true, 'File path is required']
  },
  url: {
    type: String,
    required: [true, 'File URL is required']
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Uploader is required']
  },
  attachmentType: {
    type: String,
    enum: ['profile_picture', 'assignment_submission', 'shared_document', 'report_attachment', 'homework_file'],
    required: [true, 'Attachment type is required']
  },
  // Polymorphic association - can be linked to different models
  relatedModel: {
    type: String,
    enum: ['User', 'HomeworkSubmission', 'SharedDocument', 'Report', 'Homework'],
    required: function() {
      return this.attachmentType !== 'profile_picture';
    }
  },
  relatedId: {
    type: mongoose.Schema.Types.ObjectId,
    required: function() {
      return this.attachmentType !== 'profile_picture';
    }
  },
  // Access control
  isPublic: {
    type: Boolean,
    default: false
  },
  allowedUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  allowedRoles: [{
    type: String,
    enum: ['admin', 'teacher', 'student']
  }],
  // File metadata
  description: {
    type: String,
    maxlength: 500
  },
  tags: [{
    type: String,
    trim: true
  }],
  // Security and validation
  isScanned: {
    type: Boolean,
    default: false
  },
  scanResult: {
    type: String,
    enum: ['clean', 'infected', 'suspicious', 'pending'],
    default: 'pending'
  },
  // File processing
  isProcessed: {
    type: Boolean,
    default: false
  },
  thumbnailPath: {
    type: String
  },
  compressedPath: {
    type: String
  },
  // Download tracking
  downloadCount: {
    type: Number,
    default: 0
  },
  lastDownloaded: {
    type: Date
  },
  // Expiration (optional)
  expiresAt: {
    type: Date
  }
}, { 
  timestamps: true,
  // Add virtual for file extension
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for file extension
attachmentSchema.virtual('extension').get(function() {
  return this.originalName.split('.').pop().toLowerCase();
});

// Virtual for formatted file size
attachmentSchema.virtual('formattedSize').get(function() {
  const bytes = this.size;
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
});

// Index for efficient queries
attachmentSchema.index({ uploadedBy: 1, attachmentType: 1 });
attachmentSchema.index({ relatedModel: 1, relatedId: 1 });
attachmentSchema.index({ createdAt: -1 });
attachmentSchema.index({ tags: 1 });

// Pre-save middleware to set URL
attachmentSchema.pre('save', function(next) {
  if (this.path && !this.url) {
    this.url = `/uploads/${this.path.split('/').pop()}`;
  }
  next();
});

// Method to check if user can access this attachment
attachmentSchema.methods.canAccess = function(user) {
  // Admin can access everything
  if (user.role === 'admin') return true;
  
  // Owner can always access
  if (this.uploadedBy.toString() === user._id.toString()) return true;
  
  // Public files
  if (this.isPublic) return true;
  
  // Check allowed users
  if (this.allowedUsers.includes(user._id)) return true;
  
  // Check allowed roles
  if (this.allowedRoles.includes(user.role)) return true;
  
  return false;
};

// Method to increment download count
attachmentSchema.methods.recordDownload = function() {
  this.downloadCount += 1;
  this.lastDownloaded = new Date();
  return this.save();
};

// Static method to get user's attachments
attachmentSchema.statics.getUserAttachments = function(userId, type = null) {
  const query = { uploadedBy: userId };
  if (type) query.attachmentType = type;
  return this.find(query).sort({ createdAt: -1 });
};

// Static method to get attachments for a specific entity
attachmentSchema.statics.getEntityAttachments = function(model, entityId) {
  return this.find({ relatedModel: model, relatedId: entityId }).sort({ createdAt: -1 });
};

const Attachment = mongoose.model('Attachment', attachmentSchema);

export default Attachment;
