import nodemailer from "nodemailer";
import { env } from "../config/env.js";

const canSendEmail = () => Boolean(env.smtpHost && env.smtpUser && env.smtpPass);

const getTransporter = () => {
  if (!canSendEmail()) return null;
  return nodemailer.createTransport({
    host: env.smtpHost,
    port: env.smtpPort,
    secure: env.smtpSecure,
    requireTLS: !env.smtpSecure,
    auth: {
      user: env.smtpUser,
      pass: env.smtpPass,
    },
  });
};

const normalizeBaseUrl = () => {
  const raw = String(env.appBaseUrl || env.frontendOrigin || "").split(",")[0].trim();
  const base = raw || "http://localhost:5173";
  return base.replace(/\/+$/, "");
};

const buildAppUrl = (pathname, params = {}) => {
  const base = normalizeBaseUrl();
  const url = new URL(pathname.startsWith("/") ? pathname : `/${pathname}`, `${base}/`);

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    url.searchParams.set(key, String(value));
  });

  return url.toString();
};

const sendMail = async ({ toEmail, subject, text, html }) => {
  const transporter = getTransporter();
  if (!transporter) {
    return { sent: false, reason: "smtp_not_configured" };
  }

  try {
    await transporter.sendMail({
      from: env.smtpFrom,
      to: toEmail,
      subject,
      text,
      html,
    });
  } catch (err) {
    console.error(`[mail] ${subject} failed:`, err.message);
    return { sent: false, reason: "send_failed", detail: err.message };
  }

  return { sent: true };
};

const buildLinkEmailHtml = ({ greetingName, introLine, actionLabel, actionLink, outroLines = [] }) => {
  const escapedName = String(greetingName || "there");
  const escapedIntro = String(introLine || "");
  const escapedActionLabel = String(actionLabel || "Open link");
  const escapedLink = String(actionLink || "");
  const outro = outroLines
    .filter(Boolean)
    .map((line) => `<p style="margin:0 0 12px;color:#475569;">${String(line)}</p>`)
    .join("");

  return `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#0f172a;max-width:640px;margin:0 auto;padding:24px;">
      <h2 style="margin:0 0 16px;">CTS Account Access</h2>
      <p style="margin:0 0 12px;">Hello ${escapedName},</p>
      <p style="margin:0 0 16px;color:#475569;">${escapedIntro}</p>
      <p style="margin:0 0 24px;">
        <a href="${escapedLink}" style="display:inline-block;padding:12px 18px;background:#285185;color:#ffffff;text-decoration:none;border-radius:10px;font-weight:700;">
          ${escapedActionLabel}
        </a>
      </p>
      <p style="margin:0 0 12px;color:#475569;">If the button does not work, use this link:</p>
      <p style="margin:0 0 16px;word-break:break-all;"><a href="${escapedLink}">${escapedLink}</a></p>
      ${outro}
    </div>
  `.trim();
};

export const buildPasswordResetLink = ({ token, email, mode = "reset" }) =>
  buildAppUrl("reset-password.html", { token, email, mode });

export const sendAccountSetupEmail = async ({ toEmail, username, role, setupLink }) => {
  const text = [
    `Hello ${username},`,
    "",
    `Your CTS ${role} account has been created.`,
    "Use the secure link below to set your password:",
    setupLink,
    "",
    "This link expires in 1 hour.",
    "If you did not expect this email, you can ignore it.",
  ].join("\n");

  const html = buildLinkEmailHtml({
    greetingName: username,
    introLine: `Your CTS ${role} account has been created. Use the secure link below to set your password.`,
    actionLabel: "Set Password",
    actionLink: setupLink,
    outroLines: ["This link expires in 1 hour.", "If you did not expect this email, you can ignore it."],
  });

  return sendMail({
    toEmail,
    subject: "Set up your CTS account password",
    text,
    html,
  });
};

export const sendPasswordResetEmail = async ({ toEmail, username, resetLink }) => {
  const safeName = username || "there";
  const text = [
    `Hello ${safeName},`,
    "",
    "We received a request to reset your CTS password.",
    "Use the secure link below to choose a new password:",
    resetLink,
    "",
    "This link expires in 1 hour.",
    "If you did not request a reset, you can ignore this email.",
  ].join("\n");

  const html = buildLinkEmailHtml({
    greetingName: safeName,
    introLine: "We received a request to reset your CTS password. Use the secure link below to choose a new password.",
    actionLabel: "Reset Password",
    actionLink: resetLink,
    outroLines: ["This link expires in 1 hour.", "If you did not request a reset, you can ignore this email."],
  });

  return sendMail({
    toEmail,
    subject: "Reset your CTS password",
    text,
    html,
  });
};
