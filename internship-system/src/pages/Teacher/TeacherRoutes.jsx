import TeacherHomePage from "./pages/TeacherHomePage";
import TeacherProfile from "./pages/TeacherProfile";
import TeacherAttachmentView from "./pages/TeacherAttachmentView";
import TeacherClassDetails from "./pages/TeacherClassDetails";
import TeacherViewStudent from "./pages/TeacherViewStudent";
import StudentAttendance from "./components/StudentAttendance";
import StudentExamMarks from "./components/StudentExamMarks";
import TeacherAttendance from "./pages/TeacherAttendance";
export const TeacherRoutes = [
  // Main routes
  { index: true, element: <TeacherHomePage /> },
  { path: "dashboard", element: <TeacherHomePage /> },
  { path: "profile", element: <TeacherProfile /> },
  { path: "attachment view", element: <TeacherAttachmentView /> },

  // Class routes
  { path: "class", element: <TeacherClassDetails /> },
  { path: "class/student/:id", element: <TeacherViewStudent /> },
  {
    path: "class/student/attendance/:studentID/:subjectID",
    element: <StudentAttendance situation="Subject" />,
  },
  { path: "attendance", element: <TeacherAttendance /> },
  {
    path: "class/student/marks/:studentID/:subjectID",
    element: <StudentExamMarks situation="Subject" />,
  },
];
