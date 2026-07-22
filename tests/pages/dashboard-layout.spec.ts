import { describe, expect, it } from 'vitest'
import { arrangeDashboardPanels } from '@/pages/dashboard-layout'

describe('arrangeDashboardPanels', () => {
    it('deduplicates saved columns and groups controls before utilities', () => {
        const result = arrangeDashboardPanels([
            { name: 'macros', visible: true },
            { name: 'webcam', visible: true },
            { name: 'temperature', visible: true },
            { name: 'toolhead-control', visible: true },
            { name: 'webcam', visible: true },
            { name: 'miniconsole', visible: true },
        ])

        expect(result.webcam?.name).toBe('webcam')
        expect(result.controls.map((panel) => panel.name)).toEqual(['toolhead-control', 'temperature'])
        expect(result.utilities.map((panel) => panel.name)).toEqual(['macros', 'miniconsole'])
    })
})
