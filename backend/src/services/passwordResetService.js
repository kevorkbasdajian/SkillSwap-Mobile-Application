//This file handles requests to resetPassword. It also verifies reset tokens.

const supabase = require("../config/database");
const crypto = require("crypto");

const { sendPasswordResetEmail } = require("./emailService");

const { hashPassword } = require("../utils/password");

const passwordResetService = {
  //Request password reset
  requestPasswordReset: async (email) => {
    //Find user by email
    const { data: user, error } = await supabase
      .from("users")
      .select("id,email,full_name,nick_name")
      .eq("email", email)
      .single();
    if (error || !user) {
      return { message: "If that email exists, a reset link has been sent" };
    }

    // Generate secure random token
    const resetToken = crypto.randomBytes(32).toString("hex");

    // Set expiration to 1 hour from now
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();

    //Invalidate any existing reset tokens for this user
    await supabase.from("password_resets").delete().eq("user_id", user.id);

    //Insert ResetToken
    const { error: insertError } = await supabase
      .from("password_resets")
      .insert([
        {
          user_id: user.id,
          reset_token: resetToken,
          expires_at: expiresAt,
          used: false,
        },
      ]);

    if (insertError) {
      throw new Error("Failed to create reset token");
    }

    const userName = user.nick_name || user.full_name;
    await sendPasswordResetEmail(user.email, resetToken, userName);

    return { message: "If that email exists, a reset link has been sent" };
  },

  // Verify reset token is valid
  verifyResetToken: async (token) => {
    const { data: resetRecord, error } = await supabase
      .from("password_resets")
      .select("id, user_id, expires_at,used")
      .eq("reset_token", token)
      .single();

    if (error || !resetRecord) {
      throw new Error("Invalid or expired reset token");
    }
    if (resetRecord.used) {
      throw new Error("This reset tooken has already been used");
    }
    if (new Date(resetRecord.expires_at) < Date.now) {
      throw new Error("This reset token has expired");
    }

    return { valid: true, userId: resetRecord.user_id };
  },

  //Reset password with token
  resetPassword: async (token, newPassword) => {
    //Verify token
    const { userId } = await passwordResetService.verifyResetToken(token);

    // Hash new password
    const password_hash = await hashPassword(newPassword);

    //Update user password
    const { error: updateError } = await supabase
      .from("users")
      .update({ password_hash })
      .eq("id", userId);

    if (updateError) {
      throw new Error("Failed to update password");
    }
    // Mark token as used
    await supabase
      .from("password_resets")
      .update({ used: true })
      .eq("reset_token", token);

    // Delete all reset tokens for this user
    await supabase.from("password_resets").delete().eq("user_id", userId);

    return { message: "Password reset successful" };
  },
};
module.exports = passwordResetService;

/*
1- RequestPasswordReset: First, it selects the user with the provided email. Then, it generates
a random resetToken to be used for validation. Then it sets the expiration date of the token to 1
hour and deletes any existing reset token related to the same user. Then it inserts the new token
and sends an email to the user.
2- VerifyResetToken: This function first selects the record for the token, checks if it is valid/ not used
, and also checks if it has not been expired. Then, it returns the user Id and the valid success message.
3- resetPassword: First, we verify the token.
*/
