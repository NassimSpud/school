const SidebarLogo = ({ collapsed }) => (
  <div className="flex items-center transition-all duration-200">
    {!collapsed ? (
      <>
        <div className="w-8 h-8 rounded-md bg-black flex items-center justify-center flex-shrink-0">
          <span className="font-bold text-white text-xs">SS</span>
        </div>
        <span className="ml-2 font-semibold text-gray-800 whitespace-nowrap overflow-hidden transition-opacity duration-200">
          Attachment System
        </span>
      </>
    ) : (
      <div className="w-8 h-8 rounded-md bg-black flex items-center justify-center mx-auto">
        <span className="font-bold text-white text-xs">AS</span>
      </div>
    )}
  </div>
);

export default SidebarLogo;
