import dotenv from "dotenv";

dotenv.config();

const must = (name, fallback = "") => {
  const value = process.env[name] ?? fallback;
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
};

const configuredOrigins = (process.env.FRONTEND_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const frontendOrigins = Array.from(new Set([...configuredOrigins, "http://localhost:5173", "http://127.0.0.1:5173"]));

export const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 4000),
  databaseUrl: must("DATABASE_URL"),
  jwtAccessSecret: must("JWT_ACCESS_SECRET"),
  jwtRefreshSecret: must("JWT_REFRESH_SECRET"),
  jwtAccessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m",
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
  frontendOrigin: process.env.FRONTEND_ORIGIN || "http://localhost:5173",
  frontendOrigins,
  googleClientId: process.env.GOOGLE_CLIENT_ID || "",
  smtpHost: process.env.SMTP_HOST || "",
  smtpPort: Number(process.env.SMTP_PORT || 587),
  smtpSecure: process.env.SMTP_SECURE === "true",
  smtpUser: process.env.SMTP_USER || "",
  smtpPass: process.env.SMTP_PASS || "",
  smtpFrom: process.env.SMTP_FROM || "no-reply@cts.local",
  ethRpcUrl: process.env.ETH_RPC_URL || "",
  ctsContractAddress: process.env.CTS_CONTRACT_ADDRESS || "",
  ctsOwnerPrivateKey: process.env.CTS_OWNER_PRIVATE_KEY || "",
};
