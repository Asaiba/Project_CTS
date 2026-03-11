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

const normalizeApiBase = () => {
  const base = `${API_BASE_URL}`.replace(/\/+$/, "");
  return base.endsWith("/api") ? base : `${base}/api`;
};

/* -------------------------
   TOKEN STORAGE
------------------------- */

export const saveAuthSession = ({ accessToken, refreshToken, user }) => {
  if (accessToken) localStorage.setItem("cts_access_token", accessToken);
  if (refreshToken) localStorage.setItem("cts_refresh_token", refreshToken);
  if (user) localStorage.setItem("cts_user", JSON.stringify(user));
};

export const clearAuthSession = () => {
  localStorage.removeItem("cts_access_token");
  localStorage.removeItem("cts_refresh_token");
  localStorage.removeItem("cts_user");
};

/* -------------------------
   TOKEN REFRESH
------------------------- */

const refreshAccessToken = async () => {
  const refreshToken = localStorage.getItem("cts_refresh_token");
  if (!refreshToken) throw new Error("No refresh token");

  const response = await fetch(`${normalizeApiBase()}/auth/refresh`, {
    method: "POST",
    headers: jsonHeaders,
    body: JSON.stringify({ refreshToken }),
  });

  const data = await toJson(response);

  if (!response.ok) {
    clearAuthSession();
    throw new Error("Session expired");
  }

  if (data.accessToken) {
    localStorage.setItem("cts_access_token", data.accessToken);
  }

  return data.accessToken;
};

/* -------------------------
   MAIN REQUEST FUNCTION
------------------------- */

const request = async (path, options = {}, retry = true) => {
  const accessToken = localStorage.getItem("cts_access_token");

  const response = await fetch(`${normalizeApiBase()}${path}`, {
    ...options,
    headers: {
      ...jsonHeaders,
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...(options.headers || {}),
    },
  });

  const data = await toJson(response);

  /* ---- TOKEN EXPIRED ---- */

  if (response.status === 401 && retry) {
    try {
      const newToken = await refreshAccessToken();

      return request(
        path,
        {
          ...options,
          headers: {
            ...jsonHeaders,
            Authorization: `Bearer ${newToken}`,
          },
        },
        false,
      );
    } catch (error) {
      clearAuthSession();
      window.location.href = "/login.html";
      throw error;
    }
  }

  if (!response.ok) {
    const message = data?.message || "Request failed";
    throw new Error(message);
  }

  return data;
};

/* -------------------------
   ROLE DASHBOARDS
------------------------- */

export const roleDashboard = (role) => {
  const map = {
    student: "student-dashboard.html",
    college: "college-dashboard.html",
    dao: "dao-dashboard.html",
    admin: "admin-dashboard.html",
  };
  return map[role] || "student-dashboard.html";
};

/* -------------------------
   AUTH API CALLS
------------------------- */

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

export const logoutUser = () => {
  clearAuthSession();
  window.location.href = "/login.html";
};
