import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  UserMinus, 
  Edit2, 
  Search, 
  ChevronUp, 
  ChevronDown,
  Filter,
  GraduationCap,
  Briefcase,
  Home
} from 'lucide-react';
import axios from 'axios';

const StudentManagement = () => {
  // Sample student data
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentStudent, setCurrentStudent] = useState(null);
  const [formData, setFormData] = useState({
    attachmentStatus: '',
    company: '',
    supervisor: ''
  });

  // Departments for filter dropdown
  const departments = ['IT', 'Agriculture', 'Electrical', 'Liberal', 'Building'];
  
  // Status options
  const statusOptions = ['On Attachment', 'Not Placed', 'Completed'];

  // Fetch data from API
  useEffect(() => {
    const fetchStudents = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('/api/students', {
          headers: { Authorization: `Bearer ${token}` }
        });
        // Ensure we always have an array
        setStudents(Array.isArray(res.data) ? res.data : []);
      } catch (error) {
        console.error('Failed to fetch students:', error);
        alert('Failed to load students data');
      } finally {
        setLoading(false);
      }
    };

    const fetchTeachers = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('/api/teachers', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setTeachers(res.data);
      } catch (error) {
        console.error('Failed to fetch teachers:', error);
      }
    };

    fetchStudents();
    fetchTeachers();
  }, []);

  // Handle sorting
  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Filter and sort students
  const filteredStudents = Array.isArray(students) 
    ? students.filter(student => {
      const matchesSearch = searchTerm === '' || 
        student.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.regNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.supervisor?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesDepartment = departmentFilter === 'all' || 
        student.department === departmentFilter;
      
      const matchesStatus = statusFilter === 'all' || 
        student.attachmentStatus === statusFilter;
      
      return matchesSearch && matchesDepartment && matchesStatus;
    }).sort((a, b) => {
      if (!sortConfig.key) return 0;
      
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    })
    : [];

  // Calculate statistics
  const studentsOnAttachment = filteredStudents.filter(student => 
    student.attachmentStatus === 'on_attachment' || student.attachmentStatus === 'approved'
  ).length;

  const studentsNotPlaced = filteredStudents.filter(student => 
    student.attachmentStatus === 'pending' || student.attachmentStatus === 'rejected'
  ).length;

  // Open edit modal
  const openEditModal = (student) => {
    setCurrentStudent(student);
    setFormData({
      attachmentStatus: student.attachmentStatus || '',
      company: student.company || '',
      supervisor: student.supervisor || ''
    });
    setIsModalOpen(true);
  };

  // Close modal
  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentStudent(null);
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.put(`/api/students/${currentStudent.id}/assign-teacher`, {
        teacherId: formData.supervisor
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Update local state
      const updatedStudents = students.map(student => 
        student.id === currentStudent.id ? { ...student, ...formData } : student
      );
      setStudents(updatedStudents);
      closeModal();
    } catch (error) {
      console.error('Failed to update student:', error);
      alert('Failed to update student information');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Student Attachment Management</h1>
        <p className="text-gray-600">View and manage student attachment information</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
          <div className="flex items-center">
            <Users className="h-6 w-6 text-blue-500 mr-2" />
            <h3 className="text-lg font-medium text-gray-700">Total Students</h3>
          </div>
          <p className="text-2xl font-bold mt-2">{students.length}</p>
        </div>

        <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
          <div className="flex items-center">
            <Briefcase className="h-6 w-6 text-green-500 mr-2" />
            <h3 className="text-lg font-medium text-gray-700">On Attachment</h3>
          </div>
          <p className="text-2xl font-bold mt-2">{studentsOnAttachment || 0}</p>
        </div>

        <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
          <div className="flex items-center">
            <Home className="h-6 w-6 text-purple-500 mr-2" />
            <h3 className="text-lg font-medium text-gray-700">Not Placed</h3>
          </div>
          <p className="text-2xl font-bold mt-2">{studentsNotPlaced || 0}</p>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div className="relative w-full md:w-96">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder="Search students by name, reg number, company..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex gap-3 w-full md:w-auto">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Filter className="h-5 w-5 text-gray-400" />
            </div>
            <select
              className="block w-full pl-10 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md appearance-none"
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
            >
              <option value="all">All Departments</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Filter className="h-5 w-5 text-gray-400" />
            </div>
            <select
              className="block w-full pl-10 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md appearance-none"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Statuses</option>
              {statusOptions.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Students Table */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-lg shadow">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => requestSort('name')}
                >
                  <div className="flex items-center">
                    Student Name
                    {sortConfig.key === 'name' && (
                      sortConfig.direction === 'asc' ? 
                        <ChevronUp className="ml-1 h-4 w-4" /> : 
                        <ChevronDown className="ml-1 h-4 w-4" />
                    )}
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => requestSort('regNumber')}
                >
                  <div className="flex items-center">
                    Reg Number
                    {sortConfig.key === 'regNumber' && (
                      sortConfig.direction === 'asc' ? 
                        <ChevronUp className="ml-1 h-4 w-4" /> : 
                        <ChevronDown className="ml-1 h-4 w-4" />
                    )}
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Class/Dept
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => requestSort('attachmentStatus')}
                >
                  <div className="flex items-center">
                    Status
                    {sortConfig.key === 'attachmentStatus' && (
                      sortConfig.direction === 'asc' ? 
                        <ChevronUp className="ml-1 h-4 w-4" /> : 
                        <ChevronDown className="ml-1 h-4 w-4" />
                    )}
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => requestSort('company')}
                >
                  <div className="flex items-center">
                    Company
                    {sortConfig.key === 'company' && (
                      sortConfig.direction === 'asc' ? 
                        <ChevronUp className="ml-1 h-4 w-4" /> : 
                        <ChevronDown className="ml-1 h-4 w-4" />
                    )}
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => requestSort('supervisor')}
                >
                  <div className="flex items-center">
                    Supervisor
                    {sortConfig.key === 'supervisor' && (
                      sortConfig.direction === 'asc' ? 
                        <ChevronUp className="ml-1 h-4 w-4" /> : 
                        <ChevronDown className="ml-1 h-4 w-4" />
                    )}
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredStudents.length > 0 ? (
                filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{student.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{student.regNumber}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">Class {student.classNumber}</div>
                      <div className="text-xs text-gray-500">{student.department}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full 
                        ${student.attachmentStatus === 'On Attachment' ? 'bg-green-100 text-green-800' : 
                          student.attachmentStatus === 'Not Placed' ? 'bg-red-100 text-red-800' :
                          'bg-blue-100 text-blue-800'}`}>
                        {student.attachmentStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {student.company || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {student.supervisor || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => openEditModal(student)}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        <Edit2 className="h-4 w-4 inline mr-1" />
                        Edit
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center text-sm text-gray-500">
                    No students found matching your criteria
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit Modal */}
      {isModalOpen && currentStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Edit Student Attachment</h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Student</label>
                <p className="text-gray-900 font-medium">{currentStudent.name} ({currentStudent.regNumber})</p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Attachment Status</label>
                <select
                  name="attachmentStatus"
                  value={formData.attachmentStatus}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {statusOptions.map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                <input
                  type="text"
                  name="company"
                  value={formData.company}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter company name"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Supervisor</label>
                <select
                  name="supervisor"
                  value={formData.supervisor}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select supervisor</option>
                  {teachers.map(teacher => (
                    <option key={teacher._id} value={teacher._id}>
                      {teacher.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentManagement;