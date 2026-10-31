
import { NavLink } from "react-router-dom";

import {
  LayoutDashboard,
  Radio,
  Activity,
  CalendarClock,
  AlertTriangle,
  Zap,
} from "lucide-react";

import "../App.css";

const navigation = [
  {
    label: "Dashboard",
    path: "/",
    icon: LayoutDashboard,
    end: true,
  },
  {
    label: "Endpoints",
    path: "/endpoints",
    icon: Radio,
  },
  {
    label: "Events",
    path: "/events",
    icon: CalendarClock,
  },
  {
    label: "Failed Deliveries",
    path: "/failed-deliveries",
    icon: AlertTriangle,
  },
  {
    label: "Monitoring",
    path: "/monitoring",
    icon: Activity,
  },
];

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-brand-icon">
          <Zap size={22} />
        </div>

        <div>
          <h2>ChronoMesh</h2>
          <span>Webhook Infrastructure</span>
        </div>
      </div>

      <div className="sidebar-section-label">
        WORKSPACE
      </div>

      <nav className="sidebar-nav">
        {navigation.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? "active" : ""}`
              }
            >
              <Icon size={19} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <span className="sidebar-footer-dot" />
        ChronoMesh Platform
      </div>
    </aside>
  );
}
