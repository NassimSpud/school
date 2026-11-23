import React from "react";
import DashboardLayout from "../components/DashboardLayout";
import { Outlet } from "react-router-dom";
import { useAuth } from "../context/authContext";

const TeacherDashboard = () => {
  const { user } = useAuth();
  return (
    <DashboardLayout role={user?.role === "company_supervisor" ? "company_supervisor" : "teacher"}>
      <Outlet />
    </DashboardLayout>
  );
};

export default TeacherDashboard;
