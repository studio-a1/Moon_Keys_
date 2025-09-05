
export enum MoonPhaseName {
  NEW_MOON = 'Lua Nova',
  WAXING_CRESCENT = 'Lua Crescente',
  FIRST_QUARTER = 'Quarto Crescente',
  WAXING_GIBBOUS = 'Gibosa Crescente',
  FULL_MOON = 'Lua Cheia',
  WANING_GIBBOUS = 'Gibosa Minguante',
  THIRD_QUARTER = 'Quarto Minguante',
  WANING_CRESCENT = 'Lua Minguante',
}

export interface MoonPhaseInfo {
  phase: MoonPhaseName;
  emoji: string;
  period?: 'Positivo' | 'Negativo'; // For visual sine wave generation
  longCyclePolarity?: 'Revigorante' | 'Desgastante'; // Overall state of the 3.5 day block
}

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface TideDataPoint {
  time: Date;
  height: number;
}

export type TideExtremes = {
  high: { time: Date, height: number }[];
  low: { time: Date, height: number }[];
}

export interface CycleUnit extends MoonPhaseInfo {
  unitIndex: number; // 0-7
  startDate: Date;
  endDate: Date;
}

export interface LunarCycle {
  cycleStartDate: Date;
  cycleEndDate: Date;
  units: CycleUnit[];
  currentUnit: CycleUnit;
}

export interface ShortCyclePeriod {
  startTime: Date;
  endTime: Date;
  polarity: 'Revigorante' | 'Desgastante';
}


export interface TideChartResponse {
  chartData: TideDataPoint[];
  extremes: TideExtremes;
  shortCyclePeriods: ShortCyclePeriod[];
}
