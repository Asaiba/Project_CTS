const host =
  typeof window !== "undefined" && window.location.hostname === "127.0.0.1" ? "127.0.0.1" : "localhost";
const defaultApiBaseUrl = `http://${host}:4000/api`;
const configuredApiBaseUrl =
  (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_API_BASE_URL) || "";

export const API_BASE_URL = configuredApiBaseUrl || defaultApiBaseUrl;
export const CTS_CONTRACT_ADDRESS = "0x1d7Cd344a17A70E24779B7e7040Fb3386D5623B0";
export const CTS_OWNER_ADDRESS = "0x52a176d6059b65daf15de8a047daf749ef457ec4";
