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

// Mainsail's slider semantics: the 0..1 handle spans 0..max_power, and any
// non-zero request under off_below is snapped to 0 (the fan/pin cannot sustain it).
export function clampOutput(value: number, offBelow: number, maxPower: number): number {
    const scaled = Math.min(Math.max(value, 0), 1) * (maxPower > 0 ? maxPower : 1)
    return scaled > 0 && scaled < offBelow ? 0 : scaled
}

// Mirrors MiscellaneousSlider.sendCmd. `value` is 0..1.
// Non-pwm output_pin is binary — anything above 0 is full on, never a fraction.
export function buildOutputCommand(type: string, name: string, value: number, scale: number, pwm: boolean): string {
    if (type === 'fan') return `M106 S${(value * scale).toFixed(0)}`
    if (type === 'fan_generic') return `SET_FAN_SPEED FAN=${name} SPEED=${value}`
    const pinValue = pwm ? value * scale : value > 0 ? 1 : 0
    return `SET_PIN PIN=${name} VALUE=${pinValue.toFixed(2)}`
}

// Klipper reports tachometer RPM as a raw float (13197.360527901084).
// Nobody reads six decimals on a fan: round and group.
export function formatRpm(rpm: number | null): string | null {
    if (rpm === null || !isFinite(rpm) || rpm < 0) return null
    return Math.round(rpm).toLocaleString('en-US')
}

// SET_GCODE_OFFSET babystep. MOVE=1 only when all axes are homed (Klipper rejects it otherwise).
export function buildBabystep(delta: number, homedAxes: string): string {
    const sign = delta < 0 ? '-' : '+'
    const move = homedAxes.toLowerCase() === 'xyz' ? ' MOVE=1' : ''
    return `SET_GCODE_OFFSET Z_ADJUST=${sign}${Math.abs(delta)}${move}`
}
