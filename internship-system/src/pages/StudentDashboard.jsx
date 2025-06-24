import React from "react";
import DashboardLayout from "../components/DashboardLayout";
import { Outlet } from "react-router-dom";

const StudentDashboard = () => {
  return (
    <DashboardLayout role="student">
      <Outlet />
    </DashboardLayout>
  );
};

export default StudentDashboard;
