# Copilot instructions for painting-monitoring

## Product and architecture
- This repo is a small full-stack app: `backend/` is Express + PostgreSQL, `frontend/` is React + Vite.
- The API entry point is `backend/src/index.js`; routers are mounted as `/api/master`, `/api/produksi`, `/api/repair`, and `/api/dashboard`.
- The frontend uses `HashRouter` in `frontend/src/App.jsx`; pages are simple route components without Redux or app-wide state.
- `frontend/src/lib/api.js` is the single API abstraction: `baseURL` resolves to `/api` or `VITE_API_URL`, and `extractErrors(err)` turns backend `errors` arrays into UI messages.

## Core domain rules
- `produksi_painting` is the main production record and enforces uniqueness on `(tanggal, line_id, shift_id, customer_id)`.
- `hasil_repair` is intentionally many rows per production because repair can be done incrementally; `v_produksi_final` combines both tables for final OK/NG percentages.
- Dashboard and data tables rely on the backend query layer, not local aggregation: see `backend/src/routes/dashboard.js` and `backend/src/routes/produksi.js`.
- Business rules are enforced in the API layer, especially totals: `OK + Compound + NG <= total_part` and `repair total_hasil_ok + total_hasil_ng <= total_comp_diproses`.

## Workflow and conventions
- Run backend from `backend/`: `npm install`, `npm run migrate`, `npm run dev` (server on `http://localhost:4000`; prod URL is also configured in README).
- Run frontend from `frontend/`: `npm install`, `npm run dev` (Vite serves on `http://localhost:5173` and proxies `/api` to backend).
- Migrations are SQL files under `backend/migrations/`; `backend/migrate.js` executes one file at a time and defaults to `migrations/001_init.sql`.
- `backend/src/db.js` explicitly keeps PostgreSQL `DATE` values as strings to avoid timezone serialization issues; preserve that pattern when touching DB code.

## UX and data-entry patterns
- The app is operational, not generic CRUD. Default production date logic uses `yesterday()` in `InputProduksi.jsx` because shift 2 often runs past midnight.
- The “repair queue” pattern is important: `GET /api/produksi/menunggu-repair` shows records with remaining compound; `InputRepair.jsx` selects one row and enforces remaining-sisa validation before save.
- Master data (`Line`, `Shift`, `Customer`, `Leader`) is managed by generic CRUD patterns in `backend/src/routes/master.js` and `frontend/src/pages/KelolaMaster.jsx`.
- Validation errors are returned as `{ errors: [...] }`; UI shows them via inline alert blocks and does not invent a different API contract.

## Reference files
- `backend/src/routes/produksi.js`: canonical validation and delete logic for production records and repair cascade.
- `backend/src/routes/repair.js`: repair validation, remaining-compound logic, and editing constraints.
- `backend/migrations/001_init.sql`: schema and seed data that define the domain behavior.
- `frontend/src/pages/Dashboard.jsx`: main analytics page and filter model; follow its existing parameter naming (`line_id`, `shift_id`, `customer_id`, `leader_id`, `start`, `end`).

## Constraints for AI changes
- Prefer editing existing route/page patterns rather than introducing new state libraries, context, or custom API layers.
- Preserve the app’s language: most user-facing strings are Indonesian, and the backend returns Indonesian validation messages.
- For new forms, keep the same shape as current pages: local `useState` forms, `api.*` calls, and backend-driven validation.
