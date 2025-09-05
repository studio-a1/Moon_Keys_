
import { MoonPhaseName, LunarCycle, CycleUnit, MoonPhaseInfo } from '../types';
import SunCalc from 'suncalc';

const LUNATION_PERIOD_MS = 29.530588853 * 24 * 60 * 60 * 1000;
const UNIT_LENGTH_MS = LUNATION_PERIOD_MS / 8;

// Corrected polarity sequence based on Dr. H. Spencer Lewis's article.
// The cycle starts as Positive (Revigorante) at the New Moon (growth)
// and turns fundamentally Negative (Desgastante) after the Full Moon (decay).
const PHASES: MoonPhaseInfo[] = [
    { phase: MoonPhaseName.NEW_MOON,        emoji: "🌑", longCyclePolarity: 'Revigorante' },
    { phase: MoonPhaseName.WAXING_CRESCENT, emoji: "🌒", longCyclePolarity: 'Desgastante' },
    { phase: MoonPhaseName.FIRST_QUARTER,   emoji: "🌓", longCyclePolarity: 'Revigorante' },
    { phase: MoonPhaseName.WAXING_GIBBOUS,  emoji: "🌔", longCyclePolarity: 'Desgastante' },
    { phase: MoonPhaseName.FULL_MOON,       emoji: "🌕", longCyclePolarity: 'Revigorante' },
    { phase: MoonPhaseName.WANING_GIBBOUS,  emoji: "🌖", longCyclePolarity: 'Desgastante' },
    { phase: MoonPhaseName.THIRD_QUARTER,   emoji: "🌗", longCyclePolarity: 'Revigorante' },
    { phase: MoonPhaseName.WANING_CRESCENT, emoji: "🌘", longCyclePolarity: 'Desgastante' },
];

function getPhaseIndexFromSunCalc(phaseValue: number): number {
    // phaseValue from suncalc: 0 is new moon, 0.25 is first quarter, 0.5 is full moon, 0.75 is last quarter
    // We have 8 phases, so we multiply by 8.
    const phaseIndex = Math.floor(phaseValue * 8);
    // Handle the edge case where phase is exactly 1 (which is the next new moon)
    return phaseIndex === 8 ? 0 : phaseIndex;
}

export function calculateLunarCycle(currentDate: Date): LunarCycle {
    const moonIllumination = SunCalc.getMoonIllumination(currentDate);
    const phaseValue = moonIllumination.phase; // 0..1

    // Calculate the start of the current lunation cycle (the last new moon)
    const msSinceNewMoon = phaseValue * LUNATION_PERIOD_MS;
    const cycleStartMs = currentDate.getTime() - msSinceNewMoon;
    const cycleStartDate = new Date(cycleStartMs);
    const cycleEndDate = new Date(cycleStartMs + LUNATION_PERIOD_MS);

    const units: CycleUnit[] = [];
    let currentUnit: CycleUnit | null = null;
    const currentPhaseIndex = getPhaseIndexFromSunCalc(phaseValue);

    for (let i = 0; i < PHASES.length; i++) {
        const unitStartMs = cycleStartMs + (i * UNIT_LENGTH_MS);
        const unitEndMs = unitStartMs + UNIT_LENGTH_MS;

        const unit: CycleUnit = {
            ...PHASES[i],
            unitIndex: i,
            startDate: new Date(unitStartMs),
            endDate: new Date(unitEndMs),
        };
        units.push(unit);

        if (i === currentPhaseIndex) {
            currentUnit = unit;
        }
    }
    
    // Fallback for safety, though it should always be found.
    if (!currentUnit) {
        currentUnit = units[currentPhaseIndex];
    }

    return {
        cycleStartDate,
        cycleEndDate,
        units,
        currentUnit: currentUnit!,
    };
}
