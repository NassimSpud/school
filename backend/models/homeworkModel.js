import mongoose from 'mongoose';

const homeworkSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Homework title is required'],
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    required: [true, 'Homework description is required'],
    maxlength: 2000
  },
  instructions: {
    type: String,
    maxlength: 5000
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Teacher is required']
  },
  assignedTo: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  department: {
    type: String,
    enum: ['IT', 'Engineering', 'Business', 'Science', 'Arts'],
    required: [true, 'Department is required'],
    uppercase: true
  },
  subject: {
    type: String,
    required: [true, 'Subject is required'],
    trim: true,
    maxlength: 100
  },
  dueDate: {
    type: Date,
    required: [true, 'Due date is required']
  },
  maxPoints: {
    type: Number,
    default: 100,
    min: 0
  },
  allowedFileTypes: [{
    type: String,
    enum: ['pdf', 'doc', 'docx', 'txt', 'jpg', 'jpeg', 'png', 'zip', 'rar', 'ppt', 'pptx', 'xls', 'xlsx']
  }],
  maxFileSize: {
    type: Number,
    default: 10485760, // 10MB in bytes
    max: 104857600 // 100MB max
  },
  maxFiles: {
    type: Number,
    default: 5,
    min: 1,
    max: 20
  },
  isActive: {
    type: Boolean,
    default: true
  },
  allowLateSubmission: {
    type: Boolean,
    default: false
  },
  lateSubmissionPenalty: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  // Submission statistics
  totalSubmissions: {
    type: Number,
    default: 0
  },
  onTimeSubmissions: {
    type: Number,
    default: 0
  },
  lateSubmissions: {
    type: Number,
    default: 0
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for checking if homework is overdue
homeworkSchema.virtual('isOverdue').get(function() {
  return new Date() > this.dueDate;
});

// Virtual for time remaining
homeworkSchema.virtual('timeRemaining').get(function() {
  const now = new Date();
  const due = this.dueDate;
  if (now > due) return 'Overdue';
  
  const diff = due - now;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  
  if (days > 0) return `${days} day${days > 1 ? 's' : ''} remaining`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} remaining`;
  return 'Due soon';
});

// Index for efficient queries
homeworkSchema.index({ createdBy: 1, isActive: 1 });
homeworkSchema.index({ assignedTo: 1, dueDate: 1 });
homeworkSchema.index({ department: 1, subject: 1 });
homeworkSchema.index({ dueDate: 1 });

// Method to check if user can submit to this homework
homeworkSchema.methods.canSubmit = function(userId) {
  if (!this.isActive) return false;
  if (!this.allowLateSubmission && this.isOverdue) return false;
  return this.assignedTo.includes(userId);
};

// Method to assign to all students in department
homeworkSchema.methods.assignToDepartmentStudents = async function() {
  const User = mongoose.model('User');
  const students = await User.find({ 
    role: 'student', 
    department: this.department 
  }).select('_id');
  
  this.assignedTo = students.map(student => student._id);
  return this.save();
};

const Homework = mongoose.model('Homework', homeworkSchema);

export default Homework;
