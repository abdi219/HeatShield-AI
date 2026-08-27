# HeatShield AI
## Mobile & Responsive UI/UX Architecture Specifications

**Document Version:** 3.0  
**Target Event:** FortyGuard Hackathon 2026 — Track 1: Resilient Cities & Infrastructure  
**Scope:** Mobile (XS / S), Tablet (M), and Responsive Adaptive Layout Strategy  
**Aesthetic Standard:** Obsidian Satellite Glass, High-Contrast Monochrome, Zero-Clutter Thumb Ergonomics

---

## 1. Executive Summary & Philosophy

Mobile devices account for over 60% of real-world pedestrian and field usage. A user walking down an unshaded city sidewalk needs immediate, glanceable answers without pinched layouts, overlapping panels, or tiny touch targets.

### Core Mobile Principles:
1. **Map-First Priority:** The interactive microclimate map is the primary canvas; interface controls float elegantly and never permanently block the viewport.
2. **Thumb-Zone Navigation:** Critical actions (tab switching, route triggers, layer selections) sit within the lower 40% of the screen.
3. **Non-Overlapping Clearances:** Scrollable panels enforce a strict maximum height (`max-h-[calc(100vh-13.5rem)]`) and bottom margin (`mb-16 md:mb-0`) to maintain a clean visible gap above the floating bottom dock.
4. **Progressive Disclosure:** Dense analytics (albedo breakdowns, route turn-by-turns, simulation controls) live in collapsible cards with two-state glanceable pills and full expanded sheets.

---

## 2. Responsive Breakpoint Matrix

| Device Tier | Viewport Width | Navigation Mode | Drawer / Sheet Strategy | Legend / HUD |
| :--- | :--- | :--- | :--- | :--- |
| **Extra Small (XS)** | < 380px (iPhone SE, Galaxy A) | Floating Bottom Tab Dock | Collapsible Glass Panel (`max-h-[calc(100vh-13.5rem)]`) | Speed-Dial Floating Pill |
| **Small Mobile (S)** | 380px – 640px (iPhone 14–16, Pixel) | Floating Bottom Tab Dock | Collapsible Glass Panel (`max-h-[calc(100vh-13.5rem)]`) | Speed-Dial Floating Pill |
| **Tablet (M)** | 640px – 1024px (iPad, Tablet) | TopNav + Floating Bottom Dock | Left Floating Drawer (`350px – 410px`) | Compact Center Legend |
| **Desktop (L / XL)** | >= 1024px (Laptops, 4K Displays) | Full Desktop TopNav HUD | Left Sidebar Drawer (`350px – 410px`) | Full Center Legend Bar |

---

## 3. Component-by-Component Mobile Strategy

### 3.1 Top Navigation Bar & Floating Bottom Dock
* **Top Header (Mobile):** Minimalist top bar containing:
  * HeatShield AI Logo and active Pilot City Selector.
  * Search action button.
  * Unit toggle (°C / °F) and Basemap switcher (Street / Satellite).
* **Bottom Navigation Dock (Mobile):** A floating, thumb-friendly dock fixed at the bottom:
  * `[ Map ]` • `[ Routes ]` • `[ Simulator ]` • `[ AI Copilot ]` • `[ Docs ]`
  * Active tab highlighted with high-contrast indicator.

### 3.2 Mobile Speed-Dial Layers Pill
* Positioned in the bottom-left corner above the bottom dock.
* Tapping the pill expands a lightweight speed-dial popup containing:
  * Heat Layer toggle (Heat: ON / OFF).
  * Layer selector: Surface Temperature, Heat Risk Score, Tree Canopy Deficit.
* Automatically closes upon layer selection to maximize map viewing area.

### 3.3 Street-Level Telemetry Card
* When any location is tapped on the map:
  * **Collapsed State:** Displays street name, ground temperature, anomaly delta vs ambient, and Heat Risk Score badge.
  * **Expanded State (Tap Details):** Opens full breakdown of Surface Albedo penalty %, Vegetation Deficit penalty %, and exact coordinates.
  * Fixed with clean clearance above the bottom dock.

### 3.4 Cool Route Finder Drawer
* Input fields (Origin & Destination) pinned at top with pin-drop actions.
* Drops on the map automatically reverse-geocode to street names.
* Minimized mobile snapshot shows net cooling delta (`-28% Heat Exposure`) and quick route switcher.
* Expanded mode displays side-by-side comparison cards, turn-by-turn directions, thermal elevation profile, and report export.
* Height constrained to prevent overlap with the mobile bottom dock.

### 3.5 What-If Mitigation Simulator
* Top summary banner displays dynamic cooling result (`Delta T = -3.4°C`, `Delta HRS = -15`).
* Touch-friendly sliders with 44px touch targets for Tree Canopy %, Cool Pavement Albedo, Solar Canopy %, and Shade Sails.
* Visual comparison switcher: Mitigated View, Baseline View, Delta Heat.

### 3.6 Grounded AI Heat Copilot Drawer
* Full-height slide-over drawer (`z-index: 1200`) accessible directly from the mobile bottom dock.
* Suggestion prompt chips tailored to active street or route context.
* Auto-scrolling chat history with clean Markdown formatting and session management.

### 3.7 Microclimate Heat Advisory Banner
* Default state is a compact top micro-chip (`isMinimized: true`).
* Displays warning icon, temperature peak, and a `[Details]` expander button.
* Tapping `[Details]` smoothly opens the full advisory text and `[Cool Path]` shortcut.
