const Brevo = require('@getbrevo/brevo');

const sendEmail = async (options) => {
  const apiInstance = new Brevo.TransactionalEmailsApi();
  apiInstance.setApiKey(
    Brevo.TransactionalEmailsApiApiKeys.apiKey,
    process.env.BREVO_API_KEY
  );

  const sendSmtpEmail = new Brevo.SendSmtpEmail();
  sendSmtpEmail.subject = options.subject;
  sendSmtpEmail.htmlContent = options.html;
  sendSmtpEmail.sender = { 
    name: process.env.FROM_NAME, 
    email: process.env.FROM_EMAIL 
  };
  sendSmtpEmail.to = [{ email: options.to }];

  const result = await apiInstance.sendTransacEmail(sendSmtpEmail);
  console.log('Email sent to:', options.to, result.messageId);
  return result;
};

module.exports = sendEmail;