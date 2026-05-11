import {
  LineChart,
  Users,
  BookOpen,
  Users as TeachersIcon,
  Home,
  FileText,
  ClipboardList,
} from "lucide-react";

// Common links that appear for all roles
export const commonLinks = {
  admin: [
    { path: "/admin", label: "Dashboard", icon: <LineChart size={18} /> },
  ],
  teacher: [
    { path: "/teacher", label: "Dashboard", icon: <Home size={18} /> },
  ],
  student: [
    { path: "/student", label: "Dashboard", icon: <Home size={18} /> },
  ],
};

// Role-specific navigation links
export const roleBasedLinks = {
  admin: [
    {
      path: "/admin/teachers",
      label: "Teachers",
      icon: <TeachersIcon size={18} />,
    },
    {
      path: "/admin/students",
      label: "Students",
      icon: <Users size={18} />,
    },
  ],
  teacher: [
    {
      path: "/teacher/attachment-view",
      label: "Attachment View",
      icon: <BookOpen size={18} />,
    },
  ],
  student: [
    {
      path: "/student/report",
      label: "Attachment Report",
      icon: <FileText size={18} />,
    },
    {
      path: "/student/attachment",
      label: "Attachment Form",
      icon: <ClipboardList size={18} />,
    },
    {
      path: "/student/logbook",
      label: "Logbook",
      icon: <BookOpen size={18} />,
    },
  ],
};

// Combined links for each role
export const getCombinedLinks = (role) => {
  return [...(commonLinks[role] || []), ...(roleBasedLinks[role] || [])];
};
