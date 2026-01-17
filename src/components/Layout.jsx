import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/App";
import { useState } from "react";
import {
  LayoutDashboard,
  Upload,
  List,
  Wallet,
  Folder,
  PlusCircle,
  BarChart3,
  Settings,
  LogOut,
  Building2,
  Landmark,
  Home,
  Coins,
  CreditCard,
  TrendingUp,
  Receipt,
  ChevronDown,
  ChevronRight,
  Users,
  Calculator,
  FileText,
} from "lucide-react";

const navSections = [
  {
    title: null,
    items: [
      { path: "/", icon: LayoutDashboard, label: "Dashboard" },
    ]
  },
  {
    title: "MASTERS",
    items: [
      { path: "/profiles", icon: Users, label: "Profiles & Family" },
      { path: "/bank-accounts", icon: Landmark, label: "Bank Accounts" },
      { path: "/fixed-deposits", icon: Building2, label: "Fixed Deposits" },
      { path: "/gov-schemes", icon: Landmark, label: "PPF / NPS / EPF" },
      { path: "/real-estate", icon: Home, label: "Real Estate" },
      { path: "/gold", icon: Coins, label: "Gold" },
      { path: "/loans", icon: Receipt, label: "Loans" },
      { path: "/credit-cards", icon: CreditCard, label: "Credit Cards" },
    ]
  },
  {
    title: "ACCOUNTING",
    items: [
      { path: "/upload", icon: Upload, label: "Bank Upload" },
      { path: "/transactions", icon: List, label: "Transactions" },
      { path: "/add-entry", icon: PlusCircle, label: "Add Entry" },
      { path: "/categories", icon: Folder, label: "Categories" },
    ]
  },
  {
    title: "INVESTMENTS",
    items: [
      { path: "/portfolio", icon: TrendingUp, label: "Portfolio" },
    ]
  },
  {
    title: "TAX & REPORTS",
    items: [
      { path: "/tax-planning", icon: Calculator, label: "Tax Planning" },
      { path: "/reports", icon: BarChart3, label: "Reports" },
      { path: "/export", icon: FileText, label: "CA Export" },
    ]
  },
];

export default function Layout({ children }) {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsedSections, setCollapsedSections] = useState({});

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const toggleSection = (title) => {
    setCollapsedSections(prev => ({
      ...prev,
      [title]: !prev[title]
    }));
  };

  const isSectionActive = (items) => {
    return items.some(item => location.pathname === item.path);
  };

  return (
    <div className="app-container" data-testid="app-layout">
      {/* Sidebar */}
      <aside className="sidebar" data-testid="sidebar">
        <div className="p-5 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">LedgerOS</h1>
          <p className="text-xs text-gray-500 mt-1">Personal Finance Manager</p>
        </div>

        <nav className="py-2 flex-1 overflow-y-auto">
          {navSections.map((section, sectionIndex) => (
            <div key={sectionIndex} className="mb-1">
              {section.title && (
                <button
                  onClick={() => toggleSection(section.title)}
                  className="w-full flex items-center justify-between px-4 py-2 text-[10px] font-semibold text-gray-400 uppercase tracking-wider hover:text-gray-600"
                >
                  <span>{section.title}</span>
                  {collapsedSections[section.title] ? (
                    <ChevronRight size={12} />
                  ) : (
                    <ChevronDown size={12} />
                  )}
                </button>
              )}
              
              {!collapsedSections[section.title] && (
                <div className={section.title ? "ml-2" : ""}>
                  {section.items.map((item) => (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      end={item.path === "/"}
                      className={({ isActive }) =>
                        `nav-item ${isActive ? "active" : ""}`
                      }
                      data-testid={`nav-${item.label.toLowerCase().replace(/[\s\/]/g, "-")}`}
                    >
                      <item.icon size={16} strokeWidth={1.5} />
                      <span className="text-sm">{item.label}</span>
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        <div className="p-3 border-t border-gray-200">
          <NavLink
            to="/settings"
            className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
          >
            <Settings size={16} strokeWidth={1.5} />
            <span className="text-sm">Settings</span>
          </NavLink>
          <button
            onClick={handleLogout}
            className="nav-item w-full hover:text-rose-600"
            data-testid="logout-btn"
          >
            <LogOut size={16} strokeWidth={1.5} />
            <span className="text-sm">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content" data-testid="main-content">
        {children}
      </main>
    </div>
  );
}
