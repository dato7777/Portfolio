// src/api/client.js
import axios from "axios";

const api = axios.create({
  baseURL: "http://127.0.0.1:8000", // your FastAPI base URL
});

// 1) Attach token from localStorage to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("authToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 2) Global response interceptor -> handle expired/invalid tokens
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;

    if (status === 401) {
      // Token is missing / invalid / expired -> force logout
      localStorage.removeItem("authToken");
      localStorage.removeItem("authUsername");

      // Optional: only redirect if we're not already on login page
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }

    // Always re-throw so your code can still handle errors locally if needed
    return Promise.reject(error);
  }
);

export default api;