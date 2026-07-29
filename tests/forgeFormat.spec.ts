import { describe, expect, it } from 'vitest'
import {
    buildBabystep,
    buildOutputCommand,
    clampOutput,
    clampTarget,
    formatDuration,
    formatFilament,
    formatRpm,
} from '@/plugins/forgeFormat'

describe('FORGE panel formatters', () => {
    it('formats duration and filament telemetry', () => {
        expect(formatDuration(3661)).toBe('1:01:01')
        expect(formatDuration(-1)).toBe('--')
        expect(formatFilament(1536)).toBe('1.54 m')
        expect(formatFilament(450)).toBe('450 mm')
        expect(formatRpm(13197.360527901084)).toBe('13,197')
        expect(formatRpm(null)).toBeNull()
        expect(formatRpm(-1)).toBeNull()
    })

    it('accepts safe heater targets and always permits cooldown', () => {
        expect(clampTarget(255, 10, 300)).toBe(255)
        expect(clampTarget(0, 10, 300)).toBe(0)
        expect(clampTarget(301, 10, 300)).toBeNull()
        expect(clampTarget(5, 10, 300)).toBeNull()
    })

    it('preserves proportional PWM output values and binary pin semantics', () => {
        expect(buildOutputCommand('fan', 'fan', 0.5, 255, true)).toBe('M106 S128')
        expect(buildOutputCommand('fan_generic', 'BedFans', 0.37, 1, true)).toBe('SET_FAN_SPEED FAN=BedFans SPEED=0.37')
        expect(buildOutputCommand('output_pin', 'case_light', 0.37, 1, true)).toBe('SET_PIN PIN=case_light VALUE=0.37')
        expect(buildOutputCommand('output_pin', 'relay', 0.37, 1, false)).toBe('SET_PIN PIN=relay VALUE=1.00')
        expect(buildOutputCommand('output_pin', 'relay', 0, 1, false)).toBe('SET_PIN PIN=relay VALUE=0.00')
    })

    it('applies max_power ceiling and off_below floor like Mainsail', () => {
        expect(clampOutput(1, 0, 0.6)).toBeCloseTo(0.6)
        expect(clampOutput(0.5, 0, 0.6)).toBeCloseTo(0.3)
        expect(clampOutput(0.05, 0.2, 1)).toBe(0)
        expect(clampOutput(0, 0.2, 1)).toBe(0)
        expect(clampOutput(0.5, 0.2, 1)).toBeCloseTo(0.5)
    })

    it('builds babysteps with MOVE=1 only when fully homed', () => {
        expect(buildBabystep(0.025, 'xyz')).toBe('SET_GCODE_OFFSET Z_ADJUST=+0.025 MOVE=1')
        expect(buildBabystep(-0.05, 'xyz')).toBe('SET_GCODE_OFFSET Z_ADJUST=-0.05 MOVE=1')
        expect(buildBabystep(0.01, 'xy')).toBe('SET_GCODE_OFFSET Z_ADJUST=+0.01')
        expect(buildBabystep(0.01, '')).toBe('SET_GCODE_OFFSET Z_ADJUST=+0.01')
    })
})
