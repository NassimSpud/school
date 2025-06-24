import React, { useState, useEffect } from 'react';
import { Building, Users, Calendar, ChevronUp, ChevronDown, Search, Filter } from 'lucide-react';

const ShowClasses = () => {
    // Sample data - replace with actual API calls
    const [classes, setClasses] = useState([
        { id: 1, classNumber: '249', department: 'IT', intake: 'September 2023', studentsOnAttachment: 15, totalStudents: 30 },
        { id: 2, classNumber: '251', department: 'IT', intake: 'January 2024', studentsOnAttachment: 12, totalStudents: 28 },
        { id: 3, classNumber: '245', department: 'Agriculture', intake: 'May 2023', studentsOnAttachment: 8, totalStudents: 25 },
        { id: 4, classNumber: '240', department: 'Electrical', intake: 'January 2023', studentsOnAttachment: 20, totalStudents: 35 },
        { id: 5, classNumber: '252', department: 'Building', intake: 'January 2024', studentsOnAttachment: 5, totalStudents: 18 },
        { id: 6, classNumber: '248', department: 'Liberal', intake: 'September 2023', studentsOnAttachment: 10, totalStudents: 22 },
    ]);

    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [departmentFilter, setDepartmentFilter] = useState('all');
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

    // Departments for filter dropdown
    const departments = ['IT', 'Agriculture', 'Electrical', 'Liberal', 'Building', 'Other'];

    // Fetch data from API (example)
    useEffect(() => {
        const fetchClasses = async () => {
            setLoading(true);
            try {
                // Replace with actual API call
                // const response = await fetch('/api/classes');
                // const data = await response.json();
                // setClasses(data);
            } catch (error) {
                console.error('Error fetching classes:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchClasses();
    }, []);

    // Handle sorting
    const requestSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    // Filter and sort classes
    const filteredClasses = classes
        .filter(cls => {
            const matchesSearch = searchTerm === '' || 
                cls.classNumber.includes(searchTerm) ||
                cls.department.toLowerCase().includes(searchTerm.toLowerCase());
            
            const matchesDepartment = departmentFilter === 'all' || 
                cls.department === departmentFilter;
            
            return matchesSearch && matchesDepartment;
        })
        .sort((a, b) => {
            if (!sortConfig.key) return 0;
            
            if (a[sortConfig.key] < b[sortConfig.key]) {
                return sortConfig.direction === 'asc' ? -1 : 1;
            }
            if (a[sortConfig.key] > b[sortConfig.key]) {
                return sortConfig.direction === 'asc' ? 1 : -1;
            }
            return 0;
        });

    // Calculate summary statistics
    const totalStudentsOnAttachment = classes.reduce((sum, cls) => sum + cls.studentsOnAttachment, 0);
    const totalStudents = classes.reduce((sum, cls) => sum + cls.totalStudents, 0);
    const attachmentPercentage = totalStudents > 0 
        ? Math.round((totalStudentsOnAttachment / totalStudents) * 100) 
        : 0;

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-800">Class Attachment Overview</h1>
                <p className="text-gray-600">View classes and their attachment statistics</p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
                    <div className="flex items-center">
                        <Building className="h-6 w-6 text-blue-500 mr-2" />
                        <h3 className="text-lg font-medium text-gray-700">Total Classes</h3>
                    </div>
                    <p className="text-2xl font-bold mt-2">{classes.length}</p>
                </div>

                <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
                    <div className="flex items-center">
                        <Users className="h-6 w-6 text-green-500 mr-2" />
                        <h3 className="text-lg font-medium text-gray-700">Students on Attachment</h3>
                    </div>
                    <p className="text-2xl font-bold mt-2">{totalStudentsOnAttachment} <span className="text-sm font-normal text-gray-500">({attachmentPercentage}%)</span></p>
                </div>

                <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
                    <div className="flex items-center">
                        <Users className="h-6 w-6 text-purple-500 mr-2" />
                        <h3 className="text-lg font-medium text-gray-700">Total Students</h3>
                    </div>
                    <p className="text-2xl font-bold mt-2">{totalStudents}</p>
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
                        placeholder="Search by class number or department..."
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
                </div>
            </div>

            {/* Classes Table */}
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
                                    onClick={() => requestSort('classNumber')}
                                >
                                    <div className="flex items-center">
                                        Class Number
                                        {sortConfig.key === 'classNumber' && (
                                            sortConfig.direction === 'asc' ? 
                                                <ChevronUp className="ml-1 h-4 w-4" /> : 
                                                <ChevronDown className="ml-1 h-4 w-4" />
                                        )}
                                    </div>
                                </th>
                                <th
                                    scope="col"
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                                    onClick={() => requestSort('department')}
                                >
                                    <div className="flex items-center">
                                        Department
                                        {sortConfig.key === 'department' && (
                                            sortConfig.direction === 'asc' ? 
                                                <ChevronUp className="ml-1 h-4 w-4" /> : 
                                                <ChevronDown className="ml-1 h-4 w-4" />
                                        )}
                                    </div>
                                </th>
                                <th
                                    scope="col"
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                                    onClick={() => requestSort('intake')}
                                >
                                    <div className="flex items-center">
                                        Intake
                                        <Calendar className="ml-1 h-4 w-4 text-gray-400" />
                                        {sortConfig.key === 'intake' && (
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
                                    Students
                                </th>
                                <th
                                    scope="col"
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                                    onClick={() => requestSort('studentsOnAttachment')}
                                >
                                    <div className="flex items-center">
                                        On Attachment
                                        {sortConfig.key === 'studentsOnAttachment' && (
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
                                    Percentage
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredClasses.length > 0 ? (
                                filteredClasses.map((cls) => {
                                    const percentage = Math.round((cls.studentsOnAttachment / cls.totalStudents) * 100);
                                    return (
                                        <tr key={cls.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-bold text-gray-900">Class {cls.classNumber}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 py-1 text-xs font-medium rounded-full 
                                                    ${cls.department === 'IT' ? 'bg-blue-100 text-blue-800' : 
                                                      cls.department === 'Agriculture' ? 'bg-green-100 text-green-800' :
                                                      cls.department === 'Electrical' ? 'bg-yellow-100 text-yellow-800' :
                                                      cls.department === 'Building' ? 'bg-orange-100 text-orange-800' :
                                                      cls.department === 'Liberal' ? 'bg-purple-100 text-purple-800' :
                                                      'bg-gray-100 text-gray-800'}`}>
                                                    {cls.department}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-500">{cls.intake}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-500">
                                                    <span className="font-medium">{cls.studentsOnAttachment}</span> / {cls.totalStudents}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="w-full bg-gray-200 rounded-full h-2.5">
                                                    <div 
                                                        className={`h-2.5 rounded-full 
                                                            ${percentage > 75 ? 'bg-green-600' : 
                                                              percentage > 50 ? 'bg-blue-600' : 
                                                              percentage > 25 ? 'bg-yellow-500' : 
                                                              'bg-red-600'}`}
                                                        style={{ width: `${percentage}%` }}
                                                    ></div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium">
                                                    {percentage}%
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">
                                        No classes found matching your criteria
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default ShowClasses;