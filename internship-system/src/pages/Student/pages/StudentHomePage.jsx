import React, { useState, useEffect } from 'react';
import { 
  FiCalendar, FiMail, FiPhone, FiAward, FiFileText, 
  FiAlertTriangle, FiUser, FiMapPin, FiClock, FiCheckCircle 
} from 'react-icons/fi';

const StudentDashboard = ({ attachmentDetails }) => {
  const [dashboardData, setDashboardData] = useState({
    daysRemaining: 45,
    upcomingDeadlines: [
      { id: 2, title: "Mid-Term Evaluation", due: "2024-06-20", type: "evaluation" }
    ],
    recentReports: [
      { id: 1, title: "Student Report", date: "2024-06-08", status: "approved" },
    ],
    announcements: [
      { 
        id: 1, 
        title: "Supervisor Visit Scheduled", 
        date: "2024-06-18", 
        read: false,
        type: "visit",
        supervisor: "Dr. Jane Smith",
        dateTime: "June 18, 2024 at 10:00 AM",
        purpose: "Mid-term evaluation visit",
        location: "Tech Solutions Ltd, Nairobi",
        company: "Tech Solutions Ltd"
      },
      { 
        id: 2, 
        title: "Company Safety Training", 
        date: "2024-06-05", 
        read: true,
        type: "general"
      }
    ]
  });

  // Calculate attachment progress
  const [attachmentProgress, setAttachmentProgress] = useState(0);
  
  useEffect(() => {
    if (attachmentDetails?.startDate && attachmentDetails?.endDate) {
      const startDate = new Date(attachmentDetails.startDate);
      const endDate = new Date(attachmentDetails.endDate);
      const today = new Date();
      
      const totalDuration = endDate - startDate;
      const elapsedDuration = today - startDate;
      
      let progress = Math.round((elapsedDuration / totalDuration) * 100);
      progress = Math.min(100, Math.max(0, progress));
      setAttachmentProgress(progress);
      
      const daysRemaining = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
      setDashboardData(prev => ({
        ...prev,
        daysRemaining: daysRemaining > 0 ? daysRemaining : 0
      }));
    }
  }, [attachmentDetails]);

  // Mark announcement as read
  const markAsRead = (id) => {
    setDashboardData(prev => ({
      ...prev,
      announcements: prev.announcements.map(ann => 
        ann.id === id ? {...ann, read: true} : ann
      )
    }));
  };

  // Highlight upcoming visits
  const upcomingVisits = dashboardData.announcements.filter(
    a => a.type === 'visit' && new Date(a.date) >= new Date()
  );

  // Reusable Components
  const DashboardCard = ({ title, value, icon, color }) => (
    <div className={`${color} p-4 rounded-lg shadow-sm flex items-center`}>
      <div className="mr-4 p-2 bg-white rounded-full">{icon}</div>
      <div>
        <p className="text-sm text-gray-600">{title}</p>
        <p className="text-2xl font-bold">{value}</p>
      </div>
    </div>
  );

  const Section = ({ title, children, icon }) => (
    <div>
      <div className="flex items-center mb-3">
        {icon && <span className="mr-2 text-gray-500">{icon}</span>}
        <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
      </div>
      {children}
    </div>
  );

  const Timeline = ({ progress }) => {
    const weeks = [
      { week: 1, status: progress >= 20 ? 'completed' : progress >= 10 ? 'current' : 'upcoming', date: 'Jun 1-7' },
      { week: 2, status: progress >= 40 ? 'completed' : progress >= 30 ? 'current' : 'upcoming', date: 'Jun 8-14' },
      { week: 3, status: progress >= 60 ? 'completed' : progress >= 50 ? 'current' : 'upcoming', date: 'Jun 15-21' },
      { week: 4, status: progress >= 80 ? 'completed' : progress >= 70 ? 'current' : 'upcoming', date: 'Jun 22-28' },
      { week: 5, status: progress >= 100 ? 'completed' : progress >= 90 ? 'current' : 'upcoming', date: 'Jun 29-Jul 5' }
    ];

    return (
      <div className="flex overflow-x-auto pb-2">
        {weeks.map((item) => (
          <div key={item.week} className="flex-shrink-0 w-24 text-center">
            <div className={`h-2 mx-4 rounded-full ${
              item.status === 'completed' ? 'bg-green-500' : 
              item.status === 'current' ? 'bg-blue-500' : 'bg-gray-200'
            }`}></div>
            <div className="mt-2">
              <p className="text-sm font-medium">Week {item.week}</p>
              <p className="text-xs text-gray-500">{item.date}</p>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const DeadlineItem = ({ deadline }) => (
    <div className="py-3 border-b border-gray-100 last:border-0">
      <p className="font-medium">{deadline.title}</p>
      <div className="flex items-center text-sm text-gray-500 mt-1">
        <FiCalendar className="mr-1" size={14} />
        <span>Due: {deadline.due}</span>
      </div>
    </div>
  );

  const ReportItem = ({ report }) => (
    <div className="py-3 border-b border-gray-100 last:border-0">
      <p className="font-medium">{report.title}</p>
      <div className="flex justify-between text-sm mt-1">
        <span className="text-gray-500">Submitted: {report.date}</span>
        <span className={`px-2 py-1 rounded text-xs ${
          report.status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
        }`}>
          {report.status}
        </span>
      </div>
    </div>
  );

  const AnnouncementItem = ({ announcement }) => (
    <div 
      className={`py-3 border-b border-gray-100 last:border-0 ${!announcement.read ? 'bg-blue-50 -mx-4 px-4' : ''}`}
      onClick={() => !announcement.read && markAsRead(announcement.id)}
    >
      <div className="flex items-start">
        {!announcement.read && (
          <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mt-2 mr-2"></span>
        )}
        <div>
          <p className={`font-medium ${!announcement.read ? 'text-blue-800' : 'text-gray-700'}`}>
            {announcement.title}
          </p>
          <p className="text-sm text-gray-500">Posted: {announcement.date}</p>
        </div>
      </div>
    </div>
  );

  const VisitItem = ({ visit }) => (
    <div 
      className="py-3 border-b border-gray-100 last:border-0 bg-blue-50 -mx-4 px-4"
      onClick={() => !visit.read && markAsRead(visit.id)}
    >
      <div className="flex items-start">
        <FiCalendar className="text-blue-500 mt-1 mr-3 flex-shrink-0" />
        <div>
          <p className="font-medium text-blue-800">{visit.title}</p>
          <div className="mt-1 text-sm text-blue-700">
            <p><span className="font-medium">Date:</span> {visit.dateTime}</p>
            <p><span className="font-medium">Supervisor:</span> {visit.supervisor}</p>
            <p><span className="font-medium">Purpose:</span> {visit.purpose}</p>
            <p className="flex items-center mt-1">
              <FiMapPin className="mr-1" /> {visit.location}
            </p>
          </div>
          {!visit.read && (
            <div className="mt-2 flex items-center text-xs text-blue-600">
              <FiCheckCircle className="mr-1" /> Click to mark as read
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Student Dashboard</h1>
        <p className="text-gray-600">Welcome back! Here's your attachment progress</p>
      </div>

      {/* Special Visit Notification Banner */}
      {upcomingVisits.length > 0 && (
        <div className="mb-6 bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
          <div className="flex items-start">
            <FiCalendar className="text-blue-500 mt-1 mr-3 flex-shrink-0" size={20} />
            <div>
              <h3 className="font-bold text-blue-800">Upcoming Supervisor Visit</h3>
              {upcomingVisits.map(visit => (
                <div key={visit.id} className="mt-2">
                  <p>
                    <span className="font-medium">When:</span> {visit.dateTime}
                  </p>
                  <p>
                    <span className="font-medium">Purpose:</span> {visit.purpose}
                  </p>
                  <p>
                    <span className="font-medium">Where:</span> {visit.company}, {visit.location}
                  </p>
                  <p className="mt-2 text-sm text-blue-600 flex items-center">
                    <FiClock className="mr-1" /> 
                    Please ensure your work area and reports are ready for inspection
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <DashboardCard 
          title="Days Remaining" 
          value={dashboardData.daysRemaining} 
          icon={<FiCalendar className="text-blue-500" size={24} />} 
          color="bg-blue-50"
        />
        <DashboardCard 
          title="Upcoming Deadlines" 
          value={dashboardData.upcomingDeadlines.length} 
          icon={<FiAlertTriangle className="text-orange-500" size={24} />} 
          color="bg-orange-50"
        />
        <DashboardCard 
          title="Unread Announcements" 
          value={dashboardData.announcements.filter(a => !a.read).length} 
          icon={<FiMail className="text-red-500" size={24} />} 
          color="bg-red-50"
        />
        <DashboardCard 
          title="Submitted Reports" 
          value={dashboardData.recentReports.length} 
          icon={<FiAward className="text-green-500" size={24} />} 
          color="bg-green-50"
        />
      </div>

      {/* Attachment Progress */}
      <div className="mb-8">
        <div className="flex justify-between mb-2">
          <h2 className="text-lg font-semibold text-gray-800">Attachment Progress</h2>
          <span className="text-gray-700 font-medium">{attachmentProgress}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-4">
          <div 
            className="bg-green-500 h-4 rounded-full" 
            style={{ width: `${attachmentProgress}%` }}
          ></div>
        </div>
        {attachmentDetails && (
          <div className="flex justify-between mt-2 text-sm text-gray-600">
            <span>Start: {new Date(attachmentDetails.startDate).toLocaleDateString()}</span>
            <span>End: {new Date(attachmentDetails.endDate).toLocaleDateString()}</span>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Progress Timeline */}
          <Section title="Attachment Timeline" icon={<FiCalendar size={20} />}>
            <div className="bg-white p-4 rounded-lg shadow">
              <Timeline progress={attachmentProgress} />
            </div>
          </Section>

          {/* Recent Reports */}
          <Section title="Recent Reports" icon={<FiFileText size={20} />}>
            <div className="bg-white p-4 rounded-lg shadow">
              {dashboardData.recentReports.map(report => (
                <ReportItem key={report.id} report={report} />
              ))}
            </div>
          </Section>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Upcoming Deadlines */}
          <Section title="Upcoming Deadlines" icon={<FiAlertTriangle size={20} />}>
            <div className="bg-white p-4 rounded-lg shadow">
              {dashboardData.upcomingDeadlines.map(deadline => (
                <DeadlineItem key={deadline.id} deadline={deadline} />
              ))}
              {dashboardData.upcomingDeadlines.length === 0 && (
                <p className="text-gray-500 text-center py-4">No upcoming deadlines</p>
              )}
            </div>
          </Section>

          {/* Announcements */}
          <Section title="Announcements" icon={<FiMail size={20} />}>
            <div className="bg-white p-4 rounded-lg shadow">
              {dashboardData.announcements.map(announcement => (
                announcement.type === 'visit' ? (
                  <VisitItem key={announcement.id} visit={announcement} />
                ) : (
                  <AnnouncementItem key={announcement.id} announcement={announcement} />
                )
              ))}
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;