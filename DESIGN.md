# AR Core Design System & UI/UX Specification (DESIGN.md)
> **Accounts Receivable Management Suite**  
> *Consolidated from AR-Module-Roadmap.md & AR2.md — Built for High-Density Financial Operations*

---

## 1. Executive Summary & Design Principles

The AR Core platform is engineered around the three core verbs of Accounts Receivable: **Bill**, **Track**, and **Collect**. Financial users (controllers, accountants, collection specialists) process hundreds of entries daily. The UI prioritizes **speed, numerical clarity, zero data ambiguity, and audit confidence**.

```
   ┌─────────────────────────────────────────────────────────────┐
   │                     ACCOUNTS RECEIVABLE                     │
   ├───────────────────┬───────────────────┬─────────────────────┤
   │     1. BILL       │     2. TRACK      │     3. COLLECT      │
   │  Issue Invoices   │  Monitor Aging    │  Record Payments    │
   │  & Debit Notes    │  & Running Bal.   │  & Apply Allocations│
   └───────────────────┴───────────────────┴─────────────────────┘
```

### Core Design Tenets
1. **Information Density with Breathing Room**: Minimal decorative fluff; dense, tabular data layout with consistent 8px grid spacing, high contrast, and clear hierarchy.
2. **Numeric Precision (`JetBrains Mono`)**: All currency amounts, invoice numbers, tax codes, and dates use tabular monospace typography to align decimals vertically.
3. **Semantic Status Clarity**: Instant recognition of invoice & account health via a standardized color-coded pill badge system.
4. **Non-Destructive Workflows**: No hard deletes; actions like Void, Write-Off, and Debit adjustments are displayed with explicit audit trails and safety gates.
5. **Real-Time Feedback**: Inline balance calculations, dynamic allocation balances in modals, and instant validation indicators.

---

## 2. Design Tokens & Color Palette

### 2.1 Theme & Surface Tokens
| Token | Hex / Value | Usage |
|---|---|---|
| `--bg-app` | `#0b0f19` / `#f8fafc` | App Canvas background (Dark sidebar / Light content) |
| `--bg-surface` | `#ffffff` | Primary card, modal, and table container background |
| `--bg-surface-subtle`| `#f1f5f9` | Table headers, secondary input backgrounds, code chips |
| `--border-subtle` | `#e2e8f0` | Card borders, table dividers, input borders |
| `--border-focus` | `#2563eb` | Active input outline, primary button focus |
| `--sidebar-bg` | `#0f172a` | Deep navy-slate navigation sidebar |
| `--sidebar-active` | `#1e293b` | Active navigation pill surface |

### 2.2 Typography
- **Primary Interface**: `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`
- **Monetary & Numbers**: `'JetBrains Mono', 'SF Mono', Consolas, monospace`
- **Scale Hierarchy**:
  - `Display / KPI`: 28px–32px | Weight: 700 (`JetBrains Mono`)
  - `H1 / Page Title`: 22px | Weight: 700 (`Inter`)
  - `H2 / Section Title`: 16px | Weight: 600 (`Inter`)
  - `Body / Cell Text`: 13px–14px | Weight: 400–500 (`Inter`)
  - `Micro / Labels / Badges`: 11px–12px | Weight: 600 (`Inter` / uppercase tracking +0.5px)

### 2.3 Semantic Status Palette (Invoices & Claims)
Each status utilizes a paired background, text, and border token for optimal WCAG AAA readability:

```
  [ Draft ]     [ Sent ]     [ Partial ]    [ Paid ]     [ Overdue ]    [ Void ]
  #F1F5F9       #EFF6FF       #FFFBEB       #ECFDF5       #FEF2F2       #F8FAFC
  Text: #475569 Text: #1D4ED8 Text: #B45309 Text: #047857 Text: #B91C1C Text: #64748B
  Brd:  #CBD5E1 Brd:  #BFDBFE Brd:  #FDE68A Brd:  #A7F3D0 Brd:  #FECACA Brd:  #E2E8F0
```

### 2.4 Aging Report Severity Spectrum
Aging buckets progress from neutral to high-urgency crimson:
- **Current (Not Due)**: `#047857` (Emerald Soft) — `$0 overdue`
- **1–30 Days**: `#0284c7` (Sky Blue) — Low concern
- **31–60 Days**: `#d97706` (Amber) — Follow-up required
- **61–90 Days**: `#ea580c` (Deep Orange) — Urgent reminder letter
- **90+ Days**: `#dc2626` (Crimson Strong) — Credit Hold / Demand letter

---

## 3. Global Application Architecture & Shell

The shell follows a classic **Enterprise Dual-Tone Frame**: persistent dark sidebar on the left with a high-efficiency crisp light workspace on the right.

```
┌────────────────────────────────────────────────────────────────────────────────────────────────┐
│ [APP SIDEBAR: 260px]      │ [TOP BAR: 64px]                                                   │
│ ◈ AR Core Enterprise      │  Breadcrumb: Invoices / INV-2026-0042        [Quick Search ⌘K]  ⚙ [Mike]│
├───────────────────────────┼────────────────────────────────────────────────────────────────────┤
│ ❖ Dashboard               │ [PAGE HEADER]                                                      │
│ ▤ Invoices (Core V1)      │  Invoice INV-2026-0042                     [Void] [Download PDF]   │
│ 👥 Customers              │  Issued to Acme Corp • Due Oct 24, 2026    [+ Record Payment]      │
│ ⏳ Aging Report           ├────────────────────────────────────────────────────────────────────┤
│                           │ [CONTENT AREA: Padding 24px]                                       │
│ ── V2 Extensions ──       │                                                                    │
│ 📝 Credit Notes           │  ┌───────────────────────┐  ┌───────────────────────────────────┐  │
│ ⚙ Settings & Sequences   │  │ Invoice Line Items    │  │ Balance & Summary                 │  │
│ 🛡 Audit Logs             │  │ - Lawn Mowing  $450.00│  │ Subtotal:              $450.00    │  │
│                           │  │                       │  │ Tax (0%):                $0.00    │  │
│ ── V3 Hospitality ──      │  │                       │  │ Total:                 $450.00    │  │
│ 🏨 City Ledger vs CC      │  │                       │  │ Paid:                    $0.00    │  │
│ ⚖ Aging vs Mutation       │  │                       │  │ Balance Due:           $450.00    │  │
│ 🔒 Period Close Gate      │  └───────────────────────┘  └───────────────────────────────────┘  │
└───────────────────────────┴────────────────────────────────────────────────────────────────────┘
```

---

## 4. Screen-by-Screen UI/UX Specifications

### 4.1 Dashboard (Executive Overview)
- **Goal**: Immediate single-glance assessment of cash flow, liquidity risk, and recent activity.
- **Top Metric Bar (4 KPI Cards)**:
  1. `Total Outstanding`: Total unsettled receivables (`$34,250.00`)
  2. `Overdue Balance`: Invoices past due date (`$6,800.00` with amber/red delta indicator)
  3. `Collected This Month`: Cash settled MTD (`$18,450.00` with green trend sparkline)
  4. `Open Invoices Count`: Active invoice count (`24 Open` • `5 Overdue`)
- **Main View Layout**:
  - **Left (70%)**: Aging Distribution Bar Chart (`Chart.js` / SVG) showing breakdown across buckets + Quick Action toolbar (`+ New Invoice`, `Record Payment`).
  - **Right (30%)**: Live Activity Feed (Invoices issued, payments recorded, reminders sent) with direct click-through to details.

---

### 4.2 Customer Directory & Detail View

#### Customer Directory (`/customers`)
- **Quick Filters**: All Customers | Has Overdue Balance | Near Credit Limit | Inactive/Hold.
- **Table Columns**:
  - Customer Name & Billing Email
  - Payment Terms (`Net 15`, `Net 30`, `Net 60`)
  - Open Invoices Count
  - Current Balance Due (`JetBrains Mono`, bold)
  - Status Tag (`Active`, `Credit Hold`, `Blacklisted`)
  - Actions: Quick Invoice (`+`), View Detail (`→`).

#### Customer Detail View (`/customers/:id`)
```
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Acme Corp  [Active]                        Payment Terms: Net 30   Billing: billing@acmecorp.com│
├─────────────────────────────────────────────────────────────────────────────────────────────────┤
│ [KPI: Current Balance: $4,500.00]   [KPI: Credit Limit: $10,000.00 (45% used)]   [KPI: Due: 30d]│
├─────────────────────────────────────────────────────────────────────────────────────────────────┤
│ [ Tabs: 1. Invoices (5)  |  2. Payment History (12)  |  3. Credit Notes  |  4. Account Terms ]  │
│                                                                                                 │
│  [Search invoices...]  [Status: All ▾]                            [+ Create Invoice for Acme]   │
│  ┌──────────────┬──────────────┬─────────────┬─────────────┬───────────┬──────────────┬───────┐ │
│  │ Invoice #    │ Date         │ Due Date    │ Total       │ Paid      │ Balance      │ Status│ │
│  ├──────────────┼──────────────┼─────────────┼─────────────┼───────────┼──────────────┼───────┤ │
│  │ INV-2026-004 │ Oct 01, 2026 │ Oct 31, 2026│ $1,250.00   │ $0.00     │ $1,250.00    │ Sent  │ │
│  │ INV-2026-001 │ Sep 10, 2026 │ Oct 10, 2026│ $3,250.00   │ $0.00     │ $3,250.00    │Overdue│ │
│  └──────────────┴──────────────┴─────────────┴─────────────┴───────────┴──────────────┴───────┘ │
└─────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

### 4.3 Invoice Creation & Interactive Builder (`/invoices/new`)
- **Design Philosophy**: Fast tabular data entry with keyboard navigation (`Tab` / `Enter` moves between cells).
- **Header Form Grid**:
  - Customer Search & Picker (Auto-selects payment terms & auto-calculates Due Date)
  - Invoice Date Picker (Defaults to today)
  - Due Date Picker (Calculated: `Invoice Date + Payment Terms Days`)
  - Currency & Reference Number
- **Dynamic Line Items Matrix**:
  ```
  ┌────────────────────────────────────────┬──────┬─────────────┬─────────────┬────────┐
  │ Description                            │ Qty  │ Unit Price  │ Total       │ Action │
  ├────────────────────────────────────────┼──────┼─────────────┼─────────────┼────────┤
  │ Commercial Grounds Maintenance Oct 2026│ 1    │ $450.00     │ $450.00     │  [🗑]   │
  │ Tree Trimming & Shrub Pruning          │ 2    │ $120.00     │ $240.00     │  [🗑]   │
  └────────────────────────────────────────┴──────┴─────────────┴─────────────┴────────┘
  [+ Add New Line Item]
  ```
- **Live Calculation Summary Card (Bottom-Right)**:
  - Subtotal: `$690.00`
  - Tax (Configurable Dropdown: `Exempt 0%`, `VAT 10%`, `Custom`): `$69.00`
  - **Invoice Total**: **`$759.00`** (Large font, bold navy)
- **Footer Actions**:
  - `Save Draft` (Secondary outline button)
  - `Save & Issue (Sent)` (Primary brand button with icon)

---

### 4.4 Invoice Detail & Lifecycle Manager (`/invoices/:id`)
- **Header Actions**:
  - `Record Payment`: Opens Payment Allocation Modal.
  - `Add Debit Note` (V3 extension): Increases balance for unbilled charges.
  - `Issue Credit Note` (V2): Partial credit adjustment.
  - `Void Invoice`: Requires explicit reason prompt; updates status to `Void` without deleting row.
  - `Print / PDF Export`: Generates official invoice PDF with clean print CSS.
- **Two-Column Content**:
  - **Left Column (65%)**: Line items breakdown, client address, notes & remittance instructions.
  - **Right Column (35%)**: 
    - **Receivable Lifecycle Ledger**:
      - Invoice Total: `$759.00`
      - Less Credits/Notes: `-$0.00`
      - Less Payments Received: `-$350.00` (shows date and receipt ID)
      - **Outstanding Balance**: **`$409.00`** (Highlight box)
    - **Payment Allocation History**:
      - Table showing payments applied against this invoice with date, payment method, and amount.

---

### 4.5 Payment Center & Multi-Invoice Allocation Modal

The transaction engine supports **1 Payment → Many Invoices**.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ Record Incoming Payment                                                           [✕]  │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ Customer: [ Acme Corp                                                     ▾ ]          │
│ Payment Date: [ 2026-10-15 ]    Method: [ Bank Wire / Transfer            ▾ ]          │
│ Reference / Check #: [ TXN-8849201     ]                                               │
│ Total Amount Received: [ $1,500.00     ]  (Stored as integer: 150000 cents)            │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ Allocate to Open Invoices:                                                             │
│                                                                                        │
│ [x] Apply Auto (Oldest First)                                                          │
│                                                                                        │
│ Invoice #     Due Date       Total      Balance Due   Amount to Apply                  │
│ ─────────────────────────────────────────────────────────────────────────────────────  │
│ [✓] INV-0038  2026-09-15    $500.00     $500.00       [ $500.00    ]  (Settles Full)   │
│ [✓] INV-0042  2026-10-01    $1,250.00   $1,250.00     [ $1,000.00  ]  (Partial)        │
│ [ ] INV-0047  2026-10-20    $350.00     $350.00       [ $0.00      ]                   │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ Summary:                                                                               │
│ Total Received: $1,500.00  |  Total Allocated: $1,500.00  |  Unallocated Balance: $0.00│
├────────────────────────────────────────────────────────────────────────────────────────┤
│ [Cancel]                                                      [Confirm & Apply Payment]│
└────────────────────────────────────────────────────────────────────────────────────────┘
```

#### Allocation Safety Validation:
- If `Allocated > Received`: Button is disabled; red banner displays `"Allocated exceeds total received"`.
- If `Allocated < Received`: Prompt offers option:
  1. Hold as Customer Credit Balance (for future billing).
  2. Flag excess for Cash Refund.

---

### 4.6 AR Aging Analysis Matrix (`/reports/aging`)

The definitive executive and audit view. Aggregates all open, non-void invoices into time-based delinquency buckets.

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Accounts Receivable Aging Matrix                                  As of Date: [ Today ▾ ] [PDF] │
├──────────────────────────────────────────────────────────────────────────────────────────────────┤
│ Customer Name    │ Total Due    │ Current     │ 1–30 Days  │ 31–60 Days │ 61–90 Days │ 90+ Days  │
├──────────────────┼──────────────┼─────────────┼────────────┼────────────┼────────────┼───────────┤
│ Acme Corp        │ $1,750.00    │ $1,000.00   │ $750.00    │ $0.00      │ $0.00      │ $0.00     │
│ Globex Logistics │ $4,320.00    │ $0.00       │ $1,200.00  │ $3,120.00  │ $0.00      │ $0.00     │
│ Stark Industries │ $12,800.00   │ $5,000.00   │ $0.00      │ $0.00      │ $3,800.00  │ $4,000.00!│
│ Wayne Enterprises│ $850.00      │ $850.00     │ $0.00      │ $0.00      │ $0.00      │ $0.00     │
├──────────────────┼──────────────┼─────────────┼────────────┼────────────┼────────────┼───────────┤
│ TOTALS           │ $19,720.00   │ $6,850.00   │ $1,950.00  │ $3,120.00  │ $3,800.00  │ $4,000.00 │
└──────────────────────────────────────────────────────────────────────────────────────────────────┘
```
- **UX Features**:
  - Clicking on any cell expands a sub-drawer listing the exact underlying invoices contributing to that specific bucket.
  - Rows with balances in `90+ Days` show an inline exclamation badge indicating qualification for **Final Escalation / Credit Hold**.

---

### 4.7 Hospitality & PMS Extensions (V3 Specifications)

#### A. Two-Path "Money In": City Ledger vs Credit Card
Hotels have distinct pipelines for unsettled guest accounts:
1. **City Ledger Tab**: Corporate billing accounts (direct bill) → Generates monthly corporate master statements → Settled via corporate AP wire.
2. **Credit Card Journal Tab**: Guest EDC card swipes → Grouped into daily **Card Batches** → Closed at Night Audit → Reconciled with merchant bank payout minus interchange fees.

#### B. 3-Tier Escalation Reminder Center
Automated categorization based on delinquent duration:
- **Tier 1 (30+ Days overdue)**: Courteous reminder notice (Template: "Payment Friendly Reminder").
- **Tier 2 (60+ Days overdue)**: Firm collections notice + mandatory log of telephone follow-up.
- **Tier 3 (90+ Days overdue)**: Final formal demand signed by GM / Controller + Automatic trigger for **Credit Hold** (blocks Front Office from extending folio credit).

#### C. Aging vs Mutation Side-by-Side Reconciliation View
A dual-pane screen acting as an audit closing barrier:
```
┌───────────────────────────────────────┬───────────────────────────────────────┐
│ Aging Report Snapshot (As of Oct 31)  │ Mutation Movement (Oct 01 - Oct 31)   │
├───────────────────────────────────────┼───────────────────────────────────────┤
│ Opening Balance:          $15,200.00  │ Beginning AR Control:     $15,200.00  │
│ + New Invoices Billed:    $12,400.00  │ + Total Billed Debits:    $12,400.00  │
│ - Payments Applied:      -$10,100.00  │ - Total Settled Credits: -$10,100.00  │
│ - Adjustments / Credits:    -$500.00  │ - Write-offs / Notes:       -$500.00  │
├───────────────────────────────────────┼───────────────────────────────────────┤
│ Ending Aging Total:       $17,000.00  │ Ending Mutation Total:    $17,000.00  │
├───────────────────────────────────────┴───────────────────────────────────────┤
│  ✓ RECONCILIATION SUCCESSFUL: Variance = $0.00 (Ready for Period Close)        │
└────────────────────────────────────────────────────────────────────────────────┘
```

#### D. End-of-Day / Month-End Close Gate
Checklist modal before locking the financial period:
- [x] All daily EDC card swipe batches submitted to acquiring bank
- [x] Unallocated payments resolved or moved to credit ledger
- [x] Aging total reconciles with General Ledger Control Account (Variance: `$0.00`)
- **[ Lock & Close Accounting Period ]** (Requires Admin/Controller role)

---

## 5. Component Library & Interaction Specifications

### 5.1 Tables
- **Header (`<thead>`)**: Background `#f8fafc`, uppercase text, 11px font size, tracking `0.05em`, text color `#64748b`.
- **Rows (`<tr>`)**: Height 48px, subtle hover transition (`background: #f1f5f9`), bottom border 1px solid `#e2e8f0`.
- **Numbers**: Right-aligned, `JetBrains Mono` font, standard decimal places (`.00`).

### 5.2 Forms & Input Fields
- **Default State**: 1px solid `#cbd5e1`, 6px border radius, 10px padding, font size 13px.
- **Focus State**: Border color `#2563eb`, subtle box-shadow `0 0 0 3px rgba(37, 99, 235, 0.15)`.
- **Read-Only / Derived Fields**: Subtle gray background `#f8fafc`, lock icon indicator, user cannot edit directly.

### 5.3 Modals & Drawers
- **Backdrop**: `rgba(15, 23, 42, 0.6)` with backdrop-filter blur (4px).
- **Surface**: Pure white card with 12px corner radius and elevated drop shadow (`0 20px 25px -5px rgba(0, 0, 0, 0.1)`).
- **Footer**: Sticky action bar with secondary dismiss button on the left and primary confirmation button on the right.

---

## 6. Financial Integrity & Engineering Safeguards

| Principle | UI / Architectural Implementation |
|---|---|
| **Integer Cents Math** | All currency stored & calculated in integer cents (`$450.00` → `45000`). Formatted for UI display only at view layer. Prevents binary float rounding drift. |
| **Derived Status Engine** | Statuses (`Paid`, `Partial`, `Overdue`) are never manually toggled by users; they are derived deterministically: `amount_paid >= total` → Paid. |
| **Gapless Sequence** | System guarantees gapless consecutive numbering (e.g. `INV-2026-0001`, `0002`). |
| **Audit Trails (No Deletes)**| Invoices and payments cannot be deleted. Corrections require a `Void` flag or counter-balancing `Credit Note` / `Debit Note`. |
| **ACID Multi-Allocation**| Payment distribution across multiple invoices is processed in an atomic transaction; if any line allocation fails, the entire batch rolls back. |

---

## 7. Implementation Roadmap & Milestones

```
  Phase 1: Core V1 (Minimum Viable AR) ───────────────► 100% COMPLETE & OPERATIONAL
  • Customer Directory & Balances
  • Invoice Builder & Auto-Derived Statuses
  • Payment Modal with Multi-Allocation
  • Live Aging Matrix & Metric Dashboard

  Phase 2: Commercial Additions (V2) ────────────────► IN PROGRESS
  • Credit Notes & Write-off Workflows
  • Decoupled Templated PDF Generation
  • Role-Based Access Control (Admin / Accountant / Viewer)
  • Gapless Invoice Sequence Numbering

  Phase 3: Hotel & PMS Specialization (V3) ──────────► ARCHITECTED / ON DEMAND
  • City Ledger vs Credit Card Pipeline
  • 3-Tier Escalation Letters & Sanctions
  • Side-by-Side Aging vs Mutation Gate
  • Period-End Closing Gate Checklist
```

---
*Document Version: 1.0.0 — Accounts Receivable Product Team*
