import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const motion = readFileSync(new URL('../src/components/panels/forge/ForgeMotionPanel.vue', import.meta.url), 'utf8')
const thermal = readFileSync(new URL('../src/components/panels/forge/ForgeThermalPanel.vue', import.meta.url), 'utf8')
const outputs = readFileSync(new URL('../src/components/panels/forge/ForgeOutputsPanel.vue', import.meta.url), 'utf8')
const nativeCss = readFileSync(new URL('../src/assets/styles/forge-native.css', import.meta.url), 'utf8')
const forgeCss = readFileSync(new URL('../src/assets/styles/forge.css', import.meta.url), 'utf8')

describe('motion panel safety', () => {
    // an unhomed axis has no trustworthy origin: jogging it is a crash, not a move
    it('gates jogging on homing in the handler, not only the template', () => {
        expect(motion).toContain('jog(axis: string, distance: number): void {\n        if (this.jogLocked) return')
        expect(motion).toContain('return this.locked || !this.allHomed')
    })

    it('gates gantry levelling on homing in both handlers', () => {
        const guards = motion.match(/if \(this\.locked \|\| !this\.allHomed\) return/g) ?? []
        expect(guards.length).toBe(2)
    })

    it('hides stale coordinates until the axis is homed', () => {
        expect(motion).toContain("ax.homed ? ax.value : '—'")
    })

    // a 50 mm XY step applied to Z drives the nozzle into the bed
    it('never inherits the full XY step for Z moves', () => {
        expect(motion).toContain('return Math.min(this.step, 10)')
        expect(motion).toContain("jog('Z', zStep)")
    })

    it('keeps motors-off out of the routine action grid', () => {
        expect(motion.indexOf('forge-danger-zone')).toBeGreaterThan(motion.indexOf('forge-motion-actions'))
    })

    // a per-second buffer that never trims is a memory leak on a 14-hour print
    it('bounds the flow history buffer to the visible window', () => {
        const job = readFileSync(new URL('../src/components/panels/forge/ForgeJobPanel.vue', import.meta.url), 'utf8')
        expect(job).toContain('if (this.flowHistory.length > this.flowWindowSeconds)')
        expect(job).toContain('this.flowHistory.splice(0, this.flowHistory.length - this.flowWindowSeconds)')
        // an interval that outlives the component keeps sampling a dead panel
        expect(job).toContain('if (this.flowTimer !== null) window.clearInterval(this.flowTimer)')
    })

    // hand-feeding wants a slow rate, purging a fast one — the panel hardcoded one
    it('sends the operator-selected extrude feed rate', () => {
        expect(motion).toContain('`G1 E${length} F${this.selectedExtrudeFeedrate * 60}`')
        expect(motion).toContain('extrudeFeedrateChoices = [2, 5, 10, 15]')
    })

    it('only accepts a feed rate from the offered choices', () => {
        expect(motion).toContain('if (this.extrudeFeedrateChoices.includes(value)) this.feedrateOverride = value')
    })
})

describe('capability honesty', () => {
    it('renders read-only sensors without target inputs', () => {
        expect(thermal).toContain('get sensors(): ThermRow[]')
        expect(thermal).toContain('forge-sensor-chip')
        // the control row is driven by heaters only — sensors can never reach an input
        expect(thermal).toContain('v-for="row in heaters"')
    })

    it('labels each output by what the operator may actually do', () => {
        expect(outputs).toContain("if (!item.controllable) return 'AUTO'")
        expect(outputs).toContain("return item.pwm ? 'PWM' : 'BINARY'")
    })

    // a silent tachometer is not a fan at rest
    it('distinguishes a missing RPM reading from zero', () => {
        expect(outputs).toContain("return value === null ? 'RPM unavailable' : `${value} RPM`")
    })
})

// a control the operator cannot reliably hit is a control they will mis-hit under pressure
describe('touch targets', () => {
    it('keeps every compact control at the 44px minimum', () => {
        const mini = nativeCss.match(/\.forge-mini \{[^}]*\}/)?.[0] ?? ''
        expect(mini).toContain('min-width: 44px')
        expect(mini).toContain('min-height: 44px')
        expect(mini).not.toMatch(/height: 3\d px?/)
    })

    it('keeps the thermal target input aligned at 44px', () => {
        const input = nativeCss.match(/\.forge-therm-set input \{[^}]*\}/)?.[0] ?? ''
        expect(input).toContain('height: 44px')
    })

    // the one control that must never be hard to hit
    it('keeps emergency stop at the 44px minimum', () => {
        const estop = forgeCss.match(/\.topbar \.emergency-button\.v-btn \{[^}]*\}/)?.[0] ?? ''
        expect(estop).toContain('height: 44px')
    })

    // catch the next undersized control too, not just the ones already found
    it('declares no FORGE control shorter than 44px', () => {
        const offenders: string[] = []
        for (const block of nativeCss.match(/\.forge-[^{]*\{[^}]*\}/g) ?? []) {
            const height = block.match(/(?:^|\s)(?:min-)?height:\s*(\d+)px/)
            const selector = block.split('{')[0].trim()
            if (!height) continue
            const isControl = /button|input|\.forge-mini|\.forge-cmd|\.forge-jog-btn|\.forge-macro-btn/.test(selector)
            if (isControl && Number(height[1]) < 44) offenders.push(`${selector} -> ${height[1]}px`)
        }
        expect(offenders).toEqual([])
    })
})

// AFC (RatRig 4 QuattroBox): use only the printer's tested BT_* wrappers.
describe('AFC panel safety', () => {
    const afc = readFileSync(new URL('../src/components/panels/forge/ForgeAfcPanel.vue', import.meta.url), 'utf8')

    it('uses the installed QuattroBox wrapper macros', () => {
        expect(afc).toContain('BT_CHANGE_TOOL LANE=${num}')
        expect(afc).toContain("this.forgeSend('BT_TOOL_UNLOAD')")
        expect(afc).toContain('BT_LANE_EJECT LANE=${num}')
    })

    it('locks every lane command during prints, faults, and toolchanges', () => {
        expect(afc).toContain(
            'this.printerIsPrinting || Boolean(this.afc?.error_state) || Boolean(this.afc?.in_toolchange)'
        )
        expect(afc).toContain('if (this.laneLocked || !action) return')
    })

    it('requires a confirmation before any macro is sent', () => {
        expect(afc).toContain('@click="ask(lane.name, \'load\')"')
        expect(afc).toContain('@click="confirm(lane)"')
        expect(afc).toContain('@click="cancel"')
    })

    it('never ejects the lane currently in the tool', () => {
        expect(afc).toContain("action === 'eject' && !lane.toolLoaded")
        expect(afc).toContain('laneLocked || lane.toolLoaded')
    })

    // one hub and one tool sensor are shared by all lanes: only PREP/LOAD/HUB
    // are per-lane facts, and TOOL occupancy belongs in the summary row
    it('shows only per-lane stages on the lane card', () => {
        expect(afc).toContain('>PREP<')
        expect(afc).toContain('>LOAD<')
        expect(afc).toContain('>HUB<')
        expect(afc).not.toMatch(/<span :class="\{ on: lane\.toolLoaded \}">TOOL<\/span>/)
    })

    it('refuses to load a lane whose sensors contradict each other', () => {
        expect(afc).toContain("if (action === 'load' && lane.sensorError) return")
        expect(afc).toContain('laneLocked || lane.toolLoaded || !!lane.sensorError')
    })

    it('renders nothing when the printer has no AFC', () => {
        expect(afc).toContain('v-if="klipperReadyForGui && hasAfc"')
    })

    it('surfaces the latched fault reason rather than a bare state', () => {
        expect(afc).toContain('last_error_message')
        expect(afc).toContain('last_error_resolution')
    })
})

describe('legibility', () => {
    const jobVue = readFileSync(new URL('../src/components/panels/forge/ForgeJobPanel.vue', import.meta.url), 'utf8')

    // Vuetify's .primary/.accent utilities paint a solid same-hue fill with
    // !important, which rendered blue text on a blue button — invisible.
    it('never styles a FORGE button with a Vuetify colour utility class', () => {
        for (const src of [motion, jobVue]) {
            // (?<!forge-) so the namespaced forge-accent is not mistaken for Vuetify's accent
            expect(src).not.toMatch(
                /class="forge-cmd[^"]*(?<!forge-)\b(primary|accent|secondary|info|success|error|warning)\b/
            )
        }
        expect(nativeCss).toContain('.forge-cmd.forge-accent')
    })

    // a disabled control is still information the operator must read
    it('keeps disabled commands at full opacity', () => {
        const block = nativeCss.match(/\.forge-cmd:disabled,\s*\.forge-macro-btn:disabled \{[^}]*\}/)?.[0] ?? ''
        expect(block).toContain('opacity: 1')
        expect(block).not.toMatch(/opacity: 0\./)
    })

    // a later duplicate rule silently overrode this and measured 4.06:1 at 8px
    it('declares one disabled command colour across every rule', () => {
        const colours = new Set(
            (nativeCss.match(/\.forge-(?:cmd|jog-btn|macro-btn)[^{]*:disabled[^{]*\{[^}]*\}/g) ?? [])
                .map((block) => block.match(/(?:^|\s)color:\s*(#[0-9a-f]{6})/i)?.[1]?.toLowerCase())
                .filter((colour): colour is string => Boolean(colour))
        )
        expect([...colours]).toEqual(['#3f444b'])
    })

    // these were measured failing WCAG AA on the live page at 8-9px
    it('uses the contrast-corrected text tokens', () => {
        expect(forgeCss).toContain('--forge-muted: #5a5a60')
        expect(forgeCss).toContain('--forge-signal: #0060c0')
        expect(forgeCss).toContain('--forge-ok: #16704a')
    })

    // a hardcoded fallback silently reintroduces the colour the token just fixed
    it('does not hardcode superseded low-contrast colours', () => {
        expect(nativeCss).not.toMatch(/#177046|#1c8c56|#6b6b70|#0071e3/)
    })

    // stock Mainsail surfaces measured under AA on this light theme
    it('corrects the stock Mainsail low-contrast surfaces', () => {
        expect(forgeCss).toContain('.file-list__count_printed')
        expect(forgeCss).toContain('.text--disabled')
        expect(forgeCss).toContain('.v-chip .v-chip__content')
    })

    // Vuetify's own primary drives stock buttons; patching CSS alone leaves it behind
    it('overrides the Vuetify light primary to the accessible blue', () => {
        const vuetify = readFileSync(new URL('../src/plugins/vuetify.ts', import.meta.url), 'utf8')
        expect(vuetify).toContain("primary: '#0060c0'")
    })
})
