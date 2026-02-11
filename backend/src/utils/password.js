//This utility is to hash passwords and verify them.
const bcrypt = require("bcryptjs");

const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

const comparePassword = async (password, hashedPassword) => {
  return bcrypt.compare(password, hashedPassword);
};

module.exports = { hashPassword, comparePassword };
/*
1- when hashing a password, we do not directly store the hashed password in the database
because if two users have the same password, then their hash will be the same, so we add a 
random 10 digit character ( salt ) to the password and then store it.

2- During verification, first the salt is extracted from the hashed password and then added to the
input password, and together the two are hashed and compared with the stored hashed password to check if they match
or not.
*/
