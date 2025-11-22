# FWA Analytics Platform - Design Guidelines

## Design Approach

**Selected Approach**: Enterprise Design System (Material Design 3) + Healthcare Analytics Patterns

**Justification**: This is a data-intensive, mission-critical healthcare fraud detection platform requiring clarity, professionalism, and efficiency. Drawing inspiration from established healthcare payer solutions (Cotiviti, Brighterion AI) and enterprise analytics platforms (Tableau, Power BI healthcare dashboards).

**Core Principles**: 
- Data density with clarity
- Immediate insight recognition
- Trust and professionalism
- Responsive drill-down capabilities
- Dual-mode (light/dark) as first-class feature

---

## Typography System

**Font Family**: Inter (primary), IBM Plex Mono (data/code)

**Hierarchy**:
- Page Titles: 2xl, font-semibold
- Section Headers: xl, font-semibold  
- Card Titles: lg, font-medium
- Body Text: base, font-normal
- Data Labels: sm, font-medium
- Metadata/Timestamps: xs, font-normal
- Monospace Numbers: IBM Plex Mono for all numerical data (claims amounts, percentages, counts)

---

## Layout System

**Spacing Primitives**: Tailwind units of 2, 4, 6, 8, 12, 16, 24
- Component padding: p-6
- Card spacing: gap-6
- Section margins: mb-8 to mb-12
- Dense data tables: p-2 to p-4

**Grid Structure**:
- Dashboard: 12-column grid with gap-6
- Executive cards: 3-column grid (lg:grid-cols-3)
- Drill-down details: 2-column split (lg:grid-cols-2)
- Provider lists: single column with dense rows

**Container Widths**:
- Main content: max-w-7xl mx-auto px-6
- Modals/overlays: max-w-4xl

---

## Component Library

### Navigation
- **Top Bar**: Fixed header with logo, mode toggle, user profile, notification bell with badge count
- **Sidebar**: Collapsible navigation with 4 main sections (Claim Anomaly, EVV Intelligence, Provider Profiling, Benefit Utilization) + Dashboard home icon
- **Breadcrumbs**: Show drill-down path (Dashboard > Provider Profiling > Dr. Smith > Claims)

### Dashboard Cards
- **Metric Cards**: Prominent number display (3xl, monospace) with label above, trend indicator (↑↓) and percentage change below
- **Alert Cards**: Icon on left, severity indicator, message, timestamp, action button on right
- **Risk Score Cards**: Circular progress indicator, numerical score (0-100), risk level text, brief reasoning snippet

### Data Visualization
- **Trend Charts**: Line graphs with grid lines, data point markers on hover, date range selector
- **Heatmaps**: Geographic US map with intensity gradient, click to filter by state/region
- **Bar Charts**: Horizontal bars for provider comparisons, sorted by value, show top 10 by default
- **Network Graphs**: Node-link diagrams for provider relationships, size indicates claim volume, connections show referral patterns
- **Distribution Charts**: Histograms for claim amount distributions, outlier highlighting

### Tables
- **Sortable Headers**: Click to sort, show sort direction indicator
- **Row Actions**: Kebab menu (⋮) on right for View Details/Flag/Export
- **Expandable Rows**: Click row to reveal inline detail panel with claim breakdown
- **Pagination**: Footer with rows per page selector, page numbers, total count
- **Density**: Compact row height (h-12) for data tables, slightly taller (h-16) for primary lists

### Drill-Down Views
- **Detail Panels**: Slide-in from right (w-1/2 to w-2/3 of screen), close button top-right
- **Tabbed Content**: Horizontal tabs for Claims/Timeline/Risk Analysis/Documentation
- **Timeline View**: Vertical timeline with date markers, events as cards along the line

### Forms & Filters
- **Filter Bar**: Horizontal pill-style filters with dismiss X, applied count badge
- **Date Range Picker**: Calendar dropdown, preset options (Last 7/30/90 days, YTD)
- **Multi-Select**: Checkbox dropdowns for provider types, CPT codes, risk levels
- **Search**: Debounced search with icon, placeholder "Search claims, providers..."

### Alerts & Notifications
- **Real-Time Banner**: Top of screen, dismissible, severity-coded (Critical/High/Medium)
- **Toast Notifications**: Bottom-right corner, auto-dismiss after 5s, action button option
- **Badge Indicators**: Red dot on notification bell, count on filter chips

---

## Modal & Overlay Patterns

**AI Reasoning Modal**: Display dual-pathway analysis
- Split view: Operational Issue pathway on left, Fraud pathway on right
- Confidence scores for each hypothesis
- Supporting evidence bullets
- Recommended action at bottom

**Provider Detail Overlay**: Full provider profile
- Header with provider name, ID, specialty, network status
- Stats grid (total claims, average claim amount, risk score, years active)
- Recent claims table
- Network relationship visualization

---

## Special Healthcare Elements

**Clinical Score Displays**: PHQ-9 scores shown with visual scale (0-27), trend arrow
**CPT Code Pills**: Inline code+description, monospace font, subtle border
**EVV Status Indicators**: GPS check-in status (✓ Verified / ⚠ Missing / ⨯ Mismatch)
**Modifier Badges**: Small superscript badges for 95 (telehealth), 59 (procedural), etc.

---

## Responsive Behavior

- **Desktop (lg+)**: Full multi-column layouts, sidebar visible, inline detail panels
- **Tablet (md)**: 2-column grids, collapsible sidebar, modal detail views
- **Mobile (base)**: Single column, bottom navigation, full-screen modals

---

## Accessibility Standards

- ARIA labels on all interactive elements
- Keyboard navigation for all actions (Tab, Enter, Esc)
- Focus visible states (ring-2 ring-offset-2)
- Color is never the only indicator (use icons + text)
- Min contrast ratio 4.5:1 for text
- Screen reader announcements for real-time alerts

---

## Images

**No hero images** - This is a data-focused enterprise dashboard application. All visual content is data-driven (charts, graphs, maps, network diagrams).

**Icons**: Use Heroicons throughout for consistency (outline style for navigation, solid for inline indicators)

---

## Animation Guidelines

**Minimal, purposeful animations only**:
- Page transitions: 150ms ease-in-out
- Modal/panel slide-ins: 200ms ease-out
- Data loading: Subtle skeleton screens or shimmer effect
- Real-time data updates: Gentle fade-in (300ms) for new alert cards
- **No**: Hover effects beyond standard button states, decorative animations, scroll-triggered effects

---

## Executive Dashboard Layout

**Top Row**: 4 metric cards (Total FWA Detected, Recovery Rate, Active Investigations, High-Risk Claims)

**Second Row**: 2-column split
- Left: Real-time alerts feed (scrollable, max 5 visible)
- Right: Risk score distribution chart

**Third Row**: Fraud by category pie chart (left 1/3) + Detection timeline trend line (right 2/3)

**Fourth Row**: Interactive heatmap (full width)

**Fifth Row**: Top risk providers table (sortable, paginated)

Each use case (Claim Anomaly, EVV, Provider, Utilization) gets similar structured layouts with use-case-specific visualizations and drill-down tables.