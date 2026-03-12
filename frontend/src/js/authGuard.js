import { buildPageUrl } from "./config.js";

const token = localStorage.getItem("cts_access_token");

console.log("AUTH CHECK TOKEN:", token);

if (!token || token === "" || token === "undefined") {
  window.location.href = buildPageUrl("login.html");
}
