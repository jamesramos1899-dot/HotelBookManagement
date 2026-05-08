const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail', // or use SMTP: host, port, auth
    auth: {
      user: process.env.EMAIL_USER,     // your email
      pass: process.env.EMAIL_PASS      // app password
    }
  });

  const message = {
    from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
    to: options.to,
    subject: options.subject,
    html: options.html
  };

  await transporter.sendMail(message);
};

module.exports = sendEmail;