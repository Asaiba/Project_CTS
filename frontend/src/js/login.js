import { loginUser, loginWithWallet, saveAuthSession, roleDashboard } from "./api.js";

const existingToken = localStorage.getItem("cts_access_token");
if (existingToken) {
  const user = JSON.parse(localStorage.getItem("cts_user") || "null");
  const role = user?.role || "student";
  window.location.href = roleDashboard(role);
}

const form = document.querySelector("form");
const statusEl = document.querySelector("#login-status");
const walletButton = document.querySelector("#connect-wallet-btn");

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
    if (statusEl) {
      statusEl.textContent = err.message || "Login failed.";
      statusEl.className = "text-sm text-red-500";
    } else {
      alert(err.message);
    }
  }
});

if (walletButton) {
  walletButton.addEventListener("click", async () => {
    if (statusEl) statusEl.textContent = "";
    try {
      if (!window.connectWalletForCts) {
        throw new Error("Wallet connection is not available.");
      }

      const walletAddress = await window.connectWalletForCts();
      if (!walletAddress) {
        throw new Error("Wallet address not detected.");
      }

      const data = await loginWithWallet({ walletAddress });
      saveAuthSession(data);
      window.location.href = roleDashboard(data.user.role);
    } catch (err) {
      console.error(err);
      if (statusEl) {
        statusEl.textContent = err.message || "Wallet login failed.";
        statusEl.className = "text-sm text-red-500";
      } else {
        alert(err.message);
      }
    }
  });
}
