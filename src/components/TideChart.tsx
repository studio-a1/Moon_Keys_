import React, { useState, useEffect, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Label, Scatter, ReferenceArea } from 'recharts';
import { TideChartResponse, TideExtremes, ShortCyclePeriod, TideDataPoint } from '../types';
import { Waves, Anchor } from 'lucide-react';
import Loader from './Loader';

const formatLocalTime = (date: Date): string => {
  if (!date || isNaN(date.getTime())) return '--:--';
  return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
};

// Helper to determine the polarity of a specific time point based on the pre-calculated short cycle periods.
const getPointPolarityFromPeriods = (time: number, periods: ShortCyclePeriod[]): 'positive' | 'negative' => {
    const period = periods.find(p => time >= p.startTime.getTime() && time < p.endTime.getTime());
    
    // Handle the very last point, which might be exactly at the end time of the last period.
    if (!period) {
        const lastPeriod = periods[periods.length - 1];
        if (lastPeriod && time === lastPeriod.endTime.getTime()) {
            return lastPeriod.polarity === 'Revigorante' ? 'positive' : 'negative';
        }
    }

    if (period?.polarity === 'Desgastante') {
        return 'negative';
    }
    if (period?.polarity === 'Revigorante') {
        return 'positive';
    }
    // This should not be reached with the new logic, but as a safe fallback for recharts.
    return 'negative';
};

// Helper to split chart data into contiguous segments of the same polarity.
const getSegmentedData = (data: TideDataPoint[], periods: ShortCyclePeriod[]) => {
    if (!data || data.length === 0) {
        return [{ polarity: 'negative' as const, data }];
    }

    const segments: { polarity: 'positive' | 'negative', data: TideDataPoint[] }[] = [];
    if (data.length === 0) return segments;

    let lastCutIndex = 0;
    let currentPolarity = getPointPolarityFromPeriods(data[0].time.getTime(), periods);

    for (let i = 1; i < data.length; i++) {
        const point = data[i];
        const polarity = getPointPolarityFromPeriods(point.time.getTime(), periods);

        if (polarity !== currentPolarity) {
            const segmentData = data.slice(lastCutIndex, i + 1);
            segments.push({ polarity: currentPolarity, data: segmentData });

            lastCutIndex = i;
            currentPolarity = polarity;
        }
    }
    
    const finalSegmentData = data.slice(lastCutIndex, data.length);
    if (finalSegmentData.length > 0) {
       segments.push({ polarity: currentPolarity, data: finalSegmentData });
    }
    
    return segments;
};


const ExtremesDisplay: React.FC<{ extremes: TideExtremes }> = ({ extremes }) => {
    const extremesByDay = useMemo(() => {
        const allExtremes = [
            ...extremes.high.map(e => ({ ...e, type: 'high' })),
            ...extremes.low.map(e => ({ ...e, type: 'low' }))
        ].sort((a, b) => a.time.getTime() - b.time.getTime());

        const grouped: { [key: string]: { date: Date, highs: any[], lows: any[] } } = {};

        allExtremes.forEach(extreme => {
            const dayKey = extreme.time.toLocaleDateString('pt-BR');
            if (!grouped[dayKey]) {
                const dayStart = new Date(extreme.time);
                dayStart.setHours(0, 0, 0, 0);
                grouped[dayKey] = {
                    date: dayStart,
                    highs: [],
                    lows: []
                };
            }
            if (extreme.type === 'high') {
                grouped[dayKey].highs.push(extreme);
            } else {
                grouped[dayKey].lows.push(extreme);
            }
        });

        return Object.values(grouped).sort((a,b) => a.date.getTime() - b.date.getTime());
    }, [extremes]);

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-7 gap-4 my-4 mt-8 text-sm">
            {extremesByDay.map(day => (
                <div key={day.date.toISOString()} className="bg-slate-700/50 p-3 rounded-lg border border-slate-600 flex flex-col">
                    <h4 className="font-bold text-slate-300 text-center mb-2">
                        {day.date.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'short' })}
                    </h4>
                    <div className="flex-grow grid grid-cols-2 gap-x-2">
                         <div>
                            <h5 className="font-semibold text-cyan-300 flex items-center text-xs mb-1"><Waves size={14} className="mr-1" /> Altas</h5>
                            {day.highs.length > 0 ? day.highs.map((tide, i) => (
                                <p key={`h-${day.date.toISOString()}-${i}`} className="text-slate-300 ml-1 mb-1">{formatLocalTime(tide.time)}<br/><span className="text-slate-400 text-xs">({tide.height.toFixed(1)}m)</span></p>
                            )) : <p className="text-slate-400 italic text-xs ml-1">N/A</p>}
                        </div>
                        <div>
                            <h5 className="font-semibold text-amber-300 flex items-center text-xs mb-1"><Anchor size={14} className="mr-1" /> Baixas</h5>
                            {day.lows.length > 0 ? day.lows.map((tide, i) => (
                                <p key={`l-${day.date.toISOString()}-${i}`} className="text-slate-300 ml-1 mb-1">{formatLocalTime(tide.time)}<br/><span className="text-slate-400 text-xs">({tide.height.toFixed(1)}m)</span></p>
                            )) : <p className="text-slate-400 italic text-xs ml-1">N/A</p>}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

const ShortCycleDisplay: React.FC<{ periods: ShortCyclePeriod[], timezoneOffsetName: string }> = ({ periods, timezoneOffsetName }) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const upcomingPeriods = periods.filter(p => p.endTime > currentTime).slice(0, 4);
  if (upcomingPeriods.length === 0) return null;

  return (
    <div className="my-6">
      <h4 className="text-lg font-bold text-slate-300 mb-3 text-center">Próximos Períodos do Ciclo Curto (Marés)</h4>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
        {upcomingPeriods.map((period, index) => {
          const isCurrent = currentTime >= period.startTime && currentTime < period.endTime;
          const isRevigorante = period.polarity === 'Revigorante';
          const baseClasses = `p-3 rounded-lg transition-all duration-300 border`;
          const currentClasses = isCurrent ? 'scale-105 shadow-lg' : '';
          const colorClasses = isRevigorante 
            ? `bg-green-900/40 border-green-700 ${isCurrent ? 'border-green-400' : ''}`
            : `bg-red-900/40 border-red-800 ${isCurrent ? 'border-red-500' : ''}`;
          const textColor = isRevigorante ? 'text-green-300' : 'text-red-300';

          return (
            <div key={index} className={`${baseClasses} ${colorClasses} ${currentClasses}`}>
              <p className={`font-semibold text-sm ${isCurrent ? textColor : 'text-slate-200'}`}>{period.polarity}</p>
              <p className="text-xs text-slate-400">{formatLocalTime(period.startTime)} - {formatLocalTime(period.endTime)}</p>
              <p className="text-[10px] text-slate-500">{new Date(period.startTime).toLocaleDateString('pt-BR', { weekday: 'short' })}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const CustomTooltip: React.FC<any> = ({ active, payload, label }) => {
  if (active && payload && payload.length && label) {
    const time = new Date(label);
    const timeStr = formatLocalTime(time);
    const dateStr = time.toLocaleDateString('pt-BR', {weekday: 'long', day: 'numeric', month: 'short'});
    const tideHeight = payload.find(p => p.dataKey === 'height');

    return (
      <div className="bg-slate-800/80 backdrop-blur-sm p-2 border border-slate-600 rounded-md shadow-lg text-sm">
        <p className="label text-slate-300 font-bold">{dateStr} - {timeStr}</p>
        {tideHeight && <p className="intro text-cyan-300">{`Maré: ${tideHeight.value.toFixed(2)} m`}</p>}
      </div>
    );
  }
  return null;
};

const ExtremePoint: React.FC<any> = (props) => {
    const { cx, cy, payload } = props;
    if (!cx || !cy || !payload || !payload.time) return null;

    const isHigh = payload.type === 'high';
    const color = isHigh ? '#22d3ee' : '#f59e0b';
    return <circle cx={cx} cy={cy} r={4} fill={color} stroke="#0f172a" strokeWidth={1} />;
};

const ExtremeLabel: React.FC<any> = (props) => {
    const { x, y, value, payload } = props;
    if (!x || !y) return null;
    const time = new Date(payload.time);
    return (
        <text x={x} y={y - 8} textAnchor="middle" fill="#e2e8f0" fontSize={12} fontWeight="bold">
            {formatLocalTime(time)}
        </text>
    );
}

const CustomXAxisTick: React.FC<any> = (props) => {
    const { x, y, payload } = props;
    if (!payload || typeof payload.value === 'undefined') return null;

    const date = new Date(payload.value);
    if (isNaN(date.getTime())) return null;
    
    const hour = date.getHours();

    // At midnight, create a day separator
    if (hour === 0) {
        const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const tickDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());

        let dayLabel = '';
        const diffDays = Math.round((tickDay.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        if (diffDays === -3) dayLabel = '3 Dias Atrás';
        else if (diffDays === -2) dayLabel = 'Anteontem';
        else if (diffDays === -1) dayLabel = 'Ontem';
        else if (diffDays === 0) dayLabel = 'Hoje';
        else if (diffDays === 1) dayLabel = 'Amanhã';
        else if (diffDays === 2) dayLabel = 'Depois de Amanhã';
        else if (diffDays === 3) dayLabel = 'Daqui a 3 Dias';
        else return null; 

        return (
            <g transform={`translate(${x},${y})`}>
                <line x1={0} y1={5} x2={0} y2={-420} stroke="#475569" strokeWidth={1} strokeDasharray="3 3" />
                <rect x={-60} y={10} width={120} height={45} fill="#0f172a" />
                <text x={0} y={0} dy={25} textAnchor="middle" fill="#c9d1d9" fontSize={14} fontWeight="bold">
                    {dayLabel}
                </text>
                <text x={0} y={0} dy={42} textAnchor="middle" fill="#94a3b8" fontSize={12}>
                     {dayNames[date.getDay()]} {date.getDate()}/{date.getMonth() + 1}
                </text>
            </g>
        );
    }
    
    if (hour > 0 && hour % 6 === 0) { // Ticks at 6h, 12h, 18h
       return (
            <g transform={`translate(${x},${y})`}>
                <text x={0} y={0} dy={16} textAnchor="middle" fill="#94a3b8" fontSize={12}>
                    {`${hour}h`}
                </text>
            </g>
        );
    }

    return null;
};

interface TideChartProps {
  tideInfo: TideChartResponse;
  timezoneOffsetName: string;
}

const TideChart: React.FC<TideChartProps> = ({ tideInfo, timezoneOffsetName }) => {
    const [currentTime, setCurrentTime] = useState(new Date().getTime());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date().getTime()), 60000);
        return () => clearInterval(timer);
    }, []);

    const { chartData, extremes, shortCyclePeriods } = tideInfo;

    const allExtremes = useMemo(() => ([
        ...extremes.high.map(e => ({ ...e, type: 'high' })),
        ...extremes.low.map(e => ({ ...e, type: 'low' }))
    ]), [extremes]);

    const segmentedData = useMemo(() => getSegmentedData(chartData, shortCyclePeriods), [chartData, shortCyclePeriods]);

    if (!chartData || chartData.length === 0) {
        return <Loader message="Carregando dados do gráfico de marés..." />
    }
    
    const yMin = Math.min(...chartData.map(d => d.height));
    const yMax = Math.max(...chartData.map(d => d.height));
    const yPadding = (yMax - yMin) * 0.2; // Add 20% padding
    
    const yDomain: [number, number] = [
        yMin - yPadding,
        yMax + yPadding,
    ];

    const polarityColors = {
        positive: { stroke: '#10b981', fill: '#10b981' }, // green-500
        negative: { stroke: '#ef4444', fill: '#ef4444' }, // red-500
    };


    return (
        <div className="bg-slate-800/50 rounded-xl p-4 md:p-6 shadow-2xl backdrop-blur-sm border border-slate-700">
            <h3 className="text-xl font-bold text-slate-200 mb-1 tracking-wide">Ritmo das Marés (Janela de 7 Dias)</h3>
            <div className="text-sm text-slate-400 mb-4 space-y-1">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                    <span><span className="font-bold" style={{color: polarityColors.negative.stroke}}>──</span> Desgastante: Primeira metade do período entre marés.</span>
                    <span><span className="font-bold" style={{color: polarityColors.positive.stroke}}>──</span> Revigorante: Segunda metade do período entre marés.</span>
                </div>
            </div>
            
            <div style={{ width: '100%', height: 450 }}>
                <ResponsiveContainer>
                    <AreaChart
                        data={chartData}
                        margin={{ top: 20, right: 20, left: -20, bottom: 30 }}
                    >
                        <CartesianGrid strokeDasharray="1 4" stroke="#475569" />
                        
                        <XAxis
                            dataKey="time"
                            type="number"
                            scale="time"
                            domain={['dataMin', 'dataMax']}
                            tick={<CustomXAxisTick />}
                            tickLine={false}
                            axisLine={{ stroke: '#475569' }}
                            interval={0}
                            height={55}
                        />
                        <YAxis
                            stroke="#94a3b8"
                            tick={{ fontSize: 12 }}
                            unit="m"
                            domain={yDomain}
                            tickLine={false}
                            axisLine={false}
                            width={40}
                        />

                        <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#f87171', strokeWidth: 1, strokeDasharray: '3 3' }} />
                        
                        <ReferenceLine x={currentTime} stroke="#f87171" strokeWidth={1.5} ifOverflow="extendDomain">
                           <Label value="Agora" position="top" fill="#f87171" fontSize={12} offset={10} />
                        </ReferenceLine>

                        {segmentedData.map((segment, index) => {
                            const colors = polarityColors[segment.polarity];
                            return (
                                <Area
                                    key={index}
                                    data={segment.data}
                                    type="monotone"
                                    dataKey="height"
                                    stroke={colors.stroke}
                                    fill={colors.fill}
                                    fillOpacity={0.25}
                                    strokeWidth={2}
                                    dot={false}
                                    activeDot={false}
                                    isAnimationActive={false}
                                />
                            );
                        })}
                        
                        <Scatter name="Picos de Maré" data={allExtremes} shape={<ExtremePoint />} isAnimationActive={false}>
                            {allExtremes.map((entry, index) => (
                                <Label key={`label-${index}`} content={<ExtremeLabel payload={entry} />} />
                             ))}
                        </Scatter>

                    </AreaChart>
                </ResponsiveContainer>
            </div>
            
            <ShortCycleDisplay periods={shortCyclePeriods} timezoneOffsetName={timezoneOffsetName} />
            <ExtremesDisplay extremes={extremes} />
        </div>
    );
};

export default TideChart;