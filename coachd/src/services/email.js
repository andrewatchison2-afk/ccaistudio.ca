const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.FROM_EMAIL || 'CoachD <hello@coachdhockey.ca>';
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

async function sendWelcomeEmail(player) {
  const dashboardUrl = `${BASE_URL}/dashboard?id=${player.id}`;
  await resend.emails.send({
    from: FROM,
    to: player.parent_email,
    subject: `${player.player_name}'s weekly plan is ready 🏒`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#111">
        <h2 style="margin:0 0 8px">Hey ${player.parent_name},</h2>
        <p style="margin:0 0 24px;color:#444">
          ${player.player_name}'s first weekly development plan just dropped.
          It's built around their goal: <strong>${player.primary_goal}</strong>.
        </p>
        <a href="${dashboardUrl}"
           style="display:inline-block;background:#1a1a2e;color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:16px">
          View ${player.player_name}'s Plan →
        </a>
        <p style="margin:32px 0 0;font-size:13px;color:#888">
          Bookmark that link — it's how you get back to the dashboard any time.<br>
          Or just go to <a href="${BASE_URL}/login" style="color:#888">coachdhockey.ca/login</a> and enter this email.
        </p>
      </div>
    `
  });
}

async function sendLoginEmail(player) {
  const dashboardUrl = `${BASE_URL}/dashboard?id=${player.id}`;
  await resend.emails.send({
    from: FROM,
    to: player.parent_email,
    subject: `Your CoachD dashboard link`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#111">
        <h2 style="margin:0 0 8px">Here's your dashboard link</h2>
        <p style="margin:0 0 24px;color:#444">
          Here's where ${player.player_name}'s plan lives:
        </p>
        <a href="${dashboardUrl}"
           style="display:inline-block;background:#1a1a2e;color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:16px">
          Open Dashboard →
        </a>
        <p style="margin:32px 0 0;font-size:13px;color:#888">
          If you didn't request this, ignore it — nothing was changed.
        </p>
      </div>
    `
  });
}

module.exports = { sendWelcomeEmail, sendLoginEmail };
