import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Login from "../pages/Login";
import AdminLayout from "../pages/AdminDashboard";
import StudentLayout from "../pages/StudentDashboard";
import TeacherLayout from "../pages/TeacherDashboard";
import { AdminRoutes } from "../pages/Admin/AdminRoutes";
import { TeacherRoutes } from "../pages/Teacher/TeacherRoutes";
import { StudentRoutes } from "../pages/Student/StudentRoutes";
import { useAuth } from '../context/authContext';
import { ProtectedRoute } from "../components/protectedroute";


const AppRouter = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />

        {/* Admin Routes */}
        <Route path="/admin" element={<AdminLayout />}>
          {AdminRoutes.map((route, index) => (
            <Route
              key={`admin-${index}`}
              index={route.index}
              path={route.path}
              element={route.element}
            />
          ))}
        </Route>

        {/* Teacher Routes */}
        <Route path="/teacher" element={<TeacherLayout />}>
          {TeacherRoutes.map((route, index) => (
            <Route
              key={`teacher-${index}`}
              index={route.index}
              path={route.path}
              element={route.element}
            />
          ))}
        </Route>

        {/* Student Routes */}
        <Route path="/student" element={<StudentLayout />}>
          {StudentRoutes.map((route, index) => (
            <Route
              key={`student-${index}`}
              index={route.index}
              path={route.path}
              element={route.element}
            />
          ))}
        </Route>

        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
};

export default AppRouter;
