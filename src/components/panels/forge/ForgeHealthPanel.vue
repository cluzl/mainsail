<template>
    <section class="forge-block forge-health">
        <div class="forge-health-head">
            <div>
                <div class="forge-kicker">PRINTER HEALTH</div>
                <strong>{{ verdict }}</strong>
                <small>{{ freshness }}</small>
            </div>
            <div class="forge-health-score" :class="scoreClass">{{ score == null ? '—' : score }}</div>
        </div>

        <nav class="forge-health-tabs" aria-label="Printer health sections">
            <button
                v-for="item in tabs"
                :key="item.key"
                type="button"
                :class="{ active: tab === item.key }"
                @click="tab = item.key">
                {{ item.label }}
            </button>
        </nav>

        <div v-if="error" class="forge-health-alert">{{ error }}</div>
        <div v-else-if="tab === 'overview'" class="forge-health-grid">
            <article v-for="(domain, name) in domains" :key="name">
                <span>{{ name }}</span>
                <b>{{ domain.score == null ? '—' : domain.score }}</b>
                <small>{{ domain.status }}</small>
            </article>
        </div>
        <div v-else-if="tab === 'motion'" class="forge-health-grid">
            <article v-for="item in motion" :key="item[0]">
                <span>{{ item[0] }}</span>
                <b>{{ item[1] }}</b>
            </article>
        </div>
        <div v-else-if="tab === 'thermal'" class="forge-health-list">
            <div v-for="(item, name) in thermal" :key="name">
                <span>{{ clean(name) }}</span>
                <b>{{ item.stable ? 'STABLE' : 'SETTLING' }}</b>
                <small>{{ item.span_c ?? '—' }} °C span</small>
            </div>
            <div>
                <span>Z tilt</span>
                <b>{{ geometry.z_tilt?.applied ? 'APPLIED' : 'NOT APPLIED' }}</b>
            </div>
            <div>
                <span>Mesh range</span>
                <b>{{ geometry.mesh_metrics?.range ?? '—' }} mm</b>
            </div>
        </div>
        <div v-else-if="tab === 'filament'" class="forge-health-list">
            <div>
                <span>Verdict</span>
                <b>{{ filament.classification || 'INSUFFICIENT EVIDENCE' }}</b>
            </div>
            <div>
                <span>Loaded lane</span>
                <b>{{ filament.afc?.current_load || 'NONE' }}</b>
            </div>
            <div>
                <span>MDM movement</span>
                <b>{{ yes(filament.mdm?.filament_detected) }}</b>
            </div>
            <div>
                <span>Tool sensor</span>
                <b>{{ yes(filament.tool_start?.filament_detected) }}</b>
            </div>
        </div>
        <div v-else-if="tab === 'vision'" class="forge-health-list">
            <div>
                <span>Sources</span>
                <b>{{ vision.sources_available ? 'AVAILABLE' : 'UNAVAILABLE' }}</b>
            </div>
            <div>
                <span>Fused verdict</span>
                <b>{{ !vision.sources_available ? 'UNAVAILABLE' : vision.fused_alert ? 'ALERT' : 'CLEAR' }}</b>
            </div>
            <div>
                <span>Print Watch</span>
                <b>{{ vision.print_watch?.status || 'UNAVAILABLE' }}</b>
            </div>
            <div>
                <span>Scene Guard</span>
                <b>{{ vision.scene_guard?.available ? 'AVAILABLE' : 'UNAVAILABLE' }}</b>
            </div>
        </div>
        <div v-else class="forge-health-list">
            <div>
                <span>Latest print</span>
                <b>{{ report?.filename || 'NO REPORT YET' }}</b>
            </div>
            <div>
                <span>State</span>
                <b>{{ report?.state || '—' }}</b>
            </div>
            <div>
                <span>Report ID</span>
                <b>{{ report?.id || '—' }}</b>
            </div>
            <div v-if="report" class="forge-health-links">
                <a v-if="report.json" :href="`/api/ratrig-health/v1/reports/${report.json}`" target="_blank">JSON</a>
                <a v-if="report.text" :href="`/api/ratrig-health/v1/reports/${report.text}`" target="_blank">TEXT</a>
            </div>
        </div>
        <p>Observation only · no automatic action</p>
    </section>
</template>

<script lang="ts">
import Component from 'vue-class-component'
import { Mixins } from 'vue-property-decorator'
import BaseMixin from '@/components/mixins/base'

@Component
export default class ForgeHealthPanel extends Mixins(BaseMixin) {
    tab = 'overview'
    status: Record<string, unknown> = {}
    error: string | null = null
    timer: ReturnType<typeof setInterval> | null = null
    loading = false
    tabs = [
        { key: 'overview', label: 'Overview' },
        { key: 'motion', label: 'Motion' },
        { key: 'thermal', label: 'Thermal / Bed' },
        { key: 'filament', label: 'Filament' },
        { key: 'vision', label: 'Vision' },
        { key: 'reports', label: 'Reports' },
    ]

    get health() {
        return this.status.health ?? {}
    }
    get domains() {
        return this.health.domains ?? {}
    }
    get thermal() {
        return this.health.thermal ?? {}
    }
    get geometry() {
        return this.health.geometry ?? {}
    }
    get filament() {
        return this.health.filament ?? {}
    }
    get vision() {
        return this.health.vision ?? {}
    }
    get report() {
        return this.health.report ?? null
    }
    get beacon() {
        return this.status.beacon_health ?? {}
    }
    get age() {
        return this.status.generated_at
            ? Math.max(0, Math.round((Date.now() - Date.parse(this.status.generated_at)) / 1000))
            : Infinity
    }
    get stale() {
        return this.age > 20
    }
    get score() {
        return this.stale ? null : (this.health.overall?.score ?? null)
    }
    get verdict() {
        return this.stale ? 'UNAVAILABLE' : (this.health.overall?.verdict ?? 'COLLECTING DATA')
    }
    get freshness() {
        return Number.isFinite(this.age)
            ? this.stale
                ? `Snapshot stale · ${this.age}s`
                : `Updated ${this.age}s ago`
            : 'Health service unavailable'
    }
    get scoreClass() {
        return this.score == null ? 'muted' : this.score >= 90 ? 'good' : this.score >= 70 ? 'watch' : 'bad'
    }
    get motion() {
        const ecg = this.beacon.ecg ?? {}
        return [
            ['p95', this.fmt(ecg.p95)],
            ['p99', this.fmt(ecg.p99)],
            ['Peak', this.fmt(ecg.max)],
            ['Impacts', this.beacon.impacts ?? 0],
            ['Drag flags', this.beacon.nozzle_drag_events ?? 0],
            ['Samples', this.fmt(ecg.samples)],
        ]
    }

    fmt(value: unknown) {
        return value == null ? '—' : Math.round(Number(value)).toLocaleString('en-US')
    }
    yes(value: unknown) {
        return value ? 'YES' : 'NO'
    }
    clean(value: string) {
        return value.replace('temperature_sensor ', '').replace('heater_generic ', '').replaceAll('_', ' ')
    }
    mounted() {
        this.loadStatus()
        this.timer = setInterval(this.loadStatus, 5000)
    }
    beforeDestroy() {
        if (this.timer) clearInterval(this.timer)
    }
    async loadStatus() {
        if (this.loading || document.hidden) return
        this.loading = true
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 4000)
        try {
            const response = await fetch('/api/ratrig-health/v1/status', {
                cache: 'no-store',
                signal: controller.signal,
            })
            if (!response.ok) throw new Error(`HTTP ${response.status}`)
            this.status = await response.json()
            this.error = null
        } catch (error) {
            this.error = `Health snapshot unavailable: ${error}`
        } finally {
            clearTimeout(timeout)
            this.loading = false
        }
    }
}
</script>
