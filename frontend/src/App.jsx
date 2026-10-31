
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Dashboard from "./pages/Dashboard";
import Endpoints from "./pages/Endpoints";
import Events from "./pages/Events";
import FailedDeliveries from "./pages/FailedDeliveries";
import Monitoring from "./pages/Monitoring";

import MainLayout from "./components/MainLayout";

export default function App() {
  return (
    <BrowserRouter>
      <MainLayout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/endpoints" element={<Endpoints />} />
          <Route path="/events" element={<Events />} />
          <Route path="/failed-deliveries" element={<FailedDeliveries />} />
          <Route path="/monitoring" element={<Monitoring />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </MainLayout>
    </BrowserRouter>
  );
}
