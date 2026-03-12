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

export const sendTempPasswordEmail = async ({ toEmail, username, tempPassword, role }) => {
  const transporter = getTransporter();
  if (!transporter) {
    return { sent: false, reason: "smtp_not_configured" };
  }

  const text = [
    `Hello ${username},`,
    "",
    `Your CTS ${role} account has been created.`,
    `Email: ${toEmail}`,
    `Temporary password: ${tempPassword}`,
    "",
    "Please login and change your password immediately.",
  ].join("\n");

  try {
    await transporter.sendMail({
      from: env.smtpFrom,
      to: toEmail,
      subject: "CTS account temporary password",
      text,
    });
  } catch (err) {
    console.error("[mail] sendTempPasswordEmail failed:", err.message);
    return { sent: false, reason: "send_failed", detail: err.message };
  }

  return { sent: true };
};
