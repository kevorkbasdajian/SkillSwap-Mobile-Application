/* The purpose of this file is to collect environment variables in a constant named
config, validate the presence of important variables, and provide default values in case of their absence.
*/
require("dotenv").config();

const config = {
  env: process.env.NODE_ENV || "development",
  port: process.env.PORT || 5000,
  clientUrl: process.env.clientUrl || "http://localhost:8081",
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:8081",
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresin: process.env.JWT_EXPIRES_IN || "7d",
  },
  supabase: {
    url: process.env.SUPABASE_URL,
    key: process.env.SUPABASE_ANON_KEY,
  },
  email: {
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT || "587"),
    user: process.env.EMAIL_USER,
    password: process.env.EMAIL_PASSWORD,
    from: process.env.EMAIL_FROM,
  },
  groq: {
    apiKey: process.env.GROQ_API_KEY,
  },
};

const requiredEnvVars = [
  "JWT_SECRET",
  "SUPABASE_URL",
  "SUPABASE_ANON_KEY",
  "EMAIL_USER",
  "EMAIL_PASSWORD",
  "GROQ_API_KEY",
];
const missingEnvVars = requiredEnvVars.filter(
  (varName) => !process.env[varName],
);

if (missingEnvVars.length > 0) {
  throw new Error(
    `Missing required environment variables: ${missingEnvVars.join(", ")}`,
  );
}
module.exports = config;
