import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const dashboard = readFileSync(new URL('../src/pages/Dashboard.vue', import.meta.url), 'utf8')
const nativeCss = readFileSync(new URL('../src/assets/styles/forge-native.css', import.meta.url), 'utf8')

describe('FORGE operator hierarchy', () => {
    it('always mounts Klipper recovery controls before dashboard content', () => {
        expect(dashboard).toContain('<klippy-state-panel />')
        expect(dashboard.indexOf('<klippy-state-panel />')).toBeLessThan(
            dashboard.indexOf('<section class="forge-hero">')
        )
    })

    it('keeps job, camera, and motion controls ahead of telemetry', () => {
        const order = ['<forge-job-panel', '<forge-camera-panel', '<forge-motion-panel', '<forge-thermal-panel'].map(
            (tag) => dashboard.indexOf(tag)
        )
        expect(order.every((index) => index >= 0)).toBe(true)
        expect(order).toEqual([...order].sort((a, b) => a - b))
    })

    // Direct card children in one CSS grid share row heights. MOTION then forces
    // THERMAL/OUTPUTS to leave a 600-800px hole before the next card.
    it('packs cards in independent column stacks instead of shared grid rows', () => {
        expect(dashboard.match(/class="forge-column"/g)).toHaveLength(2)
        expect(nativeCss).toContain('.forge-column {')
        expect(dashboard).toMatch(/<div class="forge-column">\s*<forge-motion-panel[\s\S]*<forge-outputs-panel/)
        expect(dashboard).toMatch(/<div class="forge-column">\s*<forge-thermal-panel[\s\S]*<forge-macros-panel/)
    })
})
