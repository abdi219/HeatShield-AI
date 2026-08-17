# HeatShield AI
## Product Requirements Document (PRD) — Hackathon Edition

**Document Version:** 2.0  
**Target Event:** FortyGuard Hackathon 2026 — Track 1: Resilient Cities & Infrastructure  
**Development Window:** August 18–30, 2026  
**Team Size:** 2  
**Product Type:** Web Application  
**Primary Objective:** Build a polished, functional hackathon prototype that uses FortyGuard's street-level temperature data to help users detect, understand, avoid, and reduce urban heat.

---

# 1. Product Overview

HeatShield AI is a spatial intelligence web application that transforms street-level temperature data into practical decisions for individuals, planners, businesses, and other decision-makers.

Traditional weather applications provide broad regional temperatures. HeatShield focuses on the fact that heat can vary significantly between individual streets and locations because of factors such as pavement, buildings, shade, and surrounding infrastructure.

HeatShield AI uses FortyGuard's available street-level temperature data to:

1. Detect where heat is concentrated.
2. Help users understand local heat conditions.
3. Help people choose routes with lower estimated heat exposure.
4. Allow decision-makers to explore potential heat-mitigation interventions.

The product follows a simple framework:

**Detect → Understand → Avoid → Reduce**

The project is being developed specifically for the FortyGuard Hackathon and must prioritize a working, visually compelling, technically credible demonstration over unnecessary feature complexity.

---

# 2. Problem Statement

Existing weather applications generally communicate temperature at a city or regional level.

This creates a gap between:

**"What is the temperature in my city?"**

and:

**"How hot is the specific street I am standing on, and what should I do about it?"**

HeatShield addresses this gap by combining detailed temperature data with maps, routing, scoring, AI interpretation, and simulation.

The application should transform raw environmental data into information that is understandable and actionable.

---

# 3. Product Goals

## Primary Goals

- Integrate FortyGuard's temperature API into a functional web application.
- Visualize available street-level heat information clearly.
- Provide meaningful location-level heat analysis.
- Provide heat-aware route comparison.
- Create a transparent HeatShield Score for routes.
- Provide a What-If mitigation simulation.
- Use AI to interpret available data rather than simply adding an unrelated chatbot.
- Deliver a polished and memorable hackathon demonstration.
- Ensure all major functionality works reliably within the supported geographic coverage.

## Secondary Goals

- Provide downloadable heat reports.
- Provide configurable heat alerts.
- Provide documentation explaining the product and its technology.
- Create a polished public-facing website suitable for hackathon judging.

---

# 4. Target Users

## 4.1 Everyday Users

People who want to understand local heat conditions or choose a route with lower estimated heat exposure.

Potential use cases include:

- Walking
- Cycling
- Commuting
- Outdoor activities
- Local travel

## 4.2 Urban Planners

Users who need to identify high-heat areas and explore possible mitigation strategies.

## 4.3 Property and Building Managers

Users who want to investigate heat around properties and explore potential interventions.

## 4.4 Businesses and Logistics Organizations

Potential future users that may benefit from heat-aware routing and location analysis.

---

# 5. Core Product Architecture

The product should consist of the following major layers:

### Data Layer

FortyGuard street-level temperature data.

### Mapping Layer

Interactive map visualization and geographic interaction.

### Analysis Layer

Heat analysis, Heat Risk Score, route analysis, and HeatShield Score.

### Simulation Layer

Model-based What-If mitigation calculations.

### Intelligence Layer

AI interpretation and contextual assistance.

### Presentation Layer

Interactive web interface, reports, documentation, and supporting pages.

---

# 6. Technical Architecture

Proposed architecture:

```text
User
  |
  v
React + Tailwind + Mapbox GL JS
  |
  v
Serverless API / Backend Layer
  |
  +---- FortyGuard Temperature API
  |
  +---- Mapbox Directions API
  |
  +---- AI Provider
  |
  +---- Supabase
```

## Frontend

- React
- Tailwind CSS
- Mapbox GL JS
- Lucide React or equivalent icon system

## Backend

- Node.js where required
- Vercel Serverless or Edge Functions where appropriate

## Database

Supabase PostgreSQL for:

- User profiles where required
- Saved locations
- Alert configurations
- Simulation history
- Other persistent application data

## Spatial Data

FortyGuard Temperature API.

The application must respect FortyGuard's actual geographic coverage and API limitations.

## Routing

Mapbox Directions API or another approved routing mechanism supported by the implementation.

## AI

Potential providers include:

- Groq
- Google Gemini
- Another suitable model supported by the project architecture

The final AI provider should be selected based on reliability, availability, rate limits, and hackathon requirements.

## Deployment

Vercel or another suitable production deployment platform.

The public application should be accessible to hackathon judges without unnecessary authentication barriers.

---

# 7. Core Feature Requirements

# 7.1 Live Microclimate Heat Map

The Heat Map is the primary geographic interface of HeatShield AI.

## Requirements

Users must be able to:

- Search for a supported U.S. location.
- Navigate the interactive map.
- Drop or select a location.
- View available street-level temperature information.
- Visually distinguish different heat levels.
- Select locations or map regions for additional information.

The application should present:

- Temperature information
- Heat Risk Score
- Relevant contextual information
- Data freshness where available

The heat visualization must be based on actual FortyGuard data rather than fabricated values.

## Heat Risk Score

The Heat Map may provide a location-level Heat Risk Score from 0–100.

The score should be calculated using defined and documented variables rather than generated arbitrarily by an AI model.

Potential inputs include:

- Ground temperature
- Local baseline comparison
- Available environmental indicators
- Built-environment information where legitimately available

The final formula must be documented in the implementation.

---

# 7.2 Cool Route Finder

The Cool Route Finder provides heat-aware navigation.

## User Flow

The user provides:

- Starting location
- Destination

The application obtains available route options and evaluates heat conditions along those routes.

## Route Comparison

The application should distinguish between:

- Fastest route
- Heat-aware recommended route

The comparison should include relevant metrics such as:

- Travel time
- Distance
- Estimated heat exposure
- HeatShield Score

The recommended route should balance travel efficiency with lower estimated heat exposure rather than automatically selecting the longest or coldest route.

## Data Processing

Route coordinates should be evaluated against available FortyGuard temperature information.

The implementation must clearly communicate when heat data is unavailable or incomplete along a route.

---

# 7.3 What-If Mitigation Simulator

The What-If Simulator is a sandbox for exploring possible heat-mitigation interventions.

It is primarily targeted toward:

- Urban planners
- Property managers
- Businesses
- Decision-makers

## Supported Intervention Categories

The initial implementation may include:

- Canopy trees
- Shade structures
- Cool roofs
- Solar canopies

## Requirements

Users should be able to select or configure interventions within a selected area.

The system should compare:

**Baseline Scenario**

against:

**Simulated Scenario**

The simulator should present estimated effects using predefined, transparent assumptions.

## Important Requirement

Simulation results must be clearly labeled as **estimates or model outputs**.

The application must not represent simulated temperature reductions, energy savings, or health outcomes as guaranteed real-world results unless supported by appropriate validated data or methodology.

The AI must not invent simulation values.

---

# 8. HeatShield Score Engine

The HeatShield Score is the application's route-specific exposure index.

It should provide a 0–100 score representing the estimated heat exposure associated with a route.

## Potential Variables

The score may incorporate:

- Temperature along route segments
- Duration spent on hotter segments
- Route distance
- Relative heat intensity
- Availability of lower-heat alternatives

The exact mathematical formula must be deterministic and documented.

The score should be consistent for the same input conditions.

The score should not simply be generated by an LLM.

---

# 9. Heat Risk Score vs HeatShield Score

These two metrics must remain separate.

| Metric | Scope | Purpose |
|---|---|---|
| Heat Risk Score | Location or area | Communicate the heat condition of a selected location |
| HeatShield Score | Route | Communicate estimated heat exposure associated with a travel route |

### Heat Risk Score

Answers:

> How concerning is the heat at this location?

### HeatShield Score

Answers:

> How much heat exposure is associated with this route compared with alternatives?

The UI must clearly distinguish these metrics so users do not confuse them.

---

# 10. AI Heat Assistant

The AI Heat Assistant provides natural-language interpretation of HeatShield's data.

Users may ask questions about:

- Local heat conditions
- Route comparisons
- Heat-risk information
- Possible mitigation strategies
- Information displayed on the map
- Simulation results

The assistant should use the application's available data and context.

## AI Requirements

The AI must:

- Avoid inventing temperatures.
- Avoid inventing FortyGuard data.
- Avoid inventing route information.
- Avoid presenting simulations as factual measurements.
- Avoid unsupported medical claims.
- Clearly distinguish measured data from estimates.
- Explain uncertainty when information is incomplete.
- Prefer application data over generic assumptions when answering questions about a selected location.

The AI is an interpretation and decision-support layer, not the source of the underlying environmental measurements.

---

# 11. Downloadable Heat Reports

Users should be able to generate a structured report from analyzed information.

The report may contain:

- Selected location
- Heat conditions
- Heat Risk Score
- High-heat areas
- Route comparison
- HeatShield Score
- What-If simulation results
- AI-generated interpretation
- Relevant assumptions and limitations

The report should clearly distinguish:

- Actual data
- Calculated scores
- Model estimates

PDF generation is considered a secondary feature and should not delay the core MVP.

---

# 12. Heat Alerts

Users may save locations and configure heat thresholds.

When available data crosses a configured threshold, the system may generate an alert.

Potential alert information includes:

- Location
- Current available temperature
- Configured threshold
- Alert timestamp

Alerts should only be implemented if the available API and backend infrastructure can support reliable monitoring.

Heat Alerts are a stretch feature and should not compromise the core hackathon demonstration.

---

# 13. Public Website Structure

The product should not consist only of the application dashboard.

The public website should contain:

## Landing Page

Purpose:

- Explain the problem.
- Introduce HeatShield AI.
- Explain the core product concept.
- Communicate the FortyGuard integration.
- Provide a clear entry point into the application.
- Support the hackathon pitch.

## Application

The main interactive HeatShield experience containing the map, analysis, routing, simulation, and AI functionality.

## Documentation Page

A dedicated documentation area should explain:

- What HeatShield AI does
- How the system works
- FortyGuard integration
- Heat data methodology
- Heat Risk Score methodology
- HeatShield Score methodology
- Routing methodology
- What-If simulation methodology
- AI behavior
- Data limitations
- Technical architecture
- Privacy and security considerations

The documentation should use strong visual communication and full relevant visualizations where appropriate rather than being a wall of plain text.

## FAQ Section

The website should include a clear FAQ section addressing common questions about:

- HeatShield AI
- FortyGuard data
- Heat scores
- Routing
- Simulation estimates
- Supported locations
- Data limitations
- AI behavior

## 404 Page

A custom 404 page must exist.

It should maintain the application's visual identity and provide a clear path back to the main application or landing page.

---

# 14. UI/UX and Visual Design Requirements

The design is a major component of the hackathon submission because the project must be visually compelling during judging.

The website must feel like a **purpose-built product**, not a generic AI-generated website.

## Design Direction

The interface should be:

- Minimal
- Aesthetic
- Distinctive
- Professional
- Modern
- Highly usable
- Visually coherent
- Information-focused

## Strict Design Restrictions

The website must NOT use:

- Generic AI-generated website aesthetics
- Generic templates
- Gradient-heavy interfaces
- Neon visual effects
- Glow effects
- Generic color palettes
- Generic typography
- Generic animations
- Generic transitions
- Excessive motion
- Oversized headline typography
- Bubble-style headlines
- Multi-colored text as a visual gimmick
- Excessive decorative elements
- Unnecessary cards everywhere
- Visually repetitive dashboard components
- Stock-looking visual patterns
- Copy-pasted SaaS design patterns

The design must avoid looking like a standard AI startup landing page or generic Tailwind template.

## Typography

Typography should be carefully selected and distinctive while remaining highly readable.

The project should avoid default or overused generic website typography.

## Color

The color system must be intentional and restrained.

Heat-related colors should be used primarily where they communicate actual heat information rather than as arbitrary decoration.

The application should avoid unnecessary multi-color visual styling.

## Data Presentation

Data visualization is one of the defining characteristics of HeatShield AI.

Information should be presented through thoughtful, purpose-built visualizations rather than simply placing numbers inside generic cards.

Every major data type should have an appropriate and distinctive presentation.

This includes:

- Temperature
- Heat Risk Score
- HeatShield Score
- Route exposure
- Heat distribution
- Simulation results
- Location comparisons
- Reports
- AI insights

The presentation should prioritize clarity while maintaining a distinctive visual identity.

## Consistency

The landing page, application, documentation, FAQ, reports, and 404 page must feel like parts of the same product.

However, individual pages should have appropriate layouts rather than repeating the exact same component structure everywhere.

## Interaction Design

Interactions and transitions should be purposeful and subtle.

Animations should communicate:

- State changes
- Data updates
- Navigation
- Spatial interaction
- User feedback

They must not exist merely as decoration.

## Responsive Design

The application should work across:

- Desktop
- Laptop
- Tablet
- Mobile where technically practical

The primary hackathon demonstration should be optimized for desktop because the map and data visualizations are central to the experience.

## Accessibility

The interface should provide:

- Sufficient text readability
- Clear interactive states
- Keyboard-accessible controls where practical
- Meaningful labels
- Non-color-dependent communication where possible
- Clear error messages

---

# 15. Application States and Error Handling

The application must account for real-world failures.

Required states include:

## No Data

When FortyGuard does not provide data for a selected area, the application must clearly communicate that the location is unsupported or currently unavailable.

## API Failure

If FortyGuard or another external service fails, the application must provide a useful error state rather than displaying fabricated information.

## Route Failure

If no usable route is available, the user should receive a clear explanation.

## AI Failure

If the AI service is unavailable, the rest of the application should remain usable where possible.

## Loading State

Data-intensive operations must provide clear loading feedback.

## Partial Data

If only part of a route or area has available heat data, the application must communicate the limitation rather than implying complete coverage.

---

# 16. Data Integrity and Methodology

HeatShield must distinguish between:

### Measured Data

Information obtained directly from FortyGuard or another authoritative data provider.

### Calculated Data

Information mathematically derived from measured data.

Examples include:

- Heat Risk Score
- HeatShield Score
- Route exposure calculations

### Simulated Data

Information produced by the What-If model.

These must be explicitly labeled as estimates.

### AI-Generated Information

Natural-language explanations generated using available application context.

These must not override the underlying measured or calculated data.

---

# 17. Geographic Scope

The application should initially focus on geographic areas supported by FortyGuard.

The current architecture assumes U.S. geographic coverage.

The application must not imply global availability if the underlying data does not support it.

Location search should communicate geographic limitations clearly.

---

# 18. Database Requirements

Supabase PostgreSQL may contain the following tables:

```sql
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT DEFAULT 'pedestrian'
    CHECK (role IN ('pedestrian', 'planner', 'enterprise')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.saved_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  location_name TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  alert_threshold_celsius NUMERIC(4,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.simulation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  location_name TEXT NOT NULL,
  baseline_temp_celsius NUMERIC(4,2) NOT NULL,
  intervention_type TEXT NOT NULL,
  simulated_temp_reduction NUMERIC(4,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

The database schema may be simplified if authentication, saved locations, or alerts are not required for the MVP.

The architecture should not introduce unnecessary database complexity solely for the sake of the PRD.

---

# 19. Authentication Strategy

The public hackathon application should be accessible to judges without requiring authentication for the primary demonstration.

Authentication may be introduced for optional features such as:

- Saved locations
- Personalized alerts
- User history
- Simulation history

Authentication should therefore be considered secondary to the core public experience.

---

# 20. MVP Definition

The MVP must prioritize the following:

### Priority 1

- FortyGuard API integration
- Interactive Heat Map
- Location-level heat information
- Heat Risk Score

### Priority 2

- Cool Route Finder
- Route heat analysis
- HeatShield Score

### Priority 3

- What-If Simulator
- At least a small number of well-implemented interventions

### Priority 4

- AI Heat Assistant

These features form the primary hackathon demonstration.

---

# 21. Stretch Features

The following features should only be implemented after the core MVP is stable:

- Downloadable Heat Reports
- Heat Alerts
- Saved locations
- User accounts
- Simulation history
- Advanced planner functionality

A partially completed stretch feature must never take priority over a reliable core feature.

---

# 22. Demo Requirements

The final hackathon demonstration should show a complete end-to-end workflow.

The demonstration should prove that:

1. FortyGuard data is actually integrated.
2. The heat map displays real available data.
3. A location can be analyzed.
4. A Heat Risk Score can be generated.
5. A route can be analyzed.
6. The HeatShield Score can compare route exposure.
7. A What-If scenario can be executed.
8. The AI can interpret application data.
9. The interface is polished and usable.

The demo should prioritize **working functionality and visual clarity** rather than presenting a large number of unfinished features.

---

# 23. Security Requirements

## API Keys

All private API keys must be stored using environment variables or secure deployment secrets.

Keys must never be committed to GitHub.

Examples:

```text
.env.local
Vercel Environment Variables
```

## Repository

The public repository should contain:

- `.env.example`
- Setup instructions
- Required environment variable documentation
- API integration documentation
- Sample request/response structure where permitted
- Project architecture documentation

Actual secrets must never appear in the repository.

## Client Security

Private API keys should not be exposed directly to the browser when the provider requires server-side protection.

External API requests should be routed through the appropriate backend/serverless layer where necessary.

---

# 24. API Reliability

The application should handle:

- Rate limits
- API errors
- Network failures
- Missing data
- Invalid coordinates
- Unsupported locations

Caching may be used where appropriate to reduce unnecessary external requests and improve performance.

The implementation must respect FortyGuard's hackathon API terms and rate limitations.

---

# 25. Performance Requirements

The application should prioritize fast interaction for the main demonstration.

Important performance areas include:

- Initial map loading
- Heat data loading
- Route calculation
- Heat analysis
- Simulation calculations
- AI responses

Large datasets should not be unnecessarily loaded into the browser.

The application should use appropriate geographic filtering and data processing.

---

# 26. 14-Day Development Plan

## Days 1–2: Foundation

- Repository setup
- React project setup
- Tailwind setup
- Mapbox setup
- Vercel setup
- FortyGuard API investigation and integration
- Environment variables
- Basic architecture

## Days 3–4: Heat Map

- Heat data retrieval
- Heat visualization
- Location selection
- Temperature display
- Heat Risk Score

## Days 5–7: Routing

- Start/destination inputs
- Mapbox route integration
- Route visualization
- FortyGuard route temperature analysis
- HeatShield Score
- Fastest vs heat-aware route comparison

## Days 8–9: Simulator

- Simulation architecture
- Intervention controls
- Baseline vs simulated comparison
- Model assumptions
- Results visualization

## Days 10–11: AI and Documentation

- AI Heat Assistant
- Context-aware prompts
- AI accuracy constraints
- Documentation page
- FAQ
- Public website refinement

## Day 12: Production

- Vercel deployment
- Environment configuration
- Error handling
- Security audit
- API key audit
- Incognito testing
- Cross-browser testing

## Day 13: Polish

- UI/UX refinement
- Data visualization refinement
- Performance improvements
- Responsive testing
- 404 page
- Final bug fixing

## Day 14: Submission

- Final testing
- Repository cleanup
- README
- Demo preparation
- Pitch video
- Hackathon submission

Stretch features such as alerts and PDF reports should only be added if the core product is already stable.

---

# 27. Team Development Strategy

The project is being developed by a two-person team.

Work should be divided by major technical responsibilities while maintaining shared ownership of architecture, testing, and the final product.

Possible division:

### Developer 1

- Backend
- FortyGuard integration
- Route analysis
- HeatShield Score
- Simulation logic
- AI integration

### Developer 2

- Frontend
- Map interface
- Data visualization
- User flows
- Simulator interface
- Public website
- Documentation and visual polish

Both developers should collaborate on:

- Architecture
- Testing
- Debugging
- Product decisions
- Demo
- Final submission

---

# 28. Success Criteria

HeatShield AI will be considered successful for the hackathon if:

- FortyGuard data is visibly and correctly integrated.
- Users can explore street-level heat.
- Users can analyze routes based on heat.
- HeatShield Score provides a clear route comparison.
- The What-If Simulator works using transparent assumptions.
- AI provides useful contextual interpretation.
- The application handles unsupported or failed requests gracefully.
- The interface is distinctive, polished, and easy to understand.
- The public deployment works without unnecessary authentication.
- The project can be demonstrated clearly within the hackathon pitch.

---

# 29. Product Principles

The entire product should follow these principles:

### Real Data First

Actual environmental data should be prioritized over generated assumptions.

### Explainable Intelligence

Scores and simulations should have understandable methodologies.

### Useful Over Decorative

Every feature should help the user understand heat or make a decision.

### Visual but Not Generic

The interface should make complex spatial data understandable without relying on generic AI-generated design patterns.

### Honest Estimates

Simulations and predictions must clearly communicate uncertainty.

### Focused MVP

A smaller number of polished features is preferable to many incomplete features.

### Hackathon Ready

The product should optimize for:

- Functionality
- Innovation
- Visual quality
- Technical credibility
- Clear storytelling
- Demo reliability

---

# 30. Final Product Definition

HeatShield AI is a street-level heat intelligence platform built around the following experience:

**Detect**

Users see where heat is concentrated through FortyGuard-powered spatial visualization.

**Understand**

Heat Risk Scores and the AI assistant help users interpret the available data.

**Avoid**

The Cool Route Finder compares travel options and uses the HeatShield Score to identify routes with lower estimated heat exposure.

**Reduce**

The What-If Simulator allows decision-makers to explore potential interventions and compare model-based scenarios.

Supporting functionality such as reports, alerts, saved locations, documentation, and FAQs extends the product without changing its central purpose.

The final product should feel like a **complete, distinctive environmental intelligence application**, not simply a weather map with an AI chatbot.

The primary objective of the FortyGuard Hackathon implementation is to demonstrate that detailed street-level temperature data can be transformed into an understandable and actionable product for both individuals and urban decision-makers.

**Core Product Loop:**

**Detect → Understand → Avoid → Reduce**

---

# 31. Hackathon Scope Rule

This project is being developed specifically for a **14-day hackathon sprint**.

The team must not expand the scope simply for the sake of adding features.

Any new feature must satisfy at least one of the following:

- Strengthens the core HeatShield concept.
- Demonstrates meaningful use of FortyGuard data.
- Improves the user decision-making experience.
- Improves the hackathon demonstration.
- Provides meaningful technical differentiation.

If a feature does not satisfy these criteria, it should not be prioritized during the hackathon.

The final submission should favor **a highly polished, reliable, distinctive core experience over excessive functionality.**