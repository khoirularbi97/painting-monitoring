import { Router } from "express";
import { query } from "../db.js";
import { pushEnabled, publicKey, notifyAll } from "../push.js";

const router = Router();

// GET /api/push/public-key — kunci publik VAPID untuk subscribe di browser
router.get("/public-key", (req, res) => {
  if (!pushEnabled) {
    return res.status(503).json({ errors: ["Notifikasi belum dikonfigurasi di server."] });
  }
  res.json({ publicKey });
});

// POST /api/push/subscribe { endpoint, keys: { p256dh, auth } }
router.post("/subscribe", async (req, res) => {
  const { endpoint, keys } = req.body || {};
  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return res.status(400).json({ errors: ["Data langganan tidak lengkap."] });
  }
  try {
    await query(
      `INSERT INTO push_subscriptions (endpoint, p256dh, auth, user_agent)
       VALUES ($1,$2,$3,$4)
       ON CONFLICT (endpoint) DO UPDATE SET p256dh = EXCLUDED.p256dh, auth = EXCLUDED.auth, user_agent = EXCLUDED.user_agent`,
      [endpoint, keys.p256dh, keys.auth, req.get("user-agent") || null]
    );
    res.status(201).json({ subscribed: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ errors: ["Gagal menyimpan langganan notifikasi."] });
  }
});

// POST /api/push/unsubscribe { endpoint }
router.post("/unsubscribe", async (req, res) => {
  const { endpoint } = req.body || {};
  if (!endpoint) return res.status(400).json({ errors: ["Endpoint wajib diisi."] });
  try {
    await query("DELETE FROM push_subscriptions WHERE endpoint = $1", [endpoint]);
    res.json({ subscribed: false });
  } catch (err) {
    console.error(err);
    res.status(500).json({ errors: ["Gagal membatalkan langganan."] });
  }
});

// POST /api/push/test — notifikasi percobaan. Hanya aktif bila PUSH_TEST_KEY diisi di server
// dan dikirim lewat header x-test-key, supaya tidak bisa dipakai orang lain untuk spam.
router.post("/test", async (req, res) => {
  if (!process.env.PUSH_TEST_KEY || req.get("x-test-key") !== process.env.PUSH_TEST_KEY) {
    return res.status(404).json({ errors: ["Tidak ditemukan."] });
  }
  const result = await notifyAll({
    title: "Tes notifikasi",
    body: "Notifikasi Monitoring Painting berfungsi.",
    url: "/#/",
    tag: "tes",
  });
  res.json(result);
});

export default router;
