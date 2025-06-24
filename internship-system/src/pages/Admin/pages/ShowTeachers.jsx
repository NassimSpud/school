import React, { useState, useEffect } from 'react';
import {
  Search,
  ChevronUp,
  ChevronDown,
  UserPlus,
  UserMinus,
  Edit2
} from 'lucide-react';
import axios from 'axios';

const TeacherSupervisionManagement = () => {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentTeacher, setCurrentTeacher] = useState(null);
  const [formData, setFormData] = useState({
    isSupervisor: false,
    maxStudents: 5
  });

  useEffect(() => {
    fetchTeachers();
  }, []);
const fetchTeachers = async () => {
  setLoading(true);
  try {
    // Simulated mock data for now
    const mockData = [
      {
        id: 1,
        name: "Alice Kimani",
        email: "alice@school.com",
        department: "Computer Science",
        studentsSupervised: 10,
        isSupervisor: true,
        maxStudents: 15
      },
      {
        id: 2,
        name: "Brian Otieno",
        email: "brian@school.com",
        department: "Agriculture",
        studentsSupervised: 0,
        isSupervisor: false
      },
      {
        id: 3,
        name: "Cynthia Wambui",
        email: "cynthia@school.com",
        department: "Engineering",
        studentsSupervised: 3,
        isSupervisor: true,
        maxStudents: 5
      }
    ];

    setTeachers(mockData); // Set the mock data
  } catch (error) {
    console.error('Failed to fetch teachers:', error);
    alert('Failed to load teachers data');
  } finally {
    setLoading(false);
  }
};


  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const filteredTeachers = Array.isArray(teachers)
    ? teachers
        .filter((teacher) =>
          teacher.name?.toLowerCase().includes(searchText.toLowerCase()) ||
          teacher.email?.toLowerCase().includes(searchText.toLowerCase()) ||
          teacher.department?.toLowerCase().includes(searchText.toLowerCase())
        )
        .sort((a, b) => {
          if (!sortConfig.key) return 0;
          if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
          if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
          return 0;
        })
    : [];

  const showSupervisorModal = (teacher) => {
    setCurrentTeacher(teacher);
    setFormData({
      isSupervisor: teacher.isSupervisor || false,
      maxStudents: teacher.maxStudents || 5
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentTeacher(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await axios.put(`/api/admin/teachers/${currentTeacher.id}/supervisor`, formData);
      alert('Supervisor assignment updated successfully');
      fetchTeachers();
      closeModal();
    } catch (error) {
      console.error('Failed to update supervisor:', error);
      alert('Failed to update supervisor assignment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="container mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-1">
          Teacher Supervision Management
        </h2>
        <p className="text-gray-600 mb-6">
          Assign teachers as supervisors for students on attachment
        </p>

        <div className="mb-4 w-full md:w-96">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search teachers..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border rounded-md text-sm focus:ring focus:ring-blue-200"
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-10">Loading...</div>
        ) : (
          <div className="overflow-x-auto bg-white rounded-lg shadow">
            <table className="min-w-full">
              <thead className="bg-gray-100 text-left text-sm font-semibold text-gray-600">
                <tr>
                  <th
                    className="px-6 py-3 cursor-pointer"
                    onClick={() => requestSort("name")}
                  >
                    <div className="flex items-center">
                      Teacher
                      {sortConfig.key === "name" &&
                        (sortConfig.direction === "asc" ? (
                          <ChevronUp className="ml-1 h-4 w-4" />
                        ) : (
                          <ChevronDown className="ml-1 h-4 w-4" />
                        ))}
                    </div>
                  </th>
                  <th className="px-6 py-3">Department</th>
                  <th
                    className="px-6 py-3 cursor-pointer"
                    onClick={() => requestSort("studentsSupervised")}
                  >
                    <div className="flex items-center">
                      Students Supervised
                      {sortConfig.key === "studentsSupervised" &&
                        (sortConfig.direction === "asc" ? (
                          <ChevronUp className="ml-1 h-4 w-4" />
                        ) : (
                          <ChevronDown className="ml-1 h-4 w-4" />
                        ))}
                    </div>
                  </th>
                  <th className="px-6 py-3">Supervisor Status</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 text-sm">
                {filteredTeachers.length > 0 ? (
                  filteredTeachers.map((teacher) => (
                    <tr key={teacher.id}>
                      <td className="px-6 py-4">
                        <div className="font-medium">{teacher.name}</div>
                        <div className="text-gray-500">{teacher.email}</div>
                      </td>
                      <td className="px-6 py-4 text-gray-700">
                        {teacher.department}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                          {teacher.studentsSupervised || 0}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {teacher.isSupervisor ? (
                          <span className="bg-green-100 text-green-800 px-2 py-1 text-xs rounded">
                            Active Supervisor
                          </span>
                        ) : (
                          <span className="bg-gray-200 text-gray-800 px-2 py-1 text-xs rounded">
                            Not Assigned
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => showSupervisorModal(teacher)}
                            className={`px-2 py-1 text-xs rounded flex items-center ${
                              teacher.isSupervisor
                                ? "bg-orange-100 text-orange-800 hover:bg-orange-200"
                                : "bg-green-100 text-green-800 hover:bg-green-200"
                            }`}
                          >
                            {teacher.isSupervisor ? (
                              <Edit2 className="w-3 h-3 mr-1" />
                            ) : (
                              <UserPlus className="w-3 h-3 mr-1" />
                            )}
                            {teacher.isSupervisor ? "Edit" : "Assign"}
                          </button>
                          {teacher.isSupervisor && (
                            <button
                              onClick={() => {
                                if (
                                  window.confirm(
                                    `Remove ${teacher.name} as supervisor?`
                                  )
                                ) {
                                  // handleRemoveSupervisor(teacher.id); // implement if needed
                                }
                              }}
                              className="px-2 py-1 text-xs rounded bg-red-100 text-red-800 hover:bg-red-200 flex items-center"
                            >
                              <UserMinus className="w-3 h-3 mr-1" />
                              Remove
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="5"
                      className="px-6 py-4 text-center text-gray-500"
                    >
                      No teachers found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {isModalOpen && currentTeacher && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={closeModal}
          ></div>
          <div className="fixed inset-0 z-50 flex itopacityems-center justify-center">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 relative">
              <h3 className="text-lg font-semibold mb-4">
                Assign Supervisor Role
              </h3>
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">
                    Is Supervisor
                  </label>
                  <input
                    type="checkbox"
                    name="isSupervisor"
                    checked={formData.isSupervisor}
                    onChange={handleInputChange}
                    className="h-4 w-4"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">
                    Max Students
                  </label>
                  <input
                    type="number"
                    name="maxStudents"
                    value={formData.maxStudents}
                    onChange={handleInputChange}
                    className="w-full border rounded px-2 py-1"
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700"
                    disabled={loading}
                  >
                    Save
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default TeacherSupervisionManagement;
