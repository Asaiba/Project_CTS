const token = localStorage.getItem("cts_access_token");

console.log("AUTH CHECK TOKEN:", token);

if (!token || token === "" || token === "undefined") {
  const isLocalHost = ["localhost", "127.0.0.1"].includes(window.location.hostname);
  const isVitePort = ["5173", "5174", "4173"].includes(window.location.port);
  const pageBase = isLocalHost && isVitePort ? "/src/pages" : "/pages";
  window.location.href = `${pageBase}/login.html`;
}
