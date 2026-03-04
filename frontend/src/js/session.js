const ACCESS_TOKEN_KEY = "cts_access_token";
const REFRESH_TOKEN_KEY = "cts_refresh_token";
const USER_KEY = "cts_user";
const API_BASE_URL = "http://localhost:4000/api";

const ROLE_DASHBOARD = {
  student: "student-dashboard.html",
  college: "college-dashboard.html",
  dao: "dao-dashboard.html",
  admin: "admin-dashboard.html",
};

const parseUser = () => {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY) || "null");
  } catch (_error) {
    return null;
  }
};

export const clearSession = () => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  sessionStorage.removeItem("wallet_connected");
  sessionStorage.removeItem("wallet_address");
};

export const getAccessToken = () => localStorage.getItem(ACCESS_TOKEN_KEY) || "";

export const getRefreshToken = () => localStorage.getItem(REFRESH_TOKEN_KEY) || "";

export const refreshSessionToken = async () => {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data?.accessToken) {
    clearSession();
    return null;
  }

  localStorage.setItem(ACCESS_TOKEN_KEY, data.accessToken || "");
  if (data.refreshToken) {
    localStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken);
  }
  return data.accessToken;
};

export const logoutAndRedirect = (target = "login.html") => {
  clearSession();
  window.location.replace(target);
};

const getSession = () => {
  const accessToken = getAccessToken();
  const user = parseUser();
  return { accessToken, user };
};

const bindLogoutLinks = () => {
  const logoutSelectors = [
    'a[href="login.html"]',
    'a[href="./login.html"]',
    'a[href="../pages/login.html"]',
  ];
  document.querySelectorAll(logoutSelectors.join(",")).forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      logoutAndRedirect("login.html");
    });
  });
};

export const requireSession = ({ roles = [] } = {}) => {
  const validate = () => {
    const { accessToken, user } = getSession();
    if (!accessToken || !user?.role) {
      logoutAndRedirect("login.html");
      return false;
    }

    if (roles.length && !roles.includes(user.role)) {
      const redirect = ROLE_DASHBOARD[user.role] || "login.html";
      window.location.replace(redirect);
      return false;
    }
    return true;
  };

  const syncSessionWithServer = async () => {
    const callWhoAmI = async (token) =>
      fetch(`${API_BASE_URL}/auth/me`, {
        headers: {
          Authorization: `Bearer ${token || ""}`,
        },
      });

    let token = getAccessToken();
    if (!token) {
      logoutAndRedirect("login.html");
      return;
    }

    let response = await callWhoAmI(token);
    if (response.status === 401) {
      token = await refreshSessionToken();
      if (!token) {
        logoutAndRedirect("login.html");
        return;
      }
      response = await callWhoAmI(token);
    }

    if (!response.ok) {
      logoutAndRedirect("login.html");
      return;
    }

    const data = await response.json().catch(() => ({}));
    const serverUser = data?.user;
    if (!serverUser?.role) {
      logoutAndRedirect("login.html");
      return;
    }

    localStorage.setItem(USER_KEY, JSON.stringify(serverUser));

    if (roles.length && !roles.includes(serverUser.role)) {
      const redirect = ROLE_DASHBOARD[serverUser.role] || "login.html";
      window.location.replace(redirect);
    }
  };

  if (!validate()) return;
  bindLogoutLinks();
  syncSessionWithServer();

  // Handles browser back-forward cache: page re-checks auth before showing.
  window.addEventListener("pageshow", () => {
    validate();
    syncSessionWithServer();
  });
};
