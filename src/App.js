import { useState, useEffect, createContext, useContext } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import axios from "axios";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";

// Pages
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import BankUpload from "@/pages/BankUpload";
import Transactions from "@/pages/Transactions";
import Categories from "@/pages/Categories";
import Reports from "@/pages/Reports";
import Settings from "@/pages/Settings";
import AddEntry from "@/pages/AddEntry";

// Masters Pages
import Profiles from "@/pages/masters/Profiles";
import BankAccounts from "@/pages/masters/BankAccounts";
import FixedDeposits from "@/pages/masters/FixedDeposits";
import GovSchemes from "@/pages/masters/GovSchemes";
import RealEstate from "@/pages/masters/RealEstate";
import Gold from "@/pages/masters/Gold";
import Loans from "@/pages/masters/Loans";
import CreditCards from "@/pages/masters/CreditCards";

// Investment & Tax Pages
import Portfolio from "@/pages/Portfolio";
import TaxPlanning from "@/pages/TaxPlanning";
import CAExport from "@/pages/CAExport";

import Layout from "@/components/Layout";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

// Auth Context
export const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

// Setup axios interceptor for 401 errors
const setupAxiosInterceptor = () => {
  axios.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        localStorage.removeItem("ledgeros_token");
        toast.error("Session expired. Please login again.");
        window.location.href = "/login";
      }
      return Promise.reject(error);
    }
  );
};

const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem("ledgeros_token"));
  const [loading, setLoading] = useState(true);
  const [setupRequired, setSetupRequired] = useState(false);

  useEffect(() => {
    setupAxiosInterceptor();
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const res = await axios.get(`${API}/auth/check`);
      setSetupRequired(res.data.setup_required);
      
      const storedToken = localStorage.getItem("ledgeros_token");
      if (storedToken && !res.data.setup_required) {
        try {
          await axios.get(`${API}/reports/dashboard?token=${storedToken}`);
        } catch (e) {
          if (e.response?.status === 401) {
            localStorage.removeItem("ledgeros_token");
            setToken(null);
          }
        }
      }
    } catch (e) {
      console.error("Auth check failed:", e);
    } finally {
      setLoading(false);
    }
  };

  const login = (newToken) => {
    localStorage.setItem("ledgeros_token", newToken);
    setToken(newToken);
  };

  const logout = async () => {
    const currentToken = localStorage.getItem("ledgeros_token");
    if (currentToken) {
      try {
        await axios.post(`${API}/auth/logout?token=${currentToken}`);
      } catch (e) {
        console.error("Logout error:", e);
      }
    }
    localStorage.removeItem("ledgeros_token");
    setToken(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ token, login, logout, setupRequired, setSetupRequired }}>
      {children}
    </AuthContext.Provider>
  );
};

const ProtectedRoute = ({ children }) => {
  const { token } = useAuth();
  const location = useLocation();

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

function AppRoutes() {
  const { token } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={token ? <Navigate to="/" replace /> : <Login />} />
      
      {/* Dashboard */}
      <Route path="/" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
      
      {/* Masters */}
      <Route path="/profiles" element={<ProtectedRoute><Layout><Profiles /></Layout></ProtectedRoute>} />
      <Route path="/bank-accounts" element={<ProtectedRoute><Layout><BankAccounts /></Layout></ProtectedRoute>} />
      <Route path="/fixed-deposits" element={<ProtectedRoute><Layout><FixedDeposits /></Layout></ProtectedRoute>} />
      <Route path="/gov-schemes" element={<ProtectedRoute><Layout><GovSchemes /></Layout></ProtectedRoute>} />
      <Route path="/real-estate" element={<ProtectedRoute><Layout><RealEstate /></Layout></ProtectedRoute>} />
      <Route path="/gold" element={<ProtectedRoute><Layout><Gold /></Layout></ProtectedRoute>} />
      <Route path="/loans" element={<ProtectedRoute><Layout><Loans /></Layout></ProtectedRoute>} />
      <Route path="/credit-cards" element={<ProtectedRoute><Layout><CreditCards /></Layout></ProtectedRoute>} />
      
      {/* Accounting */}
      <Route path="/upload" element={<ProtectedRoute><Layout><BankUpload /></Layout></ProtectedRoute>} />
      <Route path="/transactions" element={<ProtectedRoute><Layout><Transactions /></Layout></ProtectedRoute>} />
      <Route path="/add-entry" element={<ProtectedRoute><Layout><AddEntry /></Layout></ProtectedRoute>} />
      <Route path="/categories" element={<ProtectedRoute><Layout><Categories /></Layout></ProtectedRoute>} />
      
      {/* Investments */}
      <Route path="/portfolio" element={<ProtectedRoute><Layout><Portfolio /></Layout></ProtectedRoute>} />
      
      {/* Tax & Reports */}
      <Route path="/tax-planning" element={<ProtectedRoute><Layout><TaxPlanning /></Layout></ProtectedRoute>} />
      <Route path="/reports" element={<ProtectedRoute><Layout><Reports /></Layout></ProtectedRoute>} />
      <Route path="/export" element={<ProtectedRoute><Layout><CAExport /></Layout></ProtectedRoute>} />
      
      {/* Settings */}
      <Route path="/settings" element={<ProtectedRoute><Layout><Settings /></Layout></ProtectedRoute>} />
      
      {/* Legacy redirects */}
      <Route path="/accounts" element={<Navigate to="/bank-accounts" replace />} />
      <Route path="/ledgers" element={<Navigate to="/bank-accounts" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster position="top-right" richColors />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
