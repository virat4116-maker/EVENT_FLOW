import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";

export default function AppShell() {
  return (
    <div className="min-h-screen bg-[#F7F6FB]">
      <Navbar />
      <main>
        <Outlet />
      </main>
    </div>
  );
}
