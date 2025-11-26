// src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState("");
  const [username, setUsername] = useState("");

  // Load from localStorage on first mount
  useEffect(() => {
    const storedToken = localStorage.getItem("authToken");
    const storedUser = localStorage.getItem("authUsername");
    if (storedToken) setToken(storedToken);
    if (storedUser) setUsername(storedUser);
  }, []);

  const login = ({ token, username }) => {
    setToken(token);
    setUsername(username);
    localStorage.setItem("authToken", token);
    localStorage.setItem("authUsername", username);
  };

  const logout = () => {
    setToken("");
    setUsername("");
    localStorage.removeItem("authToken");
    localStorage.removeItem("authUsername");
  };

  const value = {
    token,
    username,
    isAuthenticated: !!token,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside <AuthProvider>");
  }
  return ctx;
}