import mongoose from 'mongoose';

const assessmentVisitSchema = new mongoose.Schema({
  // Basic visit information
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  
  // Teacher and student information
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Visit scheduling
  scheduledDate: {
    type: Date,
    required: true
  },
  estimatedDuration: {
    type: Number, // in minutes
    default: 60
  },
  
  // Location information
  destination: {
    name: String,
    address: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  
  // Teacher's current location (updated in real-time)
  teacherLocation: {
    coordinates: {
      latitude: Number,
      longitude: Number
    },
    accuracy: Number, // GPS accuracy in meters
    lastUpdated: {
      type: Date,
      default: Date.now
    },
    address: String // Reverse geocoded address
  },
  
  // Visit status and progress
  status: {
    type: String,
    enum: [
      'scheduled',     // Visit is planned
      'preparing',     // Teacher is getting ready
      'en_route',      // Teacher is traveling to location
      'nearby',        // Teacher is within 500m
      'arrived',       // Teacher has arrived
      'in_progress',   // Assessment is ongoing
      'completed',     // Assessment finished
      'cancelled',     // Visit was cancelled
      'postponed'      // Visit was rescheduled
    ],
    default: 'scheduled'
  },
  
  // Distance and ETA calculations
  distanceToDestination: {
    type: Number, // in meters
    default: null
  },
  estimatedArrivalTime: {
    type: Date,
    default: null
  },
  travelMode: {
    type: String,
    enum: ['driving', 'walking', 'transit', 'cycling'],
    default: 'driving'
  },
  
  // Visit timeline
  timeline: [{
    status: {
      type: String,
      enum: ['scheduled', 'preparing', 'en_route', 'nearby', 'arrived', 'in_progress', 'completed', 'cancelled', 'postponed']
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    location: {
      coordinates: {
        latitude: Number,
        longitude: Number
      },
      address: String
    },
    notes: String,
    automaticUpdate: {
      type: Boolean,
      default: false
    }
  }],
  
  // Assessment details
  assessmentType: {
    type: String,
    enum: ['internship_visit', 'project_review', 'practical_exam', 'site_inspection', 'progress_check'],
    required: true
  },
  
  // Attachments and documentation
  attachments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Attachment'
  }],
  
  // Assessment results (filled after completion)
  assessmentResults: {
    score: Number,
    grade: String,
    feedback: String,
    strengths: [String],
    improvements: [String],
    recommendations: String,
    completedAt: Date,
    duration: Number // actual duration in minutes
  },
  
  // Notification settings
  notifications: {
    studentNotified: {
      type: Boolean,
      default: false
    },
    notificationsSent: [{
      type: {
        type: String,
        enum: ['scheduled', 'preparing', 'en_route', 'nearby', 'arrived', 'delayed', 'cancelled']
      },
      sentAt: {
        type: Date,
        default: Date.now
      },
      method: {
        type: String,
        enum: ['push', 'email', 'sms', 'in_app']
      },
      delivered: {
        type: Boolean,
        default: false
      }
    }]
  },
  
  // Emergency and contact information
  emergencyContact: {
    name: String,
    phone: String,
    relationship: String
  },
  
  // Visit metadata
  department: {
    type: String,
    required: true
  },
  subject: String,
  semester: String,
  academicYear: String,
  
  // System fields
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
assessmentVisitSchema.index({ teacher: 1, scheduledDate: 1 });
assessmentVisitSchema.index({ student: 1, scheduledDate: 1 });
assessmentVisitSchema.index({ status: 1, scheduledDate: 1 });
assessmentVisitSchema.index({ 'teacherLocation.coordinates': '2dsphere' });
assessmentVisitSchema.index({ 'destination.coordinates': '2dsphere' });

// Virtual for formatted distance
assessmentVisitSchema.virtual('formattedDistance').get(function() {
  if (!this.distanceToDestination) return null;
  
  if (this.distanceToDestination < 1000) {
    return `${Math.round(this.distanceToDestination)}m`;
  } else {
    return `${(this.distanceToDestination / 1000).toFixed(1)}km`;
  }
});

// Virtual for time until arrival
assessmentVisitSchema.virtual('timeUntilArrival').get(function() {
  if (!this.estimatedArrivalTime) return null;
  
  const now = new Date();
  const eta = new Date(this.estimatedArrivalTime);
  const diffMinutes = Math.round((eta - now) / (1000 * 60));
  
  if (diffMinutes < 0) return 'Overdue';
  if (diffMinutes === 0) return 'Arriving now';
  if (diffMinutes < 60) return `${diffMinutes} min`;
  
  const hours = Math.floor(diffMinutes / 60);
  const minutes = diffMinutes % 60;
  return `${hours}h ${minutes}m`;
});

// Virtual for visit duration
assessmentVisitSchema.virtual('actualDuration').get(function() {
  const arrivedEntry = this.timeline.find(entry => entry.status === 'arrived');
  const completedEntry = this.timeline.find(entry => entry.status === 'completed');
  
  if (arrivedEntry && completedEntry) {
    return Math.round((completedEntry.timestamp - arrivedEntry.timestamp) / (1000 * 60));
  }
  return null;
});

// Method to update teacher location
assessmentVisitSchema.methods.updateTeacherLocation = async function(latitude, longitude, accuracy = null) {
  this.teacherLocation.coordinates = { latitude, longitude };
  this.teacherLocation.accuracy = accuracy;
  this.teacherLocation.lastUpdated = new Date();
  
  // Calculate distance to destination if destination is set
  if (this.destination?.coordinates) {
    this.distanceToDestination = this.calculateDistance(
      latitude, longitude,
      this.destination.coordinates.latitude,
      this.destination.coordinates.longitude
    );
    
    // Update status based on distance
    if (this.distanceToDestination <= 100 && this.status === 'en_route') {
      await this.updateStatus('arrived');
    } else if (this.distanceToDestination <= 500 && this.status === 'en_route') {
      await this.updateStatus('nearby');
    }
  }
  
  return this.save();
};

// Method to calculate distance between two coordinates (Haversine formula)
assessmentVisitSchema.methods.calculateDistance = function(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c; // Distance in meters
};

// Method to update visit status
assessmentVisitSchema.methods.updateStatus = async function(newStatus, notes = '', location = null) {
  const oldStatus = this.status;
  this.status = newStatus;
  
  // Add to timeline
  const timelineEntry = {
    status: newStatus,
    timestamp: new Date(),
    notes,
    automaticUpdate: !notes // If no notes provided, it's an automatic update
  };
  
  if (location) {
    timelineEntry.location = location;
  } else if (this.teacherLocation?.coordinates) {
    timelineEntry.location = {
      coordinates: this.teacherLocation.coordinates,
      address: this.teacherLocation.address
    };
  }
  
  this.timeline.push(timelineEntry);
  
  // Update specific fields based on status
  if (newStatus === 'completed') {
    this.assessmentResults.completedAt = new Date();
  }
  
  await this.save();
  
  // Trigger notifications if status changed
  if (oldStatus !== newStatus) {
    await this.sendStatusNotification(newStatus);
  }
  
  return this;
};

// Method to send notifications
assessmentVisitSchema.methods.sendStatusNotification = async function(status) {
  // This would integrate with your notification system
  // For now, we'll just log the notification
  console.log(`Sending ${status} notification for visit ${this._id} to student ${this.student}`);
  
  // Add to notifications log
  this.notifications.notificationsSent.push({
    type: status,
    sentAt: new Date(),
    method: 'in_app',
    delivered: true
  });
  
  return this.save();
};

// Method to calculate ETA based on current location and traffic
assessmentVisitSchema.methods.calculateETA = async function() {
  if (!this.teacherLocation?.coordinates || !this.destination?.coordinates) {
    return null;
  }
  
  // This would integrate with Google Maps API or similar for real ETA
  // For now, we'll use a simple calculation based on distance and average speed
  const distance = this.distanceToDestination;
  if (!distance) return null;
  
  // Assume average speed based on travel mode
  const speeds = {
    walking: 5, // km/h
    cycling: 15,
    driving: 30, // accounting for city traffic
    transit: 20
  };
  
  const speed = speeds[this.travelMode] || speeds.driving;
  const timeHours = (distance / 1000) / speed;
  const timeMinutes = Math.round(timeHours * 60);
  
  this.estimatedArrivalTime = new Date(Date.now() + timeMinutes * 60 * 1000);
  return this.estimatedArrivalTime;
};

// Static method to find nearby visits for a teacher
assessmentVisitSchema.statics.findNearbyVisits = function(teacherId, latitude, longitude, radiusKm = 10) {
  return this.find({
    teacher: teacherId,
    status: { $in: ['scheduled', 'preparing', 'en_route'] },
    'destination.coordinates': {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [longitude, latitude]
        },
        $maxDistance: radiusKm * 1000 // Convert km to meters
      }
    }
  });
};

// Static method to get active visits for a student
assessmentVisitSchema.statics.getActiveVisitsForStudent = function(studentId) {
  return this.find({
    student: studentId,
    status: { $in: ['scheduled', 'preparing', 'en_route', 'nearby', 'arrived', 'in_progress'] },
    isActive: true
  })
  .populate('teacher', 'name email phone profilePicture')
  .populate('attachments')
  .sort({ scheduledDate: 1 });
};

// Static method to get teacher's active visits
assessmentVisitSchema.statics.getActiveVisitsForTeacher = function(teacherId) {
  return this.find({
    teacher: teacherId,
    status: { $in: ['scheduled', 'preparing', 'en_route', 'nearby', 'arrived', 'in_progress'] },
    isActive: true
  })
  .populate('student', 'name email phone schoolId')
  .populate('attachments')
  .sort({ scheduledDate: 1 });
};

const AssessmentVisit = mongoose.model('AssessmentVisit', assessmentVisitSchema);

export default AssessmentVisit;
