import React, { useState, useEffect } from 'react';
import { 
  MapPin, 
  Clock, 
  User, 
  Phone, 
  AlertTriangle, 
  CheckCircle, 
  Navigation,
  MessageCircle,
  FileText,
  Calendar
} from 'lucide-react';
import { io } from 'socket.io-client';
import axios from 'axios';

const StudentTrackingDashboard = () => {
  const [activeVisits, setActiveVisits] = useState([]);
  const [selectedVisit, setSelectedVisit] = useState(null);
  const [socket, setSocket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);

  // Initialize WebSocket connection
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const newSocket = io(process.env.REACT_APP_API_URL || 'http://localhost:4000', {
      auth: { token },
      transports: ['websocket', 'polling']
    });

    newSocket.on('connected', (data) => {
      console.log('Connected to assessment tracking:', data);
    });

    // Listen for teacher location updates
    newSocket.on('teacher_location_update', (data) => {
      setActiveVisits(prev => prev.map(visit => 
        visit._id === data.visitId 
          ? { ...visit, teacherLocation: data.location, formattedDistance: data.distance, timeUntilArrival: data.eta }
          : visit
      ));
    });

    // Listen for visit status updates
    newSocket.on('visit_status_update', (data) => {
      setActiveVisits(prev => prev.map(visit => 
        visit._id === data.visitId 
          ? { ...visit, status: data.status, timeline: data.timeline }
          : visit
      ));
      
      addNotification(`Visit status updated: ${data.status}`, 'info');
    });

    // Listen for assessment completion
    newSocket.on('assessment_completed', (data) => {
      setActiveVisits(prev => prev.map(visit => 
        visit._id === data.visitId 
          ? { ...visit, status: 'completed', assessmentResults: data.results }
          : visit
      ));
      
      addNotification('Your assessment has been completed!', 'success');
    });

    // Listen for visit cancellation
    newSocket.on('visit_cancelled', (data) => {
      setActiveVisits(prev => prev.filter(visit => visit._id !== data.visitId));
      addNotification(`Visit cancelled: ${data.reason}`, 'warning');
    });

    // Listen for emergency alerts
    newSocket.on('emergency_alert', (data) => {
      addNotification(`Emergency: ${data.message}`, 'error');
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  // Fetch active visits
  useEffect(() => {
    fetchActiveVisits();
  }, []);

  const fetchActiveVisits = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/assessment-visits/active/student', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      setActiveVisits(response.data.visits);
      
      // Join visit rooms for real-time updates
      if (socket) {
        response.data.visits.forEach(visit => {
          socket.emit('join_visit', { visitId: visit._id });
        });
      }
    } catch (error) {
      console.error('Error fetching active visits:', error);
    } finally {
      setLoading(false);
    }
  };

  const addNotification = (message, type) => {
    const notification = {
      id: Date.now(),
      message,
      type,
      timestamp: new Date()
    };
    
    setNotifications(prev => [notification, ...prev.slice(0, 4)]);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
    }, 5000);
  };

  const getStatusColor = (status) => {
    const colors = {
      scheduled: 'bg-blue-100 text-blue-800',
      preparing: 'bg-yellow-100 text-yellow-800',
      en_route: 'bg-orange-100 text-orange-800',
      nearby: 'bg-purple-100 text-purple-800',
      arrived: 'bg-green-100 text-green-800',
      in_progress: 'bg-indigo-100 text-indigo-800',
      completed: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status) => {
    const icons = {
      scheduled: <Calendar className="w-4 h-4" />,
      preparing: <Clock className="w-4 h-4" />,
      en_route: <Navigation className="w-4 h-4" />,
      nearby: <MapPin className="w-4 h-4" />,
      arrived: <CheckCircle className="w-4 h-4" />,
      in_progress: <User className="w-4 h-4" />,
      completed: <CheckCircle className="w-4 h-4" />
    };
    return icons[status] || <Clock className="w-4 h-4" />;
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

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
          <h1 className="text-2xl font-bold text-gray-900">Assessment Tracking</h1>
          <p className="text-gray-600">Track your upcoming assessments and teacher visits</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">
            {activeVisits.length} active visit{activeVisits.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Notifications */}
      {notifications.length > 0 && (
        <div className="space-y-2">
          {notifications.map(notification => (
            <div
              key={notification.id}
              className={`p-3 rounded-lg border-l-4 ${
                notification.type === 'success' ? 'bg-green-50 border-green-400 text-green-800' :
                notification.type === 'warning' ? 'bg-yellow-50 border-yellow-400 text-yellow-800' :
                notification.type === 'error' ? 'bg-red-50 border-red-400 text-red-800' :
                'bg-blue-50 border-blue-400 text-blue-800'
              }`}
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">{notification.message}</p>
                <span className="text-xs opacity-75">
                  {formatTime(notification.timestamp)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Active Visits */}
      {activeVisits.length === 0 ? (
        <div className="text-center py-12">
          <MapPin className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No active visits</h3>
          <p className="text-gray-500">You don't have any scheduled assessment visits at the moment.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {activeVisits.map(visit => (
            <div
              key={visit._id}
              className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => setSelectedVisit(visit)}
            >
              {/* Visit Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {visit.title}
                  </h3>
                  <p className="text-sm text-gray-600">{visit.assessmentType.replace('_', ' ')}</p>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full flex items-center space-x-1 ${getStatusColor(visit.status)}`}>
                  {getStatusIcon(visit.status)}
                  <span className="capitalize">{visit.status.replace('_', ' ')}</span>
                </span>
              </div>

              {/* Teacher Info */}
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                  {visit.teacher.profilePicture ? (
                    <img
                      src={visit.teacher.profilePicture}
                      alt={visit.teacher.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <User className="w-5 h-5 text-gray-500" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{visit.teacher.name}</p>
                  <p className="text-xs text-gray-500">{visit.teacher.email}</p>
                </div>
              </div>

              {/* Location & Time Info */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span>Scheduled: {formatDate(visit.scheduledDate)}</span>
                </div>
                
                {visit.destination && (
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <MapPin className="w-4 h-4" />
                    <span>{visit.destination.name || visit.destination.address}</span>
                  </div>
                )}

                {visit.teacherLocation && visit.formattedDistance && (
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Navigation className="w-4 h-4" />
                    <span>{visit.formattedDistance} away</span>
                    {visit.timeUntilArrival && (
                      <span className="text-blue-600 font-medium">
                        • ETA: {visit.timeUntilArrival}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Progress Indicator */}
              {visit.status === 'en_route' && visit.teacherLocation && (
                <div className="mb-4">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Teacher en route</span>
                    <span>Last updated: {formatTime(visit.teacherLocation.lastUpdated)}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ 
                        width: visit.distanceToDestination 
                          ? `${Math.max(10, 100 - (visit.distanceToDestination / 1000) * 10)}%`
                          : '10%'
                      }}
                    ></div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex space-x-2">
                <button className="flex-1 bg-blue-50 text-blue-700 px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors flex items-center justify-center space-x-1">
                  <MessageCircle className="w-4 h-4" />
                  <span>Chat</span>
                </button>
                
                {visit.teacher.phone && (
                  <button className="bg-green-50 text-green-700 px-3 py-2 rounded-lg text-sm font-medium hover:bg-green-100 transition-colors flex items-center justify-center">
                    <Phone className="w-4 h-4" />
                  </button>
                )}
                
                <button className="bg-gray-50 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Selected Visit Modal/Detail View */}
      {selectedVisit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{selectedVisit.title}</h2>
                  <p className="text-gray-600">{selectedVisit.description}</p>
                </div>
                <button
                  onClick={() => setSelectedVisit(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>

              {/* Detailed visit information would go here */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Status</label>
                    <div className={`mt-1 px-3 py-2 rounded-lg ${getStatusColor(selectedVisit.status)}`}>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(selectedVisit.status)}
                        <span className="capitalize">{selectedVisit.status.replace('_', ' ')}</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Assessment Type</label>
                    <p className="mt-1 text-gray-900 capitalize">{selectedVisit.assessmentType.replace('_', ' ')}</p>
                  </div>
                </div>

                {/* Timeline */}
                {selectedVisit.timeline && selectedVisit.timeline.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-gray-500 mb-3 block">Timeline</label>
                    <div className="space-y-2">
                      {selectedVisit.timeline.slice(-5).map((entry, index) => (
                        <div key={index} className="flex items-center space-x-3 text-sm">
                          <div className={`w-2 h-2 rounded-full ${getStatusColor(entry.status).split(' ')[0]}`}></div>
                          <span className="text-gray-500">{formatTime(entry.timestamp)}</span>
                          <span className="capitalize">{entry.status.replace('_', ' ')}</span>
                          {entry.notes && <span className="text-gray-600">- {entry.notes}</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentTrackingDashboard;
