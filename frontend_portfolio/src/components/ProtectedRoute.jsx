// src/components/ProtectedRoute.jsx
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children }) {
  // Make sure this only runs in browser
  const hasWindow = typeof window !== "undefined";
  const token = hasWindow ? localStorage.getItem("authToken") : null;

  // If no token present, block access
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // If token exists, render the protected page
  return children;
}