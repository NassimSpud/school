import AdminHomePage from "./pages/AdminHomePage";
import AdminProfile from "./pages/AdminProfile";
import AddStudent from "./components/AddStudent";
import ShowStudents from "./pages/ShowStudents";
import ViewStudent from "./pages/ViewStudent";
import ShowTeachers from "./pages/ShowTeachers";
import TeacherDetails from "./pages/TeacherDetails";
import AddTeacher from "./components/AddTeacher";

export const AdminRoutes = [
  // Main routes
  { index: true, element: <AdminHomePage /> },
  { path: "dashboard", element: <AdminHomePage /> },
  { path: "profile", element: <AdminProfile /> },

  // Student routes
  { path: "addstudents", element: <AddStudent situation="Student" /> },
  { path: "students", element: <ShowStudents /> },
  { path: "students/student/:id", element: <ViewStudent /> },

  // Teacher routes
  { path: "teachers", element: <ShowTeachers /> },
  { path: "teachers/teacher/:id", element: <TeacherDetails /> },
  { path: "teachers/addteacher/:id", element: <AddTeacher /> },
];
