const RAW_API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "https://project-cts.onrender.com";
const normalizedApiBase = `${RAW_API_BASE_URL}`.replace(/\/+$/, "");
export const API_BASE_URL = normalizedApiBase.endsWith("/api")
  ? normalizedApiBase
  : `${normalizedApiBase}/api`;

export const buildPageUrl = (page) => {
  return `/${page}`;
};

export const CTS_CONTRACT_ADDRESS = "0xEAf24CD54048A6CED382A1B80E2E7AE4A221913d";
export const CTS_OWNER_ADDRESS = "0x52a176d6059b65daf15de8a047daf749ef457ec4";
