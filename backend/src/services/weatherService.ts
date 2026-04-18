import axios from "axios";

interface WeatherData {
  temperature: number;
  humidity: number;
  precipitation: number;
  windspeed: number;
  description: string;
}

export async function getWeather(lat: number, lon: number): Promise<WeatherData> {
  const { data } = await axios.get("https://api.open-meteo.com/v1/forecast", {
    params: {
      latitude: lat,
      longitude: lon,
      current: "temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m",
      timezone: "auto",
    },
  });

  const c = data.current;
  return {
    temperature: c.temperature_2m,
    humidity: c.relative_humidity_2m,
    precipitation: c.precipitation,
    windspeed: c.wind_speed_10m,
    description: `Temperature: ${c.temperature_2m}°C, Humidity: ${c.relative_humidity_2m}%, Precipitation: ${c.precipitation}mm, Wind: ${c.wind_speed_10m}km/h`,
  };
}

export function formatWeatherForPrompt(weather: WeatherData): string {
  return `Current weather: ${weather.description}`;
}
