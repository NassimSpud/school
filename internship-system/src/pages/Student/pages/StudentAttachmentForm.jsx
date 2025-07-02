import React, { useState, useEffect } from "react";
import axios from "axios";

const StudentAttachmentForm = () => {
  const [formData, setFormData] = useState({
    studentName: "",
    studentId: "",
    companyName: "",
    location: "",
    verifiedLocation: "",
    industryType: "",
    supervisorName: "",
    supervisorContact: "",
    supervisorEmail: "",
    startDate: "",
    endDate: "",
    weeklyHours: "",
  });

  const [locationFetched, setLocationFetched] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [serverValidationErrors, setServerValidationErrors] = useState({});

  useEffect(() => {
    calculateProgress();
  }, [formData]);

  const calculateProgress = () => {
    const requiredFields = [
      "studentName",
      "studentId",
      "companyName",
      "location",
      "industryType",
      "supervisorName",
      "supervisorContact",
      "startDate",
      "endDate",
      "weeklyHours",
    ];

    const filledFields = requiredFields.filter(
      (field) => formData[field] && formData[field].toString().trim() !== ""
    ).length;

    setProgress(Math.round((filledFields / requiredFields.length) * 100));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    
    if (serverValidationErrors[name]) {
      setServerValidationErrors(prev => {
        const newErrors = {...prev};
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleLocationFetch = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = `${position.coords.latitude}, ${position.coords.longitude}`;
          setFormData({
            ...formData,
            location: coords,
            verifiedLocation: "Location verified (GPS coordinates captured)",
          });
          setLocationFetched(true);
        },
        (error) => {
          console.error("Geolocation error:", error);
          setError("Could not retrieve location. Please enter manually.");
        }
      );
    } else {
      setError("Geolocation not supported by this browser.");
    }
  };

  const validateForm = async () => {
    const errors = {};
    
    // Check if teacher is assigned
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const userResponse = await axios.get('/api/user/me', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!userResponse.data.teacher) {
          errors.teacher = "No teacher assigned to this student. Please contact your administrator.";
        }
      } catch (error) {
        console.error('Error checking teacher assignment:', error);
        errors.teacher = "Failed to verify teacher assignment. Please try again later.";
      }
    }

    if (!formData.studentName.trim()) errors.studentName = "Student name is required";
    if (!formData.studentId.trim()) errors.studentId = "Student ID is required";
    if (!formData.companyName.trim()) errors.companyName = "Company name is required";
    if (!formData.location.trim()) errors.location = "Location is required";
    if (!formData.industryType) errors.industryType = "Industry type is required";
    if (!formData.supervisorName.trim()) errors.supervisorName = "Supervisor name is required";
    if (!formData.supervisorContact.trim()) errors.supervisorContact = "Supervisor contact is required";
    if (!formData.startDate) errors.startDate = "Start date is required";
    if (!formData.endDate) errors.endDate = "End date is required";
    if (!formData.weeklyHours) errors.weeklyHours = "Weekly hours is required";
    else if (isNaN(formData.weeklyHours) || formData.weeklyHours < 1 || formData.weeklyHours > 168) {
      errors.weeklyHours = "Weekly hours must be between 1 and 168";
    }

    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      if (start > end) {
        errors.endDate = "End date must be after start date";
      }
    }

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setServerValidationErrors({});
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      // Check teacher assignment first
      const userResponse = await axios.get('/api/user/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!userResponse.data.teacher) {
        setError("No teacher assigned to this student. Please contact your administrator.");
        setIsSubmitting(false);
        return;
      }

      const validationErrors = await validateForm();
      if (Object.keys(validationErrors).length > 0) {
        setServerValidationErrors(validationErrors);
        setIsSubmitting(false);
        return;
      }

      // Prepare data with proper types
      const submissionData = {
        studentName: formData.studentName.trim(),
        studentId: formData.studentId.trim(),
        companyName: formData.companyName.trim(),
        location: formData.location.trim(),
        verifiedLocation: formData.verifiedLocation.trim(),
        industryType: formData.industryType,
        supervisorName: formData.supervisorName.trim(),
        supervisorContact: formData.supervisorContact.trim(),
        supervisorEmail: formData.supervisorEmail.trim(),
        startDate: new Date(formData.startDate).toISOString(),
        endDate: new Date(formData.endDate).toISOString(),
        weeklyHours: Number(formData.weeklyHours)
      };

      console.log('Submitting data:', submissionData); // Debug log

      const response = await axios.post(
        'http://localhost:4000/api/reports',
        submissionData,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.status === 200 || response.status === 201) {
        setSubmitSuccess(true);
      }
    } catch (error) {
      console.error("Submission error:", error.response?.data || error.message);
      
      if (error.response) {
        // Handle server validation errors
        if (error.response.status === 400) {
          if (error.response.data.errors) {
            setServerValidationErrors(error.response.data.errors);
            setError("Please fix the form errors below.");
          } else {
            setError(error.response.data.message || "Invalid data submitted. Please check all fields.");
          }
        } 
        else if (error.response.status === 401) {
          setError("Your session has expired. Please log in again.");
          // Optionally redirect to login
        }
        else if (error.response.status === 500) {
          setError("Server error. Please try again later.");
        }
        else {
          setError("Submission failed. Please try again.");
        }
      } else if (error.request) {
        setError("Network error. Please check your internet connection.");
      } else {
        setError(error.message || "An unexpected error occurred.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitSuccess) {
    return (
      <div className="max-w-3xl mx-auto bg-white border border-green-200 rounded-xl shadow-sm p-8 mt-8 text-center">
        <div className="text-green-500 text-5xl mb-4">✓</div>
        <h1 className="text-2xl font-semibold text-gray-800 mb-2">
          Submission Successful!
        </h1>
        <p className="text-gray-600 mb-6">
          Your attachment details have been successfully submitted.
        </p>
        <button
          onClick={() => {
            setSubmitSuccess(false);
            setFormData({
              studentName: "",
              studentId: "",
              companyName: "",
              location: "",
              verifiedLocation: "",
              industryType: "",
              supervisorName: "",
              supervisorContact: "",
              supervisorEmail: "",
              startDate: "",
              endDate: "",
              weeklyHours: "",
            });
            setLocationFetched(false);
          }}
          className="bg-blue-500 hover:bg-blue-600 text-white font-medium px-6 py-2 rounded-lg"
        >
          Submit Another
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto bg-white border border-gray-200 rounded-xl shadow-sm p-8 mt-8">
      <h1 className="text-2xl font-semibold text-center text-gray-800 mb-6">
        Attachment Details Submission
      </h1>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between mb-1">
          <span className="text-sm font-medium text-gray-700">
            Form Completion: {progress}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div
            className="bg-green-500 h-2.5 rounded-full"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">
                {error}
              </p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Student Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-700 font-medium mb-1">
              Student Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="studentName"
              value={formData.studentName}
              onChange={handleChange}
              className={`w-full px-4 py-2 border ${serverValidationErrors.studentName ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring focus:ring-blue-200`}
            />
            {serverValidationErrors.studentName && (
              <p className="mt-1 text-sm text-red-500">{serverValidationErrors.studentName}</p>
            )}
          </div>
          <div>
            <label className="block text-gray-700 font-medium mb-1">
              Student ID <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="studentId"
              value={formData.studentId}
              onChange={handleChange}
              className={`w-full px-4 py-2 border ${serverValidationErrors.studentId ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring focus:ring-blue-200`}
            />
            {serverValidationErrors.studentId && (
              <p className="mt-1 text-sm text-red-500">{serverValidationErrors.studentId}</p>
            )}
          </div>
        </div>

        {/* Company Name */}
        <div>
          <label className="block text-gray-700 font-medium mb-1">
            Company / Organization Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="companyName"
            value={formData.companyName}
            onChange={handleChange}
            className={`w-full px-4 py-2 border ${serverValidationErrors.companyName ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring focus:ring-blue-200`}
            placeholder="e.g. Safaricom Ltd"
          />
          {serverValidationErrors.companyName && (
            <p className="mt-1 text-sm text-red-500">{serverValidationErrors.companyName}</p>
          )}
        </div>

        {/* Location */}
        <div>
          <label className="block text-gray-700 font-medium mb-1">
            Attachment Location <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              className={`flex-1 px-4 py-2 border ${serverValidationErrors.location ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring focus:ring-blue-200`}
              placeholder="Physical address or GPS coordinates"
            />
            <button
              type="button"
              onClick={handleLocationFetch}
              className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
            >
              Get My Location
            </button>
          </div>
          {serverValidationErrors.location && (
            <p className="mt-1 text-sm text-red-500">{serverValidationErrors.location}</p>
          )}
          {locationFetched && (
            <p className="mt-1 text-sm text-green-600">
              ✓ {formData.verifiedLocation}
            </p>
          )}
        </div>

        {/* Industry Type */}
        <div>
          <label className="block text-gray-700 font-medium mb-1">
            Industry / Field <span className="text-red-500">*</span>
          </label>
          <select
            name="industryType"
            value={formData.industryType}
            onChange={handleChange}
            className={`w-full px-4 py-2 border ${serverValidationErrors.industryType ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring focus:ring-blue-200`}
          >
            <option value="">Select industry</option>
            <option value="Information Technology">Information Technology</option>
            <option value="Engineering">Engineering</option>
            <option value="Healthcare">Healthcare</option>
            <option value="Business">Business</option>
            <option value="Education">Education</option>
            <option value="Agriculture">Agriculture</option>
            <option value="Other">Other</option>
          </select>
          {serverValidationErrors.industryType && (
            <p className="mt-1 text-sm text-red-500">{serverValidationErrors.industryType}</p>
          )}
        </div>

        {/* Supervisor Details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-gray-700 font-medium mb-1">
              Mentor Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="supervisorName"
              value={formData.supervisorName}
              onChange={handleChange}
              className={`w-full px-4 py-2 border ${serverValidationErrors.supervisorName ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring focus:ring-blue-200`}
            />
            {serverValidationErrors.supervisorName && (
              <p className="mt-1 text-sm text-red-500">{serverValidationErrors.supervisorName}</p>
            )}
          </div>
          <div>
            <label className="block text-gray-700 font-medium mb-1">
              Mentor Contact Number <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              name="supervisorContact"
              value={formData.supervisorContact}
              onChange={handleChange}
              className={`w-full px-4 py-2 border ${serverValidationErrors.supervisorContact ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring focus:ring-blue-200`}
              placeholder="+2547XXXXXXXX"
            />
            {serverValidationErrors.supervisorContact && (
              <p className="mt-1 text-sm text-red-500">{serverValidationErrors.supervisorContact}</p>
            )}
          </div>
          <div>
            <label className="block text-gray-700 font-medium mb-1">
              Mentor Email (optional)
            </label>
            <input
              type="email"
              name="supervisorEmail"
              value={formData.supervisorEmail}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring focus:ring-blue-200"
              placeholder="mentor@example.com"
            />
          </div>
        </div>

        {/* Attachment Dates */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-gray-700 font-medium mb-1">
              Start Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              name="startDate"
              value={formData.startDate}
              onChange={handleChange}
              className={`w-full px-4 py-2 border ${serverValidationErrors.startDate ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring focus:ring-blue-200`}
            />
            {serverValidationErrors.startDate && (
              <p className="mt-1 text-sm text-red-500">{serverValidationErrors.startDate}</p>
            )}
          </div>
          <div>
            <label className="block text-gray-700 font-medium mb-1">
              End Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              name="endDate"
              value={formData.endDate}
              onChange={handleChange}
              className={`w-full px-4 py-2 border ${serverValidationErrors.endDate ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring focus:ring-blue-200`}
            />
            {serverValidationErrors.endDate && (
              <p className="mt-1 text-sm text-red-500">{serverValidationErrors.endDate}</p>
            )}
          </div>
          <div>
            <label className="block text-gray-700 font-medium mb-1">
              Weekly Hours <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="weeklyHours"
              value={formData.weeklyHours}
              onChange={handleChange}
              min="1"
              max="168"
              className={`w-full px-4 py-2 border ${serverValidationErrors.weeklyHours ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring focus:ring-blue-200`}
              placeholder="e.g. 40"
            />
            {serverValidationErrors.weeklyHours && (
              <p className="mt-1 text-sm text-red-500">{serverValidationErrors.weeklyHours}</p>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <div className="text-center mt-6">
          <button
            type="submit"
            disabled={isSubmitting}
            className={`px-8 py-3 font-semibold rounded-lg text-white ${
              isSubmitting ? "bg-gray-400 cursor-not-allowed" : "bg-green-600 hover:bg-green-700"
            }`}
          >
            {isSubmitting ? "Submitting..." : "Submit Details"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default StudentAttachmentForm;