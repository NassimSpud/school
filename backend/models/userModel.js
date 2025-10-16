import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: [true, 'Please add a name'] 
  },
  email: { 
    type: String, 
    unique: true,
    sparse: true,
    required: function() { return this.role !== 'student'; },
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please add a valid email']
  },
  schoolId: { 
    type: String, 
    unique: true,
    sparse: true,
    required: function() { return this.role === 'student'; },
    match: [/^[A-Z0-9]+$/, 'Please use only uppercase letters and numbers']
  },
  password: { 
    type: String, 
    required: [true, 'Please add a password'],
    minlength: 6,
    select: false
  },
  role: { 
    type: String, 
    enum: ['admin', 'teacher', 'student'], 
    required: true 
  },
  department: {
    type: String,
    required: function() { return this.role !== 'admin'; },
    enum: ['IT', 'Engineering', 'Business', 'Science', 'Arts'],
    uppercase: true
  },
  students: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    department: {
      type: String,
      ref: 'User.department'
    }
  }],
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    department: {
      type: String,
      ref: 'User.department'
    }
  },
  profilePicture: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Attachment'
  }
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare passwords
userSchema.methods.matchPassword = async function(enteredPassword) {
  if (!enteredPassword || !this.password) {
    return false;
  }
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);

export default User;
