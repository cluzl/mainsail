import { Vue } from 'vue-property-decorator'
import Component from 'vue-class-component'

/**
 * Shared send helpers for FORGE-native dashboard panels.
 * Mirrors Mainsail's own execution contract exactly (ControlMixin.doSend):
 * dispatch server/addEvent console echo + socket emit. No new behavior.
 */
@Component
export default class ForgePanelMixin extends Vue {
    get socketIsConnected(): boolean {
        return this.$store.state.socket?.isConnected ?? false
    }

    get klipperReadyForGui(): boolean {
        return this.socketIsConnected && (this.$store.state.server.klippy_state ?? '') === 'ready'
    }

    get printer_state(): string {
        const state =
            this.$store.state.printer.print_stats?.state ?? this.$store.state.printer.idle_timeout?.state ?? ''
        const timelapsePause = this.$store.state.printer['gcode_macro TIMELAPSE_TAKE_FRAME']?.is_paused ?? false
        return state === 'paused' && timelapsePause ? 'printing' : state
    }

    get printerIsPrinting(): boolean {
        return ['printing', 'paused'].includes(this.printer_state)
    }

    get loadings(): string[] {
        return this.$store.state.socket.loadings ?? []
    }

    isLoading(name: string): boolean {
        return this.loadings.includes(name)
    }

    forgeSend(gcode: string): void {
        this.$store.dispatch('server/addEvent', { message: gcode, type: 'command' })
        this.$socket.emit('printer.gcode.script', { script: gcode })
    }

    forgeEmit(method: string, params: Record<string, unknown>, loading: string): void {
        this.$socket.emit(method, params, { loading })
    }
}
