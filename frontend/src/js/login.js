import { loginUser, saveAuthSession, roleDashboard } from "./api.js";

const form = document.querySelector("form");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const payload = {
    email: document.querySelector("#email").value,
    password: document.querySelector("#password").value,
  };

  try {
    const data = await loginUser(payload);

    console.log("LOGIN RESPONSE:", data);

    // Save tokens
    saveAuthSession(data);

    console.log("TOKEN SAVED:", localStorage.getItem("cts_access_token"));

    // Redirect to dashboard
    window.location.href = roleDashboard(data.user.role);
  } catch (err) {
    console.error(err);
    alert(err.message);
  }
});
