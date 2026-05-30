# Purchasing Management — Hotel Admin Dashboard

## Context & Position in Monorepo

This is **not a standalone app**. It is a feature module living inside `apps/admin-dashboard` within the `bumi-anyom-web` monorepo.

```
bumi-anyom-web/                     ← monorepo root
└── apps/
    └── admin-dashboard/            ← THIS is where all code lives
        ├── app/                    ← Next.js App Router (all pages here)
        ├── components/             ← Shared UI components
        ├── context/                ← React context providers
        ├── hooks/                  ← Custom React hooks
        ├── lib/                    ← Firebase, utilities, helpers
        ├── services/               ← Firestore service layer (data access)
        ├── public/
        ├── .env.local              ← Single source of env vars (DO NOT duplicate)
        ├── DESIGN.md               ← Design system reference
        └── apphosting.yaml
```

**All purchasing module code must follow the existing folder conventions of `admin-dashboard`.** Do not create new top-level folders unless they already exist in the structure above.

---

## Tech Stack

Inherits everything from `admin-dashboard`. No new dependencies unless absolutely necessary.

| Layer       | Technology                                     |
| ----------- | ---------------------------------------------- |
| Frontend    | Next.js (App Router), TypeScript, Tailwind CSS |
| Backend     | Firebase (Firestore, Auth, Storage, Functions) |
| State       | React Context (see `context/`)                 |
| UI          | Isolated CSS Modules (see Design Isolation)    |
| Animation   | Framer Motion                                  |
| PDF Export  | jsPDF (client-side)                            |
| Charting    | Recharts                                       |
| Deployment  | Firebase App Hosting (`apphosting.yaml`)       |

---

## Environment Variables

**All env vars are already defined in `apps/admin-dashboard/.env.local`.**
Do NOT add a new `.env` file. Do NOT ask to create new Firebase env vars — reuse what exists.

The purchasing module uses the same Firebase project, same Auth instance, and same Firestore database as the rest of admin-dashboard.

---

## User Roles

Roles are managed via **Firebase custom claims**, consistent with the rest of admin-dashboard auth.

| Role           | Access                                                              |
| -------------- | ------------------------------------------------------------------- |
| **purchasing** | Full CRUD on all purchasing modules, manages item master, approvals |
| **department** | Submit Store Requisition, view own request status                   |
| **kitchen**    | Submit Daily Market List, view approved items                       |
| **finance**    | Read-only on Purchase Requisition and reports                       |
| **admin**      | Full access, user management                                        |

Role checks must use the existing auth context from `context/` — do not create a parallel auth system.

---

## ⚠️ CSS Isolation — Critical Rule

**The purchasing module is a fully isolated design surface.** It does NOT inherit or extend the global CSS, global layout, or any layout from other dashboard sections.

### Why Isolated

- Purchasing has its own visual identity: data-dense tables, multi-step forms, signature surface cards, and animated transitions that would conflict with the global dashboard shell.
- The global layout (sidebar, topbar, page wrapper) is **excluded** from all purchasing routes. Purchasing owns its own shell.

### How to Implement Isolation

#### 1. Separate Layout File

Every purchasing page renders inside its own layout, not the global `(dashboard)/layout.tsx`:

```tsx
// app/(dashboard)/purchasing/layout.tsx
// This layout REPLACES the global dashboard layout for all /purchasing/* routes.
// It must NOT import or extend the parent layout.

import { PurchasingShell } from '@/components/purchasing/shell/PurchasingShell'

export default function PurchasingLayout({ children }: { children: React.ReactNode }) {
  return <PurchasingShell>{children}</PurchasingShell>
}
```

#### 2. CSS Modules Per Component (mandatory)

Every component inside `components/purchasing/` must have its own `.module.css` file. **Never use global class names or Tailwind utility classes** inside purchasing components.

```
components/purchasing/
└── sr/
    ├── SRTable.tsx
    ├── SRTable.module.css      ← required
    ├── SRForm.tsx
    ├── SRForm.module.css       ← required
    └── SRStatusBadge.tsx
        SRStatusBadge.module.css
```

#### 3. CSS Custom Properties Scope

All design tokens are scoped to `.purchasing-root` — a wrapper class applied by `PurchasingShell`. This prevents token bleed into global scope.

```css
/* components/purchasing/shell/purchasing-tokens.css */
/* Imported ONLY by PurchasingShell — never globally */

.purchasing-root {
  /* Surfaces */
  --p-canvas:          #ffffff;
  --p-surface-soft:    #f8fafc;
  --p-surface-strong:  #e0e2e6;
  --p-surface-dark:    #181d26;
  --p-hairline:        #dddddd;

  /* Brand / Signature */
  --p-coral:           #aa2d00;
  --p-forest:          #0a2e0e;
  --p-cream:           #f5e9d4;
  --p-peach:           #fcab79;
  --p-mint:            #a8d8c4;
  --p-yellow:          #f4d35e;
  --p-mustard:         #d9a441;

  /* Text */
  --p-ink:             #181d26;
  --p-body:            #333840;
  --p-muted:           #41454d;
  --p-on-dark:         #ffffff;

  /* Actions */
  --p-primary:         #181d26;
  --p-primary-active:  #0d1218;
  --p-link:            #1b61c9;

  /* Semantic */
  --p-success:         #006400;
  --p-success-border:  #39bf45;
  --p-info:            #254fad;
  --p-info-border:     #458fff;
  --p-danger:          #aa2d00;

  /* Spacing */
  --p-space-xxs:       4px;
  --p-space-xs:        8px;
  --p-space-sm:        12px;
  --p-space-md:        16px;
  --p-space-lg:        24px;
  --p-space-xl:        32px;
  --p-space-xxl:       48px;
  --p-space-section:   96px;

  /* Radius */
  --p-radius-sm:       6px;
  --p-radius-md:       10px;
  --p-radius-lg:       12px;
  --p-radius-full:     9999px;

  /* Typography */
  --p-font:            'Haas Grotesk', 'Inter', system-ui, sans-serif;
  --p-font-size-xl:    32px;
  --p-font-size-lg:    24px;
  --p-font-size-md:    20px;
  --p-font-size-sm:    18px;
  --p-font-size-label: 16px;
  --p-font-size-body:  14px;
  --p-font-size-caption: 13px;

  /* Animation */
  --p-ease-out:        cubic-bezier(0.16, 1, 0.3, 1);
  --p-ease-in-out:     cubic-bezier(0.4, 0, 0.2, 1);
  --p-duration-fast:   150ms;
  --p-duration-base:   250ms;
  --p-duration-slow:   400ms;
}
```

#### 4. No Tailwind Inside Purchasing Components

Do not use Tailwind utility classes (`className="flex gap-4 text-sm"`) inside any file under `components/purchasing/`. Use CSS Modules with `--p-*` custom properties instead.

Tailwind is only allowed in `app/(dashboard)/purchasing/*/page.tsx` for layout scaffolding (e.g. `className="min-h-screen"`), **never for visual design**.

---

## Folder Structure (Full Modular — One Folder Per Section)

Every section is fully self-contained: its page, all its components, its CSS modules, its hooks, and its service all live together or in clearly named subfolders. No file from one section imports from another section's component folder.

```
apps/admin-dashboard/
│
├── app/
│   └── (dashboard)/
│       └── purchasing/
│           ├── layout.tsx                          ← isolated purchasing shell (no global layout)
│           ├── page.tsx                            ← purchasing overview / dashboard
│           │
│           ├── store-requisition/
│           │   ├── page.tsx
│           │   ├── new/
│           │   │   └── page.tsx
│           │   └── [id]/
│           │       └── page.tsx
│           │
│           ├── purchase-requisition/
│           │   ├── page.tsx
│           │   ├── new/
│           │   │   └── page.tsx
│           │   └── [id]/
│           │       └── page.tsx
│           │
│           ├── daily-market-list/
│           │   ├── page.tsx
│           │   ├── new/
│           │   │   └── page.tsx
│           │   └── [id]/
│           │       └── page.tsx
│           │
│           ├── stock-opname/
│           │   ├── page.tsx
│           │   └── [id]/
│           │       └── page.tsx
│           │
│           ├── items/
│           │   ├── page.tsx
│           │   └── [id]/
│           │       └── page.tsx
│           │
│           └── suppliers/
│               ├── page.tsx
│               └── [id]/
│                   └── page.tsx
│
│
├── components/
│   └── purchasing/
│       │
│       ├── shell/                                  ← SECTION: purchasing shell & navigation
│       │   ├── PurchasingShell.tsx
│       │   ├── PurchasingShell.module.css
│       │   ├── PurchasingSidebar.tsx
│       │   ├── PurchasingSidebar.module.css
│       │   ├── PurchasingTopbar.tsx
│       │   ├── PurchasingTopbar.module.css
│       │   └── purchasing-tokens.css               ← all --p-* tokens, imported only here
│       │
│       ├── dashboard/                              ← SECTION: purchasing overview page
│       │   ├── DashboardGrid.tsx
│       │   ├── DashboardGrid.module.css
│       │   ├── StatCard.tsx
│       │   ├── StatCard.module.css
│       │   ├── SpendChart.tsx
│       │   ├── SpendChart.module.css
│       │   ├── PendingAlerts.tsx
│       │   ├── PendingAlerts.module.css
│       │   ├── TopItemsTable.tsx
│       │   └── TopItemsTable.module.css
│       │
│       ├── sr/                                     ← SECTION: store requisition
│       │   ├── SRListPage.tsx
│       │   ├── SRListPage.module.css
│       │   ├── SRTable.tsx
│       │   ├── SRTable.module.css
│       │   ├── SRForm.tsx
│       │   ├── SRForm.module.css
│       │   ├── SRDetailPage.tsx
│       │   ├── SRDetailPage.module.css
│       │   ├── SRStatusBadge.tsx
│       │   ├── SRStatusBadge.module.css
│       │   ├── SRItemRow.tsx
│       │   └── SRItemRow.module.css
│       │
│       ├── pr/                                     ← SECTION: purchase requisition
│       │   ├── PRListPage.tsx
│       │   ├── PRListPage.module.css
│       │   ├── PRTable.tsx
│       │   ├── PRTable.module.css
│       │   ├── PRForm.tsx
│       │   ├── PRForm.module.css
│       │   ├── PRDetailPage.tsx
│       │   ├── PRDetailPage.module.css
│       │   ├── PRStatusBadge.tsx
│       │   ├── PRStatusBadge.module.css
│       │   ├── PRItemRow.tsx
│       │   ├── PRItemRow.module.css
│       │   ├── SRtoPRConverter.tsx                 ← SR → PR one-click conversion
│       │   └── SRtoPRConverter.module.css
│       │
│       ├── dml/                                    ← SECTION: daily market list
│       │   ├── DMLListPage.tsx
│       │   ├── DMLListPage.module.css
│       │   ├── DMLTable.tsx
│       │   ├── DMLTable.module.css
│       │   ├── DMLForm.tsx
│       │   ├── DMLForm.module.css
│       │   ├── DMLDetailPage.tsx
│       │   ├── DMLDetailPage.module.css
│       │   ├── DMLItemRow.tsx
│       │   ├── DMLItemRow.module.css
│       │   ├── DMLStatusBadge.tsx
│       │   ├── DMLStatusBadge.module.css
│       │   ├── DMLDailySummaryCard.tsx             ← signature cream summary card
│       │   └── DMLDailySummaryCard.module.css
│       │
│       ├── opname/                                 ← SECTION: stock opname
│       │   ├── OpnameListPage.tsx
│       │   ├── OpnameListPage.module.css
│       │   ├── OpnameSheet.tsx
│       │   ├── OpnameSheet.module.css
│       │   ├── OpnameItemRow.tsx
│       │   ├── OpnameItemRow.module.css
│       │   ├── VarianceBadge.tsx
│       │   ├── VarianceBadge.module.css
│       │   ├── OpnameSummaryCard.tsx               ← locked/approved status card
│       │   └── OpnameSummaryCard.module.css
│       │
│       ├── items/                                  ← SECTION: items master list
│       │   ├── ItemsListPage.tsx
│       │   ├── ItemsListPage.module.css
│       │   ├── ItemsTable.tsx
│       │   ├── ItemsTable.module.css
│       │   ├── ItemForm.tsx
│       │   ├── ItemForm.module.css
│       │   ├── ItemDetailPage.tsx
│       │   ├── ItemDetailPage.module.css
│       │   ├── LowStockBanner.tsx                  ← signature coral alert banner
│       │   └── LowStockBanner.module.css
│       │
│       ├── suppliers/                              ← SECTION: supplier management
│       │   ├── SuppliersListPage.tsx
│       │   ├── SuppliersListPage.module.css
│       │   ├── SuppliersTable.tsx
│       │   ├── SuppliersTable.module.css
│       │   ├── SupplierForm.tsx
│       │   ├── SupplierForm.module.css
│       │   ├── SupplierDetailPage.tsx
│       │   └── SupplierDetailPage.module.css
│       │
│       └── ui/                                     ← SECTION: purchasing shared primitives
│           ├── PButton.tsx                         ← purchasing-scoped button
│           ├── PButton.module.css
│           ├── PInput.tsx
│           ├── PInput.module.css
│           ├── PSelect.tsx
│           ├── PSelect.module.css
│           ├── PModal.tsx
│           ├── PModal.module.css
│           ├── PTable.tsx
│           ├── PTable.module.css
│           ├── PCard.tsx
│           ├── PCard.module.css
│           ├── PStatusChip.tsx
│           ├── PStatusChip.module.css
│           ├── PPageHeader.tsx
│           ├── PPageHeader.module.css
│           ├── PSectionDivider.tsx
│           ├── PSectionDivider.module.css
│           ├── PEmptyState.tsx
│           ├── PEmptyState.module.css
│           ├── PSkeletonRow.tsx
│           └── PSkeletonRow.module.css
│
│
├── hooks/
│   └── purchasing/
│       ├── useStoreRequisition.ts
│       ├── usePurchaseRequisition.ts
│       ├── useDailyMarketList.ts
│       ├── useStockOpname.ts
│       ├── useItems.ts
│       └── useSuppliers.ts
│
├── services/
│   └── purchasing/
│       ├── srService.ts
│       ├── prService.ts
│       ├── dmlService.ts
│       ├── opnameService.ts
│       ├── itemsService.ts
│       └── suppliersService.ts
│
└── lib/
    └── purchasing/
        ├── types.ts                                ← all purchasing TypeScript types
        ├── constants.ts                            ← status enums, categories, units
        └── utils.ts                                ← doc number generators, formatters
```

---

## Design System

> Source: `apps/admin-dashboard/DESIGN.md` (Airtable design language)
> Install: `npx getdesign@latest add airtable`
>
> The purchasing module uses the Airtable design language but applies it through **isolated CSS Modules and `--p-*` custom properties** — never through global stylesheets or Tailwind utility classes.

---

### Design Philosophy

- **White canvas as default** — all list and form pages sit on `--p-canvas` with no decoration.
- **Voltage through signature surface cards** — summary totals, status banners, and alerts use signature surfaces to punctuate data-dense pages.
- **Emphasis via size and surface, never weight** — maximum font-weight is 500. No 600 or 700.
- **Generous whitespace** — `--p-space-section` (96px) between major page sections. Never collapse.
- **Rhythm rule** — canvas section → signature card → canvas section. Never two signature surfaces back-to-back.

---

### Color Tokens (use `--p-*` variables)

#### Surfaces
| Variable | Hex | Usage |
|---|---|---|
| `--p-canvas` | #ffffff | Page bg, table rows, form bg |
| `--p-surface-soft` | #f8fafc | Active sidebar item, selected row, tabbed card bg |
| `--p-surface-strong` | #e0e2e6 | Empty-state bg, section divider bg |
| `--p-surface-dark` | #181d26 | Dark summary total cards |
| `--p-hairline` | #dddddd | Table dividers, input borders, card outlines |

#### Text
| Variable | Hex | Usage |
|---|---|---|
| `--p-ink` | #181d26 | Page titles, primary button text-on-light |
| `--p-body` | #333840 | Table values, form copy, body text |
| `--p-muted` | #41454d | Timestamps, meta, placeholder, breadcrumbs |
| `--p-on-dark` | #ffffff | Text on dark/coral/forest surfaces |

#### Actions
| Variable | Hex | Usage |
|---|---|---|
| `--p-primary` | #181d26 | Primary button bg |
| `--p-primary-active` | #0d1218 | Primary button pressed |
| `--p-link` | #1b61c9 | Inline text links only — NEVER button bg |
| `--p-danger` | #aa2d00 | Destructive action buttons |

> ⚠️ `--p-link` is blue (#1b61c9). It is **only** for inline text links. Primary buttons are `--p-primary` (near-black). This is the single most common mistake.

#### Signature Surfaces
| Variable | Hex | Semantic Use |
|---|---|---|
| `--p-coral` | #aa2d00 | Overdue / rejected / urgent banners |
| `--p-forest` | #0a2e0e | Approved / completed summary cards |
| `--p-cream` | #f5e9d4 | Neutral info callouts, DML daily summary |
| `--p-surface-dark` | #181d26 | Monthly spend total, dark KPI cards |
| `--p-peach` | #fcab79 | Submitted / pending status chips |
| `--p-mint` | #a8d8c4 | Approved / fulfilled status chips |
| `--p-yellow` | #f4d35e | Draft status chips |
| `--p-mustard` | #d9a441 | Sent-to-supplier status chips |

#### Semantic
| Variable | Usage |
|---|---|
| `--p-success` / `--p-success-border` | Received / fulfilled states |
| `--p-info` / `--p-info-border` | Input focus, info badge |

---

### Typography

Font stack: `'Haas Grotesk', 'Inter', system-ui, sans-serif` (set via `--p-font`).

| Use | Size | Weight | Variable |
|---|---|---|---|
| Page section header | 32px | 400 | `--p-font-size-xl` |
| Card / modal header | 24px | 400 | `--p-font-size-lg` |
| Sub-section title | 20px | 400 | `--p-font-size-md` |
| Document card title | 18px | 500 | `--p-font-size-sm` |
| Table column header, form label | 16px | 500 | `--p-font-size-label` |
| Button label | 16px | 500 | `--p-font-size-label` |
| Table value, body copy | 14px | 400 | `--p-font-size-body` |
| Status chip, meta, caption | 13px | 500 | `--p-font-size-caption` |

Maximum weight: **500**. Never use 600 or 700.

---

### Spacing

All spacing uses `--p-space-*` variables. Never hardcode px values.

| Variable | Value | Usage |
|---|---|---|
| `--p-space-xs` | 8px | Icon–label gap inside buttons |
| `--p-space-sm` | 12px | Input vertical padding |
| `--p-space-md` | 16px | Dense card internal padding |
| `--p-space-lg` | 24px | Form field gap, card grid gap |
| `--p-space-xl` | 32px | Standard card padding |
| `--p-space-xxl` | 48px | Signature card padding |
| `--p-space-section` | 96px | Between major page sections |

---

### Border Radius

| Variable | Value | Usage |
|---|---|---|
| `--p-radius-sm` | 6px | Text inputs, search bars |
| `--p-radius-md` | 10px | Table cards, list cards, modals |
| `--p-radius-lg` | 12px | Primary buttons, signature surface cards |
| `--p-radius-full` | 9999px | Avatar chips, icon buttons, status chips |

> ⚠️ No pill-shaped buttons in purchasing. `--p-radius-full` is only for chips and icon buttons.

---

### Animation System

All purchasing animations use **Framer Motion**. CSS-only transitions are allowed for micro-interactions (hover, focus) via `--p-duration-*` and `--p-ease-*` variables.

#### Framer Motion Presets

Use these standard variants consistently across all purchasing components:

```tsx
// lib/purchasing/animations.ts

export const fadeUp = {
  hidden:  { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] } },
  exit:    { opacity: 0, y: 8, transition: { duration: 0.2 } },
}

export const fadeIn = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.25 } },
  exit:    { opacity: 0, transition: { duration: 0.15 } },
}

export const slideInRight = {
  hidden:  { opacity: 0, x: 32 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] } },
  exit:    { opacity: 0, x: 16, transition: { duration: 0.2 } },
}

export const staggerContainer = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.06 } },
}

export const cardHover = {
  rest:  { scale: 1,    boxShadow: '0 1px 3px rgba(0,0,0,0.06)' },
  hover: { scale: 1.01, boxShadow: '0 8px 24px rgba(0,0,0,0.10)', transition: { duration: 0.2 } },
}

export const statusChipPop = {
  hidden:  { opacity: 0, scale: 0.8 },
  visible: { opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 400, damping: 20 } },
}

export const tableRowEnter = {
  hidden:  { opacity: 0, x: -8 },
  visible: { opacity: 1, x: 0 },
}
```

#### When to Use Each Preset

| Preset | Use |
|---|---|
| `fadeUp` | Page sections, cards, modals entering the DOM |
| `fadeIn` | Overlay backdrops, skeleton-to-content transition |
| `slideInRight` | Detail panels, drawers opening from right |
| `staggerContainer` | Wrapping a list of cards/rows so they stagger in |
| `cardHover` | Stat cards and document cards on hover |
| `statusChipPop` | Status chips appearing after data loads |
| `tableRowEnter` | Table rows entering via staggerContainer |

#### Page Transition

Every `page.tsx` wraps its content in:

```tsx
<motion.div variants={fadeUp} initial="hidden" animate="visible" exit="exit">
  {/* page content */}
</motion.div>
```

#### Skeleton Loading

All list and detail pages show skeleton rows while Firestore data loads. Skeletons animate with a shimmer using CSS:

```css
/* PSkeletonRow.module.css */
.skeleton {
  background: linear-gradient(
    90deg,
    var(--p-surface-soft) 25%,
    var(--p-surface-strong) 50%,
    var(--p-surface-soft) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.4s ease-in-out infinite;
  border-radius: var(--p-radius-sm);
}

@keyframes shimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

---

## Component Specifications

### PurchasingShell

The root shell renders a **two-column layout**: fixed left sidebar + scrollable main content area. It is the only component that imports `purchasing-tokens.css`.

```css
/* PurchasingShell.module.css */
.root {
  display: grid;
  grid-template-columns: 240px 1fr;
  min-height: 100vh;
  background: var(--p-canvas);
  font-family: var(--p-font);
}

.main {
  overflow-y: auto;
  padding: var(--p-space-xxl);
}

@media (max-width: 768px) {
  .root { grid-template-columns: 1fr; }
}
```

### PurchasingSidebar

- Fixed 240px width on desktop, slides in from left on mobile as a drawer (Framer Motion `slideInRight` mirrored).
- Nav items: Dashboard, Store Requisition, Purchase Requisition, Daily Market List, Stock Opname, Items, Suppliers.
- Active item: `--p-surface-soft` bg, `--p-ink` text, left 3px border in `--p-primary`.
- Pending count badges on SR, PR, DML nav items (real-time from Firestore).
- Animation: badge count animates with `statusChipPop` on update.

### PPageHeader

Used at the top of every purchasing page.

```css
/* PPageHeader.module.css */
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--p-space-xl);
}

.title {
  font-size: var(--p-font-size-xl);    /* 32px */
  font-weight: 400;
  color: var(--p-ink);
  letter-spacing: 0;
}

.subtitle {
  font-size: var(--p-font-size-body);
  color: var(--p-muted);
  margin-top: var(--p-space-xs);
}
```

### PButton

```css
/* PButton.module.css */

.base {
  display: inline-flex;
  align-items: center;
  gap: var(--p-space-xs);
  font-family: var(--p-font);
  font-size: var(--p-font-size-label);
  font-weight: 500;
  line-height: 1.4;
  padding: 12px var(--p-space-lg);
  border-radius: var(--p-radius-lg);
  border: none;
  cursor: pointer;
  transition: background var(--p-duration-fast) var(--p-ease-out),
              transform   var(--p-duration-fast) var(--p-ease-out),
              box-shadow  var(--p-duration-fast) var(--p-ease-out);
  white-space: nowrap;
}

.primary {
  background: var(--p-primary);
  color: var(--p-on-dark);
}
.primary:active {
  background: var(--p-primary-active);
  transform: scale(0.98);
}

.secondary {
  background: var(--p-canvas);
  color: var(--p-ink);
  border: 1px solid var(--p-hairline);
}
.secondary:active {
  background: var(--p-surface-soft);
  transform: scale(0.98);
}

.danger {
  background: var(--p-coral);
  color: var(--p-on-dark);
}
.danger:active {
  background: #8f2600;
  transform: scale(0.98);
}

.base:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  transform: none;
}
```

### PInput

```css
/* PInput.module.css */
.input {
  width: 100%;
  height: 44px;
  padding: var(--p-space-sm) var(--p-space-md);
  font-family: var(--p-font);
  font-size: var(--p-font-size-body);
  color: var(--p-ink);
  background: var(--p-canvas);
  border: 1px solid var(--p-hairline);
  border-radius: var(--p-radius-sm);
  transition: border-color var(--p-duration-fast) var(--p-ease-out),
              box-shadow   var(--p-duration-fast) var(--p-ease-out);
  outline: none;
}
.input::placeholder { color: var(--p-muted); }
.input:focus {
  border-color: var(--p-info-border);
  box-shadow: 0 0 0 3px rgba(69, 143, 255, 0.15);
}
```

### PStatusChip

Status chips use `--p-radius-full` and the semantic color palette. Always animated with `statusChipPop`.

| Status value | Background | Text |
|---|---|---|
| `draft` | `--p-yellow` | `--p-ink` |
| `submitted` | `--p-peach` | `--p-ink` |
| `approved` | `--p-mint` | `--p-ink` |
| `fulfilled` / `received` | `--p-success` | `--p-on-dark` |
| `rejected` | `--p-coral` | `--p-on-dark` |
| `sent_to_supplier` | `--p-mustard` | `--p-ink` |
| `po_issued` | `--p-surface-dark` | `--p-on-dark` |
| `locked` | `--p-ink` | `--p-on-dark` |

### PTable

- Header row: `--p-surface-soft` bg, `--p-font-size-label` / weight 500, `--p-ink` color.
- Body rows: `--p-canvas` bg, `--p-font-size-body` / weight 400, `--p-body` color.
- Row divider: 1px `--p-hairline`.
- Selected row: `--p-surface-soft` bg.
- Numeric columns (qty, price, total): right-aligned, `--p-font-size-caption` / weight 500.
- Table rows enter with `staggerContainer` + `tableRowEnter` variants.
- Empty state: `PEmptyState` component centered in table body.

### PCard (Signature Surface Variants)

Four card variants, all use `--p-radius-lg` and `--p-space-xxl` padding:

```css
.canvas   { background: var(--p-canvas);       color: var(--p-ink);    border: 1px solid var(--p-hairline); }
.dark     { background: var(--p-surface-dark); color: var(--p-on-dark); }
.coral    { background: var(--p-coral);        color: var(--p-on-dark); }
.forest   { background: var(--p-forest);       color: var(--p-on-dark); }
.cream    { background: var(--p-cream);        color: var(--p-ink);    }
```

All PCard variants animate in with `fadeUp`.

### PModal

- Backdrop: `rgba(24, 29, 38, 0.5)` blur `8px`, animates with `fadeIn`.
- Modal panel: `--p-canvas`, `--p-radius-lg`, `--p-space-xxl` padding, max-width 560px.
- Entrance: `fadeUp` variant.
- Close on backdrop click and Escape key.

---

## Page Layout Patterns

### List Page Pattern

Every list page (SR, PR, DML, Items, Suppliers, Opname) follows this structure:

```
PPageHeader (title + primary "Create New" button)
  ↓
[Optional: PCard variant="coral" for urgent alerts / low-stock banners]
  ↓
Filter row (search PInput + status PSelect + date range)
  ↓
PTable (with staggered row entrance, skeleton loading, empty state)
  ↓
Pagination
```

### Detail Page Pattern

```
PPageHeader (doc number + status chip + action buttons)
  ↓
PCard variant="cream"  → document meta (created by, date, department)
  ↓
PTable                 → items list
  ↓
PCard variant="dark"   → totals summary
  ↓
Approval action row    → Approve / Reject buttons (role-gated)
```

### Form Page Pattern

```
PPageHeader (title + breadcrumb)
  ↓
Single-column form on mobile / 2-column at tablet+
  ↓
PInput / PSelect fields with PLabel, full validation feedback
  ↓
Item list section (add/remove rows, animated with staggerContainer)
  ↓
Sticky bottom action bar: PButton secondary "Batal" + PButton primary "Simpan"
```

---

## Core Modules

### 1. Store Requisition (SR)

Requests for items from internal hotel stock/warehouse, submitted by departments.

**Flow:** `Draft → Submitted → Approved → Fulfilled → Rejected`

**Features:**
- Create SR with item list, qty, unit, requested date, and department
- Purchasing reviews and approves/rejects
- Partial fulfillment (received qty vs requested qty)
- Auto-generate SR number: `SR-YYYY-MM-XXXX`
- Export as PDF

**Firestore Collection:** `store_requisitions`

```
store_requisitions/{srId}
  - sr_number: string
  - department: string
  - requested_by: uid
  - status: 'draft' | 'submitted' | 'approved' | 'fulfilled' | 'rejected'
  - items: [{ item_id, name, unit, qty_requested, qty_fulfilled, notes }]
  - created_at: timestamp
  - updated_at: timestamp
  - approved_by: uid | null
  - notes: string
```

---

### 2. Purchase Requisition (PR)

Internal procurement request to procure items from external suppliers.

**Flow:** `Draft → Submitted → Approved → PO Issued → Received → Closed`

**Features:**
- Create from scratch or auto-convert from approved SR (one-click via `SRtoPRConverter`)
- Assign supplier per item or per PR
- Budget estimation vs actual price tracking
- Finance approval gate before PO issuance
- Export PR to PDF
- Auto-generate PR number: `PR-YYYY-MM-XXXX`

**Firestore Collection:** `purchase_requisitions`

```
purchase_requisitions/{prId}
  - pr_number: string
  - linked_sr_id: string | null
  - status: 'draft' | 'submitted' | 'approved' | 'po_issued' | 'received' | 'closed'
  - items: [{ item_id, name, unit, qty, estimated_price, actual_price, supplier_id }]
  - total_estimated: number
  - total_actual: number
  - requested_by: uid
  - approved_by: uid | null
  - created_at: timestamp
  - delivery_date: timestamp | null
  - notes: string
```

---

### 3. Daily Market List (DML)

Daily procurement checklist for fresh goods (produce, meat, seafood, etc.).

**Flow:** `Draft → Submitted → Sent to Supplier → Received`

**Features:**
- Pre-fill from previous day or saved weekly template
- Items categorized: Vegetables, Fruits, Meat, Seafood, Dairy, Dry Goods, etc.
- Qty per item with unit (kg, pcs, liter, etc.)
- Auto-fill unit price from supplier price list
- Track ordered qty vs received qty
- Export to PDF / WhatsApp-ready text
- Auto-generate DML number: `DML-YYYY-MM-DD`

**Firestore Collection:** `daily_market_lists`

```
daily_market_lists/{dmlId}
  - dml_number: string
  - date: timestamp
  - status: 'draft' | 'submitted' | 'sent_to_supplier' | 'received'
  - items: [{ item_id, category, name, unit, qty_ordered, qty_received, unit_price, total }]
  - total_cost: number
  - submitted_by: uid
  - verified_by: uid | null
  - created_at: timestamp
  - notes: string
```

---

### 4. Items Master List

Central database of all purchasable/requestable items, managed by Purchasing.

- Item code, name, category, default unit, default supplier
- Minimum stock level (triggers `LowStockBanner` — coral signature card)
- Price history per supplier
- Active / Inactive toggle
- Read-only access for all other roles

**Firestore Collection:** `items`

---

### 5. Supplier Management

- Supplier profile: name, PIC contact, address, payment terms
- Linked items per supplier
- Price list versioning
- On-time delivery rate tracking

**Firestore Collection:** `suppliers`

---

### 6. Stock Opname (End-of-Month)

Monthly physical stock count and reconciliation.

**Features:**
- Auto-generate opname sheet from items master list
- Input physical count per item
- Variance calculation: `System Stock − Physical Count = Variance`
- Variance classification: normal shrinkage / damage / missing
- Approval by Purchasing Head → locks the record (immutable)
- Export to Excel / PDF
- One active opname per period (enforced)

**Firestore Collection:** `stock_opnames`

```
stock_opnames/{opnameId}
  - period: string              ← e.g. '2025-01'
  - status: 'open' | 'submitted' | 'approved' | 'locked'
  - items: [{ item_id, name, unit, system_qty, physical_qty, variance, variance_type, notes }]
  - conducted_by: uid
  - approved_by: uid | null
  - created_at: timestamp
  - approved_at: timestamp | null
```

---

### 7. Purchasing Dashboard

Landing page at `/purchasing`. Uses `staggerContainer` to animate all stat cards in sequence.

Cards layout:
- Row 1: 4× `StatCard` (pending SR count, pending PR count, today's DML cost, low-stock alerts) — `PCard variant="canvas"` with `cardHover` animation.
- Row 2: `SpendChart` (Recharts line chart, monthly spend) — `PCard variant="canvas"`.
- Row 3: `DMLDailySummaryCard` — `PCard variant="cream"` · `TopItemsTable` — `PCard variant="canvas"`.
- Row 4 (if urgent): `LowStockBanner` — `PCard variant="coral"` · `OpnameSummaryCard` — `PCard variant="dark"`.

---

## Key Business Rules

1. **SR → PR auto-conversion**: Approved SR converts to PR in one click — items carry over automatically via `SRtoPRConverter`.
2. **DML template**: Each DML pre-fills from the previous day or a saved weekly template.
3. **Auto-numbering**: Firestore transactions for atomic, collision-free document numbering.
4. **Opname lock**: After approval, opname records are immutable. Adjustments via a separate correction document.
5. **Price lock**: Once PR moves to PO Issued, unit prices are locked. Changes require a new PR.
6. **Soft delete**: `is_deleted: true` — no hard deletes anywhere.
7. **Single opname per period**: One opname document per `YYYY-MM` period enforced.

---

## Responsive Behavior

| Breakpoint | Layout Changes |
|---|---|
| Mobile < 768px | Sidebar hidden, hamburger opens as full-screen drawer. Single-column forms. Table columns collapse to essential columns only (doc number, status, date). |
| Tablet 768–1024px | Sidebar visible but narrow (64px icon-only). 2-column forms. Table shows all columns. |
| Desktop > 1024px | Full 240px sidebar. 2–3 column card grids. Full table with all columns visible. |

- All touch targets minimum 44×44px.
- Tables on mobile become card-list style (each row renders as a stacked card) rather than a horizontal-scroll table.
- Modals go full-screen on mobile.

---

## Firestore Security Rules (purchasing collections)

```
match /store_requisitions/{id} {
  allow read: if isAuthenticated();
  allow write: if hasRole('purchasing') || hasRole('admin')
               || (hasRole('department') && isOwner(resource));
}

match /purchase_requisitions/{id} {
  allow read: if hasRole('purchasing') || hasRole('finance') || hasRole('admin');
  allow write: if hasRole('purchasing') || hasRole('admin');
}

match /daily_market_lists/{id} {
  allow read: if isAuthenticated();
  allow write: if hasRole('purchasing') || hasRole('kitchen') || hasRole('admin');
}

match /stock_opnames/{id} {
  allow read: if hasRole('purchasing') || hasRole('finance') || hasRole('admin');
  allow write: if hasRole('purchasing') || hasRole('admin');
}
```

---

## Notes for AI Assistant (Gemini)

### Monorepo Rules
- This module lives in `apps/admin-dashboard` — never suggest creating a new app or standalone project.
- Never create a new `.env` file — all env vars live in `apps/admin-dashboard/.env.local`.
- Never modify `apphosting.yaml` unless specifically asked.

### CSS Isolation Rules
- **Never** use Tailwind utility classes inside `components/purchasing/` files — CSS Modules with `--p-*` tokens only.
- **Never** import from global stylesheets inside purchasing components.
- `purchasing-tokens.css` is imported **only** by `PurchasingShell` — not globally, not in `_app`, not in `layout.tsx` root.
- Every component file must have a matching `.module.css` file alongside it.
- All CSS custom property references must use `--p-*` prefix, never raw hex or px.

### Animation Rules
- Use Framer Motion presets from `lib/purchasing/animations.ts` — do not invent new variants.
- Every new page component wraps in `<motion.div variants={fadeUp} initial="hidden" animate="visible">`.
- Card grids always use `staggerContainer` + `tableRowEnter` or `fadeUp` on children.
- Do not animate layout shifts — only opacity, transform (translate/scale). Never animate width/height directly.

### Code Conventions
- All Firebase calls go in `services/purchasing/` — never call Firestore directly from page components.
- Auth and role checking must use the existing context from `context/` — no new auth logic.
- All timestamps: `serverTimestamp()` from Firestore, never `new Date()` on client.
- All monetary values: stored as **integers (Rupiah, no decimals)** — never floats.
- Date filters in Firestore: `Timestamp` comparisons, not string comparisons.
- Auto-numbering: **Firestore transactions** for atomic increments.

### File Placement
- New page → `app/(dashboard)/purchasing/[section]/`
- New component → `components/purchasing/[section]/ComponentName.tsx` + `ComponentName.module.css`
- New animation variant → `lib/purchasing/animations.ts`
- New shared primitive → `components/purchasing/ui/`
- New hook → `hooks/purchasing/`
- New service → `services/purchasing/`
- New type → `lib/purchasing/types.ts`

### Hard Don'ts
- Don't create `src/` folder — admin-dashboard does not use it.
- Don't add Zustand — state is React Context.
- Don't create parallel Firebase config — reuse `lib/`.
- Don't hard-delete Firestore documents — always `is_deleted: true`.
- Don't use font-weight 600 or 700 anywhere in purchasing UI.
- Don't use `--p-link` (#1b61c9) as any button background.
- Don't place two signature surface cards back-to-back — always a `--p-canvas` section between them.
- Don't add gradient backgrounds, mesh, or atmospheric effects to any surface.
- Don't animate `width`, `height`, or `max-height` directly — use `scaleY` or `opacity` instead.