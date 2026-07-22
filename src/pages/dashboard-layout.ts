import { GuiStateLayoutoption } from '@/store/gui/types'

const CONTROL_PANELS = new Set(['toolhead-control', 'temperature', 'extruder-control', 'afc', 'mmu', 'spoolman'])

export function arrangeDashboardPanels(panels: GuiStateLayoutoption[]) {
    const unique = panels.filter(
        (panel, index) => panel.visible && panels.findIndex((item) => item.name === panel.name) === index
    )
    const webcam = unique.find((panel) => panel.name === 'webcam') ?? null
    const controls = unique.filter((panel) => CONTROL_PANELS.has(panel.name))
    const utilities = unique.filter((panel) => panel.name !== 'webcam' && !CONTROL_PANELS.has(panel.name))

    return { webcam, controls, utilities }
}
