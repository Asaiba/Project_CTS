import { API_BASE_URL, buildPageUrl } from "./config.js";

const ACCESS_TOKEN_KEY = "cts_access_token";
const REFRESH_TOKEN_KEY = "cts_refresh_token";
const USER_KEY = "cts_user";

const ROLE_DASHBOARD = {
  student: buildPageUrl("student-dashboard.html"),
  college: buildPageUrl("college-dashboard.html"),
  dao: buildPageUrl("dao-dashboard.html"),
  admin: buildPageUrl("admin-dashboard.html"),
};

const normalizeApiBase = () => {
  const base = `${API_BASE_URL}`.replace(/\/+$/, "");
  return base.endsWith("/api") ? base : `${base}/api`;
};

const normalizePagePath = (target) => buildPageUrl(target || "login.html");

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

  const response = await fetch(`${normalizeApiBase()}/auth/refresh`, {
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
  window.location.replace(normalizePagePath(target));
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
    'a[href="/login.html"]',
    'a[href="/src/pages/login.html"]',
  ];
  document.querySelectorAll(logoutSelectors.join(",")).forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      logoutAndRedirect("login.html");
    });
  });
};

const checkWalletConsistency = async (user) => {
  if (!user?.walletAddress || !window.ethereum) return;
  try {
    const accounts = await window.ethereum.request({ method: "eth_accounts" });
    if (!accounts || !accounts.length) return;
    if (accounts[0].toLowerCase() !== user.walletAddress.toLowerCase()) {
      logoutAndRedirect("login.html");
    }
  } catch {
    // cannot query MetaMask, skip
  }
};

export const requireSession = ({ roles = [] } = {}) => {
  const validate = () => {
    const { accessToken, user } = getSession();
    if (!accessToken || !user?.role) {
      logoutAndRedirect("login.html");
      return false;
    }

    if (roles.length && !roles.includes(user.role)) {
      const redirect = ROLE_DASHBOARD[user.role] || buildPageUrl("login.html");
      window.location.replace(redirect);
      return false;
    }
    return true;
  };

  const syncSessionWithServer = async () => {
    const callWhoAmI = async (token) =>
      fetch(`${normalizeApiBase()}/auth/me`, {
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
      const redirect = ROLE_DASHBOARD[serverUser.role] || buildPageUrl("login.html");
      window.location.replace(redirect);
    }
  };

  if (!validate()) return;
  bindLogoutLinks();
  syncSessionWithServer().then(() => checkWalletConsistency(parseUser()));

  if (window.ethereum?.on) {
    window.ethereum.on("accountsChanged", (accounts) => {
      const user = parseUser();
      if (!user?.walletAddress) return;
      if (!accounts.length || accounts[0].toLowerCase() !== user.walletAddress.toLowerCase()) {
        logoutAndRedirect("login.html");
      }
    });
  }

  // Handles browser back-forward cache: page re-checks auth before showing.
  window.addEventListener("pageshow", () => {
    validate();
    syncSessionWithServer().then(() => checkWalletConsistency(parseUser()));
  });
};
