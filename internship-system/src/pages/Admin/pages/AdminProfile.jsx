import React, { useState } from 'react'
import { User, Mail, Phone, MapPin, Calendar, Shield, Settings, Camera, Save, Edit2, Bell, Lock } from 'lucide-react'

const AdminProfile = () => {
  const [isEditing, setIsEditing] = useState(false)
  const [activeTab, setActiveTab] = useState('profile')
  const [profileData, setProfileData] = useState({
    name: 'Sarah Johnson',
    email: 'sarah.johnson@company.com',
    phone: '+1 (555) 123-4567',
    location: 'New York, NY',
    role: 'System Administrator',
    department: 'IT Operations',
    joinDate: '2021-03-15',
    lastLogin: '2024-01-20 14:30',
    bio: 'Experienced system administrator with 8+ years in enterprise IT management. Specializes in cloud infrastructure and security protocols.'
  })

  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    sms: true,
    security: true
  })

  const handleInputChange = (field, value) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleNotificationChange = (type) => {
    setNotifications(prev => ({
      ...prev,
      [type]: !prev[type]
    }))
  }

  const handleSave = () => {
    setIsEditing(false)
    // Here you would typically save to backend
    console.log('Profile saved:', profileData)
  }

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'settings', label: 'Settings', icon: Settings }
  ]

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
                  <button className="absolute -bottom-2 -right-2 bg-blue-500 text-white p-2 rounded-full shadow-lg hover:bg-blue-600 transition-colors group-hover:scale-110 transform duration-200">
                    <Camera className="w-4 h-4" />
                  </button>
                </div>
                <div className="text-white">
                  <h1 className="text-3xl font-bold">{profileData.name}</h1>
                  <p className="text-blue-100 text-lg">{profileData.role}</p>
                  <p className="text-blue-200">{profileData.department}</p>
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
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Role</label>
                    <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-xl">
                      <Shield className="w-5 h-5 text-blue-500" />
                      <span className="text-gray-800 font-medium">{profileData.role}</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Department</label>
                    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl">
                      <span className="text-gray-800">{profileData.department}</span>
                    </div>
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
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-8">
              <h2 className="text-2xl font-bold text-gray-800">Security Settings</h2>
              
              <div className="grid gap-6">
                <div className="bg-gradient-to-r from-red-50 to-orange-50 p-6 rounded-xl border border-red-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Lock className="w-6 h-6 text-red-500" />
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

                <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-xl border border-green-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Shield className="w-6 h-6 text-green-500" />
                      <div>
                        <h3 className="font-semibold text-gray-800">Two-Factor Authentication</h3>
                        <p className="text-gray-600 text-sm">Add an extra layer of security</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-green-600 font-medium">Enabled</span>
                      <div className="w-12 h-6 bg-green-500 rounded-full p-1">
                        <div className="w-4 h-4 bg-white rounded-full ml-auto"></div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-800 mb-2">Active Sessions</h3>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Chrome on Windows • New York, NY</span>
                          <span className="text-green-600 font-medium">Current</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Safari on iPhone • New York, NY</span>
                          <button className="text-red-500 hover:text-red-700">Revoke</button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-8">
              <h2 className="text-2xl font-bold text-gray-800">Notification Preferences</h2>
              
              <div className="space-y-6">
                {Object.entries(notifications).map(([type, enabled]) => (
                  <div key={type} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                    <div className="flex items-center space-x-3">
                      <Bell className="w-5 h-5 text-gray-500" />
                      <div>
                        <h3 className="font-medium text-gray-800 capitalize">{type} Notifications</h3>
                        <p className="text-gray-600 text-sm">Receive {type} notifications for important updates</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleNotificationChange(type)}
                      className={`w-12 h-6 rounded-full p-1 transition-colors ${
                        enabled ? 'bg-blue-500' : 'bg-gray-300'
                      }`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full transition-transform ${
                        enabled ? 'translate-x-6' : 'translate-x-0'
                      }`}></div>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-8">
              <h2 className="text-2xl font-bold text-gray-800">Account Settings</h2>
              
              <div className="grid gap-6">
                <div className="p-6 border border-gray-200 rounded-xl hover:shadow-md transition-shadow">
                  <h3 className="font-semibold text-gray-800 mb-2">Time Zone</h3>
                  <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <option>Eastern Time (ET)</option>
                    <option>Pacific Time (PT)</option>
                    <option>Central Time (CT)</option>
                    <option>Mountain Time (MT)</option>
                  </select>
                </div>

                <div className="p-6 border border-gray-200 rounded-xl hover:shadow-md transition-shadow">
                  <h3 className="font-semibold text-gray-800 mb-2">Language</h3>
                  <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <option>English</option>
                    <option>Spanish</option>
                    <option>French</option>
                    <option>German</option>
                  </select>
                </div>

                <div className="p-6 border border-red-200 rounded-xl bg-red-50">
                  <h3 className="font-semibold text-red-800 mb-2">Danger Zone</h3>
                  <p className="text-red-600 text-sm mb-4">Once you delete your account, there is no going back.</p>
                  <button className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors">
                    Delete Account
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AdminProfile