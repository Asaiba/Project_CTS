import { API_BASE_URL, buildPageUrl } from "./config.js";

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

const API = API_BASE_URL;

export const logoutUser = () => {
  localStorage.removeItem("cts_access_token");
  localStorage.removeItem("cts_refresh_token");
  localStorage.removeItem("cts_user");
  sessionStorage.removeItem("wallet_connected");
  sessionStorage.removeItem("wallet_address");

  window.location.href = buildPageUrl("login.html");
};

const fetchWithToken = (path, token, options = {}) =>
  fetch(`${API}${path}`, {
    ...options,
    headers: {
      ...jsonHeaders,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

const request = async (path, options = {}) => {
  let token = localStorage.getItem("cts_access_token");

  let response = await fetchWithToken(path, token, options);

  if (response.status === 401) {
    const refreshToken = localStorage.getItem("cts_refresh_token");
    if (refreshToken) {
      const refreshResponse = await fetch(`${API}/auth/refresh`, {
        method: "POST",
        headers: jsonHeaders,
        body: JSON.stringify({ refreshToken }),
      });
      const refreshData = await toJson(refreshResponse);
      if (refreshResponse.ok && refreshData?.accessToken) {
        token = refreshData.accessToken;
        localStorage.setItem("cts_access_token", token);
        if (refreshData.refreshToken) {
          localStorage.setItem("cts_refresh_token", refreshData.refreshToken);
        }
        response = await fetchWithToken(path, token, options);
      } else {
        logoutUser();
        return;
      }
    }
  }

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
    student: buildPageUrl("student-dashboard.html"),
    college: buildPageUrl("college-dashboard.html"),
    dao: buildPageUrl("dao-dashboard.html"),
    admin: buildPageUrl("admin-dashboard.html"),
  };

  return map[role] || buildPageUrl("student-dashboard.html");
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

export const forgotPassword = (payload) =>
  request("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify(payload),
  });
