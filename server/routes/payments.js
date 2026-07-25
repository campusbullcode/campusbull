import express from "express";
import dns from "node:dns/promises";
import net from "node:net";
import nodemailer from "nodemailer";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();
const SENDER_EMAIL = process.env.GMAIL_USER || "mansoor.291@gmail.com";
const SMTP_USER = "mansoor.291@gmail.com";
const SMTP_PASS = "adbfslyzphqegnwe";
const SMTP_HOST = "smtp.gmail.com";
const SMTP_PORTS = [465, 587];
const ATTEMPT_TIMEOUT = 15000;

const NETWORK_CODES = new Set([
  "ETIMEDOUT",
  "ENETUNREACH",
  "EHOSTUNREACH",
  "ECONNREFUSED",
  "ECONNRESET",
  "EAI_AGAIN",
  "ENOTFOUND",
  "ESOCKET",
  "ECONNECTION",
  "EDNS",
]);

function isNetworkError(err) {
  return NETWORK_CODES.has(err?.code) || /timeout/i.test(err?.message || "");
}

// nodemailer 9 resolves BOTH the A and AAAA records for a hostname and then
// picks one at random (lib/shared/index.js -> formatDNSValue), so neither
// `family: 4` nor dns.setDefaultResultOrder influences which one it dials. On a
// host with no IPv6 egress that makes every send a coin flip between working
// and failing with ENETUNREACH.
//
// Passing an already-resolved IPv4 literal makes nodemailer skip DNS entirely
// (net.isIP short-circuit), while `servername` keeps SNI and certificate
// validation pointed at the real smtp.gmail.com.
function createTransport(address, port) {
  return nodemailer.createTransport({
    host: address,
    port,
    secure: port === 465,
    requireTLS: port !== 465,
    servername: SMTP_HOST,
    tls: { servername: SMTP_HOST },
    connectionTimeout: ATTEMPT_TIMEOUT,
    greetingTimeout: ATTEMPT_TIMEOUT,
    socketTimeout: ATTEMPT_TIMEOUT + 5000,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
}

async function sendMail(mail) {
  if (!SMTP_USER || !SMTP_PASS) {
    const err = new Error("Payment confirmation email is not configured");
    err.status = 503;
    throw err;
  }

  let addresses;
  try {
    addresses = await dns.resolve4(SMTP_HOST);
  } catch (cause) {
    const err = new Error(`Could not resolve ${SMTP_HOST} over IPv4`);
    err.code = cause?.code || "EAI_AGAIN";
    throw err;
  }

  if (!addresses.length) {
    const err = new Error(`No IPv4 address for ${SMTP_HOST}`);
    err.code = "ENOTFOUND";
    throw err;
  }

  // 465 (implicit TLS) is the norm; 587 (STARTTLS) is the fallback for hosts
  // that block 465 outbound. Worst case stays well inside the client's 90s abort.
  let lastError;
  for (const port of SMTP_PORTS) {
    for (const address of addresses) {
      const transporter = createTransport(address, port);
      try {
        return await transporter.sendMail(mail);
      } catch (err) {
        lastError = err;
        // Auth failures and rejected recipients will fail identically on every
        // address and port, so stop rather than burning the timeout budget.
        if (!isNetworkError(err)) throw err;
        console.warn(
          `smtp attempt failed host=${address} port=${port} code=${err.code || "?"}`,
        );
      } finally {
        transporter.close();
      }
    }
  }

  throw lastError;
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

// Reports what this host's network can actually reach. Exposes no secrets --
// only DNS results and TCP reachability -- so it is safe to leave in place for
// diagnosing SMTP failures on hosts whose logs we cannot read.
router.get("/diag", verifyToken, async (req, res) => {
  const probe = (host, port) =>
    new Promise((resolve) => {
      const socket = net.connect({ host, port, timeout: 8000 });
      const finish = (result) => {
        socket.destroy();
        resolve(result);
      };
      socket.once("connect", () => finish("ok"));
      socket.once("timeout", () => finish("timeout"));
      socket.once("error", (err) => finish(err.code || err.message));
    });

  const ipv4 = await dns.resolve4(SMTP_HOST).catch((err) => err.code);
  const ipv6 = await dns.resolve6(SMTP_HOST).catch((err) => err.code);

  const reachability = {};
  for (const port of SMTP_PORTS) {
    if (Array.isArray(ipv4) && ipv4.length) {
      reachability[`ipv4:${port}`] = await probe(ipv4[0], port);
    }
    if (Array.isArray(ipv6) && ipv6.length) {
      reachability[`ipv6:${port}`] = await probe(ipv6[0], port);
    }
  }

  res.json({ node: process.version, host: SMTP_HOST, ipv4, ipv6, reachability });
});

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
      return res.status(400).json({
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

    await sendMail(studentMail);

    res.json({ message: "Payment confirmation sent successfully" });
  } catch (err) {
    console.error("payment confirmation", err);

    // Report the error *code* but never the raw message: socket errors embed the
    // resolved IP, which is both noise to the user and needless disclosure.
    const isNetwork = isNetworkError(err);
    const detail = isNetwork
      ? `Could not reach the email service [${err?.code || "unknown"}]. Please try again in a moment.`
      : err?.response || err?.message || "Unknown mail error";

    res
      .status(err.status || (isNetwork ? 503 : 500))
      .json({ error: `Failed to send payment confirmation: ${detail}`, code: err?.code });
  }
});

export default router;
