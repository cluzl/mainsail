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
            <button v-if="canClear" class="forge-cmd" :disabled="isLoading('statusPrintClear')" @click="clear">
                <small>Job</small>
                <b>CLEAR</b>
            </button>
            <button
                v-if="canReprint"
                class="forge-cmd primary"
                :disabled="isLoading('statusPrintReprint')"
                @click="reprint">
                <small>Job</small>
                <b>REPRINT</b>
            </button>
        </div>

        <confirmation-dialog
            v-model="showCancelDialog"
            :icon="mdiStopCircleOutline"
            :title="$t('CancelJobDialog.CancelJob')"
            :text="$t('CancelJobDialog.AreYouSure')"
            :action-button-text="$t('Buttons.Yes')"
            :cancel-button-text="$t('Buttons.No')"
            @action="cancel" />
    </div>
</template>

<script lang="ts">
import Component from 'vue-class-component'
import { Mixins } from 'vue-property-decorator'
import ForgePanelMixin from '@/components/mixins/forgePanel'
import ConfirmationDialog from '@/components/dialogs/ConfirmationDialog.vue'
import { mdiStopCircleOutline } from '@mdi/js'
import { formatDuration, formatFilament } from '@/plugins/forgeFormat'

@Component({ components: { ConfirmationDialog } })
export default class ForgeJobPanel extends Mixins(ForgePanelMixin) {
    mdiStopCircleOutline = mdiStopCircleOutline
    showCancelDialog = false

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

    clear(): void {
        this.$socket.emit('printer.gcode.script', { script: 'SDCARD_RESET_FILE' }, { loading: 'statusPrintClear' })
    }

    reprint(): void {
        this.$socket.emit('printer.print.start', { filename: this.filename }, { loading: 'statusPrintReprint' })
    }
}
</script>
