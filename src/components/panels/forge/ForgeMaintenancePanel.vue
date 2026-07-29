<template>
    <div v-if="klipperReadyForGui && (hasBedMesh || sensors.length || hasPressureAdvance)" class="forge-block">
        <div class="forge-section-title">
            <span>MAINTENANCE</span>
            <small>MESH · TUNING · SENSORS</small>
        </div>

        <!-- BED MESH -->
        <div v-if="hasBedMesh" class="forge-maint-row">
            <div class="forge-maint-head">
                <label>BED MESH</label>
                <b>{{ meshName }}</b>
            </div>
            <p v-if="locked" class="forge-maint-note">Calibration is locked while the printer is busy.</p>
            <p v-else-if="!allHomed" class="forge-maint-note">Home all axes before calibrating.</p>
            <div v-if="meshPending" class="forge-maint-confirm">
                <p>Run BED_MESH_CALIBRATE? The toolhead will probe the whole bed.</p>
                <div class="forge-maint-actions">
                    <button class="forge-cmd forge-accent" @click="calibrateMesh">CONFIRM</button>
                    <button class="forge-cmd" @click="meshPending = false">CANCEL</button>
                </div>
            </div>
            <div v-else class="forge-maint-actions">
                <button class="forge-cmd" :disabled="meshLocked" @click="meshPending = true">CALIBRATE MESH</button>
                <button class="forge-cmd" :disabled="locked || !meshName" @click="clearMesh">CLEAR MESH</button>
            </div>
        </div>

        <!-- PRESSURE ADVANCE: stock Mainsail component, full numeric inputs -->
        <div v-if="hasPressureAdvance" class="forge-maint-row forge-maint-stock">
            <div class="forge-maint-head">
                <label>PRESSURE ADVANCE</label>
                <b>LIVE</b>
            </div>
            <extruder-pressure-advance-settings />
        </div>

        <!-- FILAMENT SENSORS -->
        <div v-if="sensors.length" class="forge-maint-row">
            <div class="forge-maint-head">
                <label>FILAMENT SENSORS</label>
                <b>{{ enabledCount }} / {{ sensors.length }} ENABLED</b>
            </div>
            <div class="forge-sensor-grid">
                <div v-for="sensor in sensors" :key="sensor.name" class="forge-sensor-toggle">
                    <div class="forge-sensor-label">
                        <span>{{ sensor.label }}</span>
                        <em :class="sensor.detected ? 'ready' : 'cold'">
                            {{ sensor.detected ? 'FILAMENT' : 'EMPTY' }}
                        </em>
                    </div>
                    <button
                        class="forge-mini"
                        :class="{ active: sensor.enabled }"
                        :aria-pressed="String(sensor.enabled)"
                        @click="toggleSensor(sensor)">
                        {{ sensor.enabled ? 'ON' : 'OFF' }}
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
import ExtruderPressureAdvanceSettings from '@/components/panels/Extruder/ExtruderPressureAdvanceSettings.vue'

type Sensor = { name: string; label: string; enabled: boolean; detected: boolean; type: string }

@Component({ components: { ExtruderPressureAdvanceSettings } })
export default class ForgeMaintenancePanel extends Mixins(ForgePanelMixin) {
    meshPending = false

    get locked(): boolean {
        return this.printerIsPrinting
    }

    get homedAxes(): string {
        return this.$store.state.printer.toolhead?.homed_axes ?? ''
    }

    get allHomed(): boolean {
        const homed = this.homedAxes.toLowerCase()
        return ['x', 'y', 'z'].every((axis) => homed.includes(axis))
    }

    // probing drives the toolhead across the whole bed: never mid-print, never unhomed
    get meshLocked(): boolean {
        return this.locked || !this.allHomed
    }

    get hasBedMesh(): boolean {
        return 'bed_mesh' in this.$store.state.printer
    }

    get meshName(): string {
        return this.$store.state.printer.bed_mesh?.profile_name ?? ''
    }

    get hasPressureAdvance(): boolean {
        return this.$store.state.printer.extruder?.pressure_advance !== undefined
    }

    get sensors(): Sensor[] {
        return (this.$store.getters['printer/getFilamentSensors'] ?? []).map((s: Record<string, unknown>) => ({
            name: s.name as string,
            label: String(s.name ?? '')
                .replace(/_/g, ' ')
                .toUpperCase(),
            enabled: Boolean(s.enabled),
            detected: Boolean(s.filament_detected),
            type: (s.type as string) ?? 'filament_switch_sensor',
        }))
    }

    get enabledCount(): number {
        return this.sensors.filter((s) => s.enabled).length
    }

    calibrateMesh(): void {
        this.meshPending = false
        if (this.meshLocked) return
        this.forgeSend('BED_MESH_CALIBRATE')
    }

    clearMesh(): void {
        if (this.locked) return
        this.forgeSend('BED_MESH_CLEAR')
    }

    // same command stock FilamentSensor.vue sends, including the width-sensor extra
    toggleSensor(sensor: Sensor): void {
        this.forgeSend(`SET_FILAMENT_SENSOR SENSOR=${sensor.name} ENABLE=${sensor.enabled ? 0 : 1}`)
        if (sensor.type === 'hall_filament_width_sensor') {
            this.forgeSend(`${sensor.enabled ? 'DIS' : 'EN'}ABLE_FILAMENT_WIDTH_SENSOR`)
        }
    }
}
</script>
