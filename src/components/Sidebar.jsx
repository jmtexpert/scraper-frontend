import { NavLink } from "react-router-dom";

export default function Sidebar() {
  return (
    <div className="w-64 h-screen bg-gray-900 text-white fixed left-0 top-0 flex flex-col">
      <div className="text-2xl font-bold p-6 border-b border-gray-700">My Dashboard</div>

      <nav className="flex-1 p-4 space-y-3">
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            `block px-4 py-2 rounded-lg transition ${
              isActive ? "bg-blue-600" : "hover:bg-gray-800"
            }`
          }
        >
          Google Scrapper
        </NavLink>
        <NavLink
          to="/trustpilot"
          className={({ isActive }) =>
            `block px-4 py-2 rounded-lg transition ${
              isActive ? "bg-blue-600" : "hover:bg-gray-800"
            }`
          }
        >
         Trust Pilots
        </NavLink>
          <NavLink
          to="/profile-data"
          className={({ isActive }) =>
            `block px-4 py-2 rounded-lg transition ${isActive ? "bg-blue-600" : "hover:bg-gray-800"}`
          }
        >
         Trust Profile Data
        </NavLink>
   
      </nav>
    </div>
  );
}
