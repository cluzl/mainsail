<template>
    <div v-if="klipperReadyForGui" class="forge-block">
        <div class="forge-section-title">
            <span>MOTION</span>
            <small>{{ homedText }}</small>
        </div>
        <div class="forge-motion">
            <div class="forge-pos">
                <div v-for="ax in axes" :key="ax.name" class="forge-pos-cell" :class="{ unhomed: !ax.homed }">
                    <small>{{ ax.name }} · {{ ax.homed ? 'HOMED' : 'NOT HOMED' }}</small>
                    <b>{{ ax.homed ? ax.value : '—' }}</b>
                </div>
            </div>

            <p v-if="printer_state === 'printing'" class="forge-motion-lock">MOTION LOCKED — PRINT IN PROGRESS</p>
            <p v-else-if="!allHomed" class="forge-motion-lock">
                HOME BEFORE JOGGING — POSITION IS UNKNOWN UNTIL AXES ARE HOMED
            </p>

            <div class="forge-motion-actions">
                <button class="forge-cmd" :disabled="locked || isLoading('homeAll')" @click="home('')">
                    <small>Home</small>
                    <b>ALL AXES</b>
                </button>
                <button class="forge-cmd" :disabled="locked || isLoading('homeZ')" @click="home('Z')">
                    <small>Home</small>
                    <b>Z AXIS</b>
                </button>
                <button
                    v-if="existsQGL"
                    class="forge-cmd"
                    :disabled="locked || !allHomed || isLoading('qgl')"
                    @click="qgl">
                    <small>Level gantry</small>
                    <b>QGL</b>
                </button>
                <button
                    v-if="existsZtilt"
                    class="forge-cmd"
                    :disabled="locked || !allHomed || isLoading('zTilt')"
                    @click="zTilt">
                    <small>Level gantry</small>
                    <b>Z-TILT</b>
                </button>
            </div>

            <div class="forge-jog">
                <div class="forge-jog-grid" aria-label="XY jog pad">
                    <button class="forge-jog-btn up" :disabled="jogLocked" @click="jog('Y', step)">Y+</button>
                    <button class="forge-jog-btn left" :disabled="jogLocked" @click="jog('X', -step)">X−</button>
                    <span class="forge-jog-hub">XY</span>
                    <button class="forge-jog-btn right" :disabled="jogLocked" @click="jog('X', step)">X+</button>
                    <button class="forge-jog-btn down" :disabled="jogLocked" @click="jog('Y', -step)">Y−</button>
                </div>
                <div class="forge-jog-z" aria-label="Z jog controls">
                    <button class="forge-jog-btn" :disabled="jogLocked" @click="jog('Z', zStep)">
                        Z+ · {{ zStep }} mm
                    </button>
                    <button class="forge-jog-btn" :disabled="jogLocked" @click="jog('Z', -zStep)">
                        Z− · {{ zStep }} mm
                    </button>
                </div>
                <div class="forge-step-box">
                    <span class="forge-step-label">XY JOG STEP · MM</span>
                    <div class="forge-step-select">
                        <button
                            v-for="s in stepChoices"
                            :key="s"
                            class="forge-mini"
                            :class="{ active: s === step }"
                            @click="step = s">
                            {{ s }}
                        </button>
                    </div>
                </div>
            </div>

            <!-- babystep: intentionally available while printing, that is when it matters -->
            <div class="forge-slider-row">
                <label>Z OFFSET</label>
                <div class="forge-btn-row">
                    <button
                        v-for="o in offsetsZ"
                        :key="'zu' + o"
                        class="forge-mini"
                        :aria-label="'Babystep up ' + o"
                        @click="babystep(o)">
                        +{{ o }}
                    </button>
                    <button
                        v-for="o in offsetsZ.slice().reverse()"
                        :key="'zd' + o"
                        class="forge-mini"
                        :aria-label="'Babystep down ' + o"
                        @click="babystep(-o)">
                        −{{ o }}
                    </button>
                    <button v-if="zOffset !== 0" class="forge-mini" @click="clearZOffset">CLR</button>
                </div>
                <b>{{ zOffset.toFixed(3) }}</b>
            </div>
            <div class="forge-slider-row">
                <label>SPEED FACTOR</label>
                <input
                    type="range"
                    min="1"
                    max="200"
                    step="5"
                    :disabled="tuningLocked"
                    :value="speedFactorPct"
                    aria-label="Speed factor"
                    @change="setSpeed($event)" />
                <b>{{ speedFactorPct }}%</b>
            </div>

            <div class="forge-slider-row">
                <label>FLOW FACTOR</label>
                <input
                    type="range"
                    min="50"
                    max="150"
                    step="1"
                    :disabled="tuningLocked"
                    :value="extrudeFactorPct"
                    aria-label="Extrusion factor"
                    @change="setFlow($event)" />
                <b>{{ extrudeFactorPct }}%</b>
            </div>
            <button v-if="tuningLocked" class="forge-mini" @click="tuningUnlocked = true">UNLOCK TUNING</button>

            <div class="forge-extruder">
                <div class="forge-extruder-head">
                    <label>EXTRUDER</label>
                    <b :class="canExtrude ? 'ready' : 'cold'">
                        {{ canExtrude ? 'READY' : 'COLD' }} · {{ extruderTemp }} °C
                    </b>
                </div>
                <span class="forge-step-label">MOVE DISTANCE · MM</span>
                <div class="forge-step-select wide">
                    <button
                        v-for="l in extrudeChoices"
                        :key="'el' + l"
                        class="forge-mini"
                        :class="{ active: l === extrudeLength }"
                        @click="extrudeLength = l">
                        {{ l }}
                    </button>
                </div>
                <span class="forge-step-label">FEED RATE · MM/S</span>
                <div class="forge-step-select wide">
                    <button
                        v-for="rate in extrudeFeedrateChoices"
                        :key="'ef' + rate"
                        class="forge-mini"
                        :class="{ active: rate === selectedExtrudeFeedrate }"
                        @click="selectedExtrudeFeedrate = rate">
                        {{ rate }}
                    </button>
                </div>
                <div class="forge-extruder-actions">
                    <button class="forge-cmd" :disabled="!canExtrude" @click="extrude(-extrudeLength)">
                        ← RETRACT {{ extrudeLength }} MM
                    </button>
                    <button class="forge-cmd forge-accent" :disabled="!canExtrude" @click="extrude(extrudeLength)">
                        EXTRUDE {{ extrudeLength }} MM →
                    </button>
                </div>
                <p class="forge-extruder-hint">
                    <template v-if="canExtrude">
                        Ready to move filament. Feed rate {{ selectedExtrudeFeedrate }} mm/s.
                    </template>
                    <template v-else>
                        Nozzle too cold. Heat to at least {{ minExtrudeTemp }} °C to enable movement.
                    </template>
                </p>
            </div>

            <div class="forge-danger-zone">
                <p>
                    <strong>Disable steppers</strong>
                    Position becomes untrusted. Re-home before printing.
                </p>
                <button class="forge-cmd stop" :disabled="locked" @click="motorsOff">MOTORS OFF</button>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import Component from 'vue-class-component'
import { Mixins } from 'vue-property-decorator'
import ForgePanelMixin from '@/components/mixins/forgePanel'
import { buildBabystep } from '@/plugins/forgeFormat'

@Component
export default class ForgeMotionPanel extends Mixins(ForgePanelMixin) {
    step = 10
    stepChoices = [0.1, 1, 10, 50]
    extrudeLength = 10
    extrudeChoices = [1, 5, 10, 25]
    // hand-feeding a cold-ish nozzle needs a slow rate; purging wants a fast one
    extrudeFeedrateChoices = [2, 5, 10, 15]
    feedrateOverride = 0
    tuningUnlocked = false

    get tuningLocked(): boolean {
        const lock = this.$store.state.gui.uiSettings.lockSlidersOnTouchDevices ?? false
        return lock && this.isTouchDevice && !this.tuningUnlocked
    }

    get locked(): boolean {
        return this.printerIsPrinting
    }

    get homedAxes(): string {
        return this.$store.state.printer.toolhead?.homed_axes ?? ''
    }

    get homedText(): string {
        return this.homedAxes ? `HOMED ${this.homedAxes.toUpperCase()}` : 'NOT HOMED'
    }

    get allHomed(): boolean {
        const homed = this.homedAxes.toLowerCase()
        return ['x', 'y', 'z'].every((axis) => homed.includes(axis))
    }

    // Normal Mainsail allows manual recovery moves while paused. Only a running
    // toolpath owns XY; a paused, fully-homed machine may be jogged safely.
    get jogLocked(): boolean {
        return this.printer_state === 'printing' || !this.allHomed
    }

    // Z steps are collision-relevant: never inherit a 50 mm XY step.
    get zStep(): number {
        return Math.min(this.step, 10)
    }

    get axes() {
        const pos = this.$store.state.printer.gcode_move?.gcode_position ?? [0, 0, 0]
        const homed = this.homedAxes.toLowerCase()
        return [
            { name: 'X', value: (pos[0] ?? 0).toFixed(2), homed: homed.includes('x') },
            { name: 'Y', value: (pos[1] ?? 0).toFixed(2), homed: homed.includes('y') },
            { name: 'Z', value: (pos[2] ?? 0).toFixed(2), homed: homed.includes('z') },
        ]
    }

    get existsQGL(): boolean {
        return this.$store.getters['printer/existsQGL'] ?? false
    }

    get existsZtilt(): boolean {
        return this.$store.getters['printer/existsZtilt'] ?? false
    }

    get speedFactorPct(): number {
        return Math.round((this.$store.state.printer.gcode_move?.speed_factor ?? 1) * 100)
    }

    get extrudeFactorPct(): number {
        return Math.round((this.$store.state.printer.gcode_move?.extrude_factor ?? 1) * 100)
    }

    get offsetsZ(): number[] {
        return this.$store.state.gui.control?.offsetsZ ?? [0.005, 0.01, 0.025, 0.05]
    }

    get zOffset(): number {
        return this.$store.state.printer.gcode_move?.homing_origin?.[2] ?? 0
    }

    // Klipper refuses extrusion below min_extrude_temp; can_extrude carries that.
    get canExtrude(): boolean {
        return this.$store.state.printer.extruder?.can_extrude ?? false
    }

    get extruderTemp(): string {
        return (this.$store.state.printer.extruder?.temperature ?? 0).toFixed(1)
    }

    get minExtrudeTemp(): number {
        return this.$store.state.printer.configfile?.settings?.extruder?.min_extrude_temp ?? 170
    }

    get maxExtrudeOnly(): number {
        return this.$store.state.printer.configfile?.settings?.extruder?.max_extrude_only_distance ?? 50
    }

    get feedrateXY(): number {
        return this.$store.state.gui.control?.feedrateXY ?? 100
    }

    get feedrateZ(): number {
        return this.$store.state.gui.control?.feedrateZ ?? 25
    }

    get extrudeFeedrate(): number {
        return this.$store.state.gui.control?.extruder?.feedrate ?? 5
    }

    get selectedExtrudeFeedrate(): number {
        return this.feedrateOverride || this.extrudeFeedrate
    }

    set selectedExtrudeFeedrate(value: number) {
        if (this.extrudeFeedrateChoices.includes(value)) this.feedrateOverride = value
    }

    home(axis: string): void {
        if (this.locked) return
        const gcode = axis ? `G28 ${axis}` : 'G28'
        const loading = axis ? 'home' + axis : 'homeAll'
        this.$store.dispatch('server/addEvent', { message: gcode, type: 'command' })
        this.$socket.emit('printer.gcode.script', { script: gcode }, { loading })
    }

    qgl(): void {
        if (this.locked || !this.allHomed) return
        this.$store.dispatch('server/addEvent', { message: 'QUAD_GANTRY_LEVEL', type: 'command' })
        this.$socket.emit('printer.gcode.script', { script: 'QUAD_GANTRY_LEVEL' }, { loading: 'qgl' })
    }

    zTilt(): void {
        if (this.locked || !this.allHomed) return
        this.$store.dispatch('server/addEvent', { message: 'Z_TILT_ADJUST', type: 'command' })
        this.$socket.emit('printer.gcode.script', { script: 'Z_TILT_ADJUST' }, { loading: 'zTilt' })
    }

    motorsOff(): void {
        if (this.locked) return
        this.forgeSend('M84')
    }

    // same safety wrapper Mainsail uses (control.ts doSendMove)
    jog(axis: string, distance: number): void {
        if (this.jogLocked) return
        const feedrate = (axis === 'Z' ? this.feedrateZ : this.feedrateXY) * 60
        const gcode = [
            'SAVE_GCODE_STATE NAME=_ui_movement',
            'G91',
            `G1 ${axis}${distance} F${feedrate}`,
            'RESTORE_GCODE_STATE NAME=_ui_movement',
        ].join('\n')
        this.forgeSend(gcode)
    }

    babystep(delta: number): void {
        this.forgeSend(buildBabystep(delta, this.homedAxes))
    }

    clearZOffset(): void {
        this.forgeSend('SET_GCODE_OFFSET Z=0' + (this.homedAxes.toLowerCase() === 'xyz' ? ' MOVE=1' : ''))
    }

    extrude(length: number): void {
        if (!this.canExtrude) return
        if (Math.abs(length) > this.maxExtrudeOnly) {
            this.$toast.error(`Exceeds max_extrude_only_distance (${this.maxExtrudeOnly} mm)`)
            return
        }
        const gcode = [
            'SAVE_GCODE_STATE NAME=_ui_extrude',
            'M83',
            `G1 E${length} F${this.selectedExtrudeFeedrate * 60}`,
            'RESTORE_GCODE_STATE NAME=_ui_extrude',
        ].join('\n')
        this.forgeSend(gcode)
    }

    setSpeed(event: Event): void {
        const val = Number((event.target as HTMLInputElement).value)
        this.forgeSend(`M220 S${val}`)
    }

    setFlow(event: Event): void {
        const val = Number((event.target as HTMLInputElement).value)
        this.forgeSend(`M221 S${val}`)
    }
}
</script>
