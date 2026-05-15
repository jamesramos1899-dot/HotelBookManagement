const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  pool: true,
  maxConnections: 5,
  maxMessages: 100,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Pre-verify connection on server startup so it's ready immediately
transporter.verify((error) => {
  if (error) {
    console.error("Mail transporter error:", error);
  } else {
    console.log("Mail transporter ready");
  }
});

const sendOtpEmail = async (toEmail, otp) => {
  await transporter.sendMail({
    from: `"AI Stay" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: "Your AI Stay Verification Code",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 400px; margin: auto; padding: 24px; background: #0f172a; color: #fff; border-radius: 12px;">
        <h2 style="color: #06b6d4;">AI Stay Email Verification</h2>
        <p>Use the code below to verify your email address:</p>
        <div style="font-size: 36px; font-weight: bold; letter-spacing: 10px; color: #a855f7; margin: 20px 0;">${otp}</div>
        <p style="color: #9ca3af; font-size: 13px;">This code expires in <strong>5 minutes</strong>. Do not share it with anyone.</p>
      </div>
    `,
  });
};

module.exports = sendOtpEmail;