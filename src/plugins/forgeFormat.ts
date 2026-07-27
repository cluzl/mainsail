// Pure formatters for FORGE panels. No Vue/store — unit-testable.

export function formatDuration(totalSeconds: number): string {
    if (!isFinite(totalSeconds) || totalSeconds < 0) return '--'
    const s = Math.floor(totalSeconds)
    const h = Math.floor(s / 3600)
    const m = Math.floor((s % 3600) / 60)
    const sec = s % 60
    return `${h}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`
}

// filament length in mm -> "1.23 m" or "456 mm"
export function formatFilament(mm: number): string {
    if (!isFinite(mm) || mm <= 0) return '0 mm'
    return mm >= 1000 ? `${(mm / 1000).toFixed(2)} m` : `${Math.round(mm)} mm`
}

// clamp a requested heater target into [min,max]; 0 (cooldown) always allowed.
// returns null when the value is out of range (caller should reject + warn).
export function clampTarget(value: number, min: number, max: number): number | null {
    if (value === 0) return 0
    if (value > max || value < min) return null
    return value
}

// Mirrors MiscellaneousSlider.sendCmd. `value` is 0..1.
// Non-pwm output_pin is binary — anything above 0 is full on, never a fraction.
export function buildOutputCommand(type: string, name: string, value: number, scale: number, pwm: boolean): string {
    if (type === 'fan') return `M106 S${(value * scale).toFixed(0)}`
    if (type === 'fan_generic') return `SET_FAN_SPEED FAN=${name} SPEED=${value}`
    const pinValue = pwm ? value * scale : value > 0 ? 1 : 0
    return `SET_PIN PIN=${name} VALUE=${pinValue.toFixed(2)}`
}

// SET_GCODE_OFFSET babystep. MOVE=1 only when all axes are homed (Klipper rejects it otherwise).
export function buildBabystep(delta: number, homedAxes: string): string {
    const sign = delta < 0 ? '-' : '+'
    const move = homedAxes.toLowerCase() === 'xyz' ? ' MOVE=1' : ''
    return `SET_GCODE_OFFSET Z_ADJUST=${sign}${Math.abs(delta)}${move}`
}
