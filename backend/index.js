const express = require("express");
const Razorpay = require("razorpay");
const bodyParser = require("body-parser");
const cors = require("cors");
const crypto = require("crypto");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

// ✅ Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// 🟢 Create Order
app.post("/create-order", async (req, res) => {
  const { amount, currency, name, email, phone, address } = req.body;

  const options = {
    amount: amount * 100, // amount in paise
    currency: currency,
    receipt: "order_rcptid_" + Date.now(),
    notes: { name, email, phone, address },
  };

  try {
    const order = await razorpay.orders.create(options);
    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 🟢 Webhook Endpoint (use raw body)
app.post("/webhook", express.raw({ type: "application/json" }), async (req, res) => {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

  const signature = req.headers["x-razorpay-signature"];
  const body = req.body;

  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(body)
    .digest("hex");

  if (signature === expectedSignature) {
    const paymentData = JSON.parse(body);
    const payment = paymentData.payload.payment.entity;
    const notes = payment.notes;

    // Removed Firebase interaction here

    res.json({ status: "success" });
  } else {
    res.status(400).json({ error: "Invalid signature" });
  }
});

// 🟢 Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
