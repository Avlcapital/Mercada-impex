const express = require("express");
const axios = require("axios");
const bodyParser = require("body-parser");
const cors = require("cors");
const nodemailer = require("nodemailer");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(".")); // serve your static site

const store = new Map(); 
// merchantRequestId => { status: 'PENDING'|'SUCCESS'|'FAILED', phone, amount, product, email, receipt }

const {
  DARAJA_KEY,
  DARAJA_SECRET,
  MPESA_SHORTCODE,
  MPESA_PASSKEY,
  CALLBACK_URL,           // e.g. https://YOUR_DOMAIN/api/callback
  EMAIL_USER,             // Gmail (or SMTP) user
  EMAIL_PASS              // App password
} = process.env;

async function getToken() {
  const auth = Buffer.from(`${DARAJA_KEY}:${DARAJA_SECRET}`).toString("base64");
  const url = "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials";
  const { data } = await axios.get(url, { headers: { Authorization: `Basic ${auth}` } });
  return data.access_token;
}

function timestampYYMMDDHHMMSS() {
  const d = new Date();
  const pad = (n) => (n < 10 ? "0" + n : n);
  return (
    d.getFullYear().toString() +
    pad(d.getMonth() + 1) +
    pad(d.getDate()) +
    pad(d.getHours()) +
    pad(d.getMinutes()) +
    pad(d.getSeconds())
  );
}

// Start STK Push
app.post("/api/stkpush", async (req, res) => {
  try {
    const { phone, amount, product, email } = req.body;
    if (!phone || !amount || !product || !email) {
      return res.status(400).json({ message: "Missing required fields." });
    }

    const token = await getToken();
    const Timestamp = timestampYYMMDDHHMMSS();
    const Password = Buffer.from(`${MPESA_SHORTCODE}${MPESA_PASSKEY}${Timestamp}`).toString("base64");

    const url = "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest";
    const payload = {
      BusinessShortCode: MPESA_SHORTCODE,
      Password,
      Timestamp,
      TransactionType: "CustomerPayBillOnline",
      Amount: amount,
      PartyA: phone,
      PartyB: MPESA_SHORTCODE,
      PhoneNumber: phone,
      CallBackURL: CALLBACK_URL,
      AccountReference: product,
      TransactionDesc: `Payment for ${product}`
    };

    const { data } = await axios.post(url, payload, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const merchantRequestId = data?.MerchantRequestID || `${Date.now()}-${Math.random()}`;

    store.set(merchantRequestId, {
      status: "PENDING",
      phone,
      amount,
      product,
      email,
      receipt: null
    });

    res.json({
      message: "✅ Check your phone for M-Pesa prompt.",
      merchantRequestId
    });
  } catch (err) {
    console.error("STK error:", err.response?.data || err.message);
    res.status(500).json({ message: "Payment initiation failed." });
  }
});

// Callback endpoint (must be publicly reachable)
app.post("/api/callback", async (req, res) => {
  try {
    const cb = req.body;

    const resultCode = cb?.Body?.stkCallback?.ResultCode;
    const merchantRequestId = cb?.Body?.stkCallback?.MerchantRequestID;
    const items = cb?.Body?.stkCallback?.CallbackMetadata?.Item || [];

    const rec = store.get(merchantRequestId);
    if (!rec) {
      // nothing to update, still respond ok
      res.json({ ResultCode: 0, ResultDesc: "Accepted" });
      return;
    }

    if (resultCode === 0) {
      const amount = items.find(i => i.Name === "Amount")?.Value;
      const phone = items.find(i => i.Name === "PhoneNumber")?.Value;
      const receipt = items.find(i => i.Name === "MpesaReceiptNumber")?.Value;

      rec.status = "SUCCESS";
      rec.amount = amount ?? rec.amount;
      rec.phone = phone ?? rec.phone;
      rec.receipt = receipt ?? rec.receipt;

      // email the customer
      try {
        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: { user: EMAIL_USER, pass: EMAIL_PASS }
        });
        await transporter.sendMail({
          from: `"Mercada Impex" <${EMAIL_USER}>`,
          to: rec.email,
          subject: `Order Received: ${rec.product}`,
          text:
`Thank you for your order.

Product: ${rec.product}
Amount: KSh ${rec.amount}
M-Pesa Receipt: ${rec.receipt}

Pickup Station:
Oro Restaurant & Lounge, Upperhill
Google Maps: https://www.google.com/maps/dir/?api=1&destination=Oro+Restaurant+%26+Lounge,+Nairobi&hl=en

Keep this receipt for pickup. Thank you for choosing Mercada Impex.`
        });
      } catch (e) {
        console.error("Email error:", e.message);
      }
    } else {
      rec.status = "FAILED";
    }

    store.set(merchantRequestId, rec);
    res.json({ ResultCode: 0, ResultDesc: "Accepted" });
  } catch (e) {
    console.error("Callback error:", e.message);
    res.json({ ResultCode: 0, ResultDesc: "Accepted" });
  }
});

// Front-end polls this to know status
app.get("/api/status", (req, res) => {
  const id = req.query.merchantRequestId;
  const rec = store.get(id);
  if (!rec) return res.json({ status: "UNKNOWN" });
  if (rec.status === "SUCCESS") {
    return res.json({
      status: "SUCCESS",
      receipt: rec.receipt,
      phone: rec.phone
    });
  }
  if (rec.status === "FAILED") return res.json({ status: "FAILED" });
  return res.json({ status: "PENDING" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log("Server running on port", PORT));
