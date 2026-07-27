<template>
    <div class="forge-dashboard">
        <klippy-state-panel />
        <section class="forge-hero">
            <forge-job-panel />
            <forge-camera-panel />
        </section>

        <section class="forge-columns">
            <forge-motion-panel />
            <forge-thermal-panel />
            <forge-outputs-panel />
            <forge-macros-panel />
        </section>

        <forge-health-panel />
    </div>
</template>

<script lang="ts">
import Component from 'vue-class-component'
import { Mixins } from 'vue-property-decorator'
import BaseMixin from '@/components/mixins/base'
import KlippyStatePanel from '@/components/panels/KlippyStatePanel.vue'
import ForgeJobPanel from '@/components/panels/forge/ForgeJobPanel.vue'
import ForgeThermalPanel from '@/components/panels/forge/ForgeThermalPanel.vue'
import ForgeCameraPanel from '@/components/panels/forge/ForgeCameraPanel.vue'
import ForgeMotionPanel from '@/components/panels/forge/ForgeMotionPanel.vue'
import ForgeOutputsPanel from '@/components/panels/forge/ForgeOutputsPanel.vue'
import ForgeMacrosPanel from '@/components/panels/forge/ForgeMacrosPanel.vue'
import ForgeHealthPanel from '@/components/panels/forge/ForgeHealthPanel.vue'

@Component({
    components: {
        KlippyStatePanel,
        ForgeJobPanel,
        ForgeThermalPanel,
        ForgeCameraPanel,
        ForgeMotionPanel,
        ForgeOutputsPanel,
        ForgeMacrosPanel,
        ForgeHealthPanel,
    },
})
export default class PageDashboard extends Mixins(BaseMixin) {}
</script>
