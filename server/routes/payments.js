import express from "express";
import nodemailer from "nodemailer";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();
const SENDER_EMAIL = process.env.GMAIL_USER || "mansoor.291@gmail.com";
let cachedTransporter;

function getTransporter() {
  const user = "mansoor.291@gmail.com";
  const pass = "adbfslyzphqegnwe";
  if (!user || !pass) return null;

  if (cachedTransporter) return cachedTransporter;

  cachedTransporter = nodemailer.createTransport({
    service: "gmail",
    pool: true,
    maxConnections: 2,
    maxMessages: 100,
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
    auth: { user, pass },
  });

  return cachedTransporter;
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
    const transporter = getTransporter();
    if (!transporter) {
      return res
        .status(503)
        .json({ error: "Payment confirmation email is not configured" });
    }

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

    await transporter.sendMail(studentMail);

    res.json({ message: "Payment confirmation sent successfully" });
  } catch (err) {
    console.error("payment confirmation", err);
    res.status(500).json({ error: "Failed to send payment confirmation" });
  }
});

export default router;
