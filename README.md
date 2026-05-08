# NIMS — Nursing Institution Management System
### Demo for Noujan Institute of Nursing, Beleghata, Kolkata

A frontend-only, mocked-data demo of NIMS built for a live sales presentation. No backend, no database, no real auth — all data lives in memory.

---

## Install & Run

```bash
npm install        # install dependencies
npm run dev        # start at http://localhost:3000
```

---

## Demo in 5 Minutes

Follow this exact narrative for the live walkthrough:

### 1. Login as Principal
- Open `http://localhost:3000` → login page appears
- Select **Principal** from the role dropdown → click **Sign In**
- Land on **Finance Dashboard** — point out KPI cards (₹ collected, ₹ outstanding)
- Scroll to **Top Defaulters** table — click the top overdue student's name

### 2. Receipt Flow
- Student Ledger opens → see fee breakdown with scholarship discounts and age-wise dues buckets
- Click **Take Payment** (top right)
- Receipt form: student is pre-filled → select fee heads → choose **UPI** → enter a transaction ID → click **Generate Receipt**
- Receipt page: **govt-format A5 layout** with QR code — click **Print** to see print preview
- Navigate back to Dashboard → KPIs have updated immediately ✓

### 3. Expenses & Approval
- Switch role to **Accountant** (top-right role switcher)
- Go to **Vendors & Expenses** → click **New Expense** → fill form → note live GST split (CGST/SGST 9+9%) → Submit
- Switch back to **Principal** → Expenses → **Pending Approval** tab → click **Approve**

### 4. Tally Bridge
- Go to **Reports & Tally** → **Tally Bridge** tab is default
- Set date range → click **Generate Tally XML** → watch spinner
- Syntax-highlighted XML preview appears → click **Download XML** → real `.xml` file downloads
- Success modal: "Ready to import in Tally Prime / Busy"

### 5. Student Portal
- Switch role to **Student** → portal appears with dues, admit cards, clinical logbook, grievance button

### 6. Quick fly-through
- **Students** → 80 students, click any to see full profile with tabs
- **Academics → Exam Routine** → Generate AI schedule
- **HR → Staff** → 25 staff with INC registration numbers

---

## Role Switching

Switch roles from the **top-right dropdown** without re-logging in. Each role sees different sidebar items:

| Role | Sees |
|------|------|
| Principal | Finance, Students, Academics, HR |
| Accountant | Finance |
| Registrar | Students, Academics, HR |
| Faculty | Students, Academics |
| Student | My Portal only |

---

## What's Mocked

- **Auth**: any username/password accepted; role is picked from dropdown
- **80 students** across GNM (Yr 1-3), B.Sc Nursing (Yr 1-4), P.B. B.Sc (Yr 1-2), M.Sc Nursing (Yr 1-2)
- **74 historical receipts** spanning 8 months with varied payment modes
- **12 defaulters** with overdue amounts from ₹8,000 to ₹1,15,000
- **25 staff** with INC registration numbers (format: `INC/WB/xxxxx/yyyy`)
- **10 vendors** (Kolkata-area businesses with real GSTIN format)
- **40 historical expenses** across all vendors
- Email, WhatsApp, PDF export → toast notifications (no real send)
- Tally XML → real `.xml` file download with valid `<TALLYMESSAGE>` structure

---

## How to Extend with a Real Backend

1. **Replace the Zustand store** (`src/lib/store.ts`) with API calls — the store shape maps 1:1 to REST resources
2. **Add real auth** — replace the login page with a JWT flow; store token in Zustand `auth` slice
3. **Replace mock data files** (`src/lib/mock-data/*.ts`) with `fetch()` calls to your API
4. **Receipt printing** — the `#print-receipt` ID and print stylesheet in `globals.css` are production-ready

---

## Project Structure

```
src/
├── app/
│   ├── login/              # Login page (any credentials)
│   ├── finance/            # Finance module (hero — all 6 pages)
│   │   ├── page.tsx        # Dashboard with KPIs + charts
│   │   ├── fee-master/     # Fee structure editor + late fee + scholarships
│   │   ├── ledger/         # Student ledger list + [id] detail
│   │   ├── receipt/new     # Receipt generation form
│   │   ├── receipt/[id]    # Printable receipt with QR
│   │   ├── expenses/       # Vendors, expenses, approval workflow
│   │   └── reports/        # P&L, Cash Flow, Tally Bridge
│   ├── students/           # Student list + [id] profile tabs
│   ├── academics/          # Exam routine + timetable
│   ├── hr/                 # Staff list + attendance calendar
│   └── portal/             # Student self-service portal
├── lib/
│   ├── store.ts            # Zustand store (single source of truth)
│   ├── types.ts            # All TypeScript types
│   ├── utils.ts            # formatINR, numberToWordsIN, formatDate, generateReceiptNumber
│   └── mock-data/          # students, staff, fees, vendors, expenses, receipts
└── components/
    ├── layout/             # Sidebar, TopBar, DashboardLayout
    └── ui/                 # toast (context-based, auto-dismiss)
```

---

## Design System

| Token | Value | Usage |
|-------|-------|-------|
| `--primary` | `#0F766E` | CTAs, active states, amounts |
| `--primary-dark` | `#0B3D3A` | Sidebar, dark headers |
| `--primary-light` | `#5EEAD4` | Mint accents |
| `--surface` | `#F0FDFA` | Card backgrounds |
| `--accent` | `#F59E0B` | Amber — warnings, CTAs |
| `--coral` | `#F97066` | Overdue, errors |

All money uses `formatINR()` — Indian comma format (₹1,00,000). Headings: Georgia/serif. Body: system sans-serif.
