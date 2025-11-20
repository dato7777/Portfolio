// src/api/client.js
import axios from "axios";

const api = axios.create({
  baseURL: "http://127.0.0.1:8000", // your FastAPI base URL
});

// Attach token from localStorage to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("authToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;