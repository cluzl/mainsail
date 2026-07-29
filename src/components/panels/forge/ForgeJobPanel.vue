<template>
    <div v-if="klipperReadyForGui" class="forge-block forge-job">
        <div class="forge-job-head">
            <div class="forge-job-title">
                <span class="forge-kicker">{{ printing ? 'ACTIVE PRODUCTION' : 'MACHINE IDLE' }}</span>
                <h1>{{ displayName }}</h1>
                <p v-if="filename">{{ filename }}</p>
            </div>
            <div class="forge-percent">
                {{ percent }}
                <span>%</span>
            </div>
        </div>

        <div class="forge-progress"><i :style="{ width: Math.max(percent, 0.4) + '%' }"></i></div>

        <div class="forge-job-metrics">
            <div class="forge-metric">
                <span>Elapsed</span>
                <b>{{ elapsed }}</b>
            </div>
            <div class="forge-metric">
                <span>Layer</span>
                <b>{{ layerText }}</b>
            </div>
            <div class="forge-metric">
                <span>Speed</span>
                <b>{{ speed }} mm/s</b>
            </div>
            <div class="forge-metric">
                <span>Flow</span>
                <b>{{ flow }} mm³/s</b>
            </div>
            <div class="forge-metric">
                <span>Filament</span>
                <b>{{ filamentText }}</b>
            </div>
            <div class="forge-metric">
                <span>ETA</span>
                <b>{{ eta }}</b>
            </div>
        </div>

        <div class="forge-command-deck">
            <button
                v-if="printer_state === 'printing'"
                class="forge-cmd pause"
                :disabled="isLoading('statusPrintPause')"
                @click="pause">
                <small>Job</small>
                <b>PAUSE</b>
            </button>
            <button
                v-if="printer_state === 'paused'"
                class="forge-cmd resume"
                :disabled="isLoading('statusPrintResume')"
                @click="resume">
                <small>Job</small>
                <b>RESUME</b>
            </button>
            <button
                v-if="canCancel"
                class="forge-cmd stop"
                :disabled="isLoading('statusPrintCancel')"
                @click="askCancel">
                <small>Job</small>
                <b>CANCEL</b>
            </button>
            <button v-if="availableObjects.length" class="forge-cmd" @click="showExcludeMap = true">
                <small>Object</small>
                <b>EXCLUDE ({{ availableObjects.length }})</b>
            </button>
            <button v-if="canClear" class="forge-cmd" :disabled="isLoading('statusPrintClear')" @click="clear">
                <small>Job</small>
                <b>CLEAR</b>
            </button>
            <button
                v-if="canReprint"
                class="forge-cmd forge-accent"
                :disabled="isLoading('statusPrintReprint')"
                @click="reprint">
                <small>Job</small>
                <b>REPRINT</b>
            </button>
        </div>

        <div class="forge-flow-chart">
            <div class="forge-flow-chart-head">
                <div>
                    <span>FLOW HISTORY</span>
                    <small>LAST {{ flowWindowSeconds }}S · MM³/S</small>
                </div>
                <b>{{ flow }} mm³/s</b>
            </div>
            <svg viewBox="0 0 300 72" preserveAspectRatio="none" role="img" aria-label="Recent filament flow rate">
                <line x1="0" :y1="flowZeroY" x2="300" :y2="flowZeroY" class="forge-flow-zero" />
                <polyline :points="flowPoints" />
            </svg>
            <div class="forge-flow-scale">
                <span>{{ flowMax }} MAX</span>
                <span>{{ flowMin }} MIN</span>
            </div>
        </div>

        <confirmation-dialog
            v-model="showCancelDialog"
            :icon="mdiStopCircleOutline"
            :title="$t('CancelJobDialog.CancelJob')"
            :text="$t('CancelJobDialog.AreYouSure')"
            :action-button-text="$t('Buttons.Yes')"
            :cancel-button-text="$t('Buttons.No')"
            @action="cancel" />
        <confirmation-dialog
            v-model="showExcludeConfirm"
            :title="$t('Panels.StatusPanel.ExcludeObject.ExcludeObjectHeadline')"
            :text="$t('Panels.StatusPanel.ExcludeObject.ExcludeObjectText', { name: selectedObject })"
            :action-button-text="$t('Panels.StatusPanel.ExcludeObject.ExcludeObject')"
            action-button-color="primary"
            @action="excludeSelectedObject" />
        <status-panel-exclude-object-dialog
            :show-dialog.sync="showExcludeMap"
            :exclude-object-dialog-name="selectedObject"
            :exclude-object-dialog-bool="showExcludeConfirm"
            @update:name="selectObject"
            @update:bool="showExcludeConfirm = $event" />
    </div>
</template>

<script lang="ts">
import Component from 'vue-class-component'
import { Mixins } from 'vue-property-decorator'
import ForgePanelMixin from '@/components/mixins/forgePanel'
import ConfirmationDialog from '@/components/dialogs/ConfirmationDialog.vue'
import StatusPanelExcludeObjectDialog from '@/components/panels/Status/ExcludeObjectDialog.vue'
import { mdiStopCircleOutline } from '@mdi/js'
import { formatDuration, formatFilament } from '@/plugins/forgeFormat'

@Component({ components: { ConfirmationDialog, StatusPanelExcludeObjectDialog } })
export default class ForgeJobPanel extends Mixins(ForgePanelMixin) {
    mdiStopCircleOutline = mdiStopCircleOutline
    showCancelDialog = false
    showExcludeMap = false
    showExcludeConfirm = false
    selectedObject = ''
    flowHistory: number[] = []
    flowTimer: number | null = null
    flowWindowSeconds = 120

    mounted(): void {
        this.sampleFlow()
        this.flowTimer = window.setInterval(() => this.sampleFlow(), 1000)
    }

    beforeDestroy(): void {
        if (this.flowTimer !== null) window.clearInterval(this.flowTimer)
    }

    // Klipper exposes only an instantaneous velocity; a graph needs history, so
    // buffer it here. Bounded to the visible window — never grows unbounded.
    sampleFlow(): void {
        this.flowHistory.push(this.flow)
        if (this.flowHistory.length > this.flowWindowSeconds) {
            this.flowHistory.splice(0, this.flowHistory.length - this.flowWindowSeconds)
        }
    }

    get flowBounds(): { min: number; max: number } {
        const values = this.flowHistory.length ? this.flowHistory : [0]
        // always include 0 so an idle trace sits on the baseline instead of filling the box
        return { min: Math.min(0, ...values), max: Math.max(0, ...values) }
    }

    get flowMax(): number {
        return Math.round(this.flowBounds.max * 10) / 10
    }

    get flowMin(): number {
        return Math.round(this.flowBounds.min * 10) / 10
    }

    flowY(value: number): number {
        const { min, max } = this.flowBounds
        const span = max - min
        if (span <= 0) return 36
        return 68 - ((value - min) / span) * 64
    }

    get flowZeroY(): number {
        return this.flowY(0)
    }

    get flowPoints(): string {
        const history = this.flowHistory
        if (history.length < 2) return ''
        const step = 300 / (this.flowWindowSeconds - 1)
        // right-align: the newest sample always sits at the right edge
        const offset = 300 - (history.length - 1) * step
        return history.map((v, i) => `${(offset + i * step).toFixed(1)},${this.flowY(v).toFixed(1)}`).join(' ')
    }

    get availableObjects(): Array<{ name: string }> {
        if (!['printing', 'paused'].includes(this.printer_state)) return []
        const state = this.$store.state.printer.exclude_object
        const excluded = new Set<string>(state?.excluded_objects ?? [])
        return (state?.objects ?? []).filter((object: { name: string }) => !excluded.has(object.name))
    }

    get filename(): string {
        return this.$store.state.printer.print_stats?.filename ?? ''
    }

    get displayName(): string {
        if (!this.filename) return 'No active job'
        const base = this.filename.split('/').pop() ?? this.filename
        return base.replace(/\.gcode$/i, '').toUpperCase()
    }

    get printing(): boolean {
        return ['printing', 'paused'].includes(this.printer_state)
    }

    get percent(): number {
        return Math.floor((this.$store.getters['printer/getPrintPercent'] ?? 0) * 100)
    }

    get elapsed(): string {
        return formatDuration(this.$store.state.printer.print_stats?.total_duration ?? 0)
    }

    get layerText(): string {
        const cur = this.$store.getters['printer/getPrintCurrentLayer'] ?? 0
        const max = this.$store.getters['printer/getPrintMaxLayers'] ?? 0
        return `${cur} / ${max}`
    }

    get speed(): number {
        const v = Math.abs(this.$store.state.printer.motion_report?.live_velocity ?? 0)
        return Math.round(v)
    }

    get flow(): number {
        const dia = this.$store.state.printer.configfile?.settings?.extruder?.filament_diameter ?? 1.75
        const ev = this.$store.state.printer.motion_report?.live_extruder_velocity ?? 0
        const area = Math.PI * Math.pow(dia / 2, 2)
        return Math.round(area * ev * 10) / 10
    }

    get filamentText(): string {
        return formatFilament(this.$store.state.printer.print_stats?.filament_used ?? 0)
    }

    get eta(): string {
        if (!this.printing) return '--'
        return this.$store.getters['printer/getEstimatedTimeETAFormat'] || 'CALCULATING'
    }

    get canCancel(): boolean {
        const allowWhilePrinting = this.$store.state.gui.uiSettings.displayCancelPrint ?? false
        const states = allowWhilePrinting ? ['printing', 'paused'] : ['paused']
        return states.includes(this.printer_state)
    }

    get canClear(): boolean {
        return ['error', 'complete', 'cancelled'].includes(this.printer_state)
    }

    get canReprint(): boolean {
        return this.canClear && !!this.filename
    }

    pause(): void {
        this.forgeEmit('printer.print.pause', {}, 'statusPrintPause')
    }

    resume(): void {
        this.forgeEmit('printer.print.resume', {}, 'statusPrintResume')
    }

    askCancel(): void {
        if (this.$store.state.gui.uiSettings.confirmOnCancelJob ?? true) {
            this.showCancelDialog = true
            return
        }
        this.cancel()
    }

    cancel(): void {
        this.showCancelDialog = false
        this.forgeEmit('printer.print.cancel', {}, 'statusPrintCancel')
    }

    selectObject(name: string): void {
        this.selectedObject = name
    }

    excludeSelectedObject(): void {
        const name = this.selectedObject
        this.showExcludeConfirm = false
        if (name) this.$socket.emit('printer.gcode.script', { script: `EXCLUDE_OBJECT NAME=${name}` })
    }

    clear(): void {
        this.$socket.emit('printer.gcode.script', { script: 'SDCARD_RESET_FILE' }, { loading: 'statusPrintClear' })
    }

    reprint(): void {
        this.$socket.emit('printer.print.start', { filename: this.filename }, { loading: 'statusPrintReprint' })
    }
}
</script>
