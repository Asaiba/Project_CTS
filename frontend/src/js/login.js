import { loginUser, loginWithWallet, saveAuthSession, roleDashboard } from "./api.js";

const form = document.querySelector("form");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const payload = {
    email: document.querySelector("#email").value,
    password: document.querySelector("#password").value,
  };

  try {
    const data = await loginUser(payload);

    saveAuthSession(data);

    window.location.href = roleDashboard(data.user.role);
  } catch (err) {
    alert(err.message);
  }
});

const walletButton = document.querySelector("#connect-wallet-btn");

if (walletButton) {
  walletButton.addEventListener("click", async () => {
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
      alert(err.message || "Wallet login failed.");
    }
  });
}
