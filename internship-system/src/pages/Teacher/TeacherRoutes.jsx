import TeacherHomePage from "./pages/TeacherHomePage";
import TeacherProfile from "./pages/TeacherProfile";
import TeacherAttachmentView from "./pages/TeacherAttachmentView";
import TeacherClassDetails from "./pages/TeacherClassDetails";
import TeacherViewStudent from "./pages/TeacherViewStudent";
export const TeacherRoutes = [
  // Main routes
  { index: true, element: <TeacherHomePage /> },
  { path: "dashboard", element: <TeacherHomePage /> },
  { path: "profile", element: <TeacherProfile /> },
  { path: "attachment view", element: <TeacherAttachmentView /> },

  // Class routes
  { path: "class", element: <TeacherClassDetails /> },
  { path: "class/student/:id", element: <TeacherViewStudent /> },
];
