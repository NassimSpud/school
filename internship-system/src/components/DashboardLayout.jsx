import React, { useState } from "react";
import UniversalSidebar from "./UniversalSidebar";
import UniversalNavbar from "./UniversalNavbar";
import UniversalProfile from "./UniversalProfile";

const DashboardLayout = ({ children, role }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);
  const toggleCollapse = () => setCollapsed((prev) => !prev);

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      <div
        className={`fixed h-full z-40 ${
          collapsed ? "w-16" : "w-56"
        } transition-all duration-300 hidden md:block`}
      >
        <UniversalSidebar
          role={role}
          isOpen={true}
          collapsed={collapsed}
          toggleCollapse={toggleCollapse}
        />
      </div>

      {/* Main Content */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ${
          collapsed ? "md:ml-16" : "md:ml-56"
        }`}
      >
        <UniversalNavbar role={role} toggleSidebar={toggleSidebar} />

        <main className="p-6 flex-1 overflow-y-auto">
          {/* Remove the demo cards and just render children */}
          {children}
        </main>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/30 bg-opacity-50 z-40 md:hidden"
            onClick={toggleSidebar}
          ></div>
          <div className="fixed inset-y-0 left-0 z-50 md:hidden w-64">
            <UniversalSidebar
              role={role}
              isOpen={isSidebarOpen}
              toggleSidebar={toggleSidebar}
              collapsed={false}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default DashboardLayout;
