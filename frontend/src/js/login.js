import { forgotPassword, loginUser, loginWithWallet, saveAuthSession, roleDashboard } from "./api.js";

const form = document.querySelector("form");
const emailInput = document.querySelector("#email");
const passwordInput = document.querySelector("#password");
const forgotPasswordButton = document.querySelector("#forgot-password-btn");
const statusEl = document.querySelector("#login-status");

const setStatus = (message, isError = false) => {
  if (!statusEl) return;
  statusEl.textContent = message || "";
  statusEl.className = `text-sm min-h-5 ${isError ? "text-red-600" : "text-green-600"}`;
};

form?.addEventListener("submit", async (event) => {
  event.preventDefault();
  setStatus("");

  const payload = {
    email: emailInput?.value?.trim() || "",
    password: passwordInput?.value || "",
  };

  try {
    const data = await loginUser(payload);
    saveAuthSession(data);
    window.location.href = roleDashboard(data.user.role);
  } catch (error) {
    setStatus(error.message || "Login failed.", true);
  }
});

forgotPasswordButton?.addEventListener("click", async () => {
  const email = emailInput?.value?.trim().toLowerCase() || "";
  if (!email) {
    setStatus("Enter the account email first, then click Forgot password.", true);
    emailInput?.focus();
    return;
  }

  setStatus("Sending reset link...");

  try {
    const data = await forgotPassword({ email });
    const emailDelivery = data?.emailDelivery || {};
    const resetLink = data?.resetLink || "";

    if (resetLink && !emailDelivery.sent) {
      window.open(resetLink, "_blank", "noopener,noreferrer");
      setStatus("Password reset email was not sent. Opened the development reset link in a new tab.");
      return;
    }

    setStatus(data?.message || "If the account exists, a password reset link has been sent.");
  } catch (error) {
    setStatus(error.message || "Failed to start password reset.", true);
  }
});

const walletButton = document.querySelector("#connect-wallet-btn");

if (walletButton) {
  walletButton.addEventListener("click", async () => {
    setStatus("");

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
    } catch (error) {
      setStatus(error.message || "Wallet login failed.", true);
    }
  });
}
