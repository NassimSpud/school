import React, { useState, useEffect } from 'react';
import { 
  FiDownload, 
  FiMail, 
  FiPhone, 
  FiCalendar, 
  FiCheck, 
  FiX,
  FiEdit,
  FiSearch
} from 'react-icons/fi';

const TeacherAttachmentView = () => {
  const [submissions, setSubmissions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [evaluation, setEvaluation] = useState({
    status: '',
    score: '',
    comments: ''
  });

  // Fetch submissions from API (mock data for example)
  useEffect(() => {
    // Replace with actual API call
    const fetchSubmissions = async () => {
      // Mock data - replace with real fetch
      const mockData = [
        {
          id: 1,
          studentName: "Jane Doe",
          studentId: "CS2024001",
          companyName: "Tech Solutions Ltd",
          status: "Pending Review",
          submissionDate: "2024-05-15"
        },
        {
          id: 2,
          studentName: "John Smith",
          studentId: "CS2024002",
          companyName: "Digital Innovations",
          status: "Approved",
          submissionDate: "2024-05-10"
        }
      ];
      setSubmissions(mockData);
    };

    fetchSubmissions();
  }, []);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const filteredSubmissions = submissions.filter(sub =>
    sub.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sub.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sub.companyName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEvaluate = (submission) => {
    setSelectedSubmission(submission);
    setEvaluation({
      status: submission.status || 'Pending Review',
      score: submission.evaluationScore || '',
      comments: submission.teacherComments || ''
    });
  };

  const handleEvaluationSubmit = () => {
    // Update the submission with evaluation data
    const updatedSubmissions = submissions.map(sub =>
      sub.id === selectedSubmission.id
        ? { ...sub, ...evaluation }
        : sub
    );
    setSubmissions(updatedSubmissions);
    setSelectedSubmission(null);
    // Here you would also send the evaluation to your backend
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Student Attachment Submissions</h1>
      
      {/* Search and Filters */}
      <div className="mb-6">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FiSearch className="text-gray-400" />
          </div>
          <input
            type="text"
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full max-w-md"
            placeholder="Search students or companies..."
            value={searchTerm}
            onChange={handleSearch}
          />
        </div>
      </div>

      {/* Submissions Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted On</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredSubmissions.map((submission) => (
              <tr key={submission.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="font-medium">{submission.studentName}</div>
                  <div className="text-sm text-gray-500">{submission.studentId}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {submission.companyName}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(submission.submissionDate).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <StatusBadge status={submission.status} />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => handleEvaluate(submission)}
                    className="text-blue-600 hover:text-blue-900 mr-3"
                  >
                    View/Evaluate
                  </button>
                  <button className="text-gray-600 hover:text-gray-900">
                    <FiDownload className="inline" /> Download
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Evaluation Modal */}
      {selectedSubmission && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">
                Evaluate {selectedSubmission.studentName}'s Attachment
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="font-medium mb-2">Student Details</h3>
                  <p>{selectedSubmission.studentName} ({selectedSubmission.studentId})</p>
                  <p className="text-sm text-gray-600">
                    Submitted on: {new Date(selectedSubmission.submissionDate).toLocaleString()}
                  </p>
                </div>
                
                <div>
                  <h3 className="font-medium mb-2">Company Details</h3>
                  <p>{selectedSubmission.companyName}</p>
                  <p className="text-sm text-gray-600">
                    {selectedSubmission.location}
                  </p>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2">
                  Evaluation Status
                </label>
                <div className="flex gap-4">
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      className="form-radio"
                      name="status"
                      value="Approved"
                      checked={evaluation.status === 'Approved'}
                      onChange={() => setEvaluation({...evaluation, status: 'Approved'})}
                    />
                    <span className="ml-2">Approved</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      className="form-radio"
                      name="status"
                      value="Rejected"
                      checked={evaluation.status === 'Rejected'}
                      onChange={() => setEvaluation({...evaluation, status: 'Rejected'})}
                    />
                    <span className="ml-2">Rejected</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      className="form-radio"
                      name="status"
                      value="Pending Review"
                      checked={evaluation.status === 'Pending Review'}
                      onChange={() => setEvaluation({...evaluation, status: 'Pending Review'})}
                    />
                    <span className="ml-2">Pending</span>
                  </label>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2">
                  Evaluation Score (1-10)
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  className="w-20 px-3 py-2 border border-gray-300 rounded"
                  value={evaluation.score}
                  onChange={(e) => setEvaluation({...evaluation, score: e.target.value})}
                />
              </div>

              <div className="mb-6">
                <label className="block text-gray-700 font-medium mb-2">
                  Comments
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                  rows="4"
                  value={evaluation.comments}
                  onChange={(e) => setEvaluation({...evaluation, comments: e.target.value})}
                  placeholder="Provide feedback or additional instructions..."
                ></textarea>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setSelectedSubmission(null)}
                  className="px-4 py-2 border border-gray-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEvaluationSubmit}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Submit Evaluation
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const StatusBadge = ({ status }) => {
  const statusClasses = {
    'Approved': 'bg-green-100 text-green-800',
    'Rejected': 'bg-red-100 text-red-800',
    'Pending Review': 'bg-yellow-100 text-yellow-800'
  };

  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusClasses[status]}`}>
      {status}
    </span>
  );
};

export default TeacherAttachmentView;