# Redesign Mainsail as an Apple-style Liquid Glass control interface

This ExecPlan is a living document. The sections `Progress`, `Surprises & Discoveries`, `Decision Log`, and `Outcomes & Retrospective` must be kept up to date as work proceeds. Repository guidance lives in `AGENTS.md`; this plan must follow it.

## Purpose / Big Picture

The current interface is a dense Vuetify dashboard with flat, opaque cards. After this change, the RatRig 3 operator will see a coherent source-built Liquid Glass interface: a translucent floating navigation layer, adaptive dark and light materials, restrained Apple-blue interaction color, consistent depth, readable typography, and a dashboard whose live state, camera, and critical controls are easier to scan. Existing Moonraker calls, printer controls, saved panel settings, localization, emergency-stop confirmation, and routes remain functional.

The result is visible by building this fork, deploying its `dist` contents to `/home/ratrig3/mainsail`, and opening `http://192.168.1.100`. A hard refresh must show the redesigned source UI without relying on `.theme/custom.css`.

## Progress

- [x] (2026-07-22 01:26 UTC+8) Inspected the live RatRig 3 dashboard and the user-supplied screenshot; confirmed the native theme attempt was only a reskin.
- [x] (2026-07-22 01:30 UTC+8) Forked `mainsail-crew/mainsail` to `cluzl/mainsail`, cloned it to `/Users/macminim4/workspace/mainsail-liquid-glass`, and created branch `feat/liquid-glass-dashboard` from upstream `develop`.
- [x] (2026-07-22 01:34 UTC+8) Read repository instructions, application shell, dashboard, sidebar, top bar, shared panel, and base styles; installed locked dependencies with `npm ci`.
- [x] (2026-07-22 01:54 UTC+8) Implemented the source-level adaptive Liquid Glass material system and application shell.
- [x] (2026-07-22 01:54 UTC+8) Improved dashboard hierarchy while preserving saved panel membership and existing handlers.
- [x] (2026-07-22 01:54 UTC+8) Ran formatting, lint, 22 unit tests, production build, iterative visual QA, and independent review; fixed the reviewer's CSS specificity finding.
- [x] (2026-07-22 01:55 UTC+8) Backed up the current deployed Mainsail, deployed the verified fork build, and disabled the old native CSS override.
- [x] (2026-07-22 01:55 UTC+8) Verified live desktop geometry, source asset hashes, no horizontal overflow, live values, Emergency Stop visibility, console state, and printer/service safety. Phone and tablet use the existing Mainsail breakpoint templates plus new 44px mobile controls.

## Surprises & Discoveries

- Observation: Mainsail already loads `.theme/custom.css` after application styles, so the old experiment would override a fork unless removed at deployment.
  Evidence: `App.vue` watches `customStylesheet` and appends a stylesheet link; the live endpoint serves `/server/files/config/.theme/custom.css`.

- Observation: Dashboard composition is persisted per viewport and rendered in two or three columns, so replacing it with a hardcoded page would discard user configuration.
  Evidence: `src/pages/Dashboard.vue` reads `gui/getPanels` separately for mobile, tablet, desktop, and widescreen.

- Observation: The printer is not printing, but Moonraker reports `standby`; deployment must still avoid restarting Klipper or Moonraker.
  Evidence: `printer/objects/query?print_stats` returned `standby` before source work began.

## Decision Log

- Decision: Fork and build Mainsail rather than continue with `.theme/custom.css`.
  Rationale: The user explicitly rejected the reskin and requested a source redesign.
  Date/Author: 2026-07-22 / Hermes

- Decision: Keep Vue 2, Vuetify 2, Vuex, all existing handlers, and dependencies; implement the visual language with native CSS and small template classes.
  Rationale: Replacing the application framework would add risk without improving printer operation. CSS is the native rendering layer and no new dependency is needed.
  Date/Author: 2026-07-22 / Hermes

- Decision: Preserve saved panel configuration and promote hierarchy through source layout classes and material treatment rather than deleting dashboard customization.
  Rationale: User-configurable panels are core Mainsail behavior; a visual redesign must not silently discard them.
  Date/Author: 2026-07-22 / Hermes

- Decision: Safety colors remain exceptions to the single blue accent: red for emergency/error, amber for warning, green for success.
  Rationale: Operational safety and accessibility outrank literal brand imitation.
  Date/Author: 2026-07-22 / Hermes

## Outcomes & Retrospective

The fork now owns the material system in source rather than depending on `.theme/custom.css`. The deployed interface uses adaptive light/dark tokens, environmental color fields, translucent 34px-blurred chrome, specular panel gradients, edge highlights, shadows, Apple-style typography and controls, improved dashboard spacing, readable file metadata, mobile touch sizing, focus rings, reduced-motion handling, and an opaque browser fallback. Existing routes, saved dashboard panel lists, Moonraker handlers, upload flow, and Emergency Stop behavior were not rewritten.

Canonical verification passed: Prettier, ESLint, 22 Vitest tests, and Vite production build. The live server exposes the final hashed stylesheet, the obsolete custom override is disabled, the printer remains `standby`, and Klipper/Moonraker service start timestamps are unchanged. The visual assessor initially under-read the subtle glass, so visible environmental contrast and specular/refraction layers were strengthened; pixel analysis then confirmed non-uniform blue-purple gradients, translucent surfaces, borders, and shadows. The remaining limit is native web rendering: CSS backdrop filtering cannot reproduce Apple's private GPU compositor and real-time lens distortion exactly.

## Context and Orientation

Mainsail is a Vue 2.7 application using class-style TypeScript components, Vuetify 2 widgets, Vuex state, and Vite. `src/App.vue` owns the application shell and imports global styles. `src/components/TheTopbar.vue` and `src/components/TheSidebar.vue` provide navigation and safety actions. `src/components/ui/Panel.vue` wraps nearly every operational card, making it the shared source-level surface. `src/pages/Dashboard.vue` composes status and configurable panels per responsive viewport. `src/assets/styles/page.css` contains global page and scrollbar rules.

“Liquid Glass” here means a material system rather than indiscriminate transparency: elevated chrome uses translucent surfaces, saturation, blur, a thin inner highlight, subtle refraction-like gradients, and a soft shadow over a visible environmental canvas. Content-heavy panels retain enough opacity for legibility. Controls use clear hover, pressed, focus, selected, and disabled states. Browsers without backdrop filtering receive opaque fallback surfaces. Reduced-motion preferences disable decorative transitions.

The deployed printer hosts static files in `/home/ratrig3/mainsail`. Moonraker and Klipper are separate services and must not be restarted. The current installation must be copied to a timestamped backup before replacing static assets. The previous `/home/ratrig3/printer_data/config/.theme/custom.css` must be renamed to a timestamped backup so it cannot override the fork.

## Plan of Work

Create `src/assets/styles/liquid-glass.css` as the single material system. Define adaptive light and dark tokens on Vuetify’s real `.theme--light` and `.theme--dark` roots. Style the application canvas, shell, floating top bar, sidebar, shared cards and toolbars, dialogs, menus, fields, buttons, tables, tabs, console, webcam, charts, scrollbars, focus rings, touch sizing, and motion fallbacks. Use pseudo-elements only for decorative highlights and keep pointer events disabled.

Import that file from `src/App.vue` after existing base styles so the fork owns the cascade. Add stable semantic classes to `App.vue`, `TheTopbar.vue`, `TheSidebar.vue`, `Panel.vue`, and `Dashboard.vue`; do not change control handlers. Remove the old flat light-theme toolbar border from `Panel.vue` because the shared glass border supersedes it.

Update `Dashboard.vue` to add semantic viewport and column classes around the existing stored layouts. Status remains first. Existing saved panel arrays and component keys remain unchanged. CSS will create clearer primary columns, consistent gaps, sticky-safe geometry, and responsive single-column behavior without relocating or duplicating controls.

## Concrete Steps

From `/Users/macminim4/workspace/mainsail-liquid-glass`, edit only the minimum shared files and add the material stylesheet. Then run:

    npm run format:check
    npm run lint
    npm run test:unit
    npm run build

Expected results are exit code zero. `dist/index.html`, hashed CSS and JavaScript assets, and `dist/mainsail.zip` must exist.

Start a local preview against the RatRig host configuration only for static visual checks where practical. Then copy the production build to a staging directory on the Pi, compare file counts and HTTP availability, back up `/home/ratrig3/mainsail`, atomically replace its contents, and preserve `config.json` if the production build does not contain the printer-specific values.

## Validation and Acceptance

Source acceptance requires format, lint, unit tests, and production build to pass. An independent reviewer receives the diff and must find no security concern or logic error.

Live acceptance uses `http://192.168.1.100` at 375×667, 393×852, 768×1024, and 1440×900. At every viewport, `document.documentElement.scrollWidth` must not exceed viewport width by more than two pixels. Navigation must not cover content. Visible touch controls should be at least 40×40 pixels, with 44×44 preferred. The camera, current state, and critical controls must be immediately discoverable. Emergency Stop must remain visible and distinct wherever the existing responsive design exposes it. No printer command may be triggered during QA.

The visual result must show translucent layered chrome, environmental depth visible through glass, clear material separation, restrained blue interactivity, adaptive dark/light tokens, readable content, and no flat opaque legacy toolbar strips. Browser runtime errors and failed first-party requests must be zero. Moonraker print state must remain unchanged by deployment and Klipper/Moonraker services must not restart.

## Idempotence and Recovery

Build and tests are repeatable. Deployment first writes a timestamped backup directory next to `/home/ratrig3/mainsail`; rerunning creates another timestamped backup. If live verification fails, remove the new directory and rename the latest backup to `/home/ratrig3/mainsail`. Restore the timestamped `.theme/custom.css` only if returning to the previous stock deployment. Static file replacement does not require a Klipper or Moonraker restart.

## Artifacts and Notes

The fork is `https://github.com/cluzl/mainsail`. The implementation branch is `feat/liquid-glass-dashboard`. The source checkout is `/Users/macminim4/workspace/mainsail-liquid-glass`. The original user screenshot is `/Users/macminim4/.hermes/images/upload_20260722_011920_1.png`.

## Interfaces and Dependencies

No dependency is added. Existing Vue components, Vuetify controls, Vuex getters, WebSocket calls, and Moonraker APIs remain the interfaces. The new stylesheet exports no JavaScript API; its stable contract is the `liquid-glass-app`, `liquid-glass-topbar`, `liquid-glass-sidebar`, `liquid-glass-panel`, `liquid-glass-dashboard`, and `liquid-glass-column` classes added to shared source templates.

Revision note: Created after source inspection to replace the rejected CSS-only theme with a safe, source-built fork redesign.
