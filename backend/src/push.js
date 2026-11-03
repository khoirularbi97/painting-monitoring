import webpush from "web-push";
import { query } from "./db.js";

const PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
const PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
// Subject wajib berupa "mailto:..." atau URL https. Default memakai URL frontend.
const SUBJECT = process.env.VAPID_SUBJECT || process.env.FRONTEND_URL || "https://painting-monitoring.onrender.com";

export const pushEnabled = Boolean(PUBLIC_KEY && PRIVATE_KEY);
export const publicKey = PUBLIC_KEY || null;

if (pushEnabled) {
  webpush.setVapidDetails(SUBJECT, PUBLIC_KEY, PRIVATE_KEY);
} else {
  console.warn("VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY belum diisi: push notifikasi dinonaktifkan.");
}

const HARI = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
const BULAN = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

// "2026-10-26" -> "Senin, 26 Okt 2026" (hitungan murni dari angka kalender, bebas timezone)
export function formatTanggal(value) {
  const m = String(value ?? "").match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return String(value ?? "");
  const [y, mo, d] = [Number(m[1]), Number(m[2]) - 1, Number(m[3])];
  const hari = HARI[new Date(Date.UTC(y, mo, d)).getUTCDay()];
  return `${hari}, ${String(d).padStart(2, "0")} ${BULAN[mo]} ${y}`;
}

// Kirim ke semua perangkat yang berlangganan. Tidak pernah melempar error:
// kegagalan notifikasi tidak boleh membatalkan penyimpanan data.
// excludeEndpoint: perangkat si penginput sendiri tidak perlu diberi notifikasi.
export async function notifyAll(payload, excludeEndpoint) {
  if (!pushEnabled) return { sent: 0, removed: 0 };

  try {
    const { rows } = await query("SELECT id, endpoint, p256dh, auth FROM push_subscriptions");
    const body = JSON.stringify(payload);
    let sent = 0;
    const dead = [];

    await Promise.all(
      rows
        .filter((s) => s.endpoint !== excludeEndpoint)
        .map(async (s) => {
          try {
            await webpush.sendNotification(
              { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
              body,
              { TTL: 60 * 60 * 12 }
            );
            sent += 1;
          } catch (err) {
            // 404/410 = langganan sudah tidak berlaku (app dihapus / izin dicabut)
            if (err.statusCode === 404 || err.statusCode === 410) dead.push(s.id);
            else console.error("Push gagal:", err.statusCode || err.message);
          }
        })
    );

    if (dead.length) await query("DELETE FROM push_subscriptions WHERE id = ANY($1::int[])", [dead]);
    return { sent, removed: dead.length };
  } catch (err) {
    console.error("notifyAll gagal:", err.message);
    return { sent: 0, removed: 0 };
  }
}

// Simpan ke riwayat (panel lonceng). Berjalan walau push belum dikonfigurasi,
// dan tidak pernah melempar error supaya penyimpanan data tidak terganggu.
const MAX_RIWAYAT = 200;
async function record(type, payload, refId) {
  try {
    await query(
      "INSERT INTO notifications (type, title, body, url, ref_id) VALUES ($1,$2,$3,$4,$5)",
      [type, payload.title, payload.body, payload.url, refId]
    );
    await query(
      `DELETE FROM notifications
       WHERE id < COALESCE((SELECT MIN(id) FROM (SELECT id FROM notifications ORDER BY id DESC LIMIT $1) t), 0)`,
      [MAX_RIWAYAT]
    );
  } catch (err) {
    console.error("Catat notifikasi gagal:", err.message);
  }
}

export async function notifyProduksi(row, excludeEndpoint) {
  const persenOk = row.total_part ? Math.round((row.total_ok / row.total_part) * 1000) / 10 : 0;
  const payload = {
    title: "Produksi baru diinput",
    body: `${row.nama_line} · ${row.nama_shift} · ${row.nama_customer}\n${formatTanggal(row.tanggal)}\nPart ${row.total_part}, OK ${row.total_ok} (${persenOk}%), Compound ${row.total_comp}, NG ${row.total_ng}`,
    url: "/#/",
    tag: `produksi-${row.id}`,
  };
  await record("produksi", payload, row.id);
  return notifyAll(payload, excludeEndpoint);
}

export async function notifyRepair(row, excludeEndpoint) {
  const payload = {
    title: "Hasil repair diinput",
    body: `${row.nama_line} · ${row.nama_shift} · ${row.nama_customer}\nProduksi ${formatTanggal(row.tanggal_produksi)}\nDiproses ${row.total_comp_diproses}, OK ${row.total_hasil_ok}, NG ${row.total_hasil_ng}`,
    url: "/#/kelola-data",
    tag: `repair-${row.id}`,
  };
  await record("repair", payload, row.id);
  return notifyAll(payload, excludeEndpoint);
}
