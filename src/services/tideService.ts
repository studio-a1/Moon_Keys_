import { Coordinates, TideDataPoint, TideExtremes, ShortCyclePeriod, TideChartResponse } from '../types';

/**
 * Calculates the short cycle periods based on the alternating logic.
 * The period between any two tide extremes (high-low or low-high) is split in half.
 * - The first half is ALWAYS 'Desgastante'.
 * - The second half is ALWAYS 'Revigorante'.
 * This creates a continuous, alternating cycle without neutral gaps.
 */
function calculateShortCyclePeriods(extremes: TideExtremes): ShortCyclePeriod[] {
    const allExtremes = [
        ...extremes.high.map(e => ({ time: e.time })),
        ...extremes.low.map(e => ({ time: e.time }))
    ].sort((a, b) => a.time.getTime() - b.time.getTime());

    if (allExtremes.length < 2) {
        return [];
    }

    const periods: ShortCyclePeriod[] = [];

    for (let i = 0; i < allExtremes.length - 1; i++) {
        const startExtremeTime = allExtremes[i].time;
        const endExtremeTime = allExtremes[i + 1].time;

        // Ensure we have valid dates
        if (isNaN(startExtremeTime.getTime()) || isNaN(endExtremeTime.getTime())) continue;

        const midpointTime = new Date(startExtremeTime.getTime() + (endExtremeTime.getTime() - startExtremeTime.getTime()) / 2);

        // First half of the period is always 'Desgastante'
        periods.push({
            startTime: startExtremeTime,
            endTime: midpointTime,
            polarity: 'Desgastante'
        });

        // Second half is always 'Revigorante'
        periods.push({
            startTime: midpointTime,
            endTime: endExtremeTime,
            polarity: 'Revigorante'
        });
    }

    return periods;
}


/**
 * Fetches real tide data by calling our Netlify serverless function proxy.
 */
export async function getRealTideData(coords: Coordinates, chartStart: Date, chartEnd: Date): Promise<TideChartResponse> {
    const durationMs = chartEnd.getTime() - chartStart.getTime();
    const durationDays = Math.ceil(durationMs / (1000 * 60 * 60 * 24));
    
    // API requires a UNIX timestamp for the start date.
    const startTimestamp = Math.floor(chartStart.getTime() / 1000);

    const params = new URLSearchParams({
        lat: coords.latitude.toString(),
        lon: coords.longitude.toString(),
        start: startTimestamp.toString(),
        days: durationDays.toString(),
    });

    // The URL now points to our secure serverless function proxy
    const url = `/.netlify/functions/tide-proxy?${params.toString()}`;

    try {
        const response = await fetch(url);
        const data = await response.json(); // Always expect JSON now

        if (!response.ok || data.error) {
            throw new Error(`A API de marés retornou um erro: ${data.error || response.statusText}`);
        }
        
        if (!data.heights || data.heights.length === 0) {
            throw new Error("A API de marés não retornou dados para esta localização.");
        }
        
        const chartData: TideDataPoint[] = data.heights.map((h: any) => ({
            time: new Date(h.dt * 1000), // Convert UNIX timestamp to Date
            height: parseFloat(h.height.toFixed(2))
        })).sort((a: TideDataPoint, b: TideDataPoint) => a.time.getTime() - b.time.getTime());

        const extremes: TideExtremes = { high: [], low: [] };
        if (data.extremes) {
            data.extremes.forEach((e: any) => {
                const extremePoint = {
                    time: new Date(e.dt * 1000),
                    height: parseFloat(e.height.toFixed(2))
                };
                if (e.type === 'High') {
                    extremes.high.push(extremePoint);
                } else if (e.type === 'Low') {
                    extremes.low.push(extremePoint);
                }
            });
        }
        
        const shortCyclePeriods = calculateShortCyclePeriods(extremes);

        return {
            chartData,
            extremes,
            shortCyclePeriods
        };

    } catch (error) {
        console.error("Erro ao buscar dados da nossa API proxy:", error);
        if (error instanceof Error) {
           throw new Error(`Falha ao buscar dados de marés: ${error.message}`);
        }
        throw new Error("Falha ao buscar dados de marés. Verifique o status da sua implantação no Netlify.");
    }
}
