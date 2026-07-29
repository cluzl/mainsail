<template>
    <div v-if="klipperReadyForGui && hasAfc" class="forge-block forge-afc">
        <div class="forge-section-title">
            <span>FILAMENT</span>
            <small>{{ unitLabel }}</small>
        </div>

        <!-- AFC latches faults. A stalled print with no visible reason is the
             failure mode this panel exists to prevent. -->
        <div v-if="fault" class="forge-afc-alert">
            <b>{{ stateText }}</b>
            <p>{{ fault }}</p>
            <p v-if="resolution" class="forge-afc-fix">{{ resolution }}</p>
        </div>

        <div class="forge-afc-head">
            <div class="forge-afc-stat">
                <small>STATE</small>
                <b :class="stateClass">{{ stateText }}</b>
            </div>
            <div class="forge-afc-stat">
                <small>IN TOOL</small>
                <b>{{ toolLane || 'NONE' }}</b>
            </div>
            <div class="forge-afc-stat">
                <small>HUB</small>
                <b>{{ hubState }}</b>
            </div>
            <div class="forge-afc-stat">
                <small>BUFFER</small>
                <b>{{ bufferState }}</b>
            </div>
        </div>

        <div class="forge-afc-lanes">
            <div v-for="lane in lanes" :key="lane.name" class="forge-afc-lane" :class="{ tooled: lane.toolLoaded }">
                <div class="forge-afc-lane-head">
                    <label>
                        {{ lane.name.toUpperCase() }}
                        <span class="forge-cap">{{ lane.map }}</span>
                    </label>
                    <b :class="lane.readyClass">{{ lane.filamentStatus }}</b>
                </div>
                <div class="forge-afc-path" :aria-label="lane.name + ' filament path'">
                    <span :class="{ on: lane.prep }">PREP</span>
                    <span :class="{ on: lane.load }">LOAD</span>
                    <span :class="{ on: lane.loadedToHub }">HUB</span>
                    <span :class="{ on: lane.toolLoaded }">TOOL</span>
                </div>
                <div class="forge-afc-meta">
                    <span>{{ lane.material }}</span>
                    <span>{{ lane.weight }}</span>
                </div>
            </div>
        </div>

        <p class="forge-afc-note">Read-only. Lane commands stay in MACROS.</p>
    </div>
</template>

<script lang="ts">
import Component from 'vue-class-component'
import { Mixins } from 'vue-property-decorator'
import ForgePanelMixin from '@/components/mixins/forgePanel'

type Lane = {
    name: string
    map: string
    prep: boolean
    load: boolean
    loadedToHub: boolean
    toolLoaded: boolean
    filamentStatus: string
    readyClass: string
    material: string
    weight: string
}

@Component
export default class ForgeAfcPanel extends Mixins(ForgePanelMixin) {
    get afc(): Record<string, unknown> | null {
        return this.$store.state.printer.AFC ?? null
    }

    // printers without AFC (RatRig 3) must render nothing at all
    get hasAfc(): boolean {
        return this.afc !== null && Array.isArray(this.afc?.lanes)
    }

    get unitLabel(): string {
        const units = (this.afc?.units as string[]) ?? []
        return units.length ? units.join(' · ').toUpperCase() : 'AFC'
    }

    get stateText(): string {
        return String(this.afc?.current_state ?? 'UNKNOWN').toUpperCase()
    }

    get stateClass(): string {
        return this.afc?.error_state ? 'cold' : 'ready'
    }

    get fault(): string {
        if (!this.afc?.error_state && !this.afc?.mdm_fault) return ''
        return String(this.afc?.last_error_message ?? this.afc?.safety_message ?? '')
    }

    get resolution(): string {
        return this.fault ? String(this.afc?.last_error_resolution ?? '') : ''
    }

    get toolLane(): string {
        const lane = this.lanes.find((l) => l.toolLoaded)
        return lane ? lane.name.toUpperCase() : ''
    }

    get hubState(): string {
        const hubs = (this.afc?.hubs as string[]) ?? []
        const hub = this.$store.state.printer[`AFC_hub ${hubs[0]}`]
        if (!hub) return '—'
        return hub.state ? 'FILAMENT' : 'CLEAR'
    }

    get bufferState(): string {
        const buffers = (this.afc?.buffers as string[]) ?? []
        const buffer = this.$store.state.printer[`AFC_buffer ${buffers[0]}`]
        return buffer ? String(buffer.state ?? '—').toUpperCase() : '—'
    }

    get lanes(): Lane[] {
        const names = (this.afc?.lanes as string[]) ?? []
        return names
            .map((name) => this.$store.state.printer[`AFC_stepper ${name}`])
            .filter((lane) => lane)
            .map((lane) => {
                const status = String(lane.filament_status ?? '—')
                const weight = Number(lane.weight ?? 0)
                return {
                    name: String(lane.name ?? ''),
                    map: String(lane.map ?? ''),
                    prep: Boolean(lane.prep),
                    load: Boolean(lane.load),
                    loadedToHub: Boolean(lane.loaded_to_hub),
                    toolLoaded: Boolean(lane.tool_loaded),
                    filamentStatus: status.toUpperCase(),
                    readyClass: /ready|tool/i.test(status) && !/not/i.test(status) ? 'ready' : 'cold',
                    // AFC reports null material and 0 weight for an empty lane
                    material: lane.material ? String(lane.material) : 'NO MATERIAL',
                    weight: weight > 0 ? `${Math.round(weight)} g` : '—',
                }
            })
    }
}
</script>
