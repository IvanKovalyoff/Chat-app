import { Resend } from 'resend';

// Resend uses a plain HTTPS API instead of SMTP, so it isn't affected by
// hosts (like Railway) that block or throttle outbound SMTP ports.
const resend = new Resend(process.env.RESEND_API_KEY);

async function send(email: string, subject: string, html: string) {
  const { error } = await resend.emails.send({
    from: `Chat App <${process.env.EMAIL_FROM}>`,
    to: email,
    subject,
    html,
  });

  if (error) {
    throw new Error(`Resend error: ${error.message}`);
  }
}

function sendActivationLink(email: string, activationToken: string) {
  const link = `${process.env.CLIENT_URL}/activation/${email}/${activationToken}`;
  const html = `
    <h1>Account activation</h1>
    <a href="${link}">${link}</a>
  `;

  return send(email, 'Account activation', html);
}

export const mailer = {
  send,
  sendActivationLink,
};
