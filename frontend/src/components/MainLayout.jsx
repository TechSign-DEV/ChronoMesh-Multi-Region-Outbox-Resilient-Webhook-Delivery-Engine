
import Sidebar from "./Sidebar";
import "../App.css";

export default function MainLayout({ children }) {
  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-wrapper">
        {children}
      </div>
    </div>
  );
}
