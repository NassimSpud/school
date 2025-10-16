import mongoose from 'mongoose';

const homeworkSubmissionSchema = new mongoose.Schema({
  homework: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Homework',
    required: [true, 'Homework reference is required']
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Student is required']
  },
  submissionText: {
    type: String,
    maxlength: 5000
  },
  submittedAt: {
    type: Date,
    default: Date.now
  },
  isLate: {
    type: Boolean,
    default: false
  },
  // Grading
  grade: {
    type: Number,
    min: 0,
    max: 100
  },
  feedback: {
    type: String,
    maxlength: 2000
  },
  gradedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  gradedAt: {
    type: Date
  },
  status: {
    type: String,
    enum: ['submitted', 'graded', 'returned', 'resubmitted'],
    default: 'submitted'
  },
  // Resubmission tracking
  resubmissionCount: {
    type: Number,
    default: 0
  },
  allowResubmission: {
    type: Boolean,
    default: false
  },
  resubmissionDeadline: {
    type: Date
  },
  // File attachments will be linked via Attachment model
  attachmentCount: {
    type: Number,
    default: 0
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for final grade with late penalty
homeworkSubmissionSchema.virtual('finalGrade').get(function() {
  if (!this.grade) return null;
  
  if (this.isLate && this.homework?.lateSubmissionPenalty) {
    const penalty = (this.homework.lateSubmissionPenalty / 100) * this.grade;
    return Math.max(0, this.grade - penalty);
  }
  
  return this.grade;
});

// Virtual for grade status
homeworkSubmissionSchema.virtual('gradeStatus').get(function() {
  if (!this.grade) return 'Not graded';
  if (this.finalGrade >= 90) return 'Excellent';
  if (this.finalGrade >= 80) return 'Good';
  if (this.finalGrade >= 70) return 'Satisfactory';
  if (this.finalGrade >= 60) return 'Needs Improvement';
  return 'Unsatisfactory';
});

// Compound index to ensure one submission per student per homework
homeworkSubmissionSchema.index({ homework: 1, student: 1 }, { unique: true });
homeworkSubmissionSchema.index({ student: 1, submittedAt: -1 });
homeworkSubmissionSchema.index({ homework: 1, status: 1 });
homeworkSubmissionSchema.index({ gradedBy: 1, gradedAt: -1 });

// Pre-save middleware to check if submission is late
homeworkSubmissionSchema.pre('save', async function(next) {
  if (this.isNew) {
    // Populate homework to check due date
    await this.populate('homework');
    
    if (this.homework && this.submittedAt > this.homework.dueDate) {
      this.isLate = true;
    }
    
    // Update homework submission statistics
    if (this.homework) {
      this.homework.totalSubmissions += 1;
      if (this.isLate) {
        this.homework.lateSubmissions += 1;
      } else {
        this.homework.onTimeSubmissions += 1;
      }
      await this.homework.save();
    }
  }
  
  next();
});

// Method to get attachments for this submission
homeworkSubmissionSchema.methods.getAttachments = function() {
  const Attachment = mongoose.model('Attachment');
  return Attachment.find({
    relatedModel: 'HomeworkSubmission',
    relatedId: this._id
  }).sort({ createdAt: -1 });
};

// Method to check if resubmission is allowed
homeworkSubmissionSchema.methods.canResubmit = function() {
  if (!this.allowResubmission) return false;
  if (this.resubmissionDeadline && new Date() > this.resubmissionDeadline) return false;
  return true;
};

// Static method to get submissions for a homework
homeworkSubmissionSchema.statics.getHomeworkSubmissions = function(homeworkId, options = {}) {
  const query = { homework: homeworkId };
  
  if (options.status) query.status = options.status;
  if (options.isLate !== undefined) query.isLate = options.isLate;
  
  return this.find(query)
    .populate('student', 'name schoolId email')
    .populate('gradedBy', 'name')
    .sort({ submittedAt: -1 });
};

// Static method to get student's submissions
homeworkSubmissionSchema.statics.getStudentSubmissions = function(studentId, options = {}) {
  const query = { student: studentId };
  
  if (options.status) query.status = options.status;
  
  return this.find(query)
    .populate('homework', 'title subject dueDate maxPoints')
    .populate('gradedBy', 'name')
    .sort({ submittedAt: -1 });
};

const HomeworkSubmission = mongoose.model('HomeworkSubmission', homeworkSubmissionSchema);

export default HomeworkSubmission;
