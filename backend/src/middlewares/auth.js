/*The purpose of this file is to protect routes that require users to be logged
in*/
const { verifyToken } = require("../utils/jwt");
const supabase = require("../config/database");
const { verify } = require("jsonwebtoken");

const authenticate = async (req, res, next) => {
  try {
    //Extract from headers
    const authHeader = req.headers.authorization;

    //If not provided or does not start with Bearer
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        error: "Access denied. No token provided.",
      });
    }

    //Extract token
    const token = authHeader.substring(7);

    //Verify token
    const decoded = verifyToken(token);

    //Fetch user from database
    const { data: user, error } = await supabase
      .from("users")
      .select(
        "id,email,full_name,nick_name,gender,profile_image_url,education_level",
      )
      .eq("id", decoded.userId)
      .single();

    if (error || !user) {
      return res.status(401).json({
        error: "Invalid token. User not found.",
      });

      //Attach user to request object
      req.user = user;
      next();
    }
  } catch (error) {
    return res.status(401).json({
      error: "Invalid or expired token.",
    });
  }
};
module.exports = authenticate;

/*
1- first, we check whether the token is provided in the headers.
2- we check if the token is not empty and starts with the word Bearer.
3- We remove the prefix and verify the token.
4- Based on the info extracted from the token, we check and see if such an
user exists. If so, we attach the user to the req.
5- In case any non-desirable thing happens, we throw an error
*/
