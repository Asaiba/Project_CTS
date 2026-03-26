import { buildPageUrl } from "./config.js";
import { resetPassword } from "./api.js";

const params = new URLSearchParams(window.location.search);
const token = params.get("token") || "";
const email = params.get("email") || "";
const mode = params.get("mode") || "reset";

const titleEl = document.getElementById("reset-title");
const subtitleEl = document.getElementById("reset-subtitle");
const emailEl = document.getElementById("reset-email");
const form = document.getElementById("reset-password-form");
const passwordInput = document.getElementById("new-password");
const confirmInput = document.getElementById("confirm-password");
const submitButton = document.getElementById("reset-submit-btn");
const statusEl = document.getElementById("reset-status");

const setStatus = (message, isError = false) => {
  if (!statusEl) return;
  statusEl.textContent = message || "";
  statusEl.className = `text-sm min-h-5 ${isError ? "text-red-600" : "text-green-600"}`;
};

if (titleEl) {
  titleEl.textContent = mode === "setup" ? "Set Your Password" : "Reset Your Password";
}

if (subtitleEl) {
  subtitleEl.textContent =
    mode === "setup"
      ? "Choose a secure password to activate your CTS account."
      : "Enter a new password for your CTS account.";
}

if (emailEl) {
  emailEl.textContent = email ? `Account: ${email}` : "Use the link from your email to continue.";
}

if (!token) {
  setStatus("This password link is missing its token. Request a new one and try again.", true);
  if (submitButton) submitButton.disabled = true;
}

form?.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!token) {
    setStatus("This password link is invalid.", true);
    return;
  }

  const newPassword = passwordInput?.value || "";
  const confirmPassword = confirmInput?.value || "";

  if (newPassword.length < 8) {
    setStatus("Password must be at least 8 characters.", true);
    return;
  }

  if (newPassword !== confirmPassword) {
    setStatus("Passwords do not match.", true);
    return;
  }

  if (submitButton) submitButton.disabled = true;
  setStatus(mode === "setup" ? "Saving your password..." : "Resetting your password...");

  try {
    const data = await resetPassword({ token, newPassword });
    setStatus(data?.message || "Password saved. Redirecting to login...");
    window.setTimeout(() => {
      window.location.href = buildPageUrl("login.html");
    }, 1600);
  } catch (error) {
    setStatus(error.message || "Could not save the new password.", true);
  } finally {
    if (submitButton) submitButton.disabled = false;
  }
});
