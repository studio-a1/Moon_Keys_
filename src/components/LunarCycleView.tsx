
import React from 'react';
import { LunarCycle } from '../types';

const formatDate = (date: Date, timezoneOffsetName: string) => {
    const localDateTime = date.toLocaleString('pt-BR', {
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    });
    return `${localDateTime} (${timezoneOffsetName})`;
};

interface LunarCycleViewProps {
  cycle: LunarCycle;
  timezoneOffsetName: string;
}

const LunarCycleView: React.FC<LunarCycleViewProps> = ({ cycle, timezoneOffsetName }) => {
  return (
    <div className="flex flex-col h-full bg-slate-800/50 rounded-xl p-4 md:p-6 shadow-2xl backdrop-blur-sm border border-slate-700">
      <h2 className="text-2xl font-bold text-slate-200 mb-2 text-center">Ciclo Longo da Lua (28 dias)</h2>
      <p className="text-center text-sm text-slate-400 mb-4">
        {formatDate(cycle.cycleStartDate, timezoneOffsetName)} a {formatDate(cycle.cycleEndDate, timezoneOffsetName)}
      </p>

      <div className="space-y-2 overflow-y-auto pr-2 flex-grow" style={{ maxHeight: '45vh' }}>
        {cycle.units.map((unit) => {
          const isCurrent = unit.unitIndex === cycle.currentUnit.unitIndex;
          return (
            <div key={unit.unitIndex} className={`p-3 rounded-lg border transition-all duration-300 ${isCurrent ? 'bg-cyan-900/50 border-cyan-500 shadow-lg' : 'bg-slate-700/40 border-slate-600'}`}>
              <div className="flex items-center space-x-4">
                <span className="text-3xl">{unit.emoji}</span>
                <div className="flex-grow">
                  <div className="flex items-center space-x-2">
                    <p className={`font-semibold ${isCurrent ? 'text-cyan-300' : 'text-slate-200'}`}>{unit.phase}</p>
                    {unit.longCyclePolarity === 'Revigorante' && (
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-green-800/80 text-green-200 border border-green-600">
                        {unit.longCyclePolarity}
                      </span>
                    )}
                    {unit.longCyclePolarity === 'Desgastante' && (
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-800/80 text-red-200 border border-red-600">
                        {unit.longCyclePolarity}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400">
                    {formatDate(unit.startDate, timezoneOffsetName)} - {formatDate(unit.endDate, timezoneOffsetName)}
                  </p>
                </div>
                {isCurrent && <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" title="Fase Atual"></div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default LunarCycleView;
