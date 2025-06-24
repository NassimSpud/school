import React, { useState, useEffect } from 'react';
import {
  Users,
  FileText,
  Calendar,
  CheckCircle,
  AlertCircle,
  Search,
  ChevronUp,
  ChevronDown,
  Mail,
  Bell,
  Plus,
  Download
} from 'lucide-react';
import axios from 'axios';

const AdminHomePage = () => {
  const [stats, setStats] = useState({
    totalStudents: 0,
    activeAttachments: 0,
    pendingApprovals: 0,
    supervisors: 0
  });

  const [recentSubmissions, setRecentSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [statsRes, submissionsRes] = await Promise.all([
          axios.get('/api/admin/stats'),
          axios.get('/api/admin/recent-submissions')
        ]);

        setStats(statsRes.data);

        // Ensure data is an array
        setRecentSubmissions(Array.isArray(submissionsRes.data) ? submissionsRes.data : []);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
        alert('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const filteredSubmissions = recentSubmissions
    .filter(submission =>
      submission.studentName?.toLowerCase().includes(searchText.toLowerCase()) ||
      submission.companyName?.toLowerCase().includes(searchText.toLowerCase())
    )
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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800">Admin Dashboard</h2>
        <p className="text-gray-600">Overview of student attachments and supervision</p>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard icon={<Users className="h-6 w-6 text-blue-500" />} title="Total Students" value={stats.totalStudents} description="Registered for attachment" />
            <StatCard icon={<FileText className="h-6 w-6 text-green-500" />} title="Active Attachments" value={stats.activeAttachments} description="Currently ongoing" />
            <StatCard icon={<AlertCircle className="h-6 w-6 text-orange-500" />} title="Pending Approvals" value={stats.pendingApprovals} description="Require attention" />
            <StatCard icon={<CheckCircle className="h-6 w-6 text-purple-500" />} title="Supervisors" value={stats.supervisors} description="Assigned teachers" />
          </div>

          {/* Submissions Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden mb-8">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Recent Submissions</h3>
              <div className="relative w-64">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Search submissions..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {['studentName', 'companyName', 'status'].map((key) => (
                      <th
                        key={key}
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                        onClick={() => requestSort(key)}
                      >
                        <div className="flex items-center">
                          {key === 'studentName' && 'Student'}
                          {key === 'companyName' && 'Company'}
                          {key === 'status' && 'Status'}
                          {sortConfig.key === key && (
                            sortConfig.direction === 'asc' ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />
                          )}
                        </div>
                      </th>
                    ))}
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supervisor</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredSubmissions.length > 0 ? (
                    filteredSubmissions.map((submission) => (
                      <tr key={submission.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{submission.studentName}</div>
                          <div className="text-sm text-gray-500">{submission.studentId}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{submission.companyName}</div>
                          <div className="text-sm text-gray-500">{submission.department}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {submission.supervisor ? (
                            <div className="text-sm text-gray-900">{submission.supervisor}</div>
                          ) : (
                            <span className="text-sm text-gray-500">Not assigned</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <StatusBadge status={submission.status} />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex justify-end space-x-2">
                            <button className="text-blue-600 hover:text-blue-900"><Mail className="h-5 w-5" /></button>
                            <button className="text-gray-600 hover:text-gray-900"><Download className="h-5 w-5" /></button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500">No submissions found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

const StatCard = ({ icon, title, value, description }) => (
  <div className="bg-white p-6 rounded-lg shadow">
    <div className="flex items-center space-x-4">
      <div className="p-2 bg-gray-100 rounded-full">{icon}</div>
      <div>
        <h4 className="text-xl font-semibold text-gray-800">{value}</h4>
        <p className="text-sm text-gray-500">{title}</p>
        <p className="text-xs text-gray-400">{description}</p>
      </div>
    </div>
  </div>
);

const StatusBadge = ({ status }) => {
  const colorMap = {
    approved: 'bg-green-100 text-green-800',
    pending: 'bg-yellow-100 text-yellow-800',
    rejected: 'bg-red-100 text-red-800',
    default: 'bg-gray-100 text-gray-800'
  };

  const color = colorMap[status?.toLowerCase()] || colorMap.default;

  return <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${color}`}>{status}</span>;
};

export default AdminHomePage;
