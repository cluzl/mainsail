import { describe, expect, it } from 'vitest'
import { arrangeDashboardPanels } from '@/pages/dashboard-layout'

describe('arrangeDashboardPanels', () => {
    it('deduplicates panels and preserves saved order within each group', () => {
        const result = arrangeDashboardPanels([
            { name: 'macros', visible: true },
            { name: 'webcam', visible: true },
            { name: 'temperature', visible: true },
            { name: 'toolhead-control', visible: true },
            { name: 'webcam', visible: true },
            { name: 'miniconsole', visible: true },
        ])

        expect(result.webcam?.name).toBe('webcam')
        expect(result.controls.map((panel) => panel.name)).toEqual(['temperature', 'toolhead-control'])
        expect(result.utilities.map((panel) => panel.name)).toEqual(['macros', 'miniconsole'])
    })

    it.each([
        {
            name: 'no webcam and hidden panels',
            panels: [
                { name: 'webcam', visible: false },
                { name: 'extruder-control', visible: true },
                { name: 'miscellaneous', visible: false },
            ],
            webcam: null,
            controls: ['extruder-control'],
            utilities: [],
        },
        {
            name: 'all control types and macrogroup ids',
            panels: [
                { name: 'mmu', visible: true },
                { name: 'afc', visible: true },
                { name: 'spoolman', visible: true },
                { name: 'macrogroup_123e4567-e89b-12d3-a456-426614174000', visible: true },
                { name: 'machine-settings', visible: true },
            ],
            webcam: null,
            controls: ['mmu', 'afc', 'spoolman'],
            utilities: ['macrogroup_123e4567-e89b-12d3-a456-426614174000', 'machine-settings'],
        },
    ])('$name', ({ panels, webcam, controls, utilities }) => {
        const result = arrangeDashboardPanels(panels)

        expect(result.webcam?.name ?? null).toBe(webcam)
        expect(result.controls.map((panel) => panel.name)).toEqual(controls)
        expect(result.utilities.map((panel) => panel.name)).toEqual(utilities)
    })
})
