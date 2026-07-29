<template>
    <div class="forge-dashboard">
        <klippy-state-panel />
        <section class="forge-hero">
            <forge-job-panel />
            <forge-camera-panel />
        </section>

        <section class="forge-columns">
            <div class="forge-column">
                <forge-motion-panel />
                <forge-outputs-panel />
            </div>
            <div class="forge-column">
                <forge-thermal-panel />
                <forge-afc-panel />
                <forge-macros-panel />
                <forge-maintenance-panel />
                <jobqueue-panel v-if="moonrakerComponents.includes('job_queue')" />
                <miniconsole-panel />
            </div>
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
import ForgeAfcPanel from '@/components/panels/forge/ForgeAfcPanel.vue'
import ForgeMacrosPanel from '@/components/panels/forge/ForgeMacrosPanel.vue'
import ForgeMaintenancePanel from '@/components/panels/forge/ForgeMaintenancePanel.vue'
import ForgeHealthPanel from '@/components/panels/forge/ForgeHealthPanel.vue'
// stock Mainsail panels: reused as-is rather than reimplemented
import JobqueuePanel from '@/components/panels/JobqueuePanel.vue'
import MiniconsolePanel from '@/components/panels/MiniconsolePanel.vue'

@Component({
    components: {
        KlippyStatePanel,
        ForgeJobPanel,
        ForgeThermalPanel,
        ForgeCameraPanel,
        ForgeMotionPanel,
        ForgeOutputsPanel,
        ForgeAfcPanel,
        ForgeMacrosPanel,
        ForgeMaintenancePanel,
        ForgeHealthPanel,
        JobqueuePanel,
        MiniconsolePanel,
    },
})
export default class PageDashboard extends Mixins(BaseMixin) {}
</script>
