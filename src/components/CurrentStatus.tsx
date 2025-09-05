import React, { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, ArrowRight, Sun, Moon, Calendar, Clock, Star } from 'lucide-react';
import { LunarCycle, TideChartResponse } from '../types';

const getPolarityClasses = (polarity: string | undefined, type: 'bg' | 'text' | 'border' | 'icon') => {
    switch (polarity) {
        case 'Revigorante':
        case 'Muito Revigorante':
            return {
                bg: 'bg-green-500/10',
                text: 'text-green-300',
                border: 'border-green-500/30',
                icon: 'text-green-400',
            }[type];
        case 'Desgastante':
        case 'Muito Desgastante':
            return {
                bg: 'bg-red-500/10',
                text: 'text-red-300',
                border: 'border-red-500/30',
                icon: 'text-red-400',
            }[type];
        default: // Neutra or undefined
            return {
                bg: 'bg-slate-500/10',
                text: 'text-slate-300',
                border: 'border-slate-500/30',
                icon: 'text-slate-400',
            }[type];
    }
};

// --- Practical Guide Component defined inside CurrentStatus ---

const GuideSection: React.FC<{ title: string; children: React.ReactNode; isActive: boolean; icon: React.ElementType }> = ({ title, children, isActive, icon }) => {
    const Icon = icon;
    return (
        <div className={`p-4 rounded-lg border-2 transition-all duration-300 ${isActive ? 'bg-slate-700/50 border-cyan-500 scale-[1.02] shadow-lg' : 'bg-slate-800/30 border-slate-700 opacity-70'}`}>
            <h3 className="font-bold text-lg mb-3 flex items-center text-slate-100">
                {Icon && <Icon className={`mr-3 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} size={24} />}
                {title}
            </h3>
            <div className="space-y-4 pl-4 border-l-2 border-slate-600/50">
                {children}
            </div>
        </div>
    );
};

const GuideSubSection: React.FC<{ title: string; children: React.ReactNode; isActive: boolean; polarity: 'positive' | 'negative' }> = ({ title, children, isActive, polarity }) => {
    return (
        <div className={`p-3 rounded-md transition-all ${isActive ? 'bg-slate-600/40' : 'bg-slate-700/30'}`}>
            <h4 className={`font-semibold flex items-center ${polarity === 'positive' ? 'text-green-300' : 'text-red-300'}`}>
                {polarity === 'positive' ? <CheckCircle2 size={16} className="mr-2" /> : <XCircle size={16} className="mr-2" />}
                {title}
            </h4>
            <ul className="mt-2 ml-2 space-y-1 text-sm list-disc list-inside text-slate-300 marker:text-slate-500">
                {children}
            </ul>
        </div>
    );
};

const Tip: React.FC<{ children: React.ReactNode }> = ({ children }) => <li>{children}</li>;

const PracticalGuide: React.FC<{ longPolarity: 'Revigorante' | 'Desgastante', shortPolarity?: 'Revigorante' | 'Desgastante' }> = ({ longPolarity, shortPolarity }) => {
    const isLongPositive = longPolarity === 'Revigorante';
    const isLongNegative = longPolarity === 'Desgastante';
    const isShortPositive = shortPolarity === 'Revigorante';
    const isShortNegative = shortPolarity === 'Desgastante';

    return (
        <div className="mt-6 border-t border-slate-700/50 pt-6 space-y-8">
            <h2 className="text-xl font-bold text-slate-200 mb-2 text-center">
                Guia Prático de Atividades
            </h2>

            <div className="space-y-6">
                <GuideSection title="Unidade Longa Positiva (Revigorante)" isActive={isLongPositive} icon={Sun}>
                    <GuideSubSection title="Ações Gerais para 3,5 dias" isActive={isLongPositive} polarity="positive">
                        <Tip>Começar projetos e novos negócios.</Tip>
                        <Tip>Fazer meditação profunda e focada.</Tip>
                        <Tip>Atividades físicas e sexuais com maior energia.</Tip>
                        <Tip>Tratamentos médicos, vacinas e fertilização.</Tip>
                    </GuideSubSection>
                    
                    <GuideSubSection title="Curta Positiva (Segunda metade entre marés)" isActive={isLongPositive && isShortPositive} polarity="positive">
                        <Tip>Marque consultas, falas públicas e reuniões.</Tip>
                        <Tip>Aproveite a alta performance mental e vitalidade.</Tip>
                    </GuideSubSection>

                    <GuideSubSection title="Curta Negativa (Primeira metade entre marés)" isActive={isLongPositive && isShortNegative} polarity="negative">
                        <Tip>Tenha cautela e evite esforço mental excessivo.</Tip>
                        <Tip>Prefira meditação leve ou introspecção.</Tip>
                    </GuideSubSection>
                </GuideSection>

                <GuideSection title="Unidade Longa Negativa (Desgastante)" isActive={isLongNegative} icon={Moon}>
                     <GuideSubSection title="Ações Gerais para 3,5 dias" isActive={isLongNegative} polarity="negative">
                        <Tip>Descanso, recuperação e convalescença.</Tip>
                        <Tip>Introspecção profunda e análise emocional.</Tip>
                        <Tip>Resguardo após partos, cirurgias ou crises.</Tip>
                    </GuideSubSection>

                    <GuideSubSection title="Curta Positiva (Segunda metade entre marés)" isActive={isLongNegative && isShortPositive} polarity="positive">
                        <Tip>Foque em leitura, estudo espiritual e trabalhos criativos.</Tip>
                        <Tip>Faça reflexões sobre projetos passados.</Tip>
                    </GuideSubSection>

                    <GuideSubSection title="Curta Negativa (Primeira metade entre marés)" isActive={isLongNegative && isShortNegative} polarity="negative">
                        <Tip>Evite ações importantes ou exames complexos.</Tip>
                        <Tip>Ideal para sono profundo, jejum e silêncio.</Tip>
                    </GuideSubSection>
                </GuideSection>

                <GuideSection title="Exemplo de Planejamento Diário" isActive={false} icon={Calendar}>
                    <p className="text-sm text-slate-400">
                        Se a maré alta local ocorre às <span className="font-bold text-cyan-300">15:00</span>, a maré baixa às <span className="font-bold text-amber-300">21:00</span>, e você está numa unidade longa <span className="font-bold text-green-300">Positiva</span>:
                    </p>
                     <div className="mt-3 space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                             <Clock size={14} className="text-slate-400" />
                            <span className="font-semibold text-slate-200 w-28">15:00 - 18:00</span>
                            <ArrowRight size={14} className="text-slate-500" />
                            <span className="text-red-300 flex items-center gap-2"><Moon size={14}/> Hora de repouso (1ª metade, desgastante).</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Clock size={14} className="text-slate-400" />
                            <span className="font-semibold text-slate-200 w-28">18:00 - 21:00</span>
                            <ArrowRight size={14} className="text-slate-500" />
                            <span className="text-green-300 flex items-center gap-2"><Star size={14}/> Período para ação (2ª metade, revigorante).</span>
                        </div>
                     </div>
                </GuideSection>
            </div>
        </div>
    );
};


// --- Main CurrentStatus Component ---

interface CurrentStatusProps {
    lunarCycle: LunarCycle;
    tideInfo: TideChartResponse;
    locationName: string | null;
}

const CurrentStatus: React.FC<CurrentStatusProps> = ({ lunarCycle, tideInfo }) => {
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const longPolarity = lunarCycle.currentUnit.longCyclePolarity;
    const shortPolarityPeriod = tideInfo.shortCyclePeriods.find(p => currentTime >= p.startTime && currentTime < p.endTime);
    const shortPolarity = shortPolarityPeriod?.polarity;

    const getCombinedPolarity = (): string => {
        if (!shortPolarity) {
            return longPolarity; // Fallback if short cycle is somehow undefined
        }
        if (longPolarity === 'Revigorante' && shortPolarity === 'Revigorante') {
            return 'Muito Revigorante';
        }
        if (longPolarity === 'Desgastante' && shortPolarity === 'Desgastante') {
            return 'Muito Desgastante';
        }
        // If polarities are opposing, the result is Neutral.
        return 'Neutra';
    };

    const combinedPolarity = getCombinedPolarity();
    
    const renderPolarity = (title: string, polarity: string | undefined) => (
        <div className={`flex-1 p-4 rounded-lg border ${getPolarityClasses(polarity, 'border')} ${getPolarityClasses(polarity, 'bg')}`}>
            <h4 className="text-sm text-slate-400 font-semibold text-center">{title}</h4>
            <p className={`text-xl font-bold text-center ${getPolarityClasses(polarity, 'text')}`}>{polarity || 'Calculando...'}</p>
        </div>
    );

    return (
        <div className="bg-slate-800/50 rounded-xl p-4 md:p-6 shadow-2xl backdrop-blur-sm border border-slate-700">
            <h3 className="text-xl font-bold text-slate-200 mb-4 text-center">Seu Ritmo Energético Atual</h3>
            <div className="flex flex-col md:flex-row items-stretch gap-4">
                {renderPolarity("Ciclo Longo (Lunar)", longPolarity)}
                <div className="flex items-center justify-center text-slate-400 text-3xl font-bold">+</div>
                {renderPolarity("Ciclo Curto (Marés)", shortPolarity)}
                <div className="flex items-center justify-center text-slate-400 text-3xl font-bold">=</div>
                
                <div className={`flex-1 p-4 rounded-lg border-2 ${getPolarityClasses(combinedPolarity, 'border')} ${getPolarityClasses(combinedPolarity, 'bg')} shadow-inner`}>
                    <h4 className="text-sm text-slate-400 font-semibold text-center">Efeito Combinado</h4>
                    <p className={`text-2xl font-bold text-center ${getPolarityClasses(combinedPolarity, 'text')}`}>{combinedPolarity}</p>
                </div>
            </div>
            
            <PracticalGuide longPolarity={longPolarity} shortPolarity={shortPolarity} />
            
            <p className="text-xs text-slate-500 mt-8 pt-4 border-t border-slate-700/50 text-center italic">
              "As unidades longas... têm a sua maior influência no funcionamento puramente fisiológico... As unidades curtas têm o seu maior efeito nas funções mentais, psíquicas, nervosas..."
            </p>
        </div>
    );
};

export default CurrentStatus;