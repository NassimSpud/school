import StudentHomePage from "./pages/StudentHomePage";
import StudentProfile from "./pages/StudentProfile";
import StudentSubjects from "./pages/StudentSubjects";
import ViewStdAttendance from "./pages/ViewStdAttendance";
import StudentAttachmentReport from "./pages/StudentAttachmentReport";
import StudentAttachmentForm from "./pages/StudentAttachmentForm";
import StudentLogBook from "./pages/StudentLgbook";

export const StudentRoutes = [
  // Main routes
  { index: true, element: <StudentHomePage /> },
  { path: "dashboard", element: <StudentHomePage /> },
  { path: "profile", element: <StudentProfile /> },

  // Academic routes
  { path: "subjects", element: <StudentSubjects /> },
  { path: "attendance", element: <ViewStdAttendance /> },
  { path: "report", element: <StudentAttachmentReport /> },

  // Attachment route
  { path: "attachment", element: <StudentAttachmentForm /> },
  // Logbook route
  { path: "logbook",element: <StudentLogBook /> },
];
