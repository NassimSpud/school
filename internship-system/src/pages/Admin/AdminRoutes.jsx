import AdminHomePage from "./pages/AdminHomePage";
import AdminProfile from "./pages/AdminProfile";
import SeeComplains from "./pages/SeeComplains";
import AddNotice from "./pages/AddNotice";
import ShowNotices from "./pages/ShowNotices";
import ShowSubjects from "./pages/ShowSubjects";
import ViewSubject from "./pages/ViewSubject";
import ChooseClass from "./components/ChooseClass";
import SubjectForm from "./components/SubjectForm";
import StudentAttendance from "./components/StudentAttendance";
import StudentExamMarks from "./components/StudentExamMarks";
import AddClass from "./pages/AddClass";
import ShowClasses from "./pages/ShowClasses";
import ClassDetails from "./pages/ClassDetails";
import AddStudent from "./components/AddStudent";
import ShowStudents from "./pages/ShowStudents";
import ViewStudent from "./pages/ViewStudent";
import ShowTeachers from "./pages/ShowTeachers";
import TeacherDetails from "./pages/TeacherDetails";
import ChooseSubject from "./components/ChooseSubject";
import AddTeacher from "./components/AddTeacher";

export const AdminRoutes = [
  // Main routes
  { index: true, element: <AdminHomePage /> },
  { path: "dashboard", element: <AdminHomePage /> },
  { path: "profile", element: <AdminProfile /> },
  { path: "complains", element: <SeeComplains /> },

  // Notice routes
  { path: "addnotice", element: <AddNotice /> },
  { path: "notices", element: <ShowNotices /> },

  // Subject routes
  { path: "subjects", element: <ShowSubjects /> },
  { path: "subjects/subject/:classID/:subjectID", element: <ViewSubject /> },
  {
    path: "subjects/chooseclass",
    element: <ChooseClass situation="Subject" />,
  },
  { path: "addsubject/:id", element: <SubjectForm /> },
  { path: "class/subject/:classID/:subjectID", element: <ViewSubject /> },
  {
    path: "subject/student/attendance/:studentID/:subjectID",
    element: <StudentAttendance situation="Subject" />,
  },
  {
    path: "subject/student/marks/:studentID/:subjectID",
    element: <StudentExamMarks situation="Subject" />,
  },

  // Class routes
  { path: "addclass", element: <AddClass /> },
  { path: "classes", element: <ShowClasses /> },
  { path: "classes/class/:id", element: <ClassDetails /> },
  { path: "class/addstudents/:id", element: <AddStudent situation="Class" /> },

  // Student routes
  { path: "addstudents", element: <AddStudent situation="Student" /> },
  { path: "students", element: <ShowStudents /> },
  { path: "students/student/:id", element: <ViewStudent /> },
  {
    path: "students/student/attendance/:id",
    element: <StudentAttendance situation="Student" />,
  },
  {
    path: "students/student/marks/:id",
    element: <StudentExamMarks situation="Student" />,
  },

  // Teacher routes
  { path: "teachers", element: <ShowTeachers /> },
  { path: "teachers/teacher/:id", element: <TeacherDetails /> },
  {
    path: "teachers/chooseclass",
    element: <ChooseClass situation="Teacher" />,
  },
  {
    path: "teachers/choosesubject/:id",
    element: <ChooseSubject situation="Norm" />,
  },
  {
    path: "teachers/choosesubject/:classID/:teacherID",
    element: <ChooseSubject situation="Teacher" />,
  },
  { path: "teachers/addteacher/:id", element: <AddTeacher /> },

];
