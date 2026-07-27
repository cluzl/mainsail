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
                    :value="Math.round(item.value * 100)"
                    :aria-label="'Set ' + item.name"
                    @change="setValue(item, Number($event.target.value) / 100)" />
                <div v-else-if="item.controllable" class="forge-step-select">
                    <button class="forge-mini" :class="{ active: item.value > 0 }" @click="setValue(item, 1)">ON</button>
                    <button class="forge-mini" :class="{ active: item.value === 0 }" @click="setValue(item, 0)">
                        OFF
                    </button>
                </div>
                <div v-else class="forge-output-static">
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
import { buildOutputCommand } from '@/plugins/forgeFormat'

type MiscItem = {
    name: string
    type: string
    value: number
    controllable: boolean
    pwm: boolean
    scale: number
    rpm: number | null
}

@Component
export default class ForgeOutputsPanel extends Mixins(ForgePanelMixin) {
    get items(): MiscItem[] {
        return (this.$store.getters['printer/getMiscellaneous'] ?? []).map((m: Record<string, unknown>) => ({
            name: m.name as string,
            type: m.type as string,
            value: (m.power as number) ?? 0,
            controllable: (m.controllable as boolean) ?? false,
            pwm: (m.pwm as boolean) ?? false,
            scale: (m.scale as number) ?? 1,
            rpm: (m.rpm as number) ?? null,
        }))
    }

    formatName(name: string): string {
        return name.replace(/_/g, ' ')
    }

    // value is 0..1
    setValue(item: MiscItem, value: number): void {
        this.forgeSend(buildOutputCommand(item.type, item.name, value, item.scale, item.pwm))
    }
}
</script>
