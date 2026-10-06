# GCC Portfolio & Footprint Modeller

A local web application for capturing an enterprise portfolio (projects, applications, roles and teams) and assessing each item from the global HQ perspective to decide what belongs in a Global Capability Centre (GCC).

## Run locally

```bash
npm install
npm run dev
```

Then open http://localhost:5173.

Production build:

```bash
npm run build      # outputs to dist/
npm run preview    # serves the production build
```

## What it does

The sidebar is organised into four groups.

**Capture**
1. **Portfolio Capture** – dashboard with totals, capture tiles and recent activity.
2. **Projects / Applications / Roles / Workforce** – list pages with search and filters, plus a five-section capture form for each type (matching the reference designs). Forms validate required fields, save as draft, and hand off to the assessment.

**Assess**
3. **Assessment** – HQ-perspective rating of each item across Strategic Relevance & Complexity, Business Proximity, Delivery Characteristics, Risk & Compliance and Economic Considerations, then Review & Submit. Projects and applications use the single-page "Assessment Framework" layout; roles and teams step through one section at a time, as in the reference screens. Each criterion takes a Low / Medium / High / Very High rating with a rationale. Submitted assessments become read-only and can be reopened.
4. **Opportunity Map** – strategic value vs GCC feasibility quadrant chart for all submitted assessments, with filters, hover detail and quadrant summaries.

**Model**
5. **Footprint Designer** – maintain delivery locations (type, cost index relative to HQ, capacity, time zone) and allocate each assessed item's target FTE across them in a matrix. Shows current vs target FTE per location and the run-rate cost impact. "Apply defaults" seeds targets from the baseline scenario.
6. **Scenario Modeller** – named scenarios with a target hub, the share of FTE moved per recommendation, transition cost per FTE, ramp-up period, year-1 productivity dip, GCC overhead and horizon. Produces steady-state savings, one-time cost, payback, year-by-year and cumulative net benefit, and a side-by-side comparison of all scenarios. One scenario is marked as the baseline.
7. **Transition Planner** – define waves (start month, duration), assign items to waves with offset, duration, status and owner, and see a Gantt timeline. "Auto-plan" sequences Early Transition work first, then Capability Hub, then Hybrid.

**Insight**
8. **Reports** – KPI tiles, recommendation mix, headcount and spend breakdowns, status matrix and the full portfolio table. CSV export and print.
9. **Executive View** – one-page summary: portfolio KPIs, recommendation mix, current vs target footprint, the baseline scenario's business case, transition roadmap, top opportunities, key risks and next steps. Print to PDF.

**Settings** – multiple companies (each with its own portfolio, locations, scenarios and waves), user profile, currency, JSON export/import, reset to sample data.

### Scoring

Ratings map to 1–4. **Strategic value** is the mean of the Strategic Relevance section. **GCC feasibility** is the mean of the other four sections, with criteria that make work harder to move (proximity, risk, investment) inverted so higher always means more feasible. Items above 2.5 on both axes are *GCC Capability Hub* candidates; high feasibility with lower strategic value is an *Early Transition Candidate*; high value with low feasibility is *Retain at HQ / Hybrid*; the rest is *Optimise in Place*. See `src/lib/scoring.ts` and `src/data/framework.ts`.

### Cost model

Each item's cost per FTE is annual spend ÷ headcount. Its current blended cost index is the FTE-weighted average of its locations' cost indices, so the HQ-equivalent cost per FTE is cost per FTE ÷ blended index. Target cost = Σ (target FTE at location × HQ-equivalent cost × that location's index). Scenarios apply the same logic to the share of FTE moved to the target hub, deduct overhead, spread the one-time transition cost over the ramp-up years, and compute payback with costs committed at the start of each year and savings accruing monthly. See `src/lib/model.ts`.

## Data

All data is stored in the browser's `localStorage` under the key `gcc-modeller-state-v1`. The app ships with a sample portfolio for "Global Tech Co." (the examples from the reference screens plus six fully assessed items, seven locations, three scenarios, three waves and a partial footprint design) and a second company, "Northwind Pharma". Use **Settings → Portfolio Data** to export, import, reset or clear.

## Deployment

Pushing to `main` runs `.github/workflows/deploy.yml`, which builds the app with `BASE_PATH=/<repo>/` and publishes `dist/` to GitHub Pages. `404.html` is a copy of `index.html` so deep links work with client-side routing.

## Stack

Vite, React 18, TypeScript, React Router, lucide-react icons. No backend. Charts are hand-drawn SVG/HTML.

## Folder layout

```
src/
  components/   Layout (sidebar + top bar) and shared UI controls
  data/         dropdown options, assessment framework, sample data
  lib/          scoring, footprint/scenario/transition model, formatting
  pages/        one file per screen; forms/ holds the four capture forms
  store/        app state + localStorage persistence
```
