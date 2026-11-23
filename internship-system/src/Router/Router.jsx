import React from "react";
import {
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Login from "../pages/Login";
import SetPassword from "../pages/SetPassword";
import AdminLayout from "../pages/AdminDashboard";
import StudentLayout from "../pages/StudentDashboard";
import TeacherLayout from "../pages/TeacherDashboard";
import { AdminRoutes } from "../pages/Admin/AdminRoutes";
import { TeacherRoutes } from "../pages/Teacher/TeacherRoutes";
import { StudentRoutes } from "../pages/Student/StudentRoutes";
import { ProtectedRoute } from "../components/protectedroute";


const AppRouter = () => {
  return (
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/admin/login" element={<Login adminOnly />} />
        <Route path="/set-password" element={<SetPassword />} />

        {/* Admin Routes */}
        <Route
          path="/admin"
          element={<ProtectedRoute roles={["admin"]} redirectTo="/admin/login" />}
        >
          <Route element={<AdminLayout />}>
            {AdminRoutes.map((route, index) => (
              <Route
                key={`admin-${index}`}
                index={route.index}
                path={route.path}
                element={route.element}
              />
            ))}
          </Route>
        </Route>

        {/* Teacher Routes */}
        <Route path="/teacher" element={<ProtectedRoute roles={["teacher"]} />}>
          <Route element={<TeacherLayout />}>
            {TeacherRoutes.map((route, index) => (
              <Route
                key={`teacher-${index}`}
                index={route.index}
                path={route.path}
                element={route.element}
              />
            ))}
          </Route>
        </Route>

        {/* Company Supervisor Routes */}
        <Route path="/company-supervisor" element={<ProtectedRoute roles={["company_supervisor"]} />}>
          <Route element={<TeacherLayout />}>
            {TeacherRoutes.map((route, index) => (
              <Route
                key={`company-supervisor-${index}`}
                index={route.index}
                path={route.path}
                element={route.element}
              />
            ))}
          </Route>
        </Route>

        {/* Student Routes */}
        <Route path="/student" element={<ProtectedRoute roles={["student"]} />}>
          <Route element={<StudentLayout />}>
            {StudentRoutes.map((route, index) => (
              <Route
                key={`student-${index}`}
                index={route.index}
                path={route.path}
                element={route.element}
              />
            ))}
          </Route>
        </Route>

        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
  );
};

export default AppRouter;
