export const validateReport = (req, res, next) => {
  const requiredFields = [
    'studentName',
    'studentId',
    'companyName',
    'location',
    'industryType',
    'supervisorName',
    'supervisorContact',
    'startDate',
    'endDate',
    'weeklyHours'
  ];

  const errors = {};
  
  // Check required fields
  requiredFields.forEach(field => {
    if (!req.body[field]) {
      errors[field] = `${field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} is required`;
    }
  });

  // Validate dates
  if (req.body.startDate && req.body.endDate) {
    const start = new Date(req.body.startDate);
    const end = new Date(req.body.endDate);
    
    if (start > end) {
      errors.endDate = 'End date must be after start date';
    }
  }

  // Validate weekly hours
  if (req.body.weeklyHours) {
    const hours = parseInt(req.body.weeklyHours, 10);
    if (isNaN(hours) || hours < 1 || hours > 168) {
      errors.weeklyHours = 'Weekly hours must be between 1 and 168';
    }
  }

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ 
      success: false,
      errors 
    });
  }

  next();
};