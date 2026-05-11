const axios = require('axios');

const sendEmail = async (options) => {
  const response = await axios.post(
    'https://api.brevo.com/v3/smtp/email',
    {
      sender: {
        name: process.env.FROM_NAME,
        email: process.env.FROM_EMAIL
      },
      to: [{ email: options.to }],
      subject: options.subject,
      htmlContent: options.html
    },
    {
      headers: {
        'api-key': process.env.BREVO_API_KEY,
        'Content-Type': 'application/json'
      }
    }
  );

  console.log('Email sent to:', options.to, response.data.messageId);
  return response.data;
};

module.exports = sendEmail;