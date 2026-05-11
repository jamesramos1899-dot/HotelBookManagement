const { Resend } = require('resend');

const sendEmail = async (options) => {
  const resend = new Resend(process.env.RESEND_API_KEY);

  const { data, error } = await resend.emails.send({
    from: `${process.env.FROM_NAME} <onboarding@resend.dev>`,
    to: options.to,
    subject: options.subject,
    html: options.html
  });

  if (error) {
    throw new Error(error.message);
  }

  console.log('Email sent:', data.id);
  return data;
};

module.exports = sendEmail;