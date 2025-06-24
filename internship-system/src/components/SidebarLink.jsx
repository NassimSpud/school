import { Link } from "react-router-dom";
import { useLocation } from "react-router-dom";

const SidebarLink = ({ path, label, icon, collapsed }) => {
  const location = useLocation();
  const isActive = location.pathname === path;

  return (
    <Link
      to={path}
      className={`flex items-center ${
        collapsed ? "justify-center" : "px-3"
      } py-2.5 rounded-md transition-all duration-200 ease-in-out ${
        isActive
          ? "bg-gray-100 text-black"
          : "text-gray-600 hover:bg-gray-50 hover:text-black"
      } group`}
    >
      <div className="transition-transform duration-200 group-hover:scale-105">
        {icon}
      </div>
      {!collapsed && (
        <span className="ml-3 text-sm font-medium transition-opacity duration-200">
          {label}
        </span>
      )}
    </Link>
  );
};

export default SidebarLink;