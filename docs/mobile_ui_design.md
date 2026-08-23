# HeatShield AI — Mobile & Responsive UI/UX Design Specification

> **Document:** `mobile_ui_design.md`  
> **Status:** Draft / Active Implementation Guide  
> **Scope:** Mobile (XS / S), Tablet (M), and Responsive Adaptive Layout Strategy  
> **Aesthetic Standard:** Pure Obsidian Glass (`bg-[#0B0F17]`), High-Contrast Monochrome, Zero-Clutter Thumb Ergonomics.

---

## 1. Executive Summary & Philosophy

Mobile devices account for over **60% of real-world pedestrian and field usage**. A user walking down a baking city sidewalk needs immediate, glanceable answers without pinched layouts, overlapping panels, or tiny touch targets.

### Core Mobile Principles:
1. **Map-First Priority:** The interactive microclimate map is the primary canvas; interface controls must float elegantly and never permanently block the viewport.
2. **Thumb-Zone Navigation:** Critical actions (tab switches, route triggers, AI prompts) must sit within the lower 40% of the screen.
3. **Progressive Disclosure & Collapsible Sheets:** Dense analytics (albedo breakdowns, route turn-by-turns, simulation controls) live in smooth bottom swipe sheets rather than static intrusive sidebars.
4. **Adaptive Viewport Scaling:** Strict zero-horizontal-scroll enforcement across Extra Small ($<380\text{px}$), Small ($380\text{–}640\text{px}$), and Tablet ($640\text{–}1024\text{px}$) devices.

---

## 2. Responsive Breakpoint Matrix

| Device Tier | Viewport Width | Navigation Mode | Drawer / Sheet Strategy | Legend / HUD |
| :--- | :--- | :--- | :--- | :--- |
| **Extra Small (XS)** | $<380\text{px}$ (iPhone SE, Galaxy A) | Floating Bottom Tab Bar | Fullscreen Slide-Up Sheet (`92vh`) | Minimized floating badge |
| **Small Mobile (S)** | $380\text{px} \text{–} 640\text{px}$ (iPhone 13–15, Pixel) | Floating Bottom Tab Bar | Bottom Sheet (`75vh` collapsible) | Minimized floating badge |
| **Tablet (M)** | $640\text{px} \text{–} 1024\text{px}$ (iPad, Galaxy Tab) | TopNav + Floating Pills | Left Floating Drawer (`420px`) | Bottom Floating Dock |
| **Desktop (L / XL)** | $\ge 1024\text{px}$ (Laptops, 4K Monitors) | Full Desktop TopNav HUD | Left Sidebar Drawer (`440px` / `840px`) | Center-Bottom Legend Bar |

---

## 3. Component-by-Component Mobile Strategy

### 📱 3.1. Navigation HUD (`TopNav` $\rightarrow$ Bottom Tab Dock on Mobile)
- **The Problem on Mobile:** TopNav currently contains Search, 4 Navigation Tabs, Live Weather Badge, City Selector, C/F Toggle, and AI Assistant button—causing horizontal overflow or tight crowding on mobile screens.
- **The Mobile Solution:**
  - **Top Floating Header (Mobile):** Minimalist top bar containing:
    - Logo + Clean City Selector dropdown.
    - Quick Search icon button (expands full search bar on tap).
    - Unit toggle (°C / °F).
  - **Bottom Mobile Navigation Dock (Mobile):** A sleek, thumb-friendly floating dock pinned to the bottom:
    - `[ 🗺️ Map ]` • `[ 🛡️ Routes ]` • `[ 🔬 Simulator ]` • `[ 🤖 AI Copilot ]` • `[ 📚 Docs ]`

---

### 📍 3.2. Location Inspection Card (`app/page.tsx`)
- **Desktop:** Floating card anchored in bottom-right corner (`w-80`).
- **Mobile Adaptation:**
  - When a user taps any location on the map, it renders as a **Bottom Slide-Up Pill**:
    - **Collapsed State (Height 70px):** Street Name, Heat Risk Score (HRS) number badge, and "View Analysis" button.
    - **Expanded State (Swipe Up):** Full surface albedo penalty, canopy deficit, temperature breakdown, and direct "Consult AI" button.
  - Tapping outside or swiping down smoothly dismisses the card.

---

### 🛡️ 3.3. Cool Route Finder (`RouteFinder.tsx`)
- **Desktop:** Left-hand floating drawer (`w-[420px]`).
- **Mobile Adaptation:**
  - When active, opens as a **Responsive Bottom Sheet** (`h-[80vh]` max) with smooth drag handle.
  - Input fields (Origin & Destination) remain pinned at the top of the sheet.
  - Route comparison cards (Direct vs. Cool Route) stack cleanly with high-contrast text and big touch-friendly "Navigate" buttons.
  - "Close / Minimize" button lets the user fold the panel down to inspect the map route lines freely.

---

### 🔬 3.4. What-If Mitigation Simulator (`WhatIfSimulator.tsx`)
- **Desktop:** Left-hand floating drawer (`w-[440px]`).
- **Mobile Adaptation:**
  - Renders as a **Collapsible Bottom Control Sheet**:
    - **Top Bar:** Shows Active Intervention type & Dynamic Cooling Result ($\Delta T = -3.4^\circ\text{C}$).
    - **Control Body:** Touch-optimized range sliders with generous thumb handles ($44\text{px}$ touch target) for Tree Canopy %, Cool Pavement Albedo, and Shading.
    - "Minimize" button allows full-screen inspection of the thermal mitigation contour circles on the map.

---

### 🤖 3.5. AI Assistant Copilot (`AIAssistantDrawer.tsx`)
- **Desktop:** Right-hand slide-out drawer (`w-[460px]` / `840px`).
- **Mobile Adaptation:**
  - Opens as a **Fullscreen Bottom-Up Sheet** (`h-[92vh]`) with a top drag handle and close `✕` button.
  - Multi-session history dropdown adapts to a compact modal menu.
  - Suggestion pills render as a horizontally scrollable single line with touch snap.
  - Input text box and send button are pinned above the mobile keyboard.

---

### 📚 3.6. Documentation & Pitch Showcase (`DocsShowcase.tsx`)
- **Mobile Adaptation:**
  - Modal fills `w-[94%]` and `max-h-[85vh]` centered on screen with hidden scrollbars.
  - Interactive "City vs Street" split slider scales down to `h-24` with easy touch drag.
  - Section tabs (`Overview`, `Solutions`, `Methodology`, `FAQ`) remain accessible at the top.
  - Formula sliders feature generous padding for accurate thumb control.

---

### 🗺️ 3.7. Map Canvas & Layer Controls (`MapCanvas.tsx`)
- **Mobile Adaptation:**
  - Move Layer Toggle pills (`Surface Temp`, `Heat Risk`, `Canopy Deficit`, `Pavement Albedo`) to a compact floating speed-dial button or top-right stack.
  - Thermal Scale Legend collapses into a clean bottom-left expandable chip so it never overlaps the bottom navigation dock.
  - Mapbox zoom controls positioned safely away from bottom thumb navigation.

---

## 4. Touch Target & Accessibility Guidelines

1. **Minimum Touch Size:** All interactive buttons, chips, and sliders must satisfy the **$44\text{px} \times 44\text{px}$** Apple HIG and Android WCAG touch target guideline.
2. **Safe Area Insets:** Account for `env(safe-area-inset-bottom)` and `env(safe-area-inset-top)` on modern iPhones and edge-to-edge Android devices.
3. **No Accidental Map Drags:** When interacting with sliders or bottom sheets, prevent touch events from propagating down to the Mapbox canvas (`e.stopPropagation()`).
4. **Haptic & Visual Feedback:** High-contrast active states (`active:scale-95 transition-transform`) for all mobile buttons.

---

## 5. Implementation Plan

```
┌────────────────────────────────────────────────────────────────────────┐
│                   MOBILE & RESPONSIVE EXECUTION PLAN                   │
├────────────────────────────────────────────────────────────────────────┤
│  1. Mobile Bottom Dock Navigation & Streamlined TopNav Header          │
│  2. Collapsible Mobile Bottom Sheet for Location Heat Inspector        │
│  3. Responsive Slide-Up Drawer for Cool Route Finder                   │
│  4. Touch-Optimized What-If Simulator Sliders & Minimize Controls       │
│  5. Fullscreen Mobile Copilot Drawer with Safe Area Insets             │
│  6. Compact Layer Toggle Speed-Dial & Collapsible Legend               │
└────────────────────────────────────────────────────────────────────────┘
```
