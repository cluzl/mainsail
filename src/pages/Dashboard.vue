<template>
    <div class="operator-dashboard">
        <section
            class="operator-dashboard__hero"
            :class="{ 'operator-dashboard__hero--single': !arrangedPanels.webcam }">
            <status-panel class="operator-dashboard__status" />
            <component
                :is="extractPanelName(arrangedPanels.webcam.name)"
                v-if="arrangedPanels.webcam"
                :key="'dashboard-hero-' + arrangedPanels.webcam.name"
                class="operator-dashboard__camera"
                :panel-id="extractPanelId(arrangedPanels.webcam.name)" />
        </section>

        <section v-if="arrangedPanels.controls.length" class="operator-dashboard__section">
            <div class="operator-dashboard__grid operator-dashboard__grid--controls">
                <component
                    :is="extractPanelName(component.name)"
                    v-for="component in arrangedPanels.controls"
                    :key="'dashboard-control-' + component.name"
                    :panel-id="extractPanelId(component.name)" />
            </div>
        </section>

        <section v-if="arrangedPanels.utilities.length" class="operator-dashboard__section">
            <div class="operator-dashboard__grid operator-dashboard__grid--utilities">
                <component
                    :is="extractPanelName(component.name)"
                    v-for="component in arrangedPanels.utilities"
                    :key="'dashboard-utility-' + component.name"
                    :panel-id="extractPanelId(component.name)" />
            </div>
        </section>
    </div>
</template>

<script lang="ts">
import Component from 'vue-class-component'
import { Mixins } from 'vue-property-decorator'
import AfcPanel from '@/components/panels/AfcPanel.vue'
import ExtruderControlPanel from '@/components/panels/ExtruderControlPanel.vue'
import DashboardMixin from '@/components/mixins/dashboard'
import KlippyStatePanel from '@/components/panels/KlippyStatePanel.vue'
import LedEffectsPanel from '@/components/panels/LedEffectsPanel.vue'
import MachineSettingsPanel from '@/components/panels/MachineSettingsPanel.vue'
import MacrogroupPanel from '@/components/panels/MacrogroupPanel.vue'
import MacrosPanel from '@/components/panels/MacrosPanel.vue'
import MiniconsolePanel from '@/components/panels/MiniconsolePanel.vue'
import MinSettingsPanel from '@/components/panels/MinSettingsPanel.vue'
import MiscellaneousPanel from '@/components/panels/MiscellaneousPanel.vue'
import SpoolmanPanel from '@/components/panels/SpoolmanPanel.vue'
import MmuPanel from '@/components/panels/MmuPanel.vue'
import StatusPanel from '@/components/panels/StatusPanel.vue'
import ToolheadControlPanel from '@/components/panels/ToolheadControlPanel.vue'
import TemperaturePanel from '@/components/panels/TemperaturePanel.vue'
import WebcamPanel from '@/components/panels/WebcamPanel.vue'
import { arrangeDashboardPanels } from '@/pages/dashboard-layout'

@Component({
    components: {
        AfcPanel,
        ExtruderControlPanel,
        KlippyStatePanel,
        LedEffectsPanel,
        MachineSettingsPanel,
        MacrogroupPanel,
        MacrosPanel,
        MiniconsolePanel,
        MinSettingsPanel,
        MiscellaneousPanel,
        SpoolmanPanel,
        MmuPanel,
        StatusPanel,
        ToolheadControlPanel,
        TemperaturePanel,
        WebcamPanel,
    },
})
export default class PageDashboard extends Mixins(DashboardMixin) {
    get configuredPanels() {
        if (this.isMobile) return this.$store.getters['gui/getPanels']('mobile', 0, true)
        if (this.isTablet)
            return [
                ...this.$store.getters['gui/getPanels']('tablet', 1, true),
                ...this.$store.getters['gui/getPanels']('tablet', 2, true),
            ]
        if (this.isDesktop)
            return [
                ...this.$store.getters['gui/getPanels']('desktop', 1, true),
                ...this.$store.getters['gui/getPanels']('desktop', 2, true),
            ]

        return [
            ...this.$store.getters['gui/getPanels']('widescreen', 1, true),
            ...this.$store.getters['gui/getPanels']('widescreen', 2, true),
            ...this.$store.getters['gui/getPanels']('widescreen', 3, true),
        ]
    }

    get arrangedPanels() {
        return arrangeDashboardPanels(this.configuredPanels)
    }

    extractPanelName(name: string) {
        return name.split('_')[0] + '-panel'
    }

    extractPanelId(name: string) {
        return name.split('_')[1] ?? null
    }
}
</script>
