/* The purpose of this file is to collect environment variables in a constant named
config, validate the presence of important variables, and provide default values in case of their absence.
*/
require("dotenv").config();

const config = {
  env: process.env.NODE_ENV || "development",
  port: process.env.PORT || 5000,
  clientUrl: process.env.clientUrl || "http://localhost:8081",
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresin: process.env.JWT_EXPIRE_IN || "7d",
  },
  supabase: {
    url: process.env.SUPABASE_URL,
    key: process.env.SUPABASE_ANON_KEY,
  },
};

const requiredEnvVars = ["JWT_SECRET", "SUPABASE_URL", "SUPABASE_ANON_KEY"];
const missingEnvVars = requiredEnvVars.filter(
  (varName) => !process.env[varName],
);

if (missingEnvVars.length > 0) {
  throw new Error(
    `Missing required environment variables: ${missingEnvVars.join(", ")}`,
  );
}
module.exports = config;
