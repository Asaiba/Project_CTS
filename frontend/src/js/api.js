import { API_BASE_URL } from "./config.js";

const jsonHeaders = {
  "Content-Type": "application/json",
};

const toJson = async (response) => {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return {};
  }
};

const normalizeApiBase = () => {
  const base = `${API_BASE_URL}`.replace(/\/+$/, "");
  return base.endsWith("/api") ? base : `${base}/api`;
};

const request = async (path, options = {}) => {
  const response = await fetch(`${normalizeApiBase()}${path}`, {
    ...options,
    headers: {
      ...jsonHeaders,
      ...(options.headers || {}),
    },
  });

  const data = await toJson(response);

  if (!response.ok) {
    const message = data?.message || "Request failed";
    throw new Error(message);
  }

  return data;
};

export const saveAuthSession = ({ accessToken, refreshToken, token, user }) => {
  localStorage.setItem("cts_access_token", accessToken || token || "");
  localStorage.setItem("cts_refresh_token", refreshToken || "");
  localStorage.setItem("cts_user", JSON.stringify(user || null));
};

export const roleDashboard = (role) => {
  const map = {
    student: "/pages/student-dashboard.html",
    college: "/pages/college-dashboard.html",
    dao: "/pages/dao-dashboard.html",
    admin: "/pages/admin-dashboard.html",
  };

  return map[role] || "/pages/student-dashboard.html";
};

export const registerUser = (payload) =>
  request("/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const loginUser = (payload) =>
  request("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const forgotPassword = (payload) =>
  request("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const logoutUser = () => {
  localStorage.removeItem("cts_access_token");
  localStorage.removeItem("cts_refresh_token");
  localStorage.removeItem("cts_user");
  window.location.href = "/pages/login.html";
};
