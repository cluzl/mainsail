# Graph Report - ratrig3-mainsail-forge (2026-07-27)

## Corpus Check

- 619 files · ~343,427 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary

- 165 nodes · 215 edges · 10 communities (4 shown, 6 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness

- Built from commit: `809ce2de`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)

- App
- ForgePanelMixin
- ForgeMotionPanel
- ForgeHealthPanel
- ForgeJobPanel
- ForgeMacrosPanel
- ForgeThermalPanel
- ForgeOutputsPanel
- forgeDashboardLayout.spec.ts
- Component

## God Nodes (most connected - your core abstractions)

1. `App` - 35 edges
2. `ForgeMotionPanel` - 28 edges
3. `ForgeHealthPanel` - 24 edges
4. `ForgeJobPanel` - 22 edges
5. `ForgePanelMixin` - 15 edges
6. `ForgeThermalPanel` - 10 edges
7. `ForgeMacrosPanel` - 7 edges
8. `ForgeOutputsPanel` - 6 edges
9. `ForgeCameraPanel` - 5 edges
10. `formatDuration()` - 4 edges

## Surprising Connections (you probably didn't know these)

- None detected - all connections are within the same source files.

## Import Cycles

- None detected.

## Communities (10 total, 6 thin omitted)

### Community 0 - "App"

Cohesion: 0.08
Nodes (3): App, Component, Watch

### Community 1 - "ForgePanelMixin"

Cohesion: 0.15
Nodes (8): ForgePanelMixin, Component, MiscItem, buildBabystep(), buildOutputCommand(), clampTarget(), formatDuration(), formatFilament()

### Community 5 - "ForgeMacrosPanel"

Cohesion: 0.14
Nodes (6): ForgeCameraPanel, Component, ForgeMacrosPanel, Component, PageDashboard, Component

### Community 6 - "ForgeThermalPanel"

Cohesion: 0.20
Nodes (3): Component, ForgeThermalPanel, ThermRow

## Knowledge Gaps

- **3 isolated node(s):** `ThermRow`, `MiscItem`, `dashboard`
  These have ≤1 connection - possible missing edges or undocumented components.
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions

_Questions this graph is uniquely positioned to answer:_

- **Why does `ForgeMotionPanel` connect `ForgeMotionPanel` to `ForgePanelMixin`, `ForgeMacrosPanel`?**
  _High betweenness centrality (0.214) - this node is a cross-community bridge._
- **Why does `ForgeHealthPanel` connect `ForgeHealthPanel` to `ForgeMacrosPanel`?**
  _High betweenness centrality (0.185) - this node is a cross-community bridge._
- **Why does `ForgeJobPanel` connect `ForgeJobPanel` to `ForgePanelMixin`, `ForgeMacrosPanel`?**
  _High betweenness centrality (0.167) - this node is a cross-community bridge._
- **What connects `ThermRow`, `MiscItem`, `dashboard` to the rest of the system?**
  _3 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `App` be split into smaller, more focused modules?**
  _Cohesion score 0.08258258258258258 - nodes in this community are weakly interconnected._
- **Should `ForgeMotionPanel` be split into smaller, more focused modules?**
  _Cohesion score 0.07407407407407407 - nodes in this community are weakly interconnected._
- **Should `ForgeHealthPanel` be split into smaller, more focused modules?**
  _Cohesion score 0.09486166007905138 - nodes in this community are weakly interconnected._
