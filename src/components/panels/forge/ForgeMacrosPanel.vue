<template>
    <div v-if="klipperReadyForGui && macros.length" class="forge-block">
        <div class="forge-section-title">
            <span>MACROS</span>
            <small>QUICK COMMANDS</small>
        </div>
        <div class="forge-macros">
            <button
                v-for="macro in macros"
                :key="macro.name"
                class="forge-macro-btn"
                :disabled="isLoading('macro_' + macro.name)"
                :title="macro.description"
                @click="run(macro)">
                {{ formatName(macro.name) }}
            </button>
        </div>
    </div>
</template>

<script lang="ts">
import Component from 'vue-class-component'
import { Mixins } from 'vue-property-decorator'
import ForgePanelMixin from '@/components/mixins/forgePanel'
import { PrinterStateMacro } from '@/store/printer/types'

@Component
export default class ForgeMacrosPanel extends Mixins(ForgePanelMixin) {
    get hiddenMacros(): string[] {
        return (this.$store.state.gui?.macros?.hiddenMacros ?? []).map((n: string) => n.toLowerCase())
    }

    get macros(): PrinterStateMacro[] {
        const macros = this.$store.getters['printer/getMacros'] ?? []
        return macros.filter((m: PrinterStateMacro) => !this.hiddenMacros.includes(m.name.toLowerCase()))
    }

    formatName(name: string): string {
        return name.replace(/_/g, ' ')
    }

    run(macro: PrinterStateMacro): void {
        // params-less execution mirrors MacroButton.doSendMacro; param macros still send base name
        this.$store.dispatch('server/addEvent', { message: macro.name, type: 'command' })
        this.$socket.emit('printer.gcode.script', { script: macro.name }, { loading: 'macro_' + macro.name })
    }
}
</script>
