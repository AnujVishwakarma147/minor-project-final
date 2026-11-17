import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";

function ProtectedDashboard() {
  const token =
    localStorage.getItem("token") || sessionStorage.getItem("token");
  return token ? <Dashboard /> : <Navigate to="/login" replace />;
}

// Logged-in users go straight to the dashboard instead of seeing Home/Login again
function PublicOnly({ children }) {
  const token =
    localStorage.getItem("token") || sessionStorage.getItem("token");
  return token ? <Navigate to="/dashboard" replace /> : children;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <PublicOnly>
              <Home />
            </PublicOnly>
          }
        />
        <Route
          path="/login"
          element={
            <PublicOnly>
              <Login />
            </PublicOnly>
          }
        />
        <Route
          path="/register"
          element={
            <PublicOnly>
              <Register />
            </PublicOnly>
          }
        />
        <Route path="/dashboard" element={<ProtectedDashboard />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
