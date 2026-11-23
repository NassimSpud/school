import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import api from '../../../utils/api';

const TeacherSupervisionManagement = () => {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  const fetchTeachers = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/api/admin/school-supervisors');
      setTeachers(data.map((supervisor) => ({
        ...supervisor,
        studentsSupervised: supervisor.students.length,
        isSupervisor: true
      })));
    } catch (error) {
      console.error('Failed to fetch school supervisors:', error);
      alert(error.response?.data?.message || 'Failed to load school supervisors');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTeachers();
  }, [fetchTeachers]);

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

  return (
    <>
      <div className="container mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-1">
          School Supervisor Assignments
        </h2>
        <p className="text-gray-600 mb-6">
          View school supervisors and their assigned students
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
                  <th className="px-6 py-3">Assigned Students</th>
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
                        <div>{teacher.students.length
                          ? teacher.students.map((student) => student.name).join(', ')
                          : 'No students assigned'}</div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="4"
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
    </>
  );
};

export default TeacherSupervisionManagement;
