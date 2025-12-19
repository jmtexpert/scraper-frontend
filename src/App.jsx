import { Routes, Route } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import TrustPilot from "./pages/TrustPilot";
import ProfileDashboard from "./pages/Profile";
import Scraper from "./pages/Scraper";
function App() {
  return (
    <div className="flex">
      <Sidebar />
      <div className="ml-64 flex-1 bg-gray-100 min-h-screen p-6">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/trustpilot" element={<TrustPilot />} />
            <Route path="/profile-data" element={<ProfileDashboard />} />
              <Route path="/scrapper" element={<Scraper />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;
