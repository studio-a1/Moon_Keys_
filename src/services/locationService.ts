import { Coordinates } from '../types';

/**
 * Gets a city and state from coordinates using the OpenStreetMap Nominatim API.
 * This is a public service and does not require an API key.
 * @param coords The latitude and longitude.
 * @returns A promise that resolves to a formatted city and state string.
 */
export async function getCityStateFromCoordinates(coords: Coordinates): Promise<string> {
  const { latitude, longitude } = coords;
  // Requesting portuguese names first.
  const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=pt-BR,pt`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }
    const data = await response.json();

    if (data.error) {
      throw new Error(data.error);
    }

    const address = data.address;
    const city = address.city || address.town || address.village || address.municipality;
    const state = address.state || address.state_district;

    if (city && state) {
      return `${city}, ${state}`;
    }
    
    // Fallback if city or state is not available
    if (city) return city;
    if (state) return state;

    if(data.display_name) {
        // More generic fallback using the first two parts of the display name
        const parts = data.display_name.split(',');
        return parts.slice(0, Math.min(parts.length, 2)).join(', ');
    }

    // If all else fails, show coordinates.
    return `Lat: ${latitude.toFixed(2)}, Lon: ${longitude.toFixed(2)}`;

  } catch (error) {
    console.error("Error during reverse geocoding:", error);
    // Return coordinates as a graceful fallback on network error or parsing failure
    return `Lat: ${latitude.toFixed(2)}, Lon: ${longitude.toFixed(2)}`;
  }
}
