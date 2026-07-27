<template>
    <div v-if="klipperReadyForGui && items.length" class="forge-block">
        <div class="forge-section-title">
            <span>OUTPUTS</span>
            <small>FANS · PINS</small>
        </div>
        <div class="forge-outputs">
            <div v-for="item in items" :key="item.name" class="forge-output">
                <div class="forge-output-head">
                    <label>{{ formatName(item.name) }}</label>
                    <b>
                        {{ Math.round(item.value * 100) }}%
                        <em v-if="item.rpm">· {{ item.rpm }} RPM</em>
                    </b>
                </div>
                <input
                    v-if="item.controllable && item.pwm"
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    :disabled="sliderLocked(item.name)"
                    :value="Math.round((item.value / item.maxPower) * 100)"
                    :aria-label="'Set ' + item.name"
                    @change="setValue(item, Number($event.target.value) / 100)" />
                <button
                    v-if="item.controllable && item.pwm && sliderLocked(item.name)"
                    class="forge-mini"
                    :aria-label="'Unlock ' + item.name + ' slider'"
                    @click="$set(unlocked, item.name, true)">
                    UNLOCK
                </button>
                <div v-if="item.controllable && !item.pwm" class="forge-step-select">
                    <button class="forge-mini" :class="{ active: item.value > 0 }" @click="setValue(item, 1)">
                        ON
                    </button>
                    <button class="forge-mini" :class="{ active: item.value === 0 }" @click="setValue(item, 0)">
                        OFF
                    </button>
                </div>
                <div v-if="!item.controllable" class="forge-output-static">
                    <div class="forge-bar"><i :style="{ width: item.value * 100 + '%' }"></i></div>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import Component from 'vue-class-component'
import { Mixins } from 'vue-property-decorator'
import ForgePanelMixin from '@/components/mixins/forgePanel'
import { buildOutputCommand, clampOutput } from '@/plugins/forgeFormat'

type MiscItem = {
    name: string
    type: string
    value: number
    controllable: boolean
    pwm: boolean
    scale: number
    rpm: number | null
    offBelow: number
    maxPower: number
}

@Component
export default class ForgeOutputsPanel extends Mixins(ForgePanelMixin) {
    unlocked: Record<string, boolean> = {}

    get lockSliders(): boolean {
        return this.$store.state.gui.uiSettings.lockSlidersOnTouchDevices ?? false
    }

    sliderLocked(name: string): boolean {
        return this.lockSliders && this.isTouchDevice && !this.unlocked[name]
    }

    get items(): MiscItem[] {
        return (this.$store.getters['printer/getMiscellaneous'] ?? []).map((m: Record<string, unknown>) => ({
            name: m.name as string,
            type: m.type as string,
            value: (m.power as number) ?? 0,
            controllable: (m.controllable as boolean) ?? false,
            pwm: (m.pwm as boolean) ?? false,
            scale: (m.scale as number) ?? 1,
            rpm: (m.rpm as number) ?? null,
            offBelow: (m.off_below as number) ?? 0,
            maxPower: (m.max_power as number) ?? 1,
        }))
    }

    formatName(name: string): string {
        return name.replace(/_/g, ' ')
    }

    // value is 0..1 of the slider; Mainsail scales it by max_power and snaps below off_below.
    setValue(item: MiscItem, value: number): void {
        const scaled = clampOutput(value, item.offBelow, item.maxPower)
        this.forgeSend(buildOutputCommand(item.type, item.name, scaled, item.scale, item.pwm))
    }
}
</script>
