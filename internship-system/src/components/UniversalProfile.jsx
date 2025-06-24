import React, { useState } from "react";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Shield,
  Settings,
  Camera,
  Save,
  Edit2,
  Bell,
  Lock,
  Briefcase,
  CreditCard,
  Book,
  GraduationCap,
} from "lucide-react";

const UserProfile = ({ role }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");

  // Default profile data for each role
  const roleProfiles = {
    admin: {
      name: "Sarah Johnson",
      email: "sarah.johnson@company.com",
      phone: "+1 (555) 123-4567",
      location: "New York, NY",
      role: "System Administrator",
      department: "IT Operations",
      joinDate: "2021-03-15",
      lastLogin: "2024-01-20 14:30",
      bio: "Experienced system administrator with 8+ years in enterprise IT management. Specializes in cloud infrastructure and security protocols.",
    },
    customer: {
      name: "John Doe",
      email: "john.doe@customer.com",
      phone: "+1 (555) 987-6543",
      location: "San Francisco, CA",
      role: "Premium Customer",
      department: "Finance",
      joinDate: "2020-07-10",
      lastLogin: "2024-01-20 15:45",
      bio: "Financial services customer with focus on investment management and retirement planning.",
    },
    advisor: {
      name: "Michael Brown",
      email: "michael.brown@advisor.com",
      phone: "+1 (555) 456-7890",
      location: "Chicago, IL",
      role: "Senior Financial Advisor",
      department: "Wealth Management",
      joinDate: "2019-05-22",
      lastLogin: "2024-01-20 11:20",
      bio: "Certified financial advisor with 10+ years experience helping clients achieve their financial goals.",
    },
    teacher: {
      name: "Prof. Williams",
      email: "prof.williams@school.edu",
      phone: "+1 (555) 789-0123",
      location: "Boston, MA",
      role: "Senior Instructor",
      department: "Computer Science",
      joinDate: "2018-09-05",
      lastLogin: "2024-01-20 09:15",
      bio: "Dedicated educator with focus on computer science and financial technology courses.",
    },
    student: {
      name: "Alex Student",
      email: "alex.student@school.edu",
      phone: "+1 (555) 012-3456",
      location: "Austin, TX",
      role: "Graduate Student",
      department: "Finance",
      joinDate: "2022-01-10",
      lastLogin: "2024-01-20 16:30",
      bio: "Graduate student specializing in financial technology and investment strategies.",
    },
  };

  const [profileData, setProfileData] = useState(
    roleProfiles[role] || roleProfiles.admin
  );
  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    sms: true,
    security: true,
  });

  const handleInputChange = (field, value) => {
    setProfileData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleNotificationChange = (type) => {
    setNotifications((prev) => ({
      ...prev,
      [type]: !prev[type],
    }));
  };

  const handleSave = () => {
    setIsEditing(false);
    // Here you would typically save to backend
    console.log("Profile saved:", profileData);
  };

  // Role-specific tabs
  const getTabs = () => {
    const baseTabs = [
      { id: "profile", label: "Profile", icon: User },
      { id: "security", label: "Security", icon: Shield },
      { id: "notifications", label: "Notifications", icon: Bell },
    ];

    if (role === "admin") {
      baseTabs.push({ id: "settings", label: "Settings", icon: Settings });
    }
    if (role === "advisor" || role === "teacher") {
      baseTabs.push({
        id: "professional",
        label: "Professional",
        icon: Briefcase,
      });
    }
    if (role === "student") {
      baseTabs.push({ id: "academic", label: "Academic", icon: GraduationCap });
    }
    if (role === "customer") {
      baseTabs.push({ id: "financial", label: "Financial", icon: CreditCard });
    }

    return baseTabs;
  };

  const tabs = getTabs();

  // Role-specific icons
  const getRoleIcon = () => {
    switch (role) {
      case "admin":
        return <Shield className="w-5 h-5 text-purple-500" />;
      case "customer":
        return <CreditCard className="w-5 h-5 text-blue-500" />;
      case "advisor":
        return <Briefcase className="w-5 h-5 text-green-500" />;
      case "teacher":
        return <Book className="w-5 h-5 text-yellow-500" />;
      case "student":
        return <GraduationCap className="w-5 h-5 text-red-500" />;
      default:
        return <User className="w-5 h-5 text-gray-500" />;
    }
  };

  // Role-specific colors
  const getRoleColor = () => {
    switch (role) {
      case "admin":
        return "from-purple-600 to-indigo-600";
      case "customer":
        return "from-blue-600 to-cyan-600";
      case "advisor":
        return "from-green-600 to-teal-600";
      case "teacher":
        return "from-yellow-600 to-amber-600";
      case "student":
        return "from-red-600 to-pink-600";
      default:
        return "from-gray-600 to-slate-600";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl mb-6 overflow-hidden">
          <div className={`bg-gradient-to-r ${getRoleColor()} px-8 py-6`}>
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
                  <p className="text-blue-100 text-lg">{profileData.role}</p>
                  <p className="text-blue-200">{profileData.department}</p>
                </div>
              </div>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="bg-white/20 text-white px-6 py-3 rounded-xl hover:bg-white/30 transition-colors flex items-center space-x-2 backdrop-blur-sm"
              >
                <Edit2 className="w-4 h-4" />
                <span>{isEditing ? "Cancel" : "Edit Profile"}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-2xl shadow-xl mb-6 p-2">
          <div className="flex space-x-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-xl transition-all duration-200 ${
                    activeTab === tab.id
                      ? `bg-gradient-to-r ${getRoleColor()} text-white shadow-lg`
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content Area */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {activeTab === "profile" && (
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-800">
                  Profile Information
                </h2>
                {isEditing && (
                  <button
                    onClick={handleSave}
                    className={`bg-gradient-to-r ${getRoleColor()} text-white px-6 py-2 rounded-xl hover:opacity-90 transition-all flex items-center space-x-2 shadow-lg`}
                  >
                    <Save className="w-4 h-4" />
                    <span>Save Changes</span>
                  </button>
                )}
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Full Name
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={profileData.name}
                        onChange={(e) =>
                          handleInputChange("name", e.target.value)
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    ) : (
                      <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl">
                        <User className="w-5 h-5 text-gray-500" />
                        <span className="text-gray-800">
                          {profileData.name}
                        </span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Email Address
                    </label>
                    {isEditing ? (
                      <input
                        type="email"
                        value={profileData.email}
                        onChange={(e) =>
                          handleInputChange("email", e.target.value)
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    ) : (
                      <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl">
                        <Mail className="w-5 h-5 text-gray-500" />
                        <span className="text-gray-800">
                          {profileData.email}
                        </span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Phone Number
                    </label>
                    {isEditing ? (
                      <input
                        type="tel"
                        value={profileData.phone}
                        onChange={(e) =>
                          handleInputChange("phone", e.target.value)
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    ) : (
                      <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl">
                        <Phone className="w-5 h-5 text-gray-500" />
                        <span className="text-gray-800">
                          {profileData.phone}
                        </span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Location
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={profileData.location}
                        onChange={(e) =>
                          handleInputChange("location", e.target.value)
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    ) : (
                      <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl">
                        <MapPin className="w-5 h-5 text-gray-500" />
                        <span className="text-gray-800">
                          {profileData.location}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Role
                    </label>
                    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl">
                      {getRoleIcon()}
                      <span className="text-gray-800 font-medium">
                        {profileData.role}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Department
                    </label>
                    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl">
                      <span className="text-gray-800">
                        {profileData.department}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Join Date
                    </label>
                    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl">
                      <Calendar className="w-5 h-5 text-gray-500" />
                      <span className="text-gray-800">
                        {new Date(profileData.joinDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Last Login
                    </label>
                    <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-xl">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-gray-800">
                        {profileData.lastLogin}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Bio
                </label>
                {isEditing ? (
                  <textarea
                    value={profileData.bio}
                    onChange={(e) => handleInputChange("bio", e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                    placeholder="Tell us about yourself..."
                  />
                ) : (
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-gray-700 leading-relaxed">
                      {profileData.bio}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "security" && (
            <div className="space-y-8">
              <h2 className="text-2xl font-bold text-gray-800">
                Security Settings
              </h2>

              <div className="grid gap-6">
                <div className="bg-gradient-to-r from-red-50 to-orange-50 p-6 rounded-xl border border-red-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Lock className="w-6 h-6 text-red-500" />
                      <div>
                        <h3 className="font-semibold text-gray-800">
                          Change Password
                        </h3>
                        <p className="text-gray-600 text-sm">
                          Update your account password
                        </p>
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
                        <h3 className="font-semibold text-gray-800">
                          Two-Factor Authentication
                        </h3>
                        <p className="text-gray-600 text-sm">
                          Add an extra layer of security
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-green-600 font-medium">
                        Enabled
                      </span>
                      <div className="w-12 h-6 bg-green-500 rounded-full p-1">
                        <div className="w-4 h-4 bg-white rounded-full ml-auto"></div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-800 mb-2">
                        Active Sessions
                      </h3>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">
                            Chrome on Windows • {profileData.location}
                          </span>
                          <span className="text-green-600 font-medium">
                            Current
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">
                            Safari on iPhone • {profileData.location}
                          </span>
                          <button className="text-red-500 hover:text-red-700">
                            Revoke
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "notifications" && (
            <div className="space-y-8">
              <h2 className="text-2xl font-bold text-gray-800">
                Notification Preferences
              </h2>

              <div className="space-y-6">
                {Object.entries(notifications).map(([type, enabled]) => (
                  <div
                    key={type}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <Bell className="w-5 h-5 text-gray-500" />
                      <div>
                        <h3 className="font-medium text-gray-800 capitalize">
                          {type} Notifications
                        </h3>
                        <p className="text-gray-600 text-sm">
                          Receive {type} notifications for important updates
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleNotificationChange(type)}
                      className={`w-12 h-6 rounded-full p-1 transition-colors ${
                        enabled ? "bg-blue-500" : "bg-gray-300"
                      }`}
                    >
                      <div
                        className={`w-4 h-4 bg-white rounded-full transition-transform ${
                          enabled ? "translate-x-6" : "translate-x-0"
                        }`}
                      ></div>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "settings" && role === "admin" && (
            <div className="space-y-8">
              <h2 className="text-2xl font-bold text-gray-800">
                Admin Settings
              </h2>

              <div className="grid gap-6">
                <div className="p-6 border border-gray-200 rounded-xl hover:shadow-md transition-shadow">
                  <h3 className="font-semibold text-gray-800 mb-2">
                    System Preferences
                  </h3>
                  <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <option>Default Settings</option>
                    <option>Advanced Settings</option>
                    <option>Custom Configuration</option>
                  </select>
                </div>

                <div className="p-6 border border-gray-200 rounded-xl hover:shadow-md transition-shadow">
                  <h3 className="font-semibold text-gray-800 mb-2">
                    User Management
                  </h3>
                  <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <option>Standard Permissions</option>
                    <option>Elevated Permissions</option>
                    <option>Custom Permissions</option>
                  </select>
                </div>

                <div className="p-6 border border-red-200 rounded-xl bg-red-50">
                  <h3 className="font-semibold text-red-800 mb-2">
                    Danger Zone
                  </h3>
                  <p className="text-red-600 text-sm mb-4">
                    These actions affect the entire system.
                  </p>
                  <button className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors mr-3">
                    Reset System
                  </button>
                  <button className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors">
                    Purge Database
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "professional" &&
            (role === "advisor" || role === "teacher") && (
              <div className="space-y-8">
                <h2 className="text-2xl font-bold text-gray-800">
                  Professional Information
                </h2>

                <div className="grid gap-6">
                  <div className="p-6 border border-gray-200 rounded-xl hover:shadow-md transition-shadow">
                    <h3 className="font-semibold text-gray-800 mb-2">
                      Professional Bio
                    </h3>
                    {isEditing ? (
                      <textarea
                        value={profileData.bio}
                        onChange={(e) =>
                          handleInputChange("bio", e.target.value)
                        }
                        rows={4}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                        placeholder="Tell us about your professional background..."
                      />
                    ) : (
                      <div className="p-4 bg-gray-50 rounded-xl">
                        <p className="text-gray-700 leading-relaxed">
                          {profileData.bio}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="p-6 border border-gray-200 rounded-xl hover:shadow-md transition-shadow">
                    <h3 className="font-semibold text-gray-800 mb-2">
                      Qualifications
                    </h3>
                    <div className="space-y-3">
                      {role === "advisor" && (
                        <>
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span>Certified Financial Planner (CFP)</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span>Series 7 License</span>
                          </div>
                        </>
                      )}
                      {role === "teacher" && (
                        <>
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span>PhD in Financial Economics</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span>Certified Educator</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

          {activeTab === "academic" && role === "student" && (
            <div className="space-y-8">
              <h2 className="text-2xl font-bold text-gray-800">
                Academic Information
              </h2>

              <div className="grid gap-6">
                <div className="p-6 border border-gray-200 rounded-xl hover:shadow-md transition-shadow">
                  <h3 className="font-semibold text-gray-800 mb-2">
                    Current Courses
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span>Financial Markets and Institutions</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span>Investment Analysis</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span>Portfolio Management</span>
                    </div>
                  </div>
                </div>

                <div className="p-6 border border-gray-200 rounded-xl hover:shadow-md transition-shadow">
                  <h3 className="font-semibold text-gray-800 mb-2">
                    Academic Progress
                  </h3>
                  <div className="h-4 w-full bg-gray-200 rounded-full">
                    <div
                      className="h-4 bg-green-500 rounded-full"
                      style={{ width: "75%" }}
                    ></div>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    75% of program completed
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "financial" && role === "customer" && (
            <div className="space-y-8">
              <h2 className="text-2xl font-bold text-gray-800">
                Financial Information
              </h2>

              <div className="grid gap-6">
                <div className="p-6 border border-gray-200 rounded-xl hover:shadow-md transition-shadow">
                  <h3 className="font-semibold text-gray-800 mb-2">
                    Investment Portfolio
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Stocks</span>
                      <span className="font-medium">$45,230 (65%)</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Bonds</span>
                      <span className="font-medium">$15,000 (22%)</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Cash</span>
                      <span className="font-medium">$8,770 (13%)</span>
                    </div>
                  </div>
                </div>

                <div className="p-6 border border-gray-200 rounded-xl hover:shadow-md transition-shadow">
                  <h3 className="font-semibold text-gray-800 mb-2">
                    Recent Transactions
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span>01/15/2024 - AAPL Purchase</span>
                      <span className="font-medium">-$5,000</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>01/10/2024 - MSFT Dividend</span>
                      <span className="font-medium text-green-600">+$342</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>01/05/2024 - Deposit</span>
                      <span className="font-medium text-green-600">
                        +$2,500
                      </span>
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

export default UserProfile;
