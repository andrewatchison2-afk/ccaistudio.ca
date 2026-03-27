const { Resend } = require('resend');

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM = 'Coachd Hockey <andy@coachdhockey.ca>';

async function send(to, subject, html) {
  if (!resend) {
    console.log(`[email skipped — no RESEND_API_KEY] To: ${to} | Subject: ${subject}`);
    return;
  }
  try {
    await resend.emails.send({ from: FROM, to, subject, html });
  } catch (err) {
    console.error('Email send failed:', err.message);
  }
}

function sendWelcome({ parentName, playerName, parentEmail, playerId }) {
  const dashboardUrl = `https://coachdhockey.ca/dashboard?id=${playerId}`;
  return send(parentEmail, `${playerName}'s training plan is being built`, `
    <div style="font-family:system-ui,sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;color:#1a1a2e">
      <div style="font-size:22px;font-weight:700;color:#0ea5e9;margin-bottom:24px">COACHD HOCKEY</div>

      <p style="font-size:16px;margin:0 0 16px">Hi ${parentName},</p>

      <p style="font-size:16px;margin:0 0 16px">
        Your free trial has started. We're building ${playerName}'s first personalized weekly plan right now — it'll be ready in about 30 seconds.
      </p>

      <a href="${dashboardUrl}"
         style="display:inline-block;background:#0ea5e9;color:#fff;text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:700;font-size:16px;margin:8px 0 24px">
        Open ${playerName}'s Dashboard →
      </a>

      <p style="font-size:14px;color:#64748b;margin:0 0 8px">
        <strong>Bookmark that link.</strong> It's your permanent access to ${playerName}'s plan, coaching chat, and training history.
      </p>

      <p style="font-size:14px;color:#64748b;margin:0 0 32px">
        You'll get a new plan every week based on the season, ${playerName}'s position, and what the coach learns over time.
      </p>

      <hr style="border:none;border-top:1px solid #e2e8f0;margin:0 0 24px">

      <p style="font-size:13px;color:#94a3b8;margin:0">
        Questions? Reply to this email or reach us at andy@coachdhockey.ca<br>
        Manage your subscription anytime from the dashboard.
      </p>
    </div>
  `);
}

function sendPlanReady({ parentName, playerName, parentEmail, playerId, weeklyTheme }) {
  const dashboardUrl = `https://coachdhockey.ca/dashboard?id=${playerId}`;
  return send(parentEmail, `${playerName}'s Week 1 plan is ready`, `
    <div style="font-family:system-ui,sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;color:#1a1a2e">
      <div style="font-size:22px;font-weight:700;color:#0ea5e9;margin-bottom:24px">COACHD HOCKEY</div>

      <p style="font-size:16px;margin:0 0 16px">Hi ${parentName},</p>

      <p style="font-size:16px;margin:0 0 16px">
        ${playerName}'s Week 1 training plan is ready.
      </p>

      ${weeklyTheme ? `
      <div style="background:#f0f9ff;border-left:4px solid #0ea5e9;padding:16px;border-radius:4px;margin:0 0 24px">
        <div style="font-size:12px;font-weight:600;color:#0ea5e9;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px">This Week's Theme</div>
        <div style="font-size:16px;font-weight:600;color:#1a1a2e">${weeklyTheme}</div>
      </div>` : ''}

      <a href="${dashboardUrl}"
         style="display:inline-block;background:#0ea5e9;color:#fff;text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:700;font-size:16px;margin:0 0 24px">
        View ${playerName}'s Plan →
      </a>

      <p style="font-size:14px;color:#64748b;margin:0 0 32px">
        The plan includes on-ice drills, off-ice training, and nutrition — all built for ${playerName}'s position and level. Chat with the AI coach anytime to adjust.
      </p>

      <hr style="border:none;border-top:1px solid #e2e8f0;margin:0 0 24px">

      <p style="font-size:13px;color:#94a3b8;margin:0">
        Coachd Hockey · andy@coachdhockey.ca<br>
        <a href="${dashboardUrl}" style="color:#94a3b8">Manage subscription</a>
      </p>
    </div>
  `);
}

module.exports = { sendWelcome, sendPlanReady };
