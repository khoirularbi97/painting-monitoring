# Monitoring performa painting Line 1 & Line 2

Aplikasi monitoring produksi painting: input hasil produksi per shift (total part, OK, Compound, NG, hanger), input hasil repair Compound, dan dashboard tren %OK (awal vs setelah repair) dengan filter Line/Shift/Customer.

## Struktur

- `backend/` — Express + PostgreSQL (REST API)
- `frontend/` — React + Vite

## Menjalankan backend

```bash
cd backend
npm install
cp .env.example .env   # sesuaikan DATABASE_URL
npm run migrate         # jalankan migrations/001_init.sql
npm run dev              # server di http://localhost:4000(URL https://painting-monitoring.onrender.com)
```

## Menjalankan frontend

```bash
cd frontend
npm install
npm run dev              # http://localhost:5173, otomatis proxy /api ke backend
```

## Alur pemakaian

1. **Input produksi** — diisi setiap akhir shift. Tanggal produksi default ke H-1 karena Shift 2 sering berakhir setelah tengah malam.
2. Kalau ada Compound, entri itu otomatis muncul di daftar **menunggu repair**.
3. **Input repair** — setelah Dept PE selesai repair, isi form ini (bisa bertahap, beberapa kali untuk satu entri produksi).
4. **Dashboard** — menampilkan %OK awal vs %OK final (setelah repair), bisa difilter per Line, Shift, dan Customer (AHM/YAMAHA).

## Catatan skema

- `produksi_painting`: 1 baris per kombinasi tanggal + line + shift + customer (unique constraint mencegah duplikat).
- `hasil_repair`: banyak baris per `produksi_id`, karena repair bisa dicicil.
- View `v_produksi_final` menggabungkan keduanya untuk menghitung %OK/%NG final.
