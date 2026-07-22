<template>
    <div ref="host" class="liquid-glass-react-surface" aria-hidden="true" />
</template>

<script lang="ts">
import Component from 'vue-class-component'
import Vue from 'vue'
import { Prop, Ref } from 'vue-property-decorator'
import React from 'react'
import { createRoot, Root } from 'react-dom/client'
import LiquidGlass from 'liquid-glass-react'

@Component
export default class LiquidGlassReactSurface extends Vue {
    @Prop({ default: 14 }) declare readonly radius: number
    @Prop({ default: false }) declare readonly overLight: boolean
    @Ref() readonly host!: HTMLDivElement

    private root: Root | null = null

    mounted() {
        this.root = createRoot(this.host)
        this.root.render(
            React.createElement(
                LiquidGlass,
                {
                    displacementScale: 42,
                    blurAmount: 0.035,
                    saturation: 130,
                    aberrationIntensity: 1.2,
                    elasticity: 0,
                    cornerRadius: this.radius,
                    padding: '0',
                    overLight: this.overLight,
                    mode: 'standard',
                    style: {
                        position: 'absolute',
                        inset: 0,
                        top: '50%',
                        left: '50%',
                        width: '100%',
                        height: '100%',
                    },
                },
                React.createElement('span', { style: { display: 'block', width: '100%', height: '100%' } })
            )
        )
    }

    beforeDestroy() {
        this.root?.unmount()
        this.root = null
    }
}
</script>
