import React, { useState, useEffect } from 'react';
import {
  FiUsers, FiFileText, FiAlertCircle,
  FiCalendar, FiSearch, FiMapPin, FiBell
} from 'react-icons/fi';
import axios from 'axios';

const TeacherDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showVisitModal, setShowVisitModal] = useState(false);
  const [newVisit, setNewVisit] = useState({
    date: "",
    purpose: "",
    location: "Nairobi",
    students: []
  });

  const fetchDashboardData = async () => {
    try {
      const response = await axios.get('/api/users/teacher/dashboard', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setDashboardData(response.data);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    }
  };

  const fetchNotifications = async () => {
    try {
      const response = await axios.get('/api/notifications', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setNotifications(response.data);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    fetchNotifications();
  }, []);

  const markNotificationAsRead = async (id) => {
    try {
      await axios.put(`/api/notifications/${id}/read`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      fetchNotifications();
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const unreadNotificationsCount = notifications.filter(n => !n.isRead).length;

  // Filter students based on search and location
  const filteredStudents = dashboardData.recentStudents
    .filter(student =>
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.company.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter(student => newVisit.location ? student.location === newVisit.location : true);

  const scheduleVisit = () => {
    // This function would need to be updated to work with the backend
    console.log("Scheduling visit:", newVisit);
    setShowVisitModal(false);
  };

  const DashboardCard = ({ title, value, icon, color }) => (
    <div className={`${color} p-4 rounded-lg shadow-sm flex items-center`}>
      <div className="mr-4 p-2 bg-white rounded-full">{icon}</div>
      <div>
        <p className="text-sm text-gray-600">{title}</p>
        <p className="text-2xl font-bold">{value}</p>
      </div>
    </div>
  );

  const Section = ({ title, children, icon }) => (
    <div>
      <div className="flex items-center mb-3">
        {icon && <span className="mr-2 text-gray-500">{icon}</span>}
        <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
      </div>
      {children}
    </div>
  );

  const StatusBadge = ({ status }) => {
    const statusStyles = {
      'On Track': 'bg-green-100 text-green-800',
      'Needs Attention': 'bg-yellow-100 text-yellow-800',
      'Behind Schedule': 'bg-red-100 text-red-800',
      'Completed': 'bg-blue-100 text-blue-800'
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusStyles[status] || 'bg-gray-100 text-gray-800'}`}>
        {status}
      </span>
    );
  };

  if (!dashboardData) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-8 flex items-center justify-center">
        <p className="text-gray-500">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Internship Supervisor Dashboard</h1>
            <p className="text-gray-600">Overview of student attachments</p>
          </div>
          <div className="relative">
            <button onClick={() => setShowNotifications(!showNotifications)} className="relative">
              <FiBell size={24} className="text-gray-600" />
              {unreadNotificationsCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {unreadNotificationsCount}
                </span>
              )}
            </button>
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg z-10">
                <div className="p-4 font-bold border-b">Notifications</div>
                <div className="max-h-96 overflow-y-auto">
                  {notifications.map(notification => (
                    <div
                      key={notification._id}
                      className={`p-4 border-b ${!notification.isRead ? 'bg-blue-50' : ''}`}
                      onClick={() => !notification.isRead && markNotificationAsRead(notification._id)}
                    >
                      <p className="font-semibold">{notification.sender.name}</p>
                      <p className="text-sm text-gray-600">{notification.message}</p>
                      <p className="text-xs text-gray-400">{new Date(notification.createdAt).toLocaleString()}</p>
                    </div>
                  ))}
                  {notifications.length === 0 && (
                    <p className="p-4 text-center text-gray-500">No notifications</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <DashboardCard
          title="Total Students"
          value={dashboardData.totalStudents}
          icon={<FiUsers className="text-blue-500" size={24} />}
          color="bg-blue-50"
        />
        <DashboardCard
          title="Nairobi Students"
          value={dashboardData.nairobiStudents}
          icon={<FiMapPin className="text-indigo-500" size={24} />}
          color="bg-indigo-50"
        />
        <DashboardCard
          title="Pending Evaluations"
          value={dashboardData.pendingEvaluations}
          icon={<FiFileText className="text-orange-500" size={24} />}
          color="bg-orange-50"
        />
        <DashboardCard
          title="Urgent Issues"
          value={dashboardData.urgentIssues}
          icon={<FiAlertCircle className="text-purple-500" size={24} />}
          color="bg-purple-50"
        />
      </div>

      {/* Schedule Visit Button */}
      <div className="mb-6">
        <button
          onClick={() => setShowVisitModal(true)}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center"
        >
          <FiCalendar className="mr-2" /> Schedule Group Visit
        </button>
      </div>

      {/* Visit Scheduling Modal */}
      {showVisitModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Schedule New Visit</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Visit Date</label>
                <input
                  type="date"
                  className="w-full p-2 border rounded"
                  value={newVisit.date}
                  onChange={(e) => setNewVisit({...newVisit, date: e.target.value})}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <select
                  className="w-full p-2 border rounded"
                  value={newVisit.location}
                  onChange={(e) => setNewVisit({...newVisit, location: e.target.value})}
                >
                  <option value="Nairobi">Nairobi</option>
                  <option value="Mombasa">Mombasa</option>
                  <option value="Kisumu">Kisumu</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Purpose</label>
                <input
                  type="text"
                  className="w-full p-2 border rounded"
                  placeholder="Evaluation, Inspection, etc."
                  value={newVisit.purpose}
                  onChange={(e) => setNewVisit({...newVisit, purpose: e.target.value})}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Students ({filteredStudents.length} in {newVisit.location})
                </label>
                <div className="max-h-60 overflow-y-auto border rounded">
                  {filteredStudents.map(student => (
                    <div key={student.id} className="p-2 border-b flex items-center">
                      <input
                        type="checkbox"
                        id={`student-${student.id}`}
                        checked={newVisit.students.includes(student.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewVisit({...newVisit, students: [...newVisit.students, student.id]});
                          } else {
                            setNewVisit({...newVisit, students: newVisit.students.filter(id => id !== student.id)});
                          }
                        }}
                        className="mr-2"
                      />
                      <label htmlFor={`student-${student.id}`} className="text-sm">
                        {student.name} - {student.company}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowVisitModal(false)}
                className="px-4 py-2 border rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={scheduleVisit}
                disabled={!newVisit.date || !newVisit.purpose || newVisit.students.length === 0}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-green-300"
              >
                Schedule Visit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Student List */}
        <div className="lg:col-span-2 space-y-6">
          {/* Student Search and Filter */}
          <Section title="Student Interns" icon={<FiUsers size={20} />}>
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="relative mb-4">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiSearch className="text-gray-400" />
                </div>
                <input
                  type="text"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Search students or companies..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Student Table */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredStudents.map((student) => (
                      <tr key={student.id} className="hover:bg-gray-50">
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="font-medium text-gray-900">{student.name}</div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-gray-500">{student.company}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-gray-500">
                          <div className="flex items-center">
                            <FiMapPin className="mr-1" size={14} />
                            {student.location}
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <StatusBadge status={student.status} />
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                          <button className="text-blue-600 hover:text-blue-900 mr-3">View</button>
                          <button className="text-green-600 hover:text-green-900">Evaluate</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredStudents.length === 0 && (
                  <div className="text-center py-6 text-gray-500">No students match your search</div>
                )}
              </div>
            </div>
          </Section>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Upcoming Visits */}
          <Section title="Upcoming Visits" icon={<FiCalendar size={20} />}>
            <div className="bg-white p-4 rounded-lg shadow">
              {dashboardData.upcomingVisits.map(visit => {
                const studentNames = dashboardData.recentStudents
                  .filter(s => visit.students.includes(s.id))
                  .map(s => s.name)
                  .join(", ");
                
                return (
                  <div key={visit.id} className="py-3 border-b border-gray-100 last:border-0">
                    <div className="flex items-start">
                      <FiCalendar className="text-blue-500 mt-1 mr-3 flex-shrink-0" />
                      <div>
                        <p className="font-medium">{visit.purpose}</p>
                        <div className="text-sm text-gray-600 mt-1">
                          <p><span className="font-medium">Date:</span> {new Date(visit.date).toLocaleDateString()}</p>
                          <p><span className="font-medium">Location:</span> {visit.location}</p>
                          <p><span className="font-medium">Students:</span> {studentNames}</p>
                          <p><span className="font-medium">Companies:</span> {visit.companies.join(", ")}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              {dashboardData.upcomingVisits.length === 0 && (
                <p className="text-gray-500 text-center py-4">No upcoming visits scheduled</p>
              )}
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;