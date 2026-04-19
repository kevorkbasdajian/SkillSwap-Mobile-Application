//This file is to handle the email needed for resetting a password

const nodemailer = require("nodemailer");
const config = require("../config/env");

//Create transporter
const transporter = nodemailer.createTransport({
  host: config.email.host,
  port: config.email.port,
  secure: false,
  auth: {
    user: config.email.user,
    pass: config.email.password,
  },
});
//Verify Connection
transporter.verify((error, success) => {
  if (error) {
    throw new Error(`Email service error: ${error}`);
  } else {
    console.log("Email service ready");
  }
});

const sendEmail = async (to, subject, html) => {
  try {
    const mailOptions = {
      from: config.email.from,
      to,
      subject,
      html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent:", info.messageId);
  } catch (error) {
    throw new Error(
      "Error when sending the email.\nOutcome: Failed to send email",
    );
  }
};

const sendPasswordResetEmail = async (email, resetToken, userName) => {
  const resetUrl = `https://medallic-unproscriptively-cori.ngrok-free.dev/reset-password?token=${resetToken}`;

  const html = `
    <!doctype html>
<html>
  <head>
    <style>
      body {
        font-family: Arial, sans-serif;
        line-height: 1.6;
        color: #333;
      }
      .container {
        max-width: 600px;
        margin: 0 auto;
        padding: 20px;
      }
      .header {
        background: #e0b9a1;
        color: white;
        padding: 20px;
        text-align: center;
        border-radius: 5px 5px 0 0;
      }
      .content {
        background: #f9f9f9;
        padding: 30px;
        border-radius: 0 0 5px 5px;
      }
      .button {
        display: inline-block;
        background: #3292af;
        color: white;
        padding: 12px 30px;
        text-decoration: none;
        border-radius: 5px;
        margin: 20px 0;
      }
      .footer {
        margin-top: 20px;
        padding-top: 20px;
        border-top: 1px solid #ddd;
        font-size: 12px;
        color: #666;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>SkillSwap</h1>
      </div>
      <div class="content">
        <h2>Password Reset Request</h2>
        <p>Hi ${userName},</p>
        <p>
          We received a request to reset your password. Click the button below
          to create a new password:
        </p>
        <p style="text-align: center">
          <a href="${resetUrl}" class="button">Reset Password</a>
        </p>
        <p>Or copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #007bff">${resetUrl}</p>
        <p><strong>This link will expire in 1 hour.</strong></p>
        <p>
          If you didn't request a password reset, you can safely ignore this
          email.
        </p>
        <div class="footer">
          <p>Best regards,<br />The SkillSwap Team</p>
          <p style="font-size: 11px">
            This is an automated email. Please do not reply.
          </p>
        </div>
      </div>
    </div>
  </body>
</html>

  `;
  await sendEmail(email, "Reset Your SkillSwap Password", html);
};

module.exports = {
  sendEmail,
  sendPasswordResetEmail,
};
/*
1- createTransport: Transporter is like the delivery truck that takes the email from
the user agent and puts it to the server agent.
2- transporter.verify: This function is needed to check if every data is valid or not.
3- sendMail: After constructing the mail options, we need to send the mail and receive
the info.
4- sendPasswordResetEmail: This function creates the url the button will take to, the html
template which informs the user about the password reset, and then sends the email.
*/
