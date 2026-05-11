const SibApiV3Sdk = require('@getbrevo/brevo');

const sendEmail = async (options) => {
  const defaultClient = SibApiV3Sdk.ApiClient.instance;
  const apiKey = defaultClient.authentications['api-key'];
  apiKey.apiKey = process.env.BREVO_API_KEY;

  const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

  const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
  sendSmtpEmail.subject = options.subject;
  sendSmtpEmail.htmlContent = options.html;
  sendSmtpEmail.sender = {
    name: process.env.FROM_NAME,
    email: process.env.FROM_EMAIL
  };
  sendSmtpEmail.to = [{ email: options.to }];

  const result = await apiInstance.sendTransacEmail(sendSmtpEmail);
  console.log('Email sent to:', options.to);
  return result;
};

module.exports = sendEmail;