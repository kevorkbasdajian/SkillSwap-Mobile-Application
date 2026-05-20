// This jwt utility is to enable the generation and verification of tokens.
const jwt = require("jsonwebtoken");
const config = require("../config/env");

// Generate a token based on a payload
const generateToken = (payload) => {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresin,
  });
};

// Take token as input, verify it with the secret jwt key
const verifyToken = (token) => {
  try {
    return jwt.verify(token, config.jwt.secret);
  } catch (error) {
    throw new Error("Invalid or expired token");
  }
};

module.exports = {
  generateToken,
  verifyToken,
};

/*
1- The generateToken function takes a payload, the user specified jwt_secret
to sign and generate a token.
2- The verifyToken function takes a token, and checks it against the jwt_secret
*/
