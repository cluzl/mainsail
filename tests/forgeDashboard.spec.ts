import { describe, expect, it } from 'vitest'
import { arrangeDashboardPanels } from '@/plugins/forgeDashboard'

describe('arrangeDashboardPanels', () => {
    it('extracts one webcam and orders operator controls before utilities', () => {
        const panels = [
            { name: 'macros', visible: true },
            { name: 'temperature', visible: true },
            { name: 'webcam', visible: true },
            { name: 'temperature', visible: true },
            { name: 'toolhead-control', visible: true },
            { name: 'miniconsole', visible: true },
        ]

        expect(arrangeDashboardPanels(panels)).toEqual({
            webcam: { name: 'webcam', visible: true },
            controls: [
                { name: 'toolhead-control', visible: true },
                { name: 'temperature', visible: true },
            ],
            utilities: [
                { name: 'macros', visible: true },
                { name: 'miniconsole', visible: true },
            ],
        })
    })
})
