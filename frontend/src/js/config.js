const defaultApiBaseUrl = (() => {
  if (typeof window === "undefined") return "http://localhost:4000/api";
  const isLocal = ["localhost", "127.0.0.1"].includes(window.location.hostname);
  return isLocal ? "http://localhost:4000/api" : `${window.location.origin}/api`;
})();
const configuredApiBaseUrl =
  (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_API_BASE_URL) || "";

export const API_BASE_URL = configuredApiBaseUrl || defaultApiBaseUrl;
export const PAGE_BASE = "/src/pages";

export const buildPageUrl = (target) => {
  if (!target) return `${PAGE_BASE}/login.html`;
  if (target.startsWith("/pages/") || target.startsWith("/src/pages/")) return target;
  const cleaned = target.replace(/^\/+/, "");
  return `${PAGE_BASE}/${cleaned}`;
};
export const CTS_CONTRACT_ADDRESS = "0x1d7Cd344a17A70E24779B7e7040Fb3386D5623B0";
export const CTS_OWNER_ADDRESS = "0x52a176d6059b65daf15de8a047daf749ef457ec4";
