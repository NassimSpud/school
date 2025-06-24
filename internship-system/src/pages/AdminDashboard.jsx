import React from "react";
import DashboardLayout from "../components/DashboardLayout";
import { Outlet } from "react-router-dom";

const AdminDashboard = () => {
  return (
    <DashboardLayout role="admin">
      <Outlet /> {/* This will render the nested admin routes */}
    </DashboardLayout>
  );
};

export default AdminDashboard;
