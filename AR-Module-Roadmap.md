# Accounts Receivable Module — Detailed Roadmap
*Consolidated from generic AR fundamentals + hotel PMS reference spec*

For every item below: **what it is → why it matters → how it actually works / example.**

---

# V1 — Core AR (Minimum Viable, Any Business)

This tier is the actual definition of AR in action. Nothing here is optional — skip any of these and the "AR module" label stops being accurate.

## Frontend

**Customer List (search/filter)**
What: A table of every customer/company you invoice, with a search bar and basic filters (e.g. "has overdue balance").
Why: You can't send an invoice to a customer that doesn't exist in the system yet — this is the entry point for everything downstream.
How: Simple paginated table. Clicking a row goes to Customer Detail.

**Customer Detail (profile, contact, running balance)**
What: One customer's full picture — contact info, billing address, and critically, their current outstanding balance (sum of unpaid/partial invoices).
Why: This is the screen a bookkeeper opens right before calling someone to ask "where's my money" — it needs to answer that question in one glance.
How: Balance is *derived*, not stored — calculated live as `sum(invoice totals) - sum(payments applied)` for that customer.

**Invoice List (status badges, filter by status/customer/date)**
What: Every invoice ever created, with a colored status badge (Draft/Sent/Partial/Paid/Overdue/Void) and filters.
Why: This is the operational hub — someone using this daily needs to instantly see "what's overdue right now" without opening each invoice.
How: Status is computed server-side (see backend section) so this list is always accurate without manual updates.

**Invoice Create/Edit (customer picker, line items, tax, due date)**
What: The form where a new invoice is built — pick a customer, add line items (description/qty/price), apply tax, set a due date.
Why: This is literally the transaction that creates the receivable. Get the math here wrong (rounding, tax calc) and every downstream report is wrong too.
How: Line items sum to a subtotal, tax is applied (flat rate or per-line), total is calculated live as the user types. Saves as "Draft" until explicitly marked "Sent."

**Invoice Detail/View (linked payments, Void action)**
What: Read-only view of one invoice — shows the original charges plus a running list of payments applied against it, and how much balance remains.
Why: When a customer disputes an invoice or asks "did I already pay this," this screen has to answer definitively.
How: Pulls the invoice plus a join against the payments table, showing partial payment history in order.

**Record Payment (form/modal — amount, method, date, invoice(s) applied to)**
What: A form to log money that's come in — how much, by what method (cash/card/transfer/check), and which invoice(s) it settles.
Why: This is the other half of the AR equation. Without it, invoices sit "Sent" forever even after the customer paid.
How: One payment can apply to multiple invoices (a customer pays one check covering three overdue invoices) — the UI should let the user allocate the amount across invoices, not force one payment = one invoice.

**Aging Report (Current / 1-30 / 31-60 / 61-90 / 90+, by customer)**
What: A table bucketing every unpaid invoice by how many days past due it is.
Why: This is the single most-used report in any AR system — it answers "who owes money and how worried should I be" in one view. It's also usually the first thing an owner or CFO asks to see.
How: For each open invoice, calculate `today - due_date`. If negative or zero, it's "Current." Otherwise it falls into the matching bucket. Group and total by customer.

**Dashboard (total outstanding, total overdue, recent activity)**
What: A landing page with a handful of summary stat cards and a short activity feed.
Why: Gives a one-glance health check without navigating anywhere — mostly a UX nicety, not core logic (that's why it's fine to build last).
How: Simple aggregation queries against the same invoice/payment data everything else uses. No new backend logic required.

## Backend

**Derived invoice status logic (Draft, Sent, Partial, Paid, Overdue, Void — computed, not manually set)**
What: Status is never a field a user sets directly (except Draft→Sent and Void, which are explicit user actions) — it's calculated from amount paid vs. total, and due date vs. today.
Why: If status were manually maintained, it would drift out of sync with reality constantly (someone forgets to mark something "Paid"). Deriving it guarantees correctness.
How: Pseudocode: `if void: Void; elif amount_paid == 0 and due_date < today: Overdue; elif amount_paid == 0: Sent; elif amount_paid < total: Partial; elif amount_paid >= total: Paid`.

**Payment allocation logic (one payment → one or more invoices), transactional**
What: The backend process that takes an incoming payment and splits/applies it across one or more invoices.
Why: This is genuinely the trickiest piece of core logic. If it fails halfway (server crashes mid-save), you cannot end up with a payment applied to invoice A but not invoice B — that's a data integrity nightmare that's very hard to notice and fix later.
How: Wrap the whole allocation in a database transaction — all invoice balance updates + the payment record either all commit or all roll back together.00
**Aging calculation (live or scheduled job)**
What: The engine that computes the aging buckets described above.
Why: For small data volumes, calculate it live on every page load. For larger datasets (thousands of invoices), recalculating on every request gets slow — you'd run it as a nightly batch job instead and cache the result.
How: Start with live calculation (simpler); only move to a scheduled job if you actually hit performance problems. Don't over-engineer this on day one.

**Money math using integer cents or decimal type (never floats)**
What: Store and calculate all monetary values as integers (cents) or a proper decimal type — never as JavaScript/Python native floats.
Why: Floating point can't represent numbers like 0.1 exactly in binary, so repeated addition/subtraction of money values silently produces off-by-a-fraction-of-a-cent errors that compound over thousands of transactions. This is the single most common bug in every amateur financial app.
How: `$10.50` is stored as `1050` (cents) internally, and only formatted back to `$10.50` for display. All arithmetic happens on the integer.

**No hard deletes — void/reverse only**
What: The database should never actually `DELETE` an invoice or payment row once it's been sent/applied. Instead, flip a status flag to "Void" or "Reversed."
Why: Real accounting is audit-driven. If a mistake invoice gets deleted, there's no record it ever existed — which looks identical to fraud during an audit. Voiding preserves the trail while making clear it doesn't count anymore.
How: Add a `status` or `is_void` field; all queries for "active" data filter out voided rows, but the rows themselves remain forever.

## Concepts

**Accrual basis accounting (this is what makes "AR" exist as a concept at all)**
What: Recording revenue the moment it's invoiced/earned, not the moment cash is received.
Why: Without this, there's no gap between "billed" and "paid" — and that gap is literally what a receivable *is*. This is the foundational assumption your whole app is built on.

**Invoice vs. Payment as separate events; the gap between them = the receivable**
What: Two distinct database records/events representing two distinct moments in time.
Why: Conflating them (e.g. only recording a transaction once money arrives) is cash-basis thinking and breaks the entire premise of an AR module.

**Partial payment**
What: A customer pays some, but not all, of an invoice.
Why: Extremely common in real business (a company pays $600 of a $1,000 invoice, promising the rest later). The system needs to represent "partially settled" as a first-class state, not an edge case.

**Aging (how overdue an unpaid invoice is)**
What: The measurement of time elapsed since an invoice's due date, for any invoice still carrying a balance.
Why: This is the primary lens through which AR health is judged by literally everyone who looks at the system — owners, accountants, auditors.

**Void vs Delete (audit trail requirement)**
What: The distinction between "this never happened" (delete) and "this happened but is cancelled/incorrect" (void).
Why: Financial software is expected to have an immutable history. Deleting is almost always the wrong tool once real money/customers are involved.

---

# V2 — Common Real-World Additions

Needed by most real businesses once V1 is live, but still generic — nothing hotel-specific yet.

## Frontend

**Credit Notes / Adjustments (list + create)**
What: A document that reduces what a customer owes — e.g., "we overcharged you $50, here's a credit."
Why: Businesses need a formal way to correct an invoice after the fact without re-issuing the whole thing or just deleting numbers.
How: A credit note is its own record type, linked to the original invoice, that subtracts from the customer's balance.

**Write-off / Bad Debt action**
What: A button/flow on an invoice to mark it as "we're never collecting this" without pretending it was paid.
Why: Eventually some customers just won't pay. Leaving that invoice sitting "Overdue" forever pollutes your aging report and overstates your real expected cash. Write-off is a distinct, honest outcome.
How: Sets a `written_off` status; it stops showing in aging totals but remains in history (never delete — same principle as void).

**Settings screen (invoice numbering format, default tax rate, payment terms, company info/logo)**
What: An admin page to configure the details that get stamped onto every invoice — your logo, default tax %, default "Net 30" terms, numbering prefix (e.g. INV-2026-0001).
Why: Without this, these values get hardcoded, and every business using your app would need code changes to rebrand or adjust tax rules.
How: A single settings/config table, read at invoice-generation time.

**PDF export (Invoice PDF, Aging Report / Statement of Account PDF)**
What: Two distinct PDF outputs — (1) the actual invoice document emailed to a customer, and (2) internal/exportable reports like the aging report or a customer statement.
Why: Invoices need to leave the system and reach a human inbox looking professional; reports need to be shareable/printable for meetings or audits.
How: Render an HTML template with real data, convert to PDF via a library (Puppeteer, wkhtmltopdf, pdf-lib). Keep this as a separate service/function, not tangled into your invoice-saving logic.

**Basic role permissions (Admin / Accountant / Viewer)**
What: Different user accounts see/do different things — an Accountant can record payments, a Viewer can only look, an Admin can void things.
Why: Prevents accidental (or intentional) misuse — e.g., you don't want just anyone voiding a paid invoice.
How: A `role` field on the user record, checked before sensitive actions (void, write-off, settings changes).

## Backend

**PDF rendering service (templated, decoupled from business logic)**
What: A dedicated function/endpoint that takes invoice data in and returns a PDF, independent of the invoice-saving code path.
Why: Keeping this separate means you can change your PDF design without touching invoice business logic, and vice versa — and you can reuse it for reports too.

**Sequential invoice numbering (gapless — legal requirement in many countries)**
What: Invoice numbers must increase by exactly 1 each time, with zero gaps or reused numbers, generated by the system — never picked freely by a user.
Why: Many tax authorities (common across the EU, Latin America, and others) require this specifically to prevent under-reporting revenue by "skipping" invoices off the books.
How: Use an atomic counter (e.g. a database sequence) incremented inside the same transaction as invoice creation, so two simultaneous invoice creations can't grab the same number.

**Tax handling (tax as its own line, separate from revenue)**
What: Tax collected on an invoice is tracked as its own value, distinct from the revenue/subtotal amount.
Why: Revenue and "tax you're holding on behalf of the government" are fundamentally different types of money — mixing them makes your revenue reporting wrong and your tax remittance calculations impossible.
How: Store `subtotal`, `tax_amount`, and `total` as separate fields on every invoice, not just a single lump sum.

**Overpayment → credit balance logic (apply to future invoices vs. flag for refund)**
What: When a payment exceeds the invoice total, decide what happens to the extra — hold it as a credit against future invoices, or flag it for a refund.
Why: This will happen (double payments, rounding, customer error) and the system needs a defined, non-error-throwing path for it rather than silently discarding or miscalculating the excess.
How: Track a `credit_balance` per customer; excess payment amount adds to it; it can be manually applied to a future invoice or marked for refund by staff.

**Audit log (who changed what, when)**
What: A log table recording every meaningful change — invoice edited, payment voided, settings changed — with a timestamp and user ID.
Why: Once real money is involved, "who did this and when" becomes an inevitable question, whether from a customer dispute, an internal error, or an actual audit.
How: A simple append-only table: `entity_type, entity_id, action, user_id, timestamp, before/after snapshot (optional)`.

## Concepts

**Credit Note (reduces amount owed) vs. Refund (cash sent back) — distinct actions**
What: A credit note adjusts the *invoice/receivable* balance; a refund moves actual *cash* back out of the business.
Why: These are commonly confused but represent completely different accounting events — one touches AR, the other touches cash. Conflating them in your data model will make your books wrong.

**Bad debt / write-off (marking uncollectible without faking a payment)**
What: An honest acknowledgment that money is not coming, recorded distinctly from "paid."
Why: Keeps your aging report and expected-cash figures meaningful — an invoice marked "Paid" that was actually never collected is a lie in your books.

**Overpayment / credit balance**
What: Money received in excess of what was owed, held as a liability-like balance in favor of the customer.
Why: This is a real, common scenario, not an edge case — needs a designed path, not an afterthought.

**Reconciliation (matching recorded payments against bank statement activity)**
What: Confirming that what your system says came in matches what actually landed in the bank.
Why: Catches errors, fraud, or timing mismatches (e.g. a payment recorded but the check bounced). This is a standard control in any real finance operation.

**Separation of duties (who can invoice vs. who can record payment vs. who can void)**
What: Different people/roles handle different steps of the money flow.
Why: A classic anti-fraud control — if one person can create an invoice, record a fake payment against it, and void the evidence, there's no check on that behavior. Splitting these across roles is standard practice in real finance departments.

---

# V3 — Hotel/PMS-Specific (From Your Reference Doc)

Only build this tier if your PM actively confirms it's in scope. This is a mature hotel property-management-system's AR module — significantly more operational complexity than a generic AR tool.

## Frontend

**Two-path Money In view: City Ledger vs Credit Card**
What: Hotels have two structurally different ways money eventually reaches AR — (1) City Ledger: a guest/company gets billed later on credit (Guest → City Ledger → Invoice issued by Finance → Cash Receipt/Deposit applied), and (2) Credit Card: guest pays immediately by card, which still needs a settlement/reconciliation cycle (Guest → Card swipe → Card Batch → sent to bank at End of Day → Reconciliation → Bank Book).
Why: These are genuinely different workflows with different timing and different failure modes — a single "Money In" screen conflating them would be confusing and functionally wrong.
How: Model both as their own pipelines sharing the same underlying Invoice/Payment tables, but with a `source_type` flag distinguishing them, since they have different intermediate states (Card Batch has no City Ledger equivalent).

**Debit Note screen (add a charge to an already-issued invoice)**
What: A specific action to add a *new* charge onto an invoice that's already been sent — e.g., Front Office discovers a guest's minibar charge wasn't included before the master bill went to their company.
Why: Without this, correcting a sent invoice would require voiding the whole thing and re-issuing — disruptive and confusing for the receiving company's own accounts payable process. A debit note is the accepted, standard way to add charges after the fact.
How: Creates a new line item associated with the original invoice ID, increasing its total; the customer sees it as an addendum, not a new document.

**Bulk Entry Adjustment (mass-adjust invoices sharing customer + account code)**
What: A batch operation to apply the same adjustment across many invoices at once, filtered by customer and chart-of-accounts code.
Why: Specifically called out for hotels following USALI (the lodging industry's standard accounting framework) where travel-agent commissions affect room revenue across potentially hundreds of invoices — doing this one invoice at a time would be a massive manual burden every month.
How: A form where the user picks a customer + COA code + adjustment type/amount, previews the affected invoices, and applies in one action (should still be logged individually in the audit trail, not as one opaque bulk change).

**Reminder Letters — 3-tier escalation**
What: A formal, templated collections process: First Reminder (>30 days, friendly tone, "you may have missed this"), Second Reminder (>60 days, firmer tone, requires a phone follow-up by AR staff), Final Reminder (>90 days, an ultimatum typically signed by the Financial Controller or GM), with defined sanctions at 120+ days (Credit Hold, Blacklist, or handoff to a collections agency).
Why: This formalizes what's otherwise an ad-hoc, easy-to-forget process into a defined, escalating workflow with accountability built in (a human must call at tier 2; a senior signature is required at tier 3).
How: Each tier is a letter template plus a trigger condition based on days-overdue; the system should be able to auto-flag which invoices are due for which tier, even if sending is still manually reviewed.

**Credit Card Journal (manual entry, Split, Change Type)**
What: Three related screens — (1) manually entering a card transaction when the physical card terminal (EDC) failed to auto-settle, (2) splitting one guest bill across two or more different cards, (3) correcting a mis-recorded card type (e.g. entered as Visa, should've been Mastercard).
Why: Card payments in a hotel context have their own failure modes and edge cases distinct from a simple "customer paid by card" checkbox in a generic AR tool.
How: Split payment records multiple card-transaction rows against one invoice, each with its own amount and card type. Change Type must originate from the source module (Front Office/Food & Beverage), not edited directly on the accounting journal — otherwise the reconciliation against the bank statement breaks, since the bank already processed it under the original card type.

**Credit Limit (Corporate) + Guest Credit Limit (Individual) with override warning**
What: A configurable ceiling on how much a company or individual guest is allowed to owe before the system warns staff.
Why: Prevents a company's unpaid balance from silently growing unchecked, giving staff a trigger point to require a different payment method before extending more credit.
How: A `credit_limit` field per customer; on invoice creation, compare running balance + new invoice against the limit and surface a warning (not necessarily a hard block) if exceeded.

**Due Days configuration per account**
What: Each customer/company can have its own allowed payment window (e.g. Net 15 vs Net 30 vs Net 60).
Why: Different corporate clients negotiate different terms; this directly feeds the aging calculation (an invoice's due date = invoice date + that customer's due days) and cash flow forecasting.
How: A `due_days` field on the customer record, applied automatically when generating a new invoice's due date.

**Two-report reconciliation view: Aging vs Mutation, side-by-side**
What: A screen explicitly showing the Aging Report total next to the Mutation Report total (a transaction-by-transaction ledger of every AR change) for the same period — they must match exactly before closing.
Why: This is a strong internal control — Aging tells you the *current state* (who owes what), Mutation tells you *everything that happened* to get there. If they disagree, something was recorded incorrectly, and it needs to be found before the books can be closed.
How: Aging = point-in-time balance query. Mutation = sum of all invoice/payment/credit transactions in the period. Both should mathematically reconcile to the same ending balance if all logic upstream is correct — build this as a validation check, not just a display.

**End-of-Day / Month-End closing screen with open-transaction warnings**
What: A guided "close the period" action that checks for any unresolved transactions (e.g. a Cash Receipt or Card Batch still dated for today but not yet processed) and blocks or warns before allowing the period to close.
Why: Prevents a common real-world mistake — closing a day/month while something is still mid-process, which causes exactly the Aging-vs-Mutation mismatches described above.
How: A checklist-style validation run before the "Close" button is enabled — surfaces a list of blocking items rather than a vague error.

## Backend

**`source_type` field on invoices (City Ledger vs Direct/Card)**
What: A flag distinguishing which "Money In" pipeline an invoice belongs to.
Why: Lets both pipelines share the same core Invoice/Payment tables while still supporting pipeline-specific behavior (e.g. only City Ledger invoices go through the Debit Note flow).

**Card Batch model (groups card transactions, sent to bank at End of Day, later reconciled against bank payout)**
What: A distinct entity representing "all the card swipes from today," which gets submitted to the bank as one lump batch and later matched against what the bank actually deposits.
Why: Card settlement doesn't happen instantly or per-transaction from an accounting perspective — banks pay out batches, sometimes with fees deducted, and the system needs to model that lag and reconcile it.

**Mutation Report generation (transaction-level ledger, must reconcile against Aging total)**
What: A query/report listing every individual AR-affecting transaction (new invoice, payment, credit note, write-off) within a period, ending in a total.
Why: This is what makes the Aging-vs-Mutation cross-check possible — Aging alone only shows a snapshot, Mutation shows the trail that produced it.

**GL reconciliation check (AR control account balance vs Aging/Mutation total)**
What: A comparison between your AR module's total and the corresponding "Accounts Receivable" balance sitting in the General Ledger (if a separate GL/full accounting system exists).
Why: The AR module and the GL are often separate systems (or separate modules of the same system) that must agree — a third layer of validation beyond the internal Aging/Mutation check.

**Parameter Setup / feature flags (e.g. "Cash Over Paid" must be manually enabled)**
What: An admin-level configuration table controlling which optional behaviors are active — the reference doc specifically calls out that overpayment handling must be turned on deliberately, not on by default.
Why: Some behaviors have accounting implications a property might not want active by default (e.g. auto-creating credit balances) — making it opt-in avoids surprising side effects.

**Reminder letter scheduling engine (auto-trigger at day thresholds)**
What: A background job that checks daily for invoices crossing the 30/60/90-day thresholds and flags them for the appropriate reminder tier.
Why: Manual tracking of which invoice needs which letter at which time doesn't scale past a handful of accounts — this needs to be systematic.

**Change Type safeguard (must originate from source module, not the journal directly)**
What: A business rule preventing staff from directly editing a card transaction's card-type on the accounting journal — the correction must instead be made back at Front Office/F&B, the original point of entry.
Why: The bank has already processed the transaction under the originally recorded card type; changing it only in your local journal creates a mismatch when reconciling against the actual bank statement. Enforcing the correction path prevents that silent discrepancy.

**Historical fee immutability (never edit fees on an existing card type setup — create a new one instead)**
What: A rule that changing a card type's fee percentage must always create a *new* card-type configuration record rather than editing the existing one.
Why: If you edit the fee directly, every historical transaction that referenced the old card type retroactively (and incorrectly) recalculates under the new fee — silently corrupting past, already-reconciled records.

## Concepts

**City Ledger = hotel-industry term for AR**
What: The specific hospitality-industry name for the same underlying concept — money billed to a guest/company account rather than collected at checkout.
Why: Knowing this mapping means you can read hotel PMS documentation and correctly translate it back to the AR fundamentals you already understand.

**Card Batch settlement cycle (Guest → EDC → Batch → Bank reconciliation)**
What: The multi-step lag between a guest swiping a card and that money actually, verifiably landing in the business's bank account.
Why: Treating a card swipe as instantly "settled" cash is inaccurate — there's a real gap where reconciliation can reveal discrepancies (declined charges, fee deductions, batch errors).

**Three-way reconciliation requirement (Aging = Mutation = GL) as a hard close gate**
What: A closing process that only proceeds once three independently-derived totals agree.
Why: A single-report system can be wrong and you'd never know; requiring independent totals to match is a strong, standard internal control against silent errors.

**Credit Hold / Blacklist / Collections as formal escalation consequences, not just a status label**
What: Real operational actions taken against a customer account, not just cosmetic tags — Credit Hold actually blocks future credit-based bookings, Blacklist prevents future business entirely, Collections hands the debt to a third party.
Why: These need to actually *do* something in the system (e.g. block a new City Ledger booking) rather than just being a badge on a customer profile.

**Cash Over Paid as a manually-enabled feature, not default behavior**
What: The specific design choice that overpayment-handling is opt-in.
Why: A useful real-world example of "not every AR behavior should be on by default" — a good principle to carry into your own settings/feature-flag design even outside this specific feature.

---

# Suggested Build Order

1. **V1 fully working** with realistic fake data — this alone is a legitimate demo/product
2. **V2 additions** as they become needed (PDF export and audit log are usually asked for early)
3. **Pause and confirm with PM** whether V3 (hotel-specific) is truly required before building it — it's a meaningfully larger scope than everything above it combined

---

# Data Model Note (carry forward from V1)

Even while building only V1, structure these fields now so V3 doesn't require a rewrite later:
- `invoice.source_type` (generic / city_ledger / card) — even if unused until V3
- `payment.method` as an extensible enum, not hardcoded to 2-3 values
- Keep Aging Report as its own queryable module/service, since V3 depends on it matching a second report exactly

# AR Module — UI Components per Page (Bootstrap)
*Companion to AR-Module-Roadmap.md — same V1–V4 structure, now broken down into actual Bootstrap components per page.*

Layout convention used throughout: **dark sidebar + light content area** (the classic admin-dashboard pattern).

---

## Global Layout (build once, reuse everywhere)

**Sidebar**
- `.sidebar.bg-dark.text-white` — fixed/sticky left column
- `.nav.flex-column` — vertical nav
- `.nav-link.text-white-50` (inactive) / `.nav-link.active.text-white.bg-primary.rounded` (active item)
- Optional: `.nav-link` with a small icon (Bootstrap Icons `bi-*`) + label
- Collapsible on mobile: `.offcanvas.offcanvas-start.bg-dark.text-white` triggered by a `.navbar-toggler` button

**Top bar (content area header)**
- `.navbar.navbar-light.bg-white.border-bottom`
- `.navbar-toggler` (mobile sidebar trigger)
- `.dropdown` for user menu (`.dropdown-toggle`, `.dropdown-menu`, `.dropdown-item`)
- `.breadcrumb` (`.breadcrumb-item`) to show current page location

**Content wrapper**
- `.container-fluid.p-4` as the main content padding wrapper
- `.row` / `.col-*` grid for laying out cards/tables within a page

**Shared feedback components**
- `.alert.alert-success` / `.alert-danger` / `.alert-warning` — form validation & save confirmations
- `.spinner-border` — loading states
- `.toast` (`.toast-container`) — non-blocking save/action confirmations

---

# V1 — Core AR

## Dashboard
- `.card` × 4 in a `.row.row-cols-1.row-cols-md-4.g-3` — stat cards (Total Outstanding, Total Overdue, Collected This Month, # Open Invoices)
  - Inside each: `.card-body`, `.card-title`, `.card-text.fs-3.fw-bold`
- `.list-group.list-group-flush` — "Recent Activity" feed
- Optional: a `<canvas>` chart (Chart.js) inside a `.card` for a simple trend line

## Customer List
- `.input-group` with `.form-control` (search box) + `.btn.btn-outline-secondary` (search icon button)
- `.dropdown` or `.form-select` for filter (e.g. "Has overdue balance")
- `.table.table-hover.align-middle` — main list
  - `.badge.bg-danger` inline next to name if customer has overdue balance
- `.pagination.justify-content-end` at the bottom
- `.btn.btn-primary` ("+ New Customer") top-right, opens a `.modal` or navigates to a form page

## Customer Detail
- `.card` header section: name, contact info, `.badge` for status (Active/Credit Hold, if applicable later)
- `.row` of small `.card` stat blocks: Current Balance, Credit Limit (if used), Due Days
- `.nav.nav-tabs` to switch between "Invoices" / "Payments" / "Activity" sub-views within the page
- `.table.table-sm` under each tab for the relevant list

## Invoice List
- `.form-select` × 2–3 for filters (Status, Customer, Date range via `.form-control[type=date]`)
- `.table.table-hover`
  - Status column uses `.badge` with semantic colors:
    - Draft → `.bg-secondary`
    - Sent → `.bg-primary`
    - Partial → `.bg-warning.text-dark`
    - Paid → `.bg-success`
    - Overdue → `.bg-danger`
    - Void → `.bg-dark`
- `.btn.btn-primary` ("+ New Invoice")
- `.pagination`

## Invoice Create/Edit
- `.form-select` — Customer picker (or a searchable dropdown component)
- `.form-control[type=date]` — Invoice Date, Due Date
- Line items as a `.table` with editable rows:
  - `.form-control` inside `<td>` for Description, Qty, Unit Price
  - `.btn.btn-sm.btn-outline-danger` (trash icon) to remove a row
  - `.btn.btn-sm.btn-outline-primary` ("+ Add Line") below the table
- `.row.justify-content-end` — Subtotal / Tax / Total summary block (plain text, right-aligned, bold total)
- `.form-select` — Tax rate dropdown (if per-invoice tax rate)
- `.btn.btn-secondary` ("Save Draft") + `.btn.btn-primary` ("Save & Send") button group (`.d-flex.gap-2`)

## Invoice Detail/View
- `.card` — header block with invoice number, customer, dates, status `.badge`
- `.table.table-borderless` — read-only line items
- `.row.justify-content-end` — totals summary (Subtotal/Tax/Total/Amount Paid/Balance Due)
- `.list-group` — payment history applied to this invoice
- Action buttons: `.btn.btn-outline-primary` ("Record Payment" → opens modal), `.btn.btn-outline-danger` ("Void" → opens confirm modal), `.btn.btn-outline-secondary` ("Download PDF")

## Record Payment (modal)
- `.modal.fade` → `.modal-dialog` → `.modal-content`
- `.form-control[type=number]` — Amount
- `.form-select` — Method (Cash/Card/Transfer/Check)
- `.form-control[type=date]` — Payment Date
- If applying across multiple invoices: a `.table` with a `.form-check-input` checkbox per row + a `.form-control` amount-to-apply field per selected invoice
- `.modal-footer` — `.btn.btn-secondary` (Cancel) + `.btn.btn-primary` (Save Payment)

## Aging Report
- `.form-select` / `.form-control[type=date]` — "As of Date" filter
- `.table.table-bordered.text-end` — Customer rows × bucket columns (Current/1-30/31-60/61-90/90+), with a bold `<tfoot>` total row
- `.btn.btn-outline-secondary` ("Export PDF") top-right

---

# V2 — Common Real-World Additions

## Credit Notes / Adjustments List + Create
- List page: same pattern as Invoice List (`.table`, `.badge` for status, filters)
- Create page/modal: `.form-select` (linked invoice), `.form-control[type=number]` (amount), `.form-control[type=textarea]` (reason)

## Write-off / Bad Debt (action, not a full page)
- Triggered from Invoice Detail: `.btn.btn-outline-dark` ("Write Off")
- `.modal` confirmation with `.form-control[type=textarea]` (reason, required) and a `.alert.alert-warning` explaining the consequence before confirming

## Settings
- `.nav.nav-pills.flex-column` (sub-nav within Settings: Company Info / Invoice Numbering / Tax / Terms)
- `.form-control` — Company Name, Address
- `.form-control[type=file]` — Logo upload, with a small image preview
- `.form-control` — Invoice number prefix/format
- `.form-control[type=number]` — Default tax rate (%)
- `.form-select` — Default payment terms (Net 15/30/60)
- `.btn.btn-primary` ("Save Changes"), with `.alert.alert-success` on save

## PDF Export (button/action pattern, appears on Invoice Detail & Aging Report)
- `.btn.btn-outline-secondary` with a download icon
- `.spinner-border.spinner-border-sm` shown inside the button while generating

## Roles/Permissions (basic)
- `.table` — Users list with a `.form-select` (inline role dropdown) per row, or `.badge` showing current role + an "Edit" button opening a `.modal`

---

# V3 — Hotel/PMS-Specific

## Money In — City Ledger vs Credit Card (tabbed view)
- `.nav.nav-tabs` — two tabs: "City Ledger" / "Credit Card"
- Each tab content (`.tab-pane`) contains its own `.table` styled like Invoice List, since the two pipelines have different columns (City Ledger: Invoice #, Company, Due Date; Credit Card: Batch #, Card Type, Settlement Status)

## Debit Note (modal or sub-form off Invoice Detail)
- `.btn.btn-outline-primary` ("+ Add Debit Note") on Invoice Detail
- `.modal` with the same line-item `.table` pattern as Invoice Create, but scoped to one new charge

## Bulk Entry Adjustment
- `.form-select` — Customer filter
- `.form-select` — Chart of Account code filter
- `.table` with `.form-check-input` "select all" checkbox in the header (`<th>`) and per-row checkboxes
- `.form-control[type=number]` — Adjustment amount, applied to all selected rows
- `.btn.btn-primary` ("Preview Impact") → shows a `.table` diff before confirming → `.btn.btn-success` ("Apply to N Invoices")

## Reminder Letters
- `.nav.nav-pills` — tabs for First / Second / Final reminder tiers
- `.table` per tab — invoices currently qualifying for that tier, with a `.form-check-input` to select which to send
- `.badge.bg-danger` for tier 3 (Final) rows to visually flag severity
- `.btn.btn-outline-secondary` ("Preview Letter" → opens a `.modal` with the rendered template)
- `.btn.btn-primary` ("Send Selected")
- On the customer record: `.badge.bg-dark` ("Credit Hold") / `.badge.bg-danger` ("Blacklisted") shown prominently if sanctioned

## Credit Card Journal — Split / Change Type
- Split: within Record Payment modal, a `.btn.btn-sm.btn-outline-primary` ("+ Split into another card") adds another row (card type `.form-select` + amount `.form-control`), with a running "Remaining to allocate" `.alert.alert-info`
- Change Type: `.form-select` (new card type) inside a `.modal`, with an `.alert.alert-warning` noting "must be corrected at Front Office/F&B source" if the safeguard applies

## Credit Limit / Due Days (on Customer Detail, in an "Account Settings" tab)
- `.form-control[type=number]` — Credit Limit
- `.form-control[type=number]` — Due Days
- `.progress` bar showing current balance as a % of credit limit, turning `.bg-danger` past threshold

## Aging vs Mutation Reconciliation View
- `.row` with two `.col-6` panels, each a `.card` containing its respective `.table` and a bold total in `.card-footer`
- A `.alert.alert-success` ("Balances match") or `.alert.alert-danger` ("Mismatch of $X — review before closing") comparing the two totals automatically

## End-of-Day / Month-End Closing
- `.list-group` — checklist of validation items, each row with a `.badge.bg-success` (OK) or `.badge.bg-danger` (Blocking issue)
- `.btn.btn-primary` ("Close Period") — disabled (`disabled` attribute) until all checklist items pass
- `.modal` confirmation before finalizing, since closing is typically irreversible

---

# Component Reference Cheat-Sheet (all Bootstrap, no custom CSS needed for a first pass)

| Need | Bootstrap component |
|---|---|
| Status labels | `.badge` + contextual color classes |
| Data listing | `.table`, `.table-hover`, `.table-striped` |
| Forms | `.form-control`, `.form-select`, `.form-check-input`, `.input-group` |
| Popups/confirms | `.modal` |
| Alerts/validation | `.alert` |
| Tabs within a page | `.nav-tabs` / `.nav-pills` + `.tab-pane` |
| Sidebar nav | `.nav.flex-column` inside `.sidebar.bg-dark` |
| Mobile sidebar | `.offcanvas` |
| Pagination | `.pagination` |
| Loading state | `.spinner-border` |
| Non-blocking confirmation | `.toast` |
| Progress/limit visualization | `.progress` |
| Grouped checklist items | `.list-group` |