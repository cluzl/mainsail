import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const dashboard = readFileSync(new URL('../src/pages/Dashboard.vue', import.meta.url), 'utf8')

describe('FORGE operator hierarchy', () => {
    it('keeps job, camera, and motion controls ahead of telemetry', () => {
        const order = ['<forge-job-panel', '<forge-camera-panel', '<forge-motion-panel', '<forge-thermal-panel'].map(
            (tag) => dashboard.indexOf(tag)
        )
        expect(order.every((index) => index >= 0)).toBe(true)
        expect(order).toEqual([...order].sort((a, b) => a - b))
    })
})
