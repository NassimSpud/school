import React from "react";
import { NavLink } from "react-router-dom";
import { commonLinks, roleBasedLinks } from "./roleLinks";
import SidebarToggle from "./SidebarToggle";
import SidebarLogo from "./SidebarLogo";
import { LogOut } from "lucide-react";

const UniversalSidebar = ({
  role,
  isOpen,
  toggleSidebar,
  collapsed,
  toggleCollapse,
}) => {
  const allLinks = [
    ...(commonLinks[role] || []),
    ...(roleBasedLinks[role] || []),
  ];

  return (
    <div
      className={`bg-white h-full flex flex-col border-r border-gray-200 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
        collapsed ? "w-16" : "w-56"
      } ${isOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}
      style={{ willChange: "transform, width" }}
    >
      {/* Header Section */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <SidebarLogo collapsed={collapsed} />
        <SidebarToggle collapsed={collapsed} toggleCollapse={toggleCollapse} />
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto py-4 px-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
        {allLinks.map((link) => (
          <NavLink
            key={link.path}
            to={link.path}
            end
            className={({ isActive }) =>
              `flex items-center ${
                collapsed ? "justify-center" : "px-3"
              } py-2.5 rounded-md transition-all duration-200 ease-in-out ${
                isActive
                  ? "bg-gray-100 text-black font-medium"
                  : "text-gray-600 hover:bg-gray-50 hover:text-black"
              }`
            }
          >
            <div className="transition-transform duration-200 hover:scale-105">
              {link.icon}
            </div>
            {!collapsed && (
              <span className="ml-3 text-sm transition-opacity duration-200">
                {link.label}
              </span>
            )}
          </NavLink>
        ))}
      </div>

      {/* Footer Section */}
      <div className="p-3 border-t border-gray-200">
        <NavLink
          to="/"
          className={({ isActive }) =>
            `flex items-center ${
              collapsed ? "justify-center" : "px-3"
            } py-2.5 rounded-md transition-all duration-200 ease-in-out ${
              isActive
                ? "bg-gray-100 text-black font-medium"
                : "text-gray-600 hover:bg-gray-50 hover:text-black"
            }`
          }
        >
          <LogOut
            size={18}
            className="transition-transform duration-200 hover:scale-105"
          />
          {!collapsed && <span className="ml-3 text-sm">Logout</span>}
        </NavLink>
      </div>
    </div>
  );
};

export default UniversalSidebar;
