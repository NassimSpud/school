import StudentHomePage from "./pages/StudentHomePage";
import StudentProfile from "./pages/StudentProfile";
import ViewStdAttendance from "./pages/ViewStdAttendance";
import StudentAttachmentReport from "./pages/StudentAttachmentReport";
import StudentAttachmentForm from "./pages/StudentAttachmentForm";
import StudentLogBook from "./pages/StudentLgbook";

export const StudentRoutes = [
  // Main routes
  { index: true, element: <StudentHomePage /> },
  { path: "dashboard", element: <StudentHomePage /> },
  { path: "profile", element: <StudentProfile /> },

  // Attachment routes
  { path: "attendance", element: <ViewStdAttendance /> },
  { path: "report", element: <StudentAttachmentReport /> },
  { path: "attachment", element: <StudentAttachmentForm /> },
  { path: "logbook", element: <StudentLogBook /> },
];
