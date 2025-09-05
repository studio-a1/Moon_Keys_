

import React, { useState, useEffect, useCallback } from 'react';
import type { Coordinates, LunarCycle, TideChartResponse } from './types';
import { calculateLunarCycle } from './services/moonService';
import { getRealTideData } from './services/tideService';
import { getCityStateFromCoordinates } from './services/locationService';
import TideChart from './components/TideChart';
import Loader from './components/Loader';
import LunarCycleView from './components/LunarCycleView';
import CurrentStatus from './components/CurrentStatus';

const App: React.FC = () => {
  const [location, setLocation] = useState<Coordinates | null>(null);
  const [locationName, setLocationName] = useState<string | null>(null);
  const [timezoneOffsetName, setTimezoneOffsetName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<string>('Aguardando permissão de localização...');
  
  const [lunarCycle, setLunarCycle] = useState<LunarCycle | null>(null);
  const [tideInfo, setTideInfo] = useState<TideChartResponse | null>(null);

  const fetchData = useCallback(async (loc: Coordinates) => {
    setLoading('Sincronizando ritmos cósmicos...');
    
    // Calculate the full lunar cycle for the other components
    const currentLunarCycle = calculateLunarCycle(new Date());
    setLunarCycle(currentLunarCycle);

    // Define a 7-day window for the tide chart (3 days past, today, 3 days future)
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today for consistent calculations

    const chartStart = new Date(today);
    chartStart.setDate(today.getDate() - 3);

    const chartEnd = new Date(today);
    chartEnd.setDate(today.getDate() + 4); // End of the 3rd day in the future

    // Set up parallel API calls
    const cityStatePromise = getCityStateFromCoordinates(loc);
    const tideInfoPromise = getRealTideData(loc, chartStart, chartEnd);

    try {
      const [cityState, chartTideData] = await Promise.all([
        cityStatePromise,
        tideInfoPromise
      ]);

      setLocationName(cityState);
      setTideInfo(chartTideData);
      
    } catch (e: any) {
      console.error("Failed to fetch data:", e);
      setError(e.message || 'Ocorreu um erro desconhecido ao buscar os dados.');
    } finally {
      setLoading('');
    }
  }, []);

  useEffect(() => {
    if (location) {
        fetchData(location);
    } else {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;

                const offsetMinutes = new Date().getTimezoneOffset();
                const offsetHours = -offsetMinutes / 60;
                const hours = Math.trunc(offsetHours);
                const minutes = Math.abs(offsetMinutes % 60);
                const tzName = `GMT${hours >= 0 ? '+' : ''}${hours}${minutes > 0 ? `:${minutes.toString().padStart(2, '0')}` : ''}`;
                setTimezoneOffsetName(tzName);

                setLocation({ latitude, longitude });
                setError(null);
            },
            (err) => {
                setError(`Erro ao obter localização: ${err.message}. Por favor, conceda a permissão e atualize a página.`);
                setLoading('');
            },
            { timeout: 10000 }
        );
    }
  }, [location, fetchData]);

  const renderContent = () => {
    if (loading) {
      return <div className="min-h-screen flex items-center justify-center"><Loader message={loading} /></div>;
    }

    if (error) {
      return (
        <div className="min-h-screen flex items-center justify-center text-center text-red-400 p-4">
            <div className="bg-red-900/50 p-8 rounded-xl border border-red-700 max-w-md">
                <h2 className="text-2xl font-bold mb-2">Erro</h2>
                <p>{error}</p>
                <button 
                  onClick={() => window.location.reload()}
                  className="mt-4 px-4 py-2 bg-slate-600 hover:bg-slate-500 rounded-lg text-white font-semibold transition-colors"
                >
                  Tentar Novamente
                </button>
            </div>
        </div>
      );
    }

    if (lunarCycle && tideInfo && timezoneOffsetName) {
      return (
        <div className="container mx-auto p-4 md:p-8 space-y-8">
            <header className="text-center">
                <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-sky-300 to-cyan-500">
                    Moon Keys
                </h1>
                <p className="text-slate-400 mt-2">Seu guia para as energias sutis da lua e das marés.</p>
                {locationName && (
                    <p className="text-slate-500 mt-1 text-sm">
                        Análise para: <span className="font-semibold text-slate-400">{locationName}</span>
                    </p>
                )}
            </header>
            
            <CurrentStatus lunarCycle={lunarCycle} tideInfo={tideInfo} locationName={locationName} />
            
            <div className="space-y-8">
                <TideChart tideInfo={tideInfo} />
                <LunarCycleView cycle={lunarCycle} timezoneOffsetName={timezoneOffsetName} />
            </div>
            
        </div>
      );
    }

    return null;
  };

  return (
    <main className="bg-slate-900 min-h-screen font-sans bg-cover bg-center" style={{backgroundImage: "url('https://images.unsplash.com/photo-1534298372274-9271643c78a9?q=80&w=1920&auto=format&fit=crop')"}}>
        <div className="min-h-screen bg-black/60 backdrop-blur-sm">
            {renderContent()}
            <footer className="text-center p-4 text-xs text-slate-500">
                <p>Dados de maré fornecidos por WorldTides.info. A localização é usada para obter previsões precisas.</p>
                 <p className="mt-1">Inspirado nos princípios do artigo "A Influência da Lua", publicado na revista O Rosacruz, edição 320 (Out/2022), de autoria do Dr. Harvey Spencer Lewis.</p>
            </footer>
        </div>
    </main>
  );
};

export default App;
