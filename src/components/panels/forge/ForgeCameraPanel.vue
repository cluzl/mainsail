<template>
    <div v-if="webcams.length" class="forge-block forge-camera">
        <webcam-wrapper-item :webcam="currentCam" :show-fps="true" page="dashboard" />
        <div class="forge-cam-tag">
            <i></i>
            LIVE / {{ (currentCam.name || 'CAM').toUpperCase() }}
        </div>
    </div>
</template>

<script lang="ts">
import Component from 'vue-class-component'
import { Mixins } from 'vue-property-decorator'
import ForgePanelMixin from '@/components/mixins/forgePanel'
import WebcamWrapperItem from '@/components/webcams/WebcamWrapperItem.vue'
import { GuiWebcamStateWebcam } from '@/store/gui/webcams/types'

@Component({ components: { WebcamWrapperItem } })
export default class ForgeCameraPanel extends Mixins(ForgePanelMixin) {
    get webcams(): GuiWebcamStateWebcam[] {
        return this.$store.getters['gui/webcams/getWebcams'] ?? []
    }

    get currentCam(): GuiWebcamStateWebcam {
        return this.webcams[0]
    }
}
</script>
