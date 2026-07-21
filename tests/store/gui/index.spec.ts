import { describe, expect, it } from 'vitest'
import { getDefaultState } from '@/store/gui'

describe('dashboard defaults', () => {
    it('puts a visible webcam first in mobile and widescreen primary layouts', () => {
        const dashboard = getDefaultState().dashboard

        expect(dashboard.mobileLayout[0]).toEqual({ name: 'webcam', visible: true })
        expect(dashboard.widescreenLayout1[0]).toEqual({ name: 'webcam', visible: true })
        expect(dashboard.widescreenLayout3.some((panel) => panel.name === 'webcam')).toBe(false)
    })
})
