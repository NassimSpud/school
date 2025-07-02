import React, { useState, useRef, useEffect } from "react";
import {
  Menu,
  Bell,
  Search,
  User,
  LogOut,
  Settings,
  HelpCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const UniversalNavbar = ({ role, toggleSidebar }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [userData, setUserData] = useState(null);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Load user data from session storage on mount
  useEffect(() => {
    const storedUser = sessionStorage.getItem("user");
    if (storedUser) {
      setUserData(JSON.parse(storedUser));
    }
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Get proper role name and color
  const getRoleInfo = (role) => {
    const roleMap = {
      admin: { name: "Admin", color: "bg-purple-600" },
      customer: { name: "Customer", color: "bg-blue-600" },
      advisor: { name: "Advisor", color: "bg-green-600" },
      teacher: { name: "Teacher", color: "bg-yellow-600" },
      student: { name: "Student", color: "bg-red-600" },
    };

    return (
      roleMap[role] || {
        name: role.charAt(0).toUpperCase() + role.slice(1),
        color: "bg-gray-600",
      }
    );
  };

  const roleInfo = getRoleInfo(role);

  // Get dashboard title based on role
  const getDashboardTitle = (role) => {
    const titleMap = {
      admin: "Admin Portal",
      customer: "Financial Dashboard",
      advisor: "Advisor Workspace",
      teacher: "Teacher Dashboard",
      student: "Learning Portal",
    };

    return titleMap[role] || `${roleInfo.name} Dashboard`;
  };

  // Get initials from name
  const getInitials = (name) => {
    if (!name) return roleInfo.name.charAt(0);
    const names = name.split(' ');
    return names.map(n => n[0]).join('').toUpperCase();
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleProfileClick = () => {
    navigate(`/${role}/profile`);
  };

  const handleLogout = () => {
    sessionStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <div className="sticky top-0 z-30 w-full bg-white shadow-sm px-4 py-3 flex justify-between items-center">
      {/* Left side with toggle and title */}
      <div className="flex items-center">
        <button
          onClick={toggleSidebar}
          className="md:hidden text-gray-600 hover:text-blue-600 mr-4 focus:outline-none"
          aria-label="Toggle sidebar"
        >
          <Menu size={20} />
        </button>
        <h1 className="text-lg font-semibold text-gray-800">
          {userData?.name
            ? `${userData.name}'s Dashboard`
            : getDashboardTitle(role)}
        </h1>
      </div>

      {/* Right side with search and profile */}
      <div className="flex items-center space-x-4">
        {/* Search - Hidden on small screens */}
        <div className="hidden md:flex items-center bg-gray-100 rounded-full px-3 py-2 focus-within:ring-2 focus-within:ring-blue-300 focus-within:bg-white transition duration-200">
          <Search size={16} className="text-gray-500" />
          <input
            type="text"
            placeholder="Search..."
            className="bg-transparent border-none outline-none text-sm px-2 w-40 lg:w-56"
          />
        </div>

        {/* Notifications */}
        <button
          className="relative p-2 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-300 transition duration-200"
          aria-label="Notifications"
        >
          <Bell size={18} className="text-gray-600" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white"></span>
        </button>

        {/* User profile with dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={toggleDropdown}
            className="flex items-center focus:outline-none"
            aria-label="User menu"
          >
            <div
              className={`h-8 w-8 rounded-full ${roleInfo.color} flex items-center justify-center text-white font-medium text-sm shadow-sm`}
            >
              {getInitials(userData?.name)}
            </div>
            <div className="ml-2 hidden md:block">
              <p className="text-xs font-medium text-gray-900">
                {userData?.name || roleInfo.name}
              </p>
              <p className="text-xs text-gray-500">
                {userData?.email || userData?.schoolId || roleInfo.name}
              </p>
            </div>
          </button>

          {/* Dropdown menu */}
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
              <div className="px-4 py-2 border-b border-gray-100">
                <p className="text-sm font-medium text-gray-900">
                  {userData?.name || roleInfo.name}
                </p>
                <p className="text-xs text-gray-500">
                  {userData?.email || userData?.schoolId || roleInfo.name}
                </p>
              </div>
              <button
                onClick={handleProfileClick}
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                <User size={16} className="mr-2" />
                Profile
              </button>

              <div className="border-t border-gray-100"></div>
              <button
                onClick={handleLogout}
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                <LogOut size={16} className="mr-2" />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UniversalNavbar;