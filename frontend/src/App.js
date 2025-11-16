import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import axios from "axios";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "./contexts/ThemeContext";
import AuthPage from "./pages/AuthPage";
import DashboardLayout from "./components/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import Orders from "./pages/Orders";
import Clients from "./pages/Clients";
import Recipes from "./pages/Recipes";
import Semifinished from "./pages/Semifinished";
import Ingredients from "./pages/Ingredients";
import CalendarPage from "./pages/CalendarPage";
import Settings from "./pages/Settings";
import "@/App.css";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Setup axios defaults
axios.defaults.baseURL = API;

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      fetchUser();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUser = async () => {
    try {
      const response = await axios.get("/auth/me");
      setUser(response.data);
    } catch (error) {
      console.error("Failed to fetch user", error);
      localStorage.removeItem("token");
      delete axios.defaults.headers.common["Authorization"];
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (token, userData) => {
    localStorage.setItem("token", token);
    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    delete axios.defaults.headers.common["Authorization"];
    setUser(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <ThemeProvider user={user} setUser={setUser}>
      <BrowserRouter>
        <Routes>
          <Route
            path="/auth"
            element={
              user ? <Navigate to="/" /> : <AuthPage onLogin={handleLogin} />
            }
          />
          <Route
            path="/"
            element={
              user ? (
                <DashboardLayout user={user} onLogout={handleLogout}>
                  <Dashboard />
                </DashboardLayout>
              ) : (
                <Navigate to="/auth" />
              )
            }
          />
          <Route
            path="/orders"
            element={
              user ? (
                <DashboardLayout user={user} onLogout={handleLogout}>
                  <Orders />
                </DashboardLayout>
              ) : (
                <Navigate to="/auth" />
              )
            }
          />
          <Route
            path="/clients"
            element={
              user ? (
                <DashboardLayout user={user} onLogout={handleLogout}>
                  <Clients />
                </DashboardLayout>
              ) : (
                <Navigate to="/auth" />
              )
            }
          />
          <Route
            path="/recipes"
            element={
              user ? (
                <DashboardLayout user={user} onLogout={handleLogout}>
                  <Recipes />
                </DashboardLayout>
              ) : (
                <Navigate to="/auth" />
              )
            }
          />
          <Route
            path="/semifinished"
            element={
              user ? (
                <DashboardLayout user={user} onLogout={handleLogout}>
                  <Semifinished />
                </DashboardLayout>
              ) : (
                <Navigate to="/auth" />
              )
            }
          />
          <Route
            path="/ingredients"
            element={
              user ? (
                <DashboardLayout user={user} onLogout={handleLogout}>
                  <Ingredients />
                </DashboardLayout>
              ) : (
                <Navigate to="/auth" />
              )
            }
          />
          <Route
            path="/calendar"
            element={
              user ? (
                <DashboardLayout user={user} onLogout={handleLogout}>
                  <CalendarPage />
                </DashboardLayout>
              ) : (
                <Navigate to="/auth" />
              )
            }
          />
          <Route
            path="/settings"
            element={
              user ? (
                <DashboardLayout user={user} onLogout={handleLogout}>
                  <Settings user={user} setUser={setUser} />
                </DashboardLayout>
              ) : (
                <Navigate to="/auth" />
              )
            }
          />
        </Routes>
        <Toaster position="top-right" />
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;