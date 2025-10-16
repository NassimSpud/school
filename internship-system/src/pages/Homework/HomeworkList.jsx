import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Calendar, Clock, Users, BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const HomeworkList = () => {
  const [homework, setHomework] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('active');
  const [pagination, setPagination] = useState({});
  const [currentPage, setCurrentPage] = useState(1);

  // Get user role from localStorage or context
  const userRole = JSON.parse(localStorage.getItem('user'))?.role || 'student';

  // Fetch homework
  const fetchHomework = async (page = 1) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/homework', {
        headers: { 'Authorization': `Bearer ${token}` },
        params: {
          page,
          limit: 10,
          status: statusFilter
        }
      });

      setHomework(response.data.homework);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Error fetching homework:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHomework(currentPage);
  }, [currentPage, statusFilter]);

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get status color
  const getStatusColor = (homework) => {
    const now = new Date();
    const dueDate = new Date(homework.dueDate);
    
    if (!homework.isActive) return 'bg-gray-100 text-gray-800';
    if (now > dueDate) return 'bg-red-100 text-red-800';
    
    const hoursUntilDue = (dueDate - now) / (1000 * 60 * 60);
    if (hoursUntilDue <= 24) return 'bg-yellow-100 text-yellow-800';
    
    return 'bg-green-100 text-green-800';
  };

  // Get status text
  const getStatusText = (homework) => {
    const now = new Date();
    const dueDate = new Date(homework.dueDate);
    
    if (!homework.isActive) return 'Inactive';
    if (now > dueDate) return 'Overdue';
    
    const hoursUntilDue = (dueDate - now) / (1000 * 60 * 60);
    if (hoursUntilDue <= 24) return 'Due Soon';
    
    return 'Active';
  };

  // Filter homework based on search term
  const filteredHomework = homework.filter(hw =>
    hw.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    hw.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    hw.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {userRole === 'teacher' ? 'My Homework' : 'Assignments'}
          </h1>
          <p className="text-gray-600">
            {userRole === 'teacher' 
              ? 'Manage and track homework assignments'
              : 'View and submit your assignments'
            }
          </p>
        </div>
        {userRole === 'teacher' && (
          <Link
            to="/homework/create"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Create Homework</span>
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search homework..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="active">Active</option>
              <option value="all">All</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Homework List */}
      <div className="space-y-4">
        {filteredHomework.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No homework found</h3>
            <p className="text-gray-500">
              {userRole === 'teacher' 
                ? "You haven't created any homework yet."
                : "No assignments have been assigned to you yet."
              }
            </p>
          </div>
        ) : (
          filteredHomework.map((hw) => (
            <div key={hw._id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <Link
                      to={`/homework/${hw._id}`}
                      className="text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors"
                    >
                      {hw.title}
                    </Link>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(hw)}`}>
                      {getStatusText(hw)}
                    </span>
                  </div>

                  <p className="text-gray-600 mb-3 line-clamp-2">
                    {hw.description}
                  </p>

                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center space-x-1">
                      <BookOpen className="w-4 h-4" />
                      <span>{hw.subject}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>Due: {formatDate(hw.dueDate)}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="w-4 h-4" />
                      <span>{hw.timeRemaining}</span>
                    </div>
                    {userRole === 'teacher' && (
                      <div className="flex items-center space-x-1">
                        <Users className="w-4 h-4" />
                        <span>{hw.assignedTo?.length || 0} students</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col items-end space-y-2">
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {hw.maxPoints} points
                    </p>
                    {userRole === 'teacher' && (
                      <p className="text-xs text-gray-500">
                        {hw.totalSubmissions} submissions
                      </p>
                    )}
                  </div>

                  <Link
                    to={`/homework/${hw._id}`}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    View Details →
                  </Link>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex justify-center items-center space-x-2">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={!pagination.hasPrev}
            className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Previous
          </button>
          
          <span className="px-4 py-2 text-sm text-gray-600">
            Page {pagination.current} of {pagination.pages}
          </span>
          
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, pagination.pages))}
            disabled={!pagination.hasNext}
            className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default HomeworkList;
