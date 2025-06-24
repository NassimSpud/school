import { ChevronLeft, ChevronRight } from "lucide-react";

const SidebarToggle = ({ collapsed, toggleCollapse, mobile = false }) => (
  <button
    onClick={toggleCollapse}
    className={`text-gray-500 hover:text-black focus:outline-none transition-colors duration-150 ${
      mobile ? "md:hidden" : "hidden md:block"
    }`}
    aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
  >
    {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
  </button>
);

export default SidebarToggle;