import React from "react";
import DashboardLayout from "../components/DashboardLayout";
import { Outlet } from "react-router-dom";

const TeacherDashboard = () => {
  return (
    <DashboardLayout role="teacher">
      <Outlet />
    </DashboardLayout>
  );
};

export default TeacherDashboard;
