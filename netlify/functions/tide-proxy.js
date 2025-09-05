// This is a Netlify Function that acts as a secure proxy to the WorldTides API.
// It reads the API key from environment variables, so it's never exposed client-side.

exports.handler = async function(event, context) {
  const { lat, lon, start, days } = event.queryStringParameters;
  
  // The API key is securely accessed from Netlify's environment variables
  const API_KEY = process.env.WORLD_TIDES_API_KEY;

  if (!API_KEY) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "A chave da API de marés não está configurada no servidor." }),
    };
  }
  
  if (!lat || !lon || !start || !days) {
     return {
      statusCode: 400,
      body: JSON.stringify({ error: "Parâmetros obrigatórios ausentes: lat, lon, start, days." }),
    };
  }

  const params = new URLSearchParams({
    key: API_KEY,
    lat: lat,
    lon: lon,
    start: start,
    days: days,
    heights: 'true',
    extremes: 'true',
  });

  const url = `https://www.worldtides.info/api/v3?${params.toString()}`;

  try {
    const apiResponse = await fetch(url);

    // If the response from WorldTides is not OK, we can't assume the body is JSON.
    if (!apiResponse.ok) {
        const errorText = await apiResponse.text();
        console.error(`WorldTides API returned an error: ${apiResponse.status}`, errorText);
        // We still return a valid JSON error object to our client.
        return {
            statusCode: apiResponse.status,
            body: JSON.stringify({ error: `A API de marés falhou com o status ${apiResponse.status}.`, details: errorText.substring(0, 200) })
        };
    }
    
    // Now we can safely assume the body is JSON.
    const data = await apiResponse.json();

    // The API might still indicate an error within the JSON payload.
    if (data.error) {
        console.error("WorldTides API returned a JSON error:", data.error);
        return {
            // Use a 400 Bad Request status as it's likely a client-side issue (e.g., bad coords).
            statusCode: 400,
            body: JSON.stringify({ error: data.error })
        };
    }

    // Success case
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    };
  } catch (error) {
    // This catches network errors when calling fetch, or if apiResponse.json() fails.
    console.error("Error in proxy function:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Ocorreu um erro interno no proxy de marés.", details: error instanceof Error ? error.message : String(error) }),
    };
  }
};
