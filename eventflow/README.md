# EventFlow

A centralized campus event, competition, registration, payment and attendance
platform. Built as a college subject-level project — the architecture stays
simple enough to explain in a viva, but the UI aims for startup-grade polish.

```
eventflow/
  backend/     Node.js + Express API (JSON-file datastore, zero setup)
  frontend/    React + Vite + Tailwind + Framer Motion
```

## 1. Quick start

You need Node.js 18+ installed. No database server, no payment gateway
account, no API keys required.

```bash
# 1. Backend
cd backend
cp .env.example .env
npm install
npm start          # seeds demo data automatically on first run
# → API running at http://localhost:5000

# 2. Frontend (in a second terminal)
cd frontend
npm install
npm run dev
# → App running at http://localhost:5173
```

Open `http://localhost:5173`. The dev server proxies `/api/*` to the backend,
so nothing else needs configuring.

### Demo accounts (password for all: `123456`)

| Role              | Email                     |
|-------------------|---------------------------|
| Main / Super Admin| admin@eventflow.com       |
| CSE Dept Admin    | cse@eventflow.com         |
| Cultural Admin    | cultural@eventflow.com    |
| Sports Admin      | sports@eventflow.com      |
| Gate Volunteer    | volunteer@eventflow.com   |
| Student           | student@eventflow.com     |
| Student           | rahul@eventflow.com       |
| Student           | aman@eventflow.com        |

To reset the demo data at any point: stop the backend, delete
`backend/data/db.json`, and start it again (or run `npm run seed`).

## 2. What's implemented

- **Three-tier role hierarchy** — Main Admin (platform-wide), Department/Club
  Admin (scoped to their own department), Participant (student).
- **Event lifecycle & approval workflow** — Draft → Submitted → Main Admin
  review (Approve & Unlock / Request Changes / Reject) → Registration Open →
  Closed → Completed. Events awaiting approval show as **"Coming Soon"** to
  students instead of being hidden, so the platform still feels alive.
- **Google-Forms-like event builder** — a 5-step creation wizard covering
  basic details, participation type, payment/attendance/certificate/capacity
  options, and a custom question builder (10 field types, add/reorder/remove
  — deliberately not drag-and-drop, for stability).
- **Individual & team registration** — team creation, shareable invite codes,
  join flow, automatic "team complete" once the minimum size is hit, and a
  leader-only finalize step.
- **Demo Payment Mode** — a `Register & Pay ₹X` flow that simulates a real
  gateway without needing credentials. See §4 for why it's safe.
- **QR ticketing & attendance** — one QR per participant, or one QR per team
  (admin's choice), scanned through an organizer-only scanner screen (real
  device camera, with a manual type/paste fallback) that checks payment
  status, department ownership, and duplicate check-ins.
- **Gate Volunteers — delegated scanning** — a department admin can create a
  "Gate Volunteer" account for a club/society council member straight from
  their dashboard. That account can log in and reach *only* the QR scanner
  (scoped to their own department's events) — no dashboard, no event
  creation, no revenue visibility. Enforced on both the frontend route guard
  and the backend (every admin-only route rejects the `VOLUNTEER` role, and
  the scan endpoint itself checks `event.department === volunteer.department`).
- **Certificates, payment history, and dashboards** for both department
  admins (their own events) and the Main Admin (platform-wide, plus pending
  approvals and department-admin management).
- **Polished UI** — Tailwind + a custom indigo/purple design system, Framer
  Motion for conditional-field reveals and page transitions, skeleton
  loaders, toasts, and empty states instead of browser alerts.

## 3. Architecture

**Backend** is a standard layered Express app: `routes/` hold the request
handlers (kept together with their logic rather than split into a separate
`controllers/` layer, to keep the codebase easy to trace for a viva),
`middleware/auth.js` handles JWT verification and role checks,
`utils/` holds QR generation, ID generation and token signing.

**Data** lives in `backend/data/db.json`, managed by `backend/data/store.js`
— a tiny in-memory-plus-file-persistence layer. This means the whole project
runs with `npm install && npm start`, no MongoDB instance required for the
demo. `backend/models/*.js` contains the equivalent **Mongoose schemas**
or `frontend/api.js` — same field names — as a direct, mechanical migration
path onto real MongoDB when needed (see `backend/models/README.md`).

**Frontend** is a single-page React app. `context/AuthContext.jsx` holds the
JWT and current user; `services/api.js` is a thin Axios wrapper that attaches
the token automatically. Pages are grouped by audience — student pages
(`Events`, `EventDetail`, `MyTickets`, `MyTeams`, `Certificates`,
`PaymentHistory`) versus organizer pages (`AdminDashboard`,
`MainAdminDashboard`, `ApprovalScreen`, `EventWizard`, `QRScanner`).

## 4. Payment security — how a fake QR is prevented

The single rule the backend enforces, in `backend/routes/payments.js`:

```js
if (payment.status === "SUCCESS") {
  registration.status = "CONFIRMED";
  // ...QR is generated here, and only here
} else {
  registration.status = "PENDING_PAYMENT";
  registration.qrToken = null;
}
```

Nothing about this decision is read from the request body or trusted from
the client — it is driven entirely by the `payment.status` value the server
itself just wrote. `demo-fail` and `demo-pay` are two ends of the same code
path; a real gateway integration (Razorpay, in production) would only need
to replace *which* function decides `SUCCESS` vs `FAILED` — a signed webhook
or verified order response — not the enforcement logic itself. The
`/attendance/scan` route independently re-checks `registration.status ===
"CONFIRMED"` before approving entry, so even a QR image someone tried to
forge or replay is checked against the real registration state, not just
the presence of a token.

## 5. QR validation — the scan pipeline

`POST /api/attendance/scan` runs a strict pipeline (`backend/routes/attendance.js`):

1. **Validate** — does a registration exist with this exact `qrToken`? If not
   → `INVALID`.
2. **Check department ownership** — a department admin can only scan tickets
   for their own department's events.
3. **Check payment** — `registration.status` must be `CONFIRMED` (see §4).
   If not → `DENIED`.
4. **Check duplicate** — if `registration.checkedIn` is already `true` →
   `ALREADY_CHECKED_IN`, and attendance is *not* incremented again.
5. **Approve & mark** — sets `checkedIn = true`, timestamps it, and writes an
   `Attendance` record used by the attendance dashboards.

For team events with a single team QR, one scan checks the whole team in at
once (`memberCount` is reported back to the scanner).

## 6. Demo scenarios (matches the spec exactly)

All six were run against the live server while building this:

1. **Free event** → register → QR issued immediately → scan → Entry Approved.
2. **Paid event** → Main Admin approves → student pays (Demo Pay) → QR
   issued → scan → Entry Approved.
3. **Team competition** → create team → invite members → team completes →
   leader finalizes → pays → team QR → one scan checks the whole team in.
4. **Approval flow** → department admin submits a draft → shows as "Coming
   Soon" to students → Main Admin approves → registration opens instantly.
5. **Payment bypass test** → attempt to scan a ticket for a paid event
   before payment succeeds → `ACCESS_DENIED`, no QR ever existed to scan.
6. **Duplicate QR** → scan a valid ticket twice → second scan returns
   `ALREADY_CHECKED_IN`; attendance count does not increase.

## 7. Delegating gate duty to a volunteer

From the department admin dashboard: **Gate Volunteers → Add Volunteer** →
give them a name, email, and temporary password. They log in with those
credentials and land straight on the scanner (`/admin/scanner`) — the
navbar shows nothing else for them. Behind the scenes this is a third role,
`VOLUNTEER`, that:

- can only reach `POST /api/attendance/scan` and `GET /api/attendance/event/:id`
  (plus a read-only, department-filtered `GET /api/events` to populate the
  event dropdown) — every other admin route (`/api/events` POST/PUT,
  `/api/admin/dashboard`, approvals, revenue) explicitly excludes it;
- is scoped to one department, exactly like a department admin, so a
  volunteer can never scan a ticket for another department's event;
- can be revoked instantly by the department admin (or the Main Admin, for
  oversight across all departments) from the same panel.

The Main Admin never has to get involved in delegating this — it's entirely
self-service per department.

## 8. Real QR scanning

`QRScanner.jsx` defaults to **Camera** mode, using `html5-qrcode` to read the
device's rear camera and auto-submit the moment a code decodes (with a
1.5s cooldown so the same code in frame doesn't get re-submitted). If the
browser denies camera permission or no camera is available, it falls back
to a **Type / Paste** tab that hits the same `/api/attendance/scan`
endpoint — so a laptop without a webcam, or a student showing their QR from
across a table, still works. Camera access requires HTTPS or `localhost`
(the Vite dev server satisfies this automatically).

## 9. Production ideas

- Swap `backend/data/store.js` for Mongoose calls against the schemas in
  `backend/models/` (field names match 1:1).
- Swap `backend/routes/payments.js`'s `demo-pay`/`demo-fail` handlers for a
  real Razorpay order + signature-verified webhook — the confirm/QR-issue
  logic downstream doesn't change.
- Add a file storage service (S3, Cloudinary) for the `FILE_UPLOAD` custom
  field type and event banners, which are currently filenames/text only.
- Add real camera-based QR scanning (e.g. a `BarcodeDetector` or a library
  like `html5-qrcode`) in `QRScanner.jsx` — the manual token-entry field it
  currently uses hits the exact same `/api/attendance/scan` endpoint, so no
  backend change is needed.
