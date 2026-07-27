# Graph Report - ratrig3-mainsail-forge (2026-07-27)

## Corpus Check

- 619 files · ~343,345 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary

- 161 nodes · 217 edges · 9 communities (2 shown, 7 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness

- Built from commit: `0796fe85`
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

## God Nodes (most connected - your core abstractions)

1. `App` - 35 edges
2. `ForgeMotionPanel` - 28 edges
3. `ForgeHealthPanel` - 24 edges
4. `ForgeJobPanel` - 22 edges
5. `ForgePanelMixin` - 16 edges
6. `ForgeMacrosPanel` - 7 edges
7. `ForgeThermalPanel` - 7 edges
8. `ForgeOutputsPanel` - 6 edges
9. `ForgeCameraPanel` - 5 edges
10. `formatDuration()` - 4 edges

## Surprising Connections (you probably didn't know these)

- None detected - all connections are within the same source files.

## Import Cycles

- None detected.

## Communities (9 total, 7 thin omitted)

### Community 0 - "App"

Cohesion: 0.08
Nodes (3): App, Component, Watch

### Community 1 - "ForgePanelMixin"

Cohesion: 0.10
Nodes (13): ForgePanelMixin, Component, ForgeCameraPanel, Component, MiscItem, ThermRow, PageDashboard, Component (+5 more)

## Knowledge Gaps

- **3 isolated node(s):** `MiscItem`, `ThermRow`, `dashboard`
  These have ≤1 connection - possible missing edges or undocumented components.
- **7 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions

_Questions this graph is uniquely positioned to answer:_

- **Why does `ForgeMotionPanel` connect `ForgeMotionPanel` to `ForgePanelMixin`?**
  _High betweenness centrality (0.218) - this node is a cross-community bridge._
- **Why does `ForgeHealthPanel` connect `ForgeHealthPanel` to `ForgePanelMixin`?**
  _High betweenness centrality (0.189) - this node is a cross-community bridge._
- **Why does `ForgeJobPanel` connect `ForgeJobPanel` to `ForgePanelMixin`?**
  _High betweenness centrality (0.171) - this node is a cross-community bridge._
- **What connects `MiscItem`, `ThermRow`, `dashboard` to the rest of the system?**
  _3 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `App` be split into smaller, more focused modules?**
  _Cohesion score 0.08258258258258258 - nodes in this community are weakly interconnected._
- **Should `ForgePanelMixin` be split into smaller, more focused modules?**
  _Cohesion score 0.10338680926916222 - nodes in this community are weakly interconnected._
- **Should `ForgeMotionPanel` be split into smaller, more focused modules?**
  _Cohesion score 0.07692307692307693 - nodes in this community are weakly interconnected._
