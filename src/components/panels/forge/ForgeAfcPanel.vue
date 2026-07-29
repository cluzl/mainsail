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
            <div
                v-for="lane in lanes"
                :key="lane.name"
                class="forge-afc-lane"
                :class="{ tooled: lane.toolLoaded, faulted: lane.sensorError }">
                <div class="forge-afc-lane-head">
                    <label>
                        {{ lane.name.toUpperCase() }}
                        <span class="forge-cap">{{ lane.map }}</span>
                    </label>
                    <b :class="lane.sensorError ? 'cold' : lane.readyClass">
                        {{ lane.sensorError ? 'FAULT' : lane.filamentStatus }}
                    </b>
                </div>
                <div class="forge-afc-path" :aria-label="lane.name + ' filament path'">
                    <span :class="{ on: lane.prep }">PREP</span>
                    <span :class="{ on: lane.load }">LOAD</span>
                    <span :class="{ on: lane.loadedToHub }">HUB</span>
                </div>

                <!-- A physically impossible sensor pattern is a wiring/filament
                     fault, not a state: say so on the lane it belongs to. -->
                <p v-if="lane.sensorError" class="forge-afc-lane-error">{{ lane.sensorError }}</p>

                <div class="forge-afc-meta">
                    <span>{{ lane.material }}</span>
                    <span>{{ lane.weight }}</span>
                </div>

                <!-- Confirm step is deliberate: these commands move filament and
                     take minutes to undo if fired on the wrong lane. -->
                <div v-if="pending === lane.name" class="forge-afc-confirm">
                    <p>{{ pendingLabel }} {{ lane.name.toUpperCase() }}?</p>
                    <div class="forge-afc-actions">
                        <button class="forge-cmd forge-accent" @click="confirm(lane)">CONFIRM</button>
                        <button class="forge-cmd" @click="cancel">CANCEL</button>
                    </div>
                </div>
                <div v-else class="forge-afc-actions">
                    <button
                        class="forge-cmd"
                        :disabled="laneLocked || lane.toolLoaded || !!lane.sensorError"
                        :title="loadTitle(lane)"
                        @click="ask(lane.name, 'load')">
                        LOAD TO TOOL
                    </button>
                    <button
                        class="forge-cmd"
                        :disabled="laneLocked || !lane.toolLoaded"
                        :title="lockReason"
                        @click="ask(lane.name, 'unload')">
                        UNLOAD TOOL
                    </button>
                    <button
                        class="forge-cmd"
                        :disabled="laneLocked || lane.toolLoaded"
                        :title="lane.toolLoaded ? 'Unload from the tool first' : lockReason"
                        @click="ask(lane.name, 'eject')">
                        EJECT SPOOL
                    </button>
                </div>
            </div>
        </div>

        <p class="forge-afc-note">{{ laneLocked ? lockReason : 'Lane commands run the printer AFC macros.' }}</p>
    </div>
</template>

<script lang="ts">
import Component from 'vue-class-component'
import { Mixins } from 'vue-property-decorator'
import ForgePanelMixin from '@/components/mixins/forgePanel'
import { afcLaneSensorError } from '@/plugins/forgeFormat'

type Action = 'load' | 'unload' | 'eject'

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
    sensorError: string
}

@Component
export default class ForgeAfcPanel extends Mixins(ForgePanelMixin) {
    pending = ''
    pendingAction: Action | '' = ''

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
                const prep = Boolean(lane.prep)
                const load = Boolean(lane.load)
                const loadedToHub = Boolean(lane.loaded_to_hub)
                return {
                    name: String(lane.name ?? ''),
                    map: String(lane.map ?? ''),
                    prep,
                    load,
                    loadedToHub,
                    toolLoaded: Boolean(lane.tool_loaded),
                    filamentStatus: status.toUpperCase(),
                    readyClass: /ready|tool/i.test(status) && !/not/i.test(status) ? 'ready' : 'cold',
                    // AFC reports null material and 0 weight for an empty lane
                    material: lane.material ? String(lane.material) : 'NO MATERIAL',
                    weight: weight > 0 ? `${Math.round(weight)} g` : '—',
                    sensorError: afcLaneSensorError(prep, load, loadedToHub),
                }
            })
    }

    // A toolchange mid-print belongs to the running gcode, not to a person
    // poking the dashboard. AFC's own error latch blocks lane moves too.
    get laneLocked(): boolean {
        return this.printerIsPrinting || Boolean(this.afc?.error_state) || Boolean(this.afc?.in_toolchange)
    }

    get lockReason(): string {
        if (this.printerIsPrinting) return 'Lane commands are locked while a print is running.'
        if (this.afc?.in_toolchange) return 'A toolchange is in progress.'
        if (this.afc?.error_state) return 'Clear the AFC fault before moving filament.'
        return ''
    }

    get pendingLabel(): string {
        if (this.pendingAction === 'load') return 'Load'
        if (this.pendingAction === 'unload') return 'Unload from tool:'
        return 'Eject spool from'
    }

    loadTitle(lane: Lane): string {
        if (lane.sensorError) return lane.sensorError
        if (lane.toolLoaded) return 'This lane is already in the tool'
        return this.lockReason
    }

    ask(lane: string, action: Action): void {
        if (this.laneLocked) return
        this.pending = lane
        this.pendingAction = action
    }

    cancel(): void {
        this.pending = ''
        this.pendingAction = ''
    }

    // BT_* are the printer's own AFC wrappers; lane number is the trailing digit
    // of the AFC_stepper name (lane1..lane4), which is what BT_* expects.
    confirm(lane: Lane): void {
        const action = this.pendingAction
        this.pending = ''
        this.pendingAction = ''
        if (this.laneLocked || !action) return

        const num = Number(lane.name.replace(/\D/g, ''))
        if (!Number.isFinite(num) || num <= 0) return

        // a lane whose sensors contradict each other must not be commanded to load
        if (action === 'load' && lane.sensorError) return

        if (action === 'load') this.forgeSend(`BT_CHANGE_TOOL LANE=${num}`)
        else if (action === 'unload' && lane.toolLoaded) this.forgeSend('BT_TOOL_UNLOAD')
        else if (action === 'eject' && !lane.toolLoaded) this.forgeSend(`BT_LANE_EJECT LANE=${num}`)
    }
}
</script>
