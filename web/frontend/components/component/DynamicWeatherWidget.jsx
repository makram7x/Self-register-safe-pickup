import React, { useState, useEffect } from "react";
import {
  Cloud,
  Sun,
  CloudRain,
  CloudSnow,
  CloudLightning,
  CloudDrizzle,
  Loader,
} from "lucide-react";

const WeatherWidget = () => {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const OPENWEATHERKEY = "497cc15d5b7e618ca029b96ad28c0fa0";
  const CITY = "Petaling Jaya"; // Replace with your desired city name

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const response = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?q=${CITY}&units=metric&appid=${OPENWEATHERKEY}`
        );

        if (!response.ok) {
          throw new Error(`Weather API error: ${response.statusText}`);
        }

        const data = await response.json();
        console.log("Weather data:", data); // Add this for debugging
        setWeather(data);
        setError(null);
      } catch (err) {
        console.error("Weather fetch error:", err); // Add this for debugging
        setError("Could not load weather data");
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
    const interval = setInterval(fetchWeather, 1800000);

    return () => clearInterval(interval);
  }, []);

  const getWeatherIcon = (weatherCode) => {
    // Weather condition codes: https://openweathermap.org/weather-conditions
    switch (true) {
      case weatherCode >= 200 && weatherCode < 300:
        return <CloudLightning className="h-8 w-8" />;
      case weatherCode >= 300 && weatherCode < 400:
        return <CloudDrizzle className="h-8 w-8" />;
      case weatherCode >= 500 && weatherCode < 600:
        return <CloudRain className="h-8 w-8" />;
      case weatherCode >= 600 && weatherCode < 700:
        return <CloudSnow className="h-8 w-8" />;
      case weatherCode === 800:
        return <Sun className="h-8 w-8" />;
      default:
        return <Cloud className="h-8 w-8" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center space-x-2 bg-blue-950/20 p-3 rounded-lg">
        <Loader className="h-8 w-8 text-blue-400 animate-spin" />
        <div className="text-xs text-blue-300">Loading weather...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center space-x-2 bg-blue-950/20 p-3 rounded-lg">
        <Cloud className="h-8 w-8 text-blue-400" />
        <div className="text-xs text-blue-300">{error}</div>
      </div>
    );
  }

  return weather ? (
    <div className="flex items-center space-x-2 bg-grey-550/20 p-3 rounded-lg ">
      <div className="text-blue-600 dark:text-blue-300">
        {getWeatherIcon(weather.weather[0].id)}
      </div>
      <div>
        <div className="text-sm font-medium text-blue-600 dark:text-blue-100">
          {Math.round(weather.main.temp)}°C
        </div>
        <div className="text-xs dark:text-blue-300 text-blue-700">
          {weather.weather[0].description}
        </div>
      </div>
    </div>
  ) : null;
};

export default WeatherWidget;
