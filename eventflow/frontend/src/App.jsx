import { Routes, Route } from "react-router-dom";
import AppShell from "./layouts/AppShell.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";

import Home from "./pages/Home.jsx";
import Login from "./pages/Login.jsx";
import Events from "./pages/Events.jsx";
import EventDetail from "./pages/EventDetail.jsx";
import CreateTeam from "./pages/CreateTeam.jsx";
import JoinTeam from "./pages/JoinTeam.jsx";
import MyTickets from "./pages/MyTickets.jsx";
import MyTeams from "./pages/MyTeams.jsx";
import Certificates from "./pages/Certificates.jsx";
import PaymentHistory from "./pages/PaymentHistory.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import MainAdminDashboard from "./pages/MainAdminDashboard.jsx";
import ApprovalScreen from "./pages/ApprovalScreen.jsx";
import EventWizard from "./pages/EventWizard.jsx";
import QRScanner from "./pages/QRScanner.jsx";
import EventRegistrations from "./pages/EventRegistrations.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route element={<AppShell />}>
        <Route path="/" element={<Home />} />
        <Route path="/events" element={<Events />} />
        <Route path="/events/:id" element={<EventDetail />} />

        <Route path="/events/:id/create-team" element={<ProtectedRoute roles={["PARTICIPANT"]}><CreateTeam /></ProtectedRoute>} />
        <Route path="/join-team" element={<ProtectedRoute roles={["PARTICIPANT"]}><JoinTeam /></ProtectedRoute>} />
        <Route path="/my-tickets" element={<ProtectedRoute roles={["PARTICIPANT"]}><MyTickets /></ProtectedRoute>} />
        <Route path="/my-teams" element={<ProtectedRoute roles={["PARTICIPANT"]}><MyTeams /></ProtectedRoute>} />
        <Route path="/certificates" element={<ProtectedRoute roles={["PARTICIPANT"]}><Certificates /></ProtectedRoute>} />
        <Route path="/payments" element={<ProtectedRoute roles={["PARTICIPANT"]}><PaymentHistory /></ProtectedRoute>} />

        <Route path="/admin" element={<ProtectedRoute roles={["DEPARTMENT_ADMIN", "SUPER_ADMIN"]}><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/events/new" element={<ProtectedRoute roles={["DEPARTMENT_ADMIN", "SUPER_ADMIN"]}><EventWizard /></ProtectedRoute>} />
        <Route path="/admin/events/:id/edit" element={<ProtectedRoute roles={["DEPARTMENT_ADMIN", "SUPER_ADMIN"]}><EventWizard /></ProtectedRoute>} />
        <Route path="/admin/events/:id/registrations" element={<ProtectedRoute roles={["DEPARTMENT_ADMIN", "SUPER_ADMIN"]}><EventRegistrations /></ProtectedRoute>} />
        <Route path="/admin/scanner" element={<ProtectedRoute roles={["DEPARTMENT_ADMIN", "SUPER_ADMIN", "VOLUNTEER"]}><QRScanner /></ProtectedRoute>} />

        <Route path="/main-admin" element={<ProtectedRoute roles={["SUPER_ADMIN"]}><MainAdminDashboard /></ProtectedRoute>} />
        <Route path="/main-admin/review/:id" element={<ProtectedRoute roles={["SUPER_ADMIN"]}><ApprovalScreen /></ProtectedRoute>} />

        <Route path="*" element={<Home />} />
      </Route>
    </Routes>
  );
}
