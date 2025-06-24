import React, { useState } from 'react';
import { 
  FiUser, FiMail, FiPhone, FiCalendar, FiBook, 
  FiAward, FiBriefcase, FiMapPin, FiClock, FiUsers,
  FiEdit3, FiSave, FiX, FiPlus, FiTrash2
} from 'react-icons/fi';

const TeacherProfile = ({ teacher }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditing, setIsEditing] = useState(false);
  
  // Sample data - would normally come from props or API
  const [profileData, setProfileData] = useState({
    ...teacher,
    name: teacher?.name || "Dr. Jane Smith",
    title: teacher?.title || "Associate Professor",
    department: teacher?.department || "Computer Science",
    email: teacher?.email || "j.smith@university.edu",
    phone: teacher?.phone || "+1 (555) 123-4567",
    office: teacher?.office || "Building 4, Room 205",
    bio: teacher?.bio || "Dr. Smith specializes in Software Engineering and has over 15 years of teaching experience. She has supervised more than 50 student attachments and internships.",
    expertise: teacher?.expertise || ["Software Engineering", "Database Systems", "Machine Learning"],
    currentSupervisees: teacher?.currentSupervisees || 8,
    totalSupervised: teacher?.totalSupervised || 52,
    availability: teacher?.availability || [
      { day: "Monday", time: "10:00 AM - 12:00 PM" },
      { day: "Wednesday", time: "2:00 PM - 4:00 PM" },
      { day: "Friday", time: "9:00 AM - 11:00 AM" }
    ],
    recentActivities: teacher?.recentActivities || [
      { date: "2024-06-10", activity: "Conducted mid-term evaluations for supervisees" },
      { date: "2024-06-05", activity: "Published research paper in IEEE Journal" },
      { date: "2024-05-28", activity: "Attended industry partnership workshop" }
    ],
    supervisionApproach: teacher?.supervisionApproach || "Dr. Smith typically meets with supervisees bi-weekly to review progress. She emphasizes practical application of theoretical knowledge and maintains regular communication through email and scheduled meetings.",
    studentExpectations: teacher?.studentExpectations || [
      "Weekly progress reports submitted by Friday 5pm",
      "Prompt communication about any challenges",
      "Preparation before supervision meetings",
      "Adherence to academic and professional ethics"
    ],
    upcomingUnavailableDates: teacher?.upcomingUnavailableDates || [
      "June 20-22, 2024 - Academic Conference",
      "July 1-5, 2024 - Research Leave"
    ],
    recentPublications: teacher?.recentPublications || [
      { title: "Advanced Machine Learning Techniques in Education", journal: "IEEE Journal of Educational Technology, May 2024" },
      { title: "Industry-Academia Collaboration Models", journal: "International Conference on Computer Science, March 2024" }
    ],
    bookingInstructions: teacher?.bookingInstructions || "To schedule a meeting outside regular office hours, please contact me via email at least 48 hours in advance."
  });

  const [editData, setEditData] = useState({});

  const handleEdit = () => {
    setEditData({...profileData});
    setIsEditing(true);
  };

  const handleSave = () => {
    setProfileData({...editData});
    setIsEditing(false);
    // Here you would typically make an API call to save the data
    console.log('Saving profile data:', editData);
  };

  const handleCancel = () => {
    setEditData({});
    setIsEditing(false);
  };

  const handleInputChange = (field, value) => {
    setEditData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleExpertiseChange = (index, value) => {
    const newExpertise = [...editData.expertise];
    newExpertise[index] = value;
    setEditData(prev => ({
      ...prev,
      expertise: newExpertise
    }));
  };

  const addExpertise = () => {
    setEditData(prev => ({
      ...prev,
      expertise: [...prev.expertise, '']
    }));
  };

  const removeExpertise = (index) => {
    const newExpertise = editData.expertise.filter((_, i) => i !== index);
    setEditData(prev => ({
      ...prev,
      expertise: newExpertise
    }));
  };

  const handleAvailabilityChange = (index, field, value) => {
    const newAvailability = [...editData.availability];
    newAvailability[index] = { ...newAvailability[index], [field]: value };
    setEditData(prev => ({
      ...prev,
      availability: newAvailability
    }));
  };

  const addAvailability = () => {
    setEditData(prev => ({
      ...prev,
      availability: [...prev.availability, { day: '', time: '' }]
    }));
  };

  const removeAvailability = (index) => {
    const newAvailability = editData.availability.filter((_, i) => i !== index);
    setEditData(prev => ({
      ...prev,
      availability: newAvailability
    }));
  };

  const handleActivityChange = (index, field, value) => {
    const newActivities = [...editData.recentActivities];
    newActivities[index] = { ...newActivities[index], [field]: value };
    setEditData(prev => ({
      ...prev,
      recentActivities: newActivities
    }));
  };

  const addActivity = () => {
    setEditData(prev => ({
      ...prev,
      recentActivities: [...prev.recentActivities, { date: '', activity: '' }]
    }));
  };

  const removeActivity = (index) => {
    const newActivities = editData.recentActivities.filter((_, i) => i !== index);
    setEditData(prev => ({
      ...prev,
      recentActivities: newActivities
    }));
  };

  const handleExpectationChange = (index, value) => {
    const newExpectations = [...editData.studentExpectations];
    newExpectations[index] = value;
    setEditData(prev => ({
      ...prev,
      studentExpectations: newExpectations
    }));
  };

  const addExpectation = () => {
    setEditData(prev => ({
      ...prev,
      studentExpectations: [...prev.studentExpectations, '']
    }));
  };

  const removeExpectation = (index) => {
    const newExpectations = editData.studentExpectations.filter((_, i) => i !== index);
    setEditData(prev => ({
      ...prev,
      studentExpectations: newExpectations
    }));
  };

  const handleUnavailableDateChange = (index, value) => {
    const newDates = [...editData.upcomingUnavailableDates];
    newDates[index] = value;
    setEditData(prev => ({
      ...prev,
      upcomingUnavailableDates: newDates
    }));
  };

  const addUnavailableDate = () => {
    setEditData(prev => ({
      ...prev,
      upcomingUnavailableDates: [...prev.upcomingUnavailableDates, '']
    }));
  };

  const removeUnavailableDate = (index) => {
    const newDates = editData.upcomingUnavailableDates.filter((_, i) => i !== index);
    setEditData(prev => ({
      ...prev,
      upcomingUnavailableDates: newDates
    }));
  };

  const handlePublicationChange = (index, field, value) => {
    const newPublications = [...editData.recentPublications];
    newPublications[index] = { ...newPublications[index], [field]: value };
    setEditData(prev => ({
      ...prev,
      recentPublications: newPublications
    }));
  };

  const addPublication = () => {
    setEditData(prev => ({
      ...prev,
      recentPublications: [...prev.recentPublications, { title: '', journal: '' }]
    }));
  };

  const removePublication = (index) => {
    const newPublications = editData.recentPublications.filter((_, i) => i !== index);
    setEditData(prev => ({
      ...prev,
      recentPublications: newPublications
    }));
  };

  const currentData = isEditing ? editData : profileData;

  return (
    <div className="bg-gray-50 min-h-screen p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row gap-6 mb-8">
          {/* Profile Photo */}
          <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden border-4 border-white shadow">
            {currentData.photo ? (
              <img src={currentData.photo} alt={currentData.name} className="w-full h-full object-cover" />
            ) : (
              <FiUser className="text-gray-400" size={48} />
            )}
          </div>
          
          {/* Basic Info */}
          <div className="flex-1">
            {isEditing ? (
              <div className="space-y-4">
                <input
                  type="text"
                  value={currentData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="text-2xl md:text-3xl font-bold text-gray-800 bg-white border border-gray-300 rounded px-3 py-2 w-full"
                  placeholder="Full Name"
                />
                <input
                  type="text"
                  value={currentData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className="text-lg text-blue-600 font-medium bg-white border border-gray-300 rounded px-3 py-2 w-full"
                  placeholder="Job Title"
                />
                <input
                  type="text"
                  value={currentData.department}
                  onChange={(e) => handleInputChange('department', e.target.value)}
                  className="text-gray-600 bg-white border border-gray-300 rounded px-3 py-2 w-full"
                  placeholder="Department"
                />
              </div>
            ) : (
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800">{currentData.name}</h1>
                <p className="text-lg text-blue-600 font-medium">{currentData.title}</p>
                <p className="text-gray-600 mb-4">{currentData.department}</p>
              </div>
            )}
            
            <div className="flex flex-wrap gap-4 mt-4">
              {isEditing ? (
                <div className="space-y-2 w-full">
                  <input
                    type="email"
                    value={currentData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="flex items-center text-gray-700 bg-white border border-gray-300 rounded px-3 py-2 w-full"
                    placeholder="Email"
                  />
                  <input
                    type="tel"
                    value={currentData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="flex items-center text-gray-700 bg-white border border-gray-300 rounded px-3 py-2 w-full"
                    placeholder="Phone"
                  />
                  <input
                    type="text"
                    value={currentData.office}
                    onChange={(e) => handleInputChange('office', e.target.value)}
                    className="flex items-center text-gray-700 bg-white border border-gray-300 rounded px-3 py-2 w-full"
                    placeholder="Office Location"
                  />
                </div>
              ) : (
                <>
                  <div className="flex items-center text-gray-700">
                    <FiMail className="mr-2 text-blue-500" />
                    <span>{currentData.email}</span>
                  </div>
                  <div className="flex items-center text-gray-700">
                    <FiPhone className="mr-2 text-green-500" />
                    <span>{currentData.phone}</span>
                  </div>
                  <div className="flex items-center text-gray-700">
                    <FiMapPin className="mr-2 text-orange-500" />
                    <span>{currentData.office}</span>
                  </div>
                </>
              )}
            </div>
          </div>

         {/* Edit Button */}
<div className="flex gap-1">
  {isEditing ? (
    <>
      <button
        onClick={handleSave}
        className="flex items-center justify-center bg-green-600 text-white px-1.5 py-0.5 rounded text-xs hover:bg-green-700 transition-colors min-w-[50px] h-6"
      >
        <FiSave size={10} />
      </button>
      <button
        onClick={handleCancel}
        className="flex items-center justify-center bg-gray-600 text-white px-1.5 py-0.5 rounded text-xs hover:bg-gray-700 transition-colors min-w-[50px] h-6"
      >
        <FiX size={10} />
      </button>
    </>
  ) : (
    <button
      onClick={handleEdit}
      className="flex items-center justify-center bg-blue-600 text-white px-1.5 py-0.5 rounded text-xs hover:bg-blue-700 transition-colors min-w-[50px] h-6"
    >
      <FiEdit3 size={10} />
    </button>
  )}
</div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'overview' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('supervision')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'supervision' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
            >
              Supervision
            </button>
            <button
              onClick={() => setActiveTab('availability')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'availability' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
            >
              Availability
            </button>
            <button
              onClick={() => setActiveTab('activities')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'activities' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
            >
              Recent Activities
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow p-6">
          {activeTab === 'overview' && (
            <div>
              <h2 className="text-xl font-bold text-gray-800 mb-4">About</h2>
              {isEditing ? (
                <textarea
                  value={currentData.bio}
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded px-3 py-2 h-32 mb-6"
                  placeholder="Professional bio..."
                />
              ) : (
                <p className="text-gray-700 mb-6">{currentData.bio}</p>
              )}
              
              <h2 className="text-xl font-bold text-gray-800 mb-4">Areas of Expertise</h2>
              {isEditing ? (
                <div className="mb-6">
                  {currentData.expertise.map((area, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={area}
                        onChange={(e) => handleExpertiseChange(index, e.target.value)}
                        className="flex-1 bg-white border border-gray-300 rounded px-3 py-1"
                        placeholder="Area of expertise"
                      />
                      <button
                        onClick={() => removeExpertise(index)}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        <FiTrash2 size={16} />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={addExpertise}
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-800 mt-2"
                  >
                    <FiPlus size={16} />
                    Add Expertise
                  </button>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2 mb-6">
                  {currentData.expertise.map((area, index) => (
                    <span key={index} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                      {area}
                    </span>
                  ))}
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
                    <FiUsers className="mr-2 text-blue-500" />
                    Supervision Stats
                  </h3>
                  <div className="space-y-2">
                    <p className="flex justify-between">
                      <span className="text-gray-600">Current Supervisees:</span>
                      {isEditing ? (
                        <input
                          type="number"
                          value={currentData.currentSupervisees}
                          onChange={(e) => handleInputChange('currentSupervisees', parseInt(e.target.value))}
                          className="w-16 text-right bg-white border border-gray-300 rounded px-2 py-1"
                        />
                      ) : (
                        <span className="font-medium">{currentData.currentSupervisees}</span>
                      )}
                    </p>
                    <p className="flex justify-between">
                      <span className="text-gray-600">Total Supervised:</span>
                      {isEditing ? (
                        <input
                          type="number"
                          value={currentData.totalSupervised}
                          onChange={(e) => handleInputChange('totalSupervised', parseInt(e.target.value))}
                          className="w-16 text-right bg-white border border-gray-300 rounded px-2 py-1"
                        />
                      ) : (
                        <span className="font-medium">{currentData.totalSupervised}</span>
                      )}
                    </p>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
                    <FiBriefcase className="mr-2 text-green-500" />
                    Professional Details
                  </h3>
                  <div className="space-y-2">
                    <p className="flex justify-between">
                      <span className="text-gray-600">Department:</span>
                      {isEditing ? (
                        <input
                          type="text"
                          value={currentData.department}
                          onChange={(e) => handleInputChange('department', e.target.value)}
                          className="bg-white border border-gray-300 rounded px-2 py-1"
                        />
                      ) : (
                        <span className="font-medium">{currentData.department}</span>
                      )}
                    </p>
                    <p className="flex justify-between">
                      <span className="text-gray-600">Office:</span>
                      {isEditing ? (
                        <input
                          type="text"
                          value={currentData.office}
                          onChange={(e) => handleInputChange('office', e.target.value)}
                          className="bg-white border border-gray-300 rounded px-2 py-1"
                        />
                      ) : (
                        <span className="font-medium">{currentData.office}</span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'supervision' && (
            <div>
              <h2 className="text-xl font-bold text-gray-800 mb-4">Supervision Information</h2>
              
              <div className="mb-6">
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
                  <FiBook className="mr-2 text-purple-500" />
                  Supervision Approach
                </h3>
                {isEditing ? (
                  <textarea
                    value={currentData.supervisionApproach}
                    onChange={(e) => handleInputChange('supervisionApproach', e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded px-3 py-2 h-24"
                    placeholder="Describe your supervision approach..."
                  />
                ) : (
                  <p className="text-gray-700">{currentData.supervisionApproach}</p>
                )}
              </div>
              
              <div className="mb-6">
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
                  <FiAward className="mr-2 text-orange-500" />
                  Expectations for Students
                </h3>
                {isEditing ? (
                  <div className="space-y-2">
                    {currentData.studentExpectations.map((expectation, index) => (
                      <div key={index} className="flex gap-2">
                        <input
                          type="text"
                          value={expectation}
                          onChange={(e) => handleExpectationChange(index, e.target.value)}
                          className="flex-1 bg-white border border-gray-300 rounded px-3 py-1"
                          placeholder="Expectation"
                        />
                        <button
                          onClick={() => removeExpectation(index)}
                          className="text-red-500 hover:text-red-700 p-1"
                        >
                          <FiTrash2 size={16} />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={addExpectation}
                      className="flex items-center gap-2 text-blue-600 hover:text-blue-800 mt-2"
                    >
                      <FiPlus size={16} />
                      Add Expectation
                    </button>
                  </div>
                ) : (
                  <ul className="list-disc pl-5 text-gray-700 space-y-2">
                    {currentData.studentExpectations.map((expectation, index) => (
                      <li key={index}>{expectation}</li>
                    ))}
                  </ul>
                )}
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-800 mb-3">Current Supervisees (Sample)</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Program</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Attachment Site</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap">John Doe</td>
                        <td className="px-6 py-4 whitespace-nowrap">BSc Computer Science</td>
                        <td className="px-6 py-4 whitespace-nowrap">Tech Solutions Inc.</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                            Active
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap">Mary Johnson</td>
                        <td className="px-6 py-4 whitespace-nowrap">MSc Data Science</td>
                        <td className="px-6 py-4 whitespace-nowrap">Data Analytics Co.</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                            Mid-term
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'availability' && (
            <div>
              <h2 className="text-xl font-bold text-gray-800 mb-4">Office Hours & Availability</h2>
              
              <div className="mb-6">
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
                  <FiClock className="mr-2 text-blue-500" />
                  Regular Office Hours
                </h3>
                {isEditing ? (
                  <div className="space-y-2">
                    {currentData.availability.map((slot, index) => (
                      <div key={index} className="flex gap-2 items-center">
                        <input
                          type="text"
                          value={slot.day}
                          onChange={(e) => handleAvailabilityChange(index, 'day', e.target.value)}
                          className="bg-white border border-gray-300 rounded px-3 py-2 flex-1"
                          placeholder="Day"
                        />
                        <input
                          type="text"
                          value={slot.time}
                          onChange={(e) => handleAvailabilityChange(index, 'time', e.target.value)}
                          className="bg-white border border-gray-300 rounded px-3 py-2 flex-1"
                          placeholder="Time"
                        />
                        <button
                          onClick={() => removeAvailability(index)}
                          className="text-red-500 hover:text-red-700 p-1"
                        >
                          <FiTrash2 size={16} />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={addAvailability}
                      className="flex items-center gap-2 text-blue-600 hover:text-blue-800 mt-2"
                    >
                      <FiPlus size={16} />
                      Add Time Slot
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {currentData.availability.map((slot, index) => (
                      <div key={index} className="flex justify-between max-w-md">
                        <span className="font-medium">{slot.day}</span>
                        <span>{slot.time}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
                  <FiCalendar className="mr-2 text-green-500" />
                  Booking Instructions
                </h3>
                {isEditing ? (
                  <textarea
                    value={currentData.bookingInstructions}
                    onChange={(e) => handleInputChange('bookingInstructions', e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded px-3 py-2 h-20 mb-4"
                    placeholder="Booking instructions..."
                  />
                ) : (
                  <p className="text-gray-700 mb-4">{currentData.bookingInstructions}</p>
                )}
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-800 mb-2">Upcoming Unavailable Dates</h4>
                  {isEditing ? (
                    <div className="space-y-2">
                      {currentData.upcomingUnavailableDates.map((date, index) => (
                        <div key={index} className="flex gap-2">
                          <input
                            type="text"
                            value={date}
                            onChange={(e) => handleUnavailableDateChange(index, e.target.value)}
                            className="flex-1 bg-white border border-blue-200 rounded px-3 py-1"
                            placeholder="Unavailable date and reason"
                          />
                          <button
                            onClick={() => removeUnavailableDate(index)}
                            className="text-red-500 hover:text-red-700 p-1"
                          >
                            <FiTrash2 size={16} />
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={addUnavailableDate}
                        className="flex items-center gap-2 text-blue-600 hover:text-blue-800 mt-2"
                      >
                        <FiPlus size={16} />
                        Add Unavailable Date
                      </button>
                    </div>
                  ) : (
                    <ul className="text-blue-700 space-y-1">
                      {currentData.upcomingUnavailableDates.map((date, index) => (
                        <li key={index}>{date}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'activities' && (
            <div>
              <h2 className="text-xl font-bold text-gray-800 mb-4">Recent Activities</h2>
              
              {isEditing ? (
                <div className="space-y-4 mb-6">
                  {currentData.recentActivities.map((activity, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        value={activity.date}
                        onChange={(e) => handleActivityChange(index, 'date', e.target.value)}
                        className="bg-white border border-gray-300 rounded px-3 py-1 w-32"
                        placeholder="Date"
                      />
                      <input
                        type="text"
                        value={activity.activity}
                        onChange={(e) => handleActivityChange(index, 'activity', e.target.value)}
                        className="flex-1 bg-white border border-gray-300 rounded px-3 py-1"
                        placeholder="Activity"
                      />
                      <button
                        onClick={() => removeActivity(index)}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        <FiTrash2 size={16} />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={addActivity}
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-800 mt-2"
                  >
                    <FiPlus size={16} />
                    Add Activity
                  </button>
                </div>
              ) : (
                <div className="space-y-4 mb-6">
                  {currentData.recentActivities.map((activity, index) => (
                    <div key={index} className="border-l-4 border-blue-500 pl-4 py-1">
                      <div className="flex justify-between items-baseline">
                        <h3 className="font-medium text-gray-800">{activity.activity}</h3>
                        <span className="text-sm text-gray-500">{activity.date}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              <div>
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
                  <FiAward className="mr-2 text-purple-500" />
                  Recent Publications
                </h3>
                {isEditing ? (
                  <div className="space-y-4">
                    {currentData.recentPublications.map((pub, index) => (
                      <div key={index} className="flex gap-2">
                        <div className="flex-1 space-y-2">
                          <input
                            type="text"
                            value={pub.title}
                            onChange={(e) => handlePublicationChange(index, 'title', e.target.value)}
                            className="w-full bg-white border border-gray-300 rounded px-3 py-1"
                            placeholder="Publication title"
                          />
                          <input
                            type="text"
                            value={pub.journal}
                            onChange={(e) => handlePublicationChange(index, 'journal', e.target.value)}
                            className="w-full bg-white border border-gray-300 rounded px-3 py-1"
                            placeholder="Journal/conference"
                          />
                        </div>
                        <button
                          onClick={() => removePublication(index)}
                          className="text-red-500 hover:text-red-700 p-1"
                        >
                          <FiTrash2 size={16} />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={addPublication}
                      className="flex items-center gap-2 text-blue-600 hover:text-blue-800 mt-2"
                    >
                      <FiPlus size={16} />
                      Add Publication
                    </button>
                  </div>
                ) : (
                  <ul className="space-y-3">
                    {currentData.recentPublications.map((pub, index) => (
                      <li key={index} className="text-gray-700">
                        <p className="font-medium">"{pub.title}"</p>
                        <p className="text-sm text-gray-500">{pub.journal}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeacherProfile;