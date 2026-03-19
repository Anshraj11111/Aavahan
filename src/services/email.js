'use strict';

const transporter = require('../config/mailer');
const env = require('../config/env');

/**
 * Send an email. Non-fatal — logs errors but never throws.
 */
async function sendMail({ to, subject, html }) {
  try {
    await transporter.sendMail({
      from: env.EMAIL_FROM,
      to,
      subject,
      html,
    });
  } catch (err) {
    console.error(`[Email] Failed to send to ${to}:`, err.message);
  }
}

// ─── HTML Templates ──────────────────────────────────────────────────────────

function baseTemplate(content) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 30px auto; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .header { background: #1a1a2e; color: #fff; padding: 24px 32px; }
    .header h1 { margin: 0; font-size: 22px; }
    .header p { margin: 4px 0 0; font-size: 13px; color: #aaa; }
    .body { padding: 32px; color: #333; line-height: 1.6; }
    .footer { background: #f9f9f9; padding: 16px 32px; font-size: 12px; color: #888; text-align: center; border-top: 1px solid #eee; }
    .badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; }
    .badge-success { background: #d4edda; color: #155724; }
    .badge-danger { background: #f8d7da; color: #721c24; }
    .info-box { background: #f0f4ff; border-left: 4px solid #4a6cf7; padding: 16px; border-radius: 4px; margin: 16px 0; }
    .btn { display: inline-block; padding: 12px 24px; background: #4a6cf7; color: #fff; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 16px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎓 ${env.FEST_NAME}</h1>
      <p>${env.FEST_ORG} &bull; ${env.FEST_START_DATE} to ${env.FEST_END_DATE}</p>
    </div>
    <div class="body">${content}</div>
    <div class="footer">
      This is an automated email from ${env.FEST_NAME}. Please do not reply.<br>
      ${env.FEST_ORG}
    </div>
  </div>
</body>
</html>`;
}

/**
 * Send registration received confirmation email.
 */
async function sendRegistrationReceived({ to, fullName, eventTitle, uniqueRegistrationId, eventDay, amountExpected }) {
  const subject = `Registration Received - ${eventTitle} | ${env.FEST_NAME}`;
  const html = baseTemplate(`
    <h2>Hi ${fullName},</h2>
    <p>Your registration for <strong>${eventTitle}</strong> has been received successfully!</p>
    <div class="info-box">
      <strong>Registration ID:</strong> ${uniqueRegistrationId}<br>
      <strong>Event:</strong> ${eventTitle}<br>
      <strong>Day:</strong> ${eventDay}<br>
      <strong>Amount Expected:</strong> ₹${amountExpected}
    </div>
    <p>Our team will review your payment screenshot and approve your registration within 24-48 hours.</p>
    <p>You can check your registration status using your Registration ID: <strong>${uniqueRegistrationId}</strong></p>
    <p>See you at ${env.FEST_NAME}! 🚀</p>
  `);
  await sendMail({ to, subject, html });
}

/**
 * Send approval email with QR ticket.
 */
async function sendApprovalEmail({ to, fullName, eventTitle, uniqueRegistrationId, eventDay, qrCodeUrl }) {
  const subject = `Registration Approved ✅ - ${eventTitle} | ${env.FEST_NAME}`;
  const html = baseTemplate(`
    <h2>Congratulations, ${fullName}! 🎉</h2>
    <p>Your registration for <strong>${eventTitle}</strong> has been <span class="badge badge-success">APPROVED</span></p>
    <div class="info-box">
      <strong>Registration ID:</strong> ${uniqueRegistrationId}<br>
      <strong>Event:</strong> ${eventTitle}<br>
      <strong>Day:</strong> ${eventDay}
    </div>
    <p><strong>Your QR Ticket:</strong></p>
    ${qrCodeUrl ? `<p><img src="${qrCodeUrl}" alt="QR Ticket" style="max-width:200px;border:1px solid #ddd;border-radius:8px;padding:8px;" /></p>` : ''}
    ${qrCodeUrl ? `<p><a href="${qrCodeUrl}" class="btn">Download QR Ticket</a></p>` : ''}
    <p>Please bring this QR code on the day of the event for check-in. See you there! 🎓</p>
  `);
  await sendMail({ to, subject, html });
}

/**
 * Send rejection email with reason.
 */
async function sendRejectionEmail({ to, fullName, eventTitle, uniqueRegistrationId, reason }) {
  const subject = `Registration Update - ${eventTitle} | ${env.FEST_NAME}`;
  const html = baseTemplate(`
    <h2>Hi ${fullName},</h2>
    <p>We regret to inform you that your registration for <strong>${eventTitle}</strong> has been <span class="badge badge-danger">REJECTED</span>.</p>
    <div class="info-box">
      <strong>Registration ID:</strong> ${uniqueRegistrationId}<br>
      <strong>Reason:</strong> ${reason || 'Payment verification failed'}
    </div>
    <p>If you believe this is an error, please contact the fest team with your Registration ID.</p>
    <p>We hope to see you at ${env.FEST_NAME} for other events!</p>
  `);
  await sendMail({ to, subject, html });
}

/**
 * Send pending verification reminder to admin.
 */
async function sendPendingVerificationReminder({ to, count, registrations }) {
  const subject = `[Action Required] ${count} Pending Verifications - ${env.FEST_NAME}`;
  const rows = registrations
    .map(
      (r) =>
        `<tr><td>${r.uniqueRegistrationId}</td><td>${r.fullName}</td><td>${r.eventTitle}</td><td>${new Date(r.createdAt).toLocaleDateString()}</td></tr>`
    )
    .join('');

  const html = baseTemplate(`
    <h2>Pending Payment Verifications</h2>
    <p>There are <strong>${count}</strong> registrations pending payment verification for more than 24 hours.</p>
    <table style="width:100%;border-collapse:collapse;margin-top:16px;">
      <thead>
        <tr style="background:#f0f4ff;">
          <th style="padding:8px;text-align:left;border:1px solid #ddd;">Reg ID</th>
          <th style="padding:8px;text-align:left;border:1px solid #ddd;">Name</th>
          <th style="padding:8px;text-align:left;border:1px solid #ddd;">Event</th>
          <th style="padding:8px;text-align:left;border:1px solid #ddd;">Submitted</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    <p style="margin-top:16px;">Please log in to the admin panel to review and process these registrations.</p>
  `);
  await sendMail({ to, subject, html });
}

module.exports = {
  sendRegistrationReceived,
  sendApprovalEmail,
  sendRejectionEmail,
  sendPendingVerificationReminder,
};
