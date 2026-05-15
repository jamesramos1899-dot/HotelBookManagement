const axios = require("axios");

const sendOtpEmail = async (toEmail, otp) => {
  const response = await axios.post(
    "https://api.brevo.com/v3/smtp/email",
    {
      sender: {
        name: process.env.FROM_NAME,
        email: process.env.FROM_EMAIL,
      },
      to: [{ email: toEmail }],
      subject: "Your AI Stay Verification Code",
      htmlContent: `
        <div style="font-family: Arial, sans-serif; max-width: 400px; margin: auto; padding: 24px; background: #0f172a; color: #fff; border-radius: 12px;">
          <h2 style="color: #06b6d4;">AI Stay Email Verification</h2>
          <p>Use the code below to verify your email address:</p>
          <div style="font-size: 36px; font-weight: bold; letter-spacing: 10px; color: #a855f7; margin: 20px 0;">${otp}</div>
          <p style="color: #9ca3af; font-size: 13px;">This code expires in <strong>5 minutes</strong>. Do not share it with anyone.</p>
        </div>
      `,
    },
    {
      headers: {
        "api-key": process.env.BREVO_API_KEY,
        "Content-Type": "application/json",
      },
    }
  );

  console.log("OTP email sent to:", toEmail, response.data.messageId);
  return response.data;
};

module.exports = sendOtpEmail;