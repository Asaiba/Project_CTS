import { buildPageUrl } from "./config.js";

const token = localStorage.getItem("cts_access_token");

if (!token || token === "" || token === "undefined") {
  window.location.href = buildPageUrl("login.html");
}
