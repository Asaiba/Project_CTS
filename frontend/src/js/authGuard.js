const token = localStorage.getItem("cts_access_token");

console.log("AUTH CHECK TOKEN:", token);

if (!token || token === "" || token === "undefined") {
  window.location.href = "/pages/login.html";
}
