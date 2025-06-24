import React, { useState, useEffect } from 'react';
import { 
  User, Mail, Phone, MapPin, Calendar, Book, 
  Briefcase, Users, Shield, Settings, Camera, 
  Save, Edit2, Bell, Clock, Award
} from 'lucide-react';

const StudentProfile = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [profileData, setProfileData] = useState({
    name: '',
    studentId: '',
    email: '',
    phone: '',
    location: '',
    program: '',
    year: '',
    department: '',
    joinDate: '',
    lastLogin: '',
    bio: '',
    skills: []
  });

  // Load user data from session storage on mount
  useEffect(() => {
    const storedUser = sessionStorage.getItem("user");
    if (storedUser) {
      const user = JSON.parse(storedUser);
      setProfileData({
        name: user.name || '',
        studentId: user.schoolId || '',
        email: user.email || '',
        phone: user.phone || '',
        location: user.location || '',
        program: user.program || '',
        year: user.year || '',
        department: user.department || '',
        joinDate: user.joinDate || new Date().toISOString(),
        lastLogin: user.lastLogin || new Date().toLocaleString(),
        bio: user.bio || '',
        skills: user.skills || []
      });
    }
  }, []);

  const handleInputChange = (field, value) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSkillsChange = (e) => {
    const skills = e.target.value.split(',').map(skill => skill.trim());
    setProfileData(prev => ({ ...prev, skills }));
  };

  const handleSave = () => {
    // Update session storage with new data
    const storedUser = JSON.parse(sessionStorage.getItem("user"));
    const updatedUser = {
      ...storedUser,
      name: profileData.name,
      email: profileData.email,
      schoolId: profileData.studentId,
      phone: profileData.phone,
      location: profileData.location,
      program: profileData.program,
      year: profileData.year,
      department: profileData.department,
      bio: profileData.bio,
      skills: profileData.skills
    };
    sessionStorage.setItem("user", JSON.stringify(updatedUser));
    setIsEditing(false);
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Shield }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl mb-6 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6">
                <div className="relative group">
                  <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-lg">
                    <User className="w-12 h-12 text-gray-600" />
                  </div>
                  {isEditing && (
                    <button className="absolute -bottom-2 -right-2 bg-blue-500 text-white p-2 rounded-full shadow-lg hover:bg-blue-600 transition-colors group-hover:scale-110 transform duration-200">
                      <Camera className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <div className="text-white">
                  <h1 className="text-3xl font-bold">{profileData.name}</h1>
                  <p className="text-blue-100 text-lg">{profileData.program}</p>
                  <p className="text-blue-200">Year {profileData.year} Student</p>
                </div>
              </div>
              <button 
                onClick={() => setIsEditing(!isEditing)}
                className="bg-white/20 text-white px-6 py-3 rounded-xl hover:bg-white/30 transition-colors flex items-center space-x-2 backdrop-blur-sm"
              >
                <Edit2 className="w-4 h-4" />
                <span>{isEditing ? 'Cancel' : 'Edit Profile'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-2xl shadow-xl mb-6 p-2">
          <div className="flex space-x-1">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-xl transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{tab.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Content Area */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {activeTab === 'profile' && (
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-800">Profile Information</h2>
                {isEditing && (
                  <button
                    onClick={handleSave}
                    className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-2 rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all flex items-center space-x-2 shadow-lg"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save Changes</span>
                  </button>
                )}
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={profileData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    ) : (
                      <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl">
                        <User className="w-5 h-5 text-gray-500" />
                        <span className="text-gray-800">{profileData.name}</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Student ID</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={profileData.studentId}
                        onChange={(e) => handleInputChange('studentId', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    ) : (
                      <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl">
                        <Book className="w-5 h-5 text-gray-500" />
                        <span className="text-gray-800">{profileData.studentId}</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                    {isEditing ? (
                      <input
                        type="email"
                        value={profileData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    ) : (
                      <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl">
                        <Mail className="w-5 h-5 text-gray-500" />
                        <span className="text-gray-800">{profileData.email}</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number</label>
                    {isEditing ? (
                      <input
                        type="tel"
                        value={profileData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    ) : (
                      <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl">
                        <Phone className="w-5 h-5 text-gray-500" />
                        <span className="text-gray-800">{profileData.phone}</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Location</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={profileData.location}
                        onChange={(e) => handleInputChange('location', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    ) : (
                      <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl">
                        <MapPin className="w-5 h-5 text-gray-500" />
                        <span className="text-gray-800">{profileData.location}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Academic Program</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={profileData.program}
                        onChange={(e) => handleInputChange('program', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    ) : (
                      <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-xl">
                        <Book className="w-5 h-5 text-blue-500" />
                        <span className="text-gray-800 font-medium">{profileData.program}</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Year of Study</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={profileData.year}
                        onChange={(e) => handleInputChange('year', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    ) : (
                      <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl">
                        <span className="text-gray-800">Year {profileData.year}</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Join Date</label>
                    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl">
                      <Calendar className="w-5 h-5 text-gray-500" />
                      <span className="text-gray-800">{new Date(profileData.joinDate).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Last Login</label>
                    <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-xl">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-gray-800">{profileData.lastLogin}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Bio</label>
                {isEditing ? (
                  <textarea
                    value={profileData.bio}
                    onChange={(e) => handleInputChange('bio', e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                    placeholder="Tell us about yourself..."
                  />
                ) : (
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-gray-700 leading-relaxed">{profileData.bio}</p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Skills</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={profileData.skills.join(', ')}
                    onChange={handleSkillsChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Enter skills separated by commas"
                  />
                ) : (
                  <div className="flex flex-wrap gap-2 p-4 bg-gray-50 rounded-xl">
                    {profileData.skills.map((skill, index) => (
                      <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                        {skill}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-8">
              <h2 className="text-2xl font-bold text-gray-800">Security Settings</h2>
              
              <div className="grid gap-6">
                <div className="bg-gradient-to-r from-red-50 to-orange-50 p-6 rounded-xl border border-red-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Shield className="w-6 h-6 text-red-500" />
                      <div>
                        <h3 className="font-semibold text-gray-800">Change Password</h3>
                        <p className="text-gray-600 text-sm">Update your account password</p>
                      </div>
                    </div>
                    <button className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors">
                      Change
                    </button>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-800 mb-2">Active Sessions</h3>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Current Session</span>
                          <span className="text-green-600 font-medium">Active</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentProfile;