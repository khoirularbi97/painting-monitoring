# Update: fitur login

## Hak akses
| | Admin | Operator |
|---|---|---|
| Dashboard, lihat data | ya | ya |
| Input produksi / repair, edit data | ya | ya |
| Hapus data produksi / repair | ya | tidak |
| Kelola master (line, shift, customer, leader) | ya | tidak |
| Kelola pengguna | ya | tidak |

## Langkah pasang (urut)
1. **Backend**: salin isi folder `backend` ke repo, lalu `npm install` (menambah bcryptjs dan jsonwebtoken).
2. **Isi `JWT_SECRET`** di Render (Environment). Wajib, minimal 32 karakter acak. Buat dengan:
   `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`
   Tanpa ini semua endpoint menjawab 503.
3. **Migrasi** dari komputer Anda (DATABASE_URL Neon di `backend/.env`):
   `node migrate.js migrations/006_users.sql`
4. **Buat admin pertama** (lokal, sekali saja):
   `npm run create-user -- arbi GantiPasswordIni admin "Arbi"`
   Operator: `npm run create-user -- budi PasswordBudi1 operator "Budi"`. Setelah itu akun lain dibuat dari menu Kelola pengguna.
5. **Frontend**: salin folder `frontend`, push, Vercel deploy otomatis.
6. Deploy backend di Render, buka aplikasi, login.

Urutan penting: backend + migrasi + admin dulu, baru frontend, supaya tidak ada waktu aplikasi terkunci tanpa akun.

## Catatan
- Sesi berlaku 14 hari (ubah dengan env `JWT_EXPIRES_IN`, mis. `7d`).
- 5 kali salah password untuk satu username dari satu IP mengunci 15 menit.
- Ganti/reset password atau nonaktifkan akun langsung mengeluarkan akun itu dari semua perangkat.
- Lupa password admin satu-satunya: jalankan `npm run create-user -- <username> <passwordBaru> admin` lagi, ini mereset akun yang ada.
- Kolom "input oleh" pada data produksi kini otomatis terisi username yang login.
- Endpoint `/health` tetap terbuka (dipakai pengecekan server).
