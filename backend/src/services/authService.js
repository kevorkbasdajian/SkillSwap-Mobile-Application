// This service is to authenticate new/existing users and register them.
const supabase = require("../config/database");
const { hashPassword, comparePassword } = require("../utils/password");
const { generateToken } = require("../utils/jwt");

const authService = {
  //Register new user
  register: async (userData) => {
    const { email, full_name, password } = userData;

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .single();

    if (existingUser) {
      throw new Error("user with this email already exists");
    }
    const password_hash = await hashPassword(password);
    const { data: newUser, error } = await supabase
      .from("users")
      .insert([{ email, password_hash, full_name }])
      .select("id,email,full_name,created_at")
      .single();
    if (error) {
      throw new Error(`Registration failed: ${error.message}`);
    }
    const { error: settingsError } = await supabase
      .from("user_settings")
      .insert([
        {
          user_id: newUser.id,
          allow_notifications: true,
          show_skills: true,
          allow_friend_requests: true,
          auto_accept_group_invites: true,
        },
      ]);

    if (settingsError) {
      throw new Error(`Settings creation failed: ${settingsError.message}`);
    }

    //Generate JWT token
    const token = generateToken({ userId: newUser.id, email: newUser.email });
    return {
      user: newUser,
      token,
    };
  },

  //Login user
  login: async (email, password) => {
    //Find user by email
    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .single();

    if (error) {
      throw new Error("Invalid email or password");
    }

    //Verify Password
    const isPasswordValid = await comparePassword(password, user.password_hash);

    if (!isPasswordValid) {
      throw new Error("Invalid email or password");
    }

    //Generate a JWT token
    const token = generateToken({ userId: user.id, email: user.email });
    const { password_hash, ...userWithoutPassword } = user;
    return {
      user: userWithoutPassword,
      token,
    };
  },
};
module.exports = authService;

/*
1- if a user wants to register, first we check if a similar user exists.
If not, we hash the password and create a new user. Then we generate a new token,
by using the id and the email of the user.
2-if a user wants to login, first we check if such a user exists by email. Then,
we compare the password with the hashed_password. If it matches, we generate a JWT
token . Finally, we remove the hashed_password from the response.


*/
