import React, { useState } from 'react';
import { 
  FiUsers, 
  FiCalendar, 
  FiFileText, 
  FiMail, 
  FiPhone,
  FiAlertTriangle,
  FiCheckCircle,
  FiClock,
  FiSearch,
  FiChevronDown,
  FiChevronUp,
  FiDownload
} from 'react-icons/fi';

const TeacherClassDetails = () => {
  // Sample data - replace with API calls in real implementation
  const [classDetails, setClassDetails] = useState({
    className: "Computer Science 2024",
    program: "BSc Computer Science",
    totalStudents: 24,
    ongoingAttachments: 22,
    completedAttachments: 2,
    students: [
      {
        id: 1,
        name: "Jane Doe",
        studentId: "CS2024001",
        company: "Tech Solutions Ltd",
        supervisor: "John Smith",
        startDate: "2024-06-01",
        endDate: "2024-08-30",
        status: "On Track",
        lastReport: "2024-06-15",
        evaluation: "Pending",
        contact: "jane.doe@email.com"
      },
      {
        id: 2,
        name: "John Smith",
        studentId: "CS2024002",
        company: "Digital Innovations",
        supervisor: "Sarah Johnson",
        startDate: "2024-06-01",
        endDate: "2024-09-15",
        status: "Needs Attention",
        lastReport: "2024-06-10",
        evaluation: "Completed",
        contact: "john.smith@email.com"
      },
      // Add more students as needed
    ]
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [expandedStudent, setExpandedStudent] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'ascending' });

  // Filter students based on search
  const filteredStudents = classDetails.students.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.studentId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Sort students
  const sortedStudents = [...filteredStudents].sort((a, b) => {
    if (a[sortConfig.key] < b[sortConfig.key]) {
      return sortConfig.direction === 'ascending' ? -1 : 1;
    }
    if (a[sortConfig.key] > b[sortConfig.key]) {
      return sortConfig.direction === 'ascending' ? 1 : -1;
    }
    return 0;
  });

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const toggleStudentExpand = (studentId) => {
    setExpandedStudent(expandedStudent === studentId ? null : studentId);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">{classDetails.className}</h1>
        <div className="flex flex-wrap items-center gap-4 mt-2">
          <span className="text-gray-600">{classDetails.program}</span>
          <div className="flex items-center text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
            <FiUsers className="mr-1" />
            {classDetails.totalStudents} Students
          </div>
          <div className="flex items-center text-sm bg-green-100 text-green-800 px-3 py-1 rounded-full">
            <FiClock className="mr-1" />
            {classDetails.ongoingAttachments} Ongoing
          </div>
          <div className="flex items-center text-sm bg-purple-100 text-purple-800 px-3 py-1 rounded-full">
            <FiCheckCircle className="mr-1" />
            {classDetails.completedAttachments} Completed
          </div>
        </div>
      </div>

      {/* Search and Actions */}
      <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FiSearch className="text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder="Search students, companies, or IDs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center">
            <FiDownload className="mr-2" /> Export
          </button>
          <button className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300">
            Send Bulk Message
          </button>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => requestSort('name')}
                >
                  <div className="flex items-center">
                    Student
                    {sortConfig.key === 'name' && (
                      <span className="ml-1">
                        {sortConfig.direction === 'ascending' ? <FiChevronUp size={14} /> : <FiChevronDown size={14} />}
                      </span>
                    )}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Period</th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => requestSort('status')}
                >
                  <div className="flex items-center">
                    Status
                    {sortConfig.key === 'status' && (
                      <span className="ml-1">
                        {sortConfig.direction === 'ascending' ? <FiChevronUp size={14} /> : <FiChevronDown size={14} />}
                      </span>
                    )}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Report</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedStudents.map((student) => (
                <React.Fragment key={student.id}>
                  <tr className="hover:bg-gray-50 cursor-pointer" onClick={() => toggleStudentExpand(student.id)}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{student.name}</div>
                      <div className="text-sm text-gray-500">{student.studentId}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-gray-900">{student.company}</div>
                      <div className="text-sm text-gray-500">{student.supervisor}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                      {student.startDate} to {student.endDate}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={student.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                      {student.lastReport}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button 
                        className="text-blue-600 hover:text-blue-900 mr-3"
                        onClick={(e) => {
                          e.stopPropagation();
                          // View student action
                        }}
                      >
                        View
                      </button>
                      <button 
                        className="text-green-600 hover:text-green-900"
                        onClick={(e) => {
                          e.stopPropagation();
                          // Evaluate action
                        }}
                      >
                        Evaluate
                      </button>
                    </td>
                  </tr>
                  {expandedStudent === student.id && (
                    <tr className="bg-gray-50">
                      <td colSpan="6" className="px-6 py-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <h4 className="font-medium text-gray-900 mb-2">Contact Information</h4>
                            <div className="flex items-center text-sm text-gray-500 mb-1">
                              <FiMail className="mr-2" /> {student.contact}
                            </div>
                            <div className="flex items-center text-sm text-gray-500">
                              <FiPhone className="mr-2" /> {student.phone || 'Not provided'}
                            </div>
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900 mb-2">Supervisor Details</h4>
                            <div className="text-sm text-gray-500 mb-1">
                              {student.supervisor}
                            </div>
                            <div className="flex items-center text-sm text-gray-500">
                              <FiMail className="mr-2" /> {student.supervisorEmail || 'Not provided'}
                            </div>
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900 mb-2">Quick Actions</h4>
                            <div className="flex flex-wrap gap-2">
                              <button className="bg-blue-100 text-blue-800 px-3 py-1 rounded text-sm hover:bg-blue-200">
                                Message Student
                              </button>
                              <button className="bg-green-100 text-green-800 px-3 py-1 rounded text-sm hover:bg-green-200">
                                Request Report
                              </button>
                              <button className="bg-purple-100 text-purple-800 px-3 py-1 rounded text-sm hover:bg-purple-200">
                                Schedule Visit
                              </button>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
          {sortedStudents.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No students found matching your search
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Reusable Components
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

export default TeacherClassDetails;