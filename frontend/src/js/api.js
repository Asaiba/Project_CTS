import { API_BASE_URL } from "./config.js";

const jsonHeaders = {
  "Content-Type": "application/json",
};

const toJson = async (response) => {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch (_error) {
    return {};
  }
};

const request = async (path, options = {}) => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
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

export const saveAuthSession = ({ accessToken, refreshToken, user }) => {
  localStorage.setItem("cts_access_token", accessToken || "");
  localStorage.setItem("cts_refresh_token", refreshToken || "");
  localStorage.setItem("cts_user", JSON.stringify(user || null));
};

export const roleDashboard = (role) => {
  const map = {
    student: "student-dashboard.html",
    college: "college-dashboard.html",
    dao: "dao-dashboard.html",
    admin: "admin-dashboard.html",
  };
  return map[role] || "student-dashboard.html";
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

export const loginWithWallet = (payload) =>
  request("/auth/login-wallet", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const loginWithGoogle = (payload) =>
  request("/auth/login-google", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const forgotPassword = (payload) =>
  request("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify(payload),
  });
