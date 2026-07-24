export type DashboardPanel = {
    name: string
    [key: string]: unknown
}

const controlOrder = ['toolhead-control', 'temperature', 'extruder-control', 'afc', 'mmu', 'spoolman']

export function arrangeDashboardPanels(panels: DashboardPanel[]) {
    const unique = [...new Map(panels.map((panel) => [panel.name, panel])).values()]
    const webcam = unique.find((panel) => panel.name === 'webcam') ?? null
    const controls = controlOrder.flatMap((name) => unique.filter((panel) => panel.name === name))
    const reserved = new Set(['webcam', ...controlOrder])
    const utilities = unique.filter((panel) => !reserved.has(panel.name))

    return { webcam, controls, utilities }
}
