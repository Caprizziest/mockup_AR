# AR Module — Concrete Walkthrough
*A grounding document: one real story, the exact schema, and exactly what each screen needs.*

This exists because the roadmap and UI docs list *what exists* — this doc explains *how it's actually used*, with a real example, so it stops feeling abstract.

---

# Part 1: The One-Sentence Definition (say this out loud)

**Your app lets a business (1) bill customers, (2) track who hasn't paid yet, and (3) record money when it comes in.**

That's it. Everything else — statuses, aging, credit notes — exists only to support those three verbs: **bill, track, collect.**

---

# Part 2: A Day in the Life (concrete story, V1 only)

Meet **Sarah**. She runs a small landscaping business, "Sarah's Landscaping." She has one employee who does the books, **Mike**. Here's a week in their life using your app.

### Monday — Sarah finishes a job
Sarah mows lawns for **Acme Corp's office park**. The job is done. Mike needs to bill them.

**Mike opens the app → Customers → searches "Acme Corp"** — it already exists from last month (Mike added it once, doesn't recreate it every time).

He clicks into Acme Corp's **Customer Detail** page. He sees:
- Name: Acme Corp
- Contact: jane@acmecorp.com
- Current balance owed: **$0** (last invoice was paid off)

He clicks **"+ New Invoice."** On the **Invoice Create** screen he:
- Picks customer: Acme Corp (already selected since he came from their page)
- Adds a line item: "Lawn mowing service — office park," Qty 1, Price $450
- Tax rate: 0% (landscaping isn't taxed in his state)
- Due date: auto-fills to 30 days out (Acme's payment terms), but he can override it
- Total shows: **$450.00**
- Clicks **"Save & Send"**

**What just happened in the database:** A new row in `invoices` (status: `sent`, total: 45000 cents, due_date: 30 days from now), plus one row in `invoice_line_items`.

### Two weeks later — Mike checks who owes money
Mike opens the **Dashboard**. He sees:
- Total Outstanding: $3,200 (across all customers)
- Total Overdue: $450 (one invoice, from a different customer, is now late)
- Acme's $450 invoice is *not* in the overdue number yet — it's not due for another 2 weeks

He clicks **Aging Report** to see the full breakdown. Acme's invoice shows in the "Current" bucket (not due yet). Another customer's invoice shows in the "31-60" bucket — Mike knows that's the one he needs to call about.

### Three weeks later — Acme pays
A check arrives from Acme for $450. Mike opens **Acme's Customer Detail**, sees the $450 invoice still marked "Sent," clicks into it (**Invoice Detail**), and clicks **"Record Payment."**

On the **Record Payment modal**, he enters:
- Amount: $450
- Method: Check
- Date: today
- Applies to: this invoice (auto-selected since he opened it from here)

He clicks Save. **What happened in the database:** A new row in `payments` (amount: 45000 cents), a row in `payment_allocations` linking that payment to this specific invoice. The invoice's status is now recalculated — since `amount_paid (450) >= total (450)`, the status flips to `Paid` automatically. Nobody manually set that.

### Month-end — the overdue customer still hasn't paid
That other customer's $450 invoice is now 65 days overdue. Mike doesn't have a formal reminder-letter system yet (that's V3/hotel-specific and irrelevant to Sarah's landscaping business) — he just sees it sitting in red on the Aging Report and calls them directly. **This is a perfectly complete V1 experience** — not every business needs automated reminders.

---

That's the entire loop. Every feature in your roadmap exists to make *some version of this story* possible, at increasing levels of sophistication. If a feature doesn't map back to a moment in a story like this, question whether you need it yet.

---

# Part 3: The User Journey, Mapped to Screens

```
┌─────────────┐
│  Dashboard   │ ← Mike's landing page, glance at health
└──────┬──────┘
       │
       ▼
┌─────────────┐     ┌──────────────────┐
│Customer List │────▶│  Customer Detail  │
└─────────────┘     └────────┬─────────┘
                              │ "+ New Invoice"
                              ▼
                     ┌──────────────────┐
                     │ Invoice Create    │
                     └────────┬─────────┘
                              │ Save & Send
                              ▼
                     ┌──────────────────┐
                     │  Invoice List     │◀── also reachable directly from sidebar
                     └────────┬─────────┘
                              │ click a row
                              ▼
                     ┌──────────────────┐      "Record Payment"     ┌──────────────┐
                     │ Invoice Detail    │─────────────────────────▶│ Payment Modal │
                     └──────────────────┘                           └──────────────┘
                              ▲
                              │
                     ┌──────────────────┐
                     │  Aging Report     │ ← Mike's "who do I chase" view
                     └──────────────────┘
```

**The two entry points into billing a customer:**
1. From Customer Detail → "+ New Invoice" (customer pre-filled) — this is the common path
2. From the sidebar → Invoice List → "+ New Invoice" (customer picked manually) — for when you're not already looking at a specific customer

**The two entry points into recording a payment:**
1. From Invoice Detail → "Record Payment" (invoice pre-filled) — common path, one payment for one invoice
2. From a general "Record Payment" action (if you add one to the sidebar) — needed when one payment covers multiple invoices, since you're not starting from any single invoice

This is the part that "doesn't sound intuitive" until you see it mapped like this — there is no single linear path, there are two natural jumping-off points depending on what the user is looking at when they need to act.

---

# Part 4: Exact Database Schema (V1)

This is the real, concrete answer to "what data does it need." Every field here is used by the story above.

```sql
customers
├── id                  (primary key)
├── name                (text) — "Acme Corp"
├── email               (text)
├── phone               (text)
├── billing_address     (text)
├── payment_terms_days  (integer) — e.g. 30, used to auto-calc invoice due dates
├── created_at          (timestamp)

invoices
├── id                  (primary key)
├── customer_id         (foreign key → customers.id)
├── invoice_number      (text) — sequential, e.g. "INV-0001"
├── invoice_date        (date)
├── due_date            (date)
├── subtotal_cents      (integer) — sum of line items, before tax
├── tax_cents           (integer)
├── total_cents         (integer) — subtotal + tax
├── status              (enum: draft, sent, partial, paid, overdue, void)
│                          ⚠️ NOTE: status can be a computed/derived value at read-time
│                          instead of a stored column — either works, but if stored,
│                          it must be recalculated every time a payment is applied
├── created_at          (timestamp)

invoice_line_items
├── id                  (primary key)
├── invoice_id          (foreign key → invoices.id)
├── description         (text) — "Lawn mowing service — office park"
├── quantity            (integer)
├── unit_price_cents    (integer)
├── line_total_cents    (integer) — quantity × unit_price

payments
├── id                  (primary key)
├── customer_id         (foreign key → customers.id)
├── amount_cents        (integer) — total amount of this payment
├── method              (enum: cash, card, transfer, check)
├── payment_date         (date)
├── created_at          (timestamp)

payment_allocations
├── id                  (primary key)
├── payment_id          (foreign key → payments.id)
├── invoice_id          (foreign key → invoices.id)
├── amount_applied_cents (integer) — how much of this payment went to this invoice
│                          (this table is what makes "one payment, many invoices" possible)
```

**Why `payment_allocations` is its own table and not just a field on `payments`:** because one payment can cover multiple invoices (Mike's earlier example — a customer paying off 3 overdue invoices with one check). If you tried to store `invoice_id` directly on `payments`, you couldn't represent that. This join table is the piece that makes the "flexible payment application" feature actually work — it's the most important modeling decision in the whole schema.

**How balance/status gets calculated (not stored, or stored + recalculated):**
```
customer.balance = SUM(invoices.total_cents WHERE customer_id = X AND status != 'void')
                  - SUM(payment_allocations.amount_applied_cents joined through invoices WHERE customer_id = X)

invoice.amount_paid = SUM(payment_allocations.amount_applied_cents WHERE invoice_id = X)
invoice.balance_due = invoice.total_cents - invoice.amount_paid
```

---

# Part 5: Per-Screen Data Contract (exactly what goes in, exactly what comes out)

| Screen | **Displays (output)** | **Collects (input)** |
|---|---|---|
| **Dashboard** | Total outstanding (sum across all open invoices), Total overdue (sum where due_date < today and unpaid), Recent activity (last N invoices/payments) | Nothing — read-only |
| **Customer List** | Customer name, balance owed (computed), overdue flag | Search text, optional filter |
| **Customer Detail** | Name, contact, address, computed balance, list of their invoices | Edits to contact info (name/email/phone/address) |
| **Invoice List** | Invoice #, customer name, date, due date, status badge, total | Filter selections (status/customer/date range) |
| **Invoice Create** | (mostly blank form, pre-filled customer if coming from Customer Detail) | Customer, line items (description/qty/price), tax rate, due date |
| **Invoice Detail** | Invoice #, customer, line items, subtotal/tax/total, amount paid, balance due, payment history, status | Nothing directly — actions only (Void, Record Payment) |
| **Record Payment (modal)** | Invoice(s) it's being applied to, their current balance due | Amount, method, date, which invoice(s) + how much per invoice |
| **Aging Report** | Every customer with an open balance, bucketed by days overdue, row + column totals | "As of" date filter |

If you're ever unsure what a screen needs, ask: **"what does Mike need to see here to make a decision, and what does he need to type/click to move forward?"** That's the entire design process for every screen in this app.

---

# Part 6: How to Actually Approach the Mockup

You don't need a separate design tool (Figma, etc.) for this. Given the app is 90% tables/forms/badges (per the Bootstrap doc), the fastest and most useful path is:

1. **Build the Dashboard, Customer List, and Invoice List first**, with hardcoded fake data that mirrors Sarah's story above (use "Acme Corp," a $450 invoice, etc. — real-feeling data, not "Test Customer 1").
2. **Wire them together with real navigation** (clicking a customer row actually goes to that customer's detail page) even before the backend logic exists — this alone will tell you if the flow feels right.
3. **Build Invoice Create and Record Payment as actual working forms** even if they just log to the console or write to a temporary in-memory array — you want to feel the actual click-through experience, not just look at static boxes.
4. **Only then build the Aging Report** — it depends on having several invoices with varied due dates to look meaningful, so seed a handful of fake invoices spanning different ages first.

This means your "mockup" and your "real app" are the same codebase from day one — nothing gets thrown away. That's the practical benefit of skipping a separate design tool here.

---

# What to specify before you start building, concretely

Answer these for yourself (or ask your PM once they resurface):
1. **Does Sarah's V1 story match what you're building, or is the hotel City Ledger story the actual target from day one?** This changes your schema (whether `source_type` and Card Batch matter now or later).
2. **Do invoices need tax at all?** (Some B2B service businesses genuinely don't.)
3. **Is there more than one user/role at launch, or is it just one person using it?** (Determines if you need login/roles in V1 or can hardcode a single user for now.)
4. **What happens when a payment doesn't fully cover an invoice — is partial payment a real use case for your business, or is every invoice paid in full or not at all?** (Affects how much you need to build out the allocation table right away.)
