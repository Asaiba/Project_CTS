export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "https://project-cts.onrender.com";

export const buildPageUrl = (page) => {
  return `/${page}`;
};

export const CTS_CONTRACT_ADDRESS = "0x1d7Cd344a17A70E24779B7e7040Fb3386D5623B0";
export const CTS_OWNER_ADDRESS = "0x52a176d6059b65daf15de8a047daf749ef457ec4";
