import express from "express";
import nodemailer from "nodemailer";
import dns from "node:dns/promises";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();
const SENDER_EMAIL = process.env.GMAIL_USER || "mansoor.291@gmail.com";
const SMTP_USER = "mansoor.291@gmail.com";
const SMTP_PASS = "adbfslyzphqegnwe";

function createTransport(host, port, secure) {
  const isIpAddress = /^\d+\.\d+\.\d+\.\d+$/.test(host);

  return nodemailer.createTransport({
    host,
    port,
    secure,
    requireTLS: !secure,
    family: isIpAddress ? undefined : 4,
    connectionTimeout: 12000,
    greetingTimeout: 12000,
    socketTimeout: 20000,
    tls: { servername: "smtp.gmail.com" },
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
}

async function sendMailWithFallback(mail) {
  if (!SMTP_USER || !SMTP_PASS) {
    const err = new Error("Payment confirmation email is not configured");
    err.status = 503;
    throw err;
  }

  const resolvedIps = await dns.resolve4("smtp.gmail.com").catch(() => []);
  const hosts = [...new Set(["smtp.gmail.com", ...resolvedIps.slice(0, 3)])];
  const attempts = hosts.flatMap(host => [
    { host, port: 587, secure: false },
    { host, port: 465, secure: true },
  ]);

  const errors = [];
  for (const attempt of attempts) {
    const transporter = createTransport(attempt.host, attempt.port, attempt.secure);
    try {
      const info = await transporter.sendMail(mail);
      transporter.close();
      return info;
    } catch (err) {
      transporter.close();
      errors.push(`${attempt.host}:${attempt.port} ${err?.code || ""} ${err?.response || err?.message || "failed"}`.trim());
    }
  }

  throw new Error(`All Gmail SMTP attempts failed: ${errors.join(" | ")}`);
}

function clean(value) {
  return String(value || "").trim();
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function plainRows(rows) {
  return rows.map(([label, value]) => `${label}: ${value}`).join("\n");
}

function detailsTable(rows) {
  return `
    <table cellpadding="8" cellspacing="0" style="border-collapse:collapse;border:1px solid #ddd;width:100%;max-width:640px">
      ${rows
        .map(
          ([label, value]) => `
        <tr>
          <td style="border:1px solid #ddd;font-weight:700;background:#f8f8f8;width:190px">${escapeHtml(label)}</td>
          <td style="border:1px solid #ddd">${escapeHtml(value)}</td>
        </tr>
      `,
        )
        .join("")}
    </table>
  `;
}

router.post("/confirmation", verifyToken, async (req, res) => {
  try {
    const name = clean(req.body.name);
    const email = clean(req.body.email);
    const phone = clean(req.body.phone);
    const service = clean(req.body.service);
    const amount = clean(req.body.amount);
    const utr = clean(req.body.utr).toUpperCase();
    const notes = clean(req.body.notes);

    if (!name || !email || !phone || !service || !utr) {
      return res
        .status(400)
        .json({
          error: "Name, email, phone, service and UTR number are required",
        });
    }

    if (utr.length < 6 || utr.length > 40) {
      return res
        .status(400)
        .json({ error: "Enter a valid UTR / Transaction ID" });
    }

    const submittedAt = new Date().toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
    });

    const studentRows = [
      ["Name", name],
      ["Email", email],
      ["Phone", phone],
      ["Service", service],
      ["Amount", amount || "Not provided"],
      ["UTR / Transaction ID", utr],
      ["Notes", notes || "None"],
      ["Submitted At", submittedAt],
    ];

    const studentMail = {
      from: `"Campus Bull" <${SENDER_EMAIL}>`,
      to: email,
      replyTo: SENDER_EMAIL,
      subject: `We received your payment details - ${service}`,
      text: [
        `Dear ${name},`,
        "",
        "Thank you for submitting your payment confirmation to Campus Bull.",
        "We have received your UTR / Transaction ID and our team will verify the payment shortly.",
        "Once verified, your membership/service access will be upgraded accordingly.",
        "",
        plainRows(studentRows),
        "",
        "If any detail is incorrect, please reply to this email with the correct information.",
        "",
        "Regards,",
        "Campus Bull Team",
      ].join("\n"),
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111;max-width:680px">
          <h2 style="margin:0 0 12px;color:#d32f2f">Payment confirmation received</h2>
          <p>Dear ${escapeHtml(name)},</p>
          <p>Thank you for submitting your payment confirmation to <strong>Campus Bull</strong>.</p>
          <p>
            We have received your UTR / Transaction ID and our team will verify the payment shortly.
            Once verified, your membership or selected service access will be upgraded accordingly.
          </p>
          ${detailsTable(studentRows)}
          <p style="margin-top:18px">
            If any detail is incorrect, please reply to this email with the correct information.
          </p>
          <p style="margin-top:22px">
            Regards,<br />
            <strong>Campus Bull Team</strong>
          </p>
        </div>
      `,
    };

    await sendMailWithFallback(studentMail);

    res.json({ message: "Payment confirmation sent successfully" });
  } catch (err) {
    console.error("payment confirmation", err);
    const detail = err?.response || err?.message || "Unknown mail error";
    res.status(err.status || 500).json({ error: `Failed to send payment confirmation: ${detail}` });
  }
});

export default router;
