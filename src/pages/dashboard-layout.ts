import { GuiStateLayoutoption } from '@/store/gui/types'

const CONTROL_ORDER = ['toolhead-control', 'temperature', 'extruder-control', 'afc', 'mmu', 'spoolman']

export function arrangeDashboardPanels(panels: GuiStateLayoutoption[]) {
    const unique = panels.filter((panel, index) => panels.findIndex((item) => item.name === panel.name) === index)
    const webcam = unique.find((panel) => panel.name === 'webcam') ?? null
    const controls = CONTROL_ORDER.flatMap((name) => unique.filter((panel) => panel.name === name))
    const controlNames = new Set(CONTROL_ORDER)
    const utilities = unique.filter((panel) => panel.name !== 'webcam' && !controlNames.has(panel.name))

    return { webcam, controls, utilities }
}
