import React, { useState, useEffect, useRef } from 'react';
import { 
  MapPin, 
  Navigation, 
  Play, 
  Pause, 
  AlertTriangle, 
  CheckCircle,
  Clock,
  User,
  Phone,
  MessageCircle
} from 'lucide-react';
import { io } from 'socket.io-client';
import axios from 'axios';

const TeacherLocationTracker = () => {
  const [activeVisits, setActiveVisits] = useState([]);
  const [selectedVisit, setSelectedVisit] = useState(null);
  const [isTracking, setIsTracking] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [socket, setSocket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [locationError, setLocationError] = useState(null);
  
  const watchIdRef = useRef(null);
  const locationUpdateIntervalRef = useRef(null);

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

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  // Fetch active visits
  useEffect(() => {
    fetchActiveVisits();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      if (locationUpdateIntervalRef.current) {
        clearInterval(locationUpdateIntervalRef.current);
      }
    };
  }, []);

  const fetchActiveVisits = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/assessment-visits/active/teacher', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      setActiveVisits(response.data.visits);
    } catch (error) {
      console.error('Error fetching active visits:', error);
    } finally {
      setLoading(false);
    }
  };

  const startLocationTracking = (visit) => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by this browser');
      return;
    }

    setSelectedVisit(visit);
    setIsTracking(true);
    setLocationError(null);

    // Join visit room for real-time updates
    if (socket) {
      socket.emit('start_location_sharing', { visitId: visit._id });
    }

    // Start watching position
    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        const location = { latitude, longitude, accuracy };
        
        setCurrentLocation(location);
        
        // Update location in database and emit to students
        updateLocationInDatabase(visit._id, location);
        
        if (socket) {
          socket.emit('location_update', {
            visitId: visit._id,
            latitude,
            longitude,
            accuracy
          });
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        setLocationError(error.message);
        setIsTracking(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000
      }
    );

    // Update visit status to 'en_route'
    updateVisitStatus(visit._id, 'en_route', 'Started traveling to location');
  };

  const stopLocationTracking = () => {
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    if (locationUpdateIntervalRef.current) {
      clearInterval(locationUpdateIntervalRef.current);
      locationUpdateIntervalRef.current = null;
    }

    setIsTracking(false);
    setCurrentLocation(null);
    setSelectedVisit(null);
  };

  const updateLocationInDatabase = async (visitId, location) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`/api/assessment-visits/${visitId}/location`, location, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch (error) {
      console.error('Error updating location:', error);
    }
  };

  const updateVisitStatus = async (visitId, status, notes = '') => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(`/api/assessment-visits/${visitId}/status`, {
        status,
        notes,
        location: currentLocation
      }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      // Update local state
      setActiveVisits(prev => prev.map(visit => 
        visit._id === visitId ? { ...visit, status, timeline: response.data.visit.timeline } : visit
      ));

      // Emit status update via WebSocket
      if (socket) {
        socket.emit('visit_status_update', {
          visitId,
          status,
          notes
        });
      }
    } catch (error) {
      console.error('Error updating visit status:', error);
    }
  };

  const markAsArrived = (visit) => {
    updateVisitStatus(visit._id, 'arrived', 'Teacher has arrived at location');
    stopLocationTracking();
  };

  const startAssessment = (visit) => {
    updateVisitStatus(visit._id, 'in_progress', 'Assessment started');
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
          <h1 className="text-2xl font-bold text-gray-900">Assessment Visits</h1>
          <p className="text-gray-600">Manage your assessment visits and track your location</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">
            {activeVisits.length} active visit{activeVisits.length !== 1 ? 's' : ''}
          </p>
          {isTracking && (
            <div className="flex items-center space-x-2 text-green-600 text-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Location tracking active</span>
            </div>
          )}
        </div>
      </div>

      {/* Location Error */}
      {locationError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <p className="text-red-800 font-medium">Location Error</p>
          </div>
          <p className="text-red-700 text-sm mt-1">{locationError}</p>
        </div>
      )}

      {/* Current Tracking Status */}
      {isTracking && selectedVisit && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-blue-900">Currently tracking: {selectedVisit.title}</h3>
              <p className="text-blue-700 text-sm">Student: {selectedVisit.student.name}</p>
              {currentLocation && (
                <p className="text-blue-600 text-xs mt-1">
                  Location: {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
                  {currentLocation.accuracy && ` (±${Math.round(currentLocation.accuracy)}m)`}
                </p>
              )}
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => markAsArrived(selectedVisit)}
                className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors flex items-center space-x-1"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Mark Arrived</span>
              </button>
              <button
                onClick={stopLocationTracking}
                className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors flex items-center space-x-1"
              >
                <Pause className="w-4 h-4" />
                <span>Stop Tracking</span>
              </button>
            </div>
          </div>
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
              className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow"
            >
              {/* Visit Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {visit.title}
                  </h3>
                  <p className="text-sm text-gray-600">{visit.assessmentType.replace('_', ' ')}</p>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(visit.status)}`}>
                  {visit.status.replace('_', ' ')}
                </span>
              </div>

              {/* Student Info */}
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-gray-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{visit.student.name}</p>
                  <p className="text-xs text-gray-500">{visit.student.schoolId}</p>
                </div>
              </div>

              {/* Visit Details */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Clock className="w-4 h-4" />
                  <span>Scheduled: {formatDate(visit.scheduledDate)}</span>
                </div>
                
                {visit.destination && (
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <MapPin className="w-4 h-4" />
                    <span>{visit.destination.name || visit.destination.address}</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                {visit.status === 'scheduled' && (
                  <button
                    onClick={() => updateVisitStatus(visit._id, 'preparing', 'Getting ready for visit')}
                    className="w-full bg-yellow-50 text-yellow-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-yellow-100 transition-colors"
                  >
                    Mark as Preparing
                  </button>
                )}

                {visit.status === 'preparing' && (
                  <button
                    onClick={() => startLocationTracking(visit)}
                    disabled={isTracking}
                    className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-1"
                  >
                    <Play className="w-4 h-4" />
                    <span>Start Tracking</span>
                  </button>
                )}

                {visit.status === 'arrived' && (
                  <button
                    onClick={() => startAssessment(visit)}
                    className="w-full bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
                  >
                    Start Assessment
                  </button>
                )}

                {visit.status === 'in_progress' && (
                  <button
                    onClick={() => {/* Navigate to assessment form */}}
                    className="w-full bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                  >
                    Complete Assessment
                  </button>
                )}

                {/* Communication Buttons */}
                <div className="flex space-x-2">
                  <button className="flex-1 bg-gray-50 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors flex items-center justify-center space-x-1">
                    <MessageCircle className="w-4 h-4" />
                    <span>Chat</span>
                  </button>
                  
                  {visit.student.phone && (
                    <button className="bg-green-50 text-green-700 px-3 py-2 rounded-lg text-sm font-medium hover:bg-green-100 transition-colors flex items-center justify-center">
                      <Phone className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TeacherLocationTracker;
