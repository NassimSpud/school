import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  studentName: {
    type: String,
    required: true
  },
  studentId: {
    type: String,
    required: true
  },
  companyName: {
    type: String,
    required: true
  },
  location: {
    type: String,
    required: true
  },
  verifiedLocation: String,
  industryType: {
    type: String,
    required: true,
    enum: [
      'Information Technology',
      'Engineering',
      'Healthcare',
      'Business',
      'Education',
      'Agriculture',
      'Other'
    ]
  },
  supervisorName: {
    type: String,
    required: true
  },
  supervisorContact: {
    type: String,
    required: true
  },
  supervisorEmail: String,
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  weeklyHours: {
    type: Number,
    required: true,
    min: 1,
    max: 168
  },
  attachment: String,
  status: {
    type: String,
    enum: ['submitted', 'reviewed', 'approved', 'rejected'],
    default: 'submitted'
  },
  feedback: String,
  grade: String,
  submittedAt: {
    type: Date,
    default: Date.now
  },
  reviewedAt: Date
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Add indexes for better performance
reportSchema.index({ student: 1 });
reportSchema.index({ teacher: 1 });
reportSchema.index({ status: 1 });

const Report = mongoose.model('Report', reportSchema);

export default Report;