<template>
    <div v-if="klipperReadyForGui" class="forge-block">
        <div class="forge-section-title">
            <span>THERMAL</span>
            <small>LIVE LOOP</small>
        </div>
        <div class="forge-thermal">
            <div v-for="row in rows" :key="row.name" class="forge-therm">
                <label>
                    {{ row.label }}
                    <small v-if="row.settable">{{ Math.round(row.power * 100) }}% OUTPUT</small>
                    <small v-else>SENSOR</small>
                </label>
                <div class="forge-bar"><i :style="{ width: row.barPct + '%' }"></i></div>
                <div class="forge-temp">
                    <em>{{ row.temperature.toFixed(1) }}</em>
                    <small v-if="row.settable">/ {{ Math.round(row.target) }}°C</small>
                    <small v-else>°C</small>
                </div>
                <div v-if="row.settable" class="forge-therm-set">
                    <input
                        :value="row.target"
                        type="number"
                        :min="row.min"
                        :max="row.max"
                        :aria-label="'Set ' + row.label + ' target'"
                        @keyup.enter="setTarget(row, $event)" />
                    <button
                        v-if="row.target > 0"
                        class="forge-mini"
                        :aria-label="'Cooldown ' + row.label"
                        @click="cooldown(row)">
                        OFF
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import Component from 'vue-class-component'
import { Mixins } from 'vue-property-decorator'
import ForgePanelMixin from '@/components/mixins/forgePanel'
import { clampTarget } from '@/plugins/forgeFormat'
import { convertName } from '@/plugins/helpers'

type ThermRow = {
    name: string
    commandName: string
    label: string
    temperature: number
    target: number
    power: number
    settable: boolean
    command: string | null
    attr: string
    min: number
    max: number
    barPct: number
}

@Component
export default class ForgeThermalPanel extends Mixins(ForgePanelMixin) {
    get rows(): ThermRow[] {
        const printer = this.$store.state.printer
        const heaters: string[] = printer.heaters?.available_heaters ?? []
        const sensors: string[] = printer.heaters?.available_sensors ?? []
        const names = [...new Set([...heaters, ...sensors])].filter((n) => !n.startsWith('_'))

        return names
            .map((name) => this.buildRow(name, heaters))
            .filter((r): r is ThermRow => r !== null)
            .sort((a, b) => Number(b.settable) - Number(a.settable))
    }

    buildRow(name: string, heaters: string[]): ThermRow | null {
        const obj = this.$store.state.printer[name]
        if (!obj || obj.temperature === undefined) return null

        const settings = this.$store.state.printer.configfile?.settings?.[name.toLowerCase()] ?? {}
        const min = settings.min_temp ?? 0
        const max = settings.max_temp ?? 300

        let command: string | null = null
        let attr = ''
        if (name.startsWith('temperature_fan')) {
            command = 'SET_TEMPERATURE_FAN_TARGET'
            attr = 'TEMPERATURE_FAN'
        } else if (name.startsWith('extruder') || name.startsWith('heater_') || heaters.includes(name)) {
            command = 'SET_HEATER_TEMPERATURE'
            attr = 'HEATER'
        }

        const target = obj.target ?? 0
        const temperature = obj.temperature ?? 0
        const barPct = max > min ? Math.min(100, Math.max(0, ((temperature - min) / (max - min)) * 100)) : 0

        return {
            name,
            commandName: name.split(' ')[1] ?? name,
            label: convertName(name.split(' ')[1] ?? name).toUpperCase(),
            temperature,
            target,
            power: obj.power ?? obj.speed ?? 0,
            settable: command !== null,
            command,
            attr,
            min,
            max,
            barPct,
        }
    }

    setTarget(row: ThermRow, event: KeyboardEvent): void {
        if (!row.command) return
        const raw = Number((event.target as HTMLInputElement).value)
        if (isNaN(raw)) return
        const value = clampTarget(raw, row.min, row.max)
        if (value === null) {
            this.$toast.error(this.$t('Panels.TemperaturePanel.TempTooHigh', { name: row.label }).toString())
            return
        }
        if (value === row.target) return
        this.forgeSend(`${row.command} ${row.attr}=${row.commandName} TARGET=${value}`)
    }

    cooldown(row: ThermRow): void {
        if (!row.command) return
        this.forgeSend(`${row.command} ${row.attr}=${row.commandName} TARGET=0`)
    }
}
</script>
