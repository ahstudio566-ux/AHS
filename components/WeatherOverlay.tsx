import React, { useEffect, useState } from 'react';
import { safeLocaleDateString } from '../utils/dateUtils';
import { WeatherData } from '../types';
import { CloudIcon } from './icons/CloudIcon'; // I'll need to create or use existing icons
import { SunIcon } from './icons/SunIcon';
import { CloudRainIcon } from './icons/CloudRainIcon';
import { WindIcon } from './icons/WindIcon';
import { DropletsIcon } from './icons/DropletsIcon';
import Loader from './Loader';

interface WeatherOverlayProps {
  lat: number;
  lng: number;
  areaName?: string;
  onClose?: () => void;
}

const getWeatherCondition = (code: number): { text: string; icon: React.ReactNode } => {
  if (code === 0) return { text: 'Trời quang', icon: <SunIcon className="w-6 h-6 text-yellow-500" /> };
  if (code <= 3) return { text: 'Nhiều mây', icon: <CloudIcon className="w-6 h-6 text-slate-400" /> };
  if (code <= 48) return { text: 'Sương mù', icon: <CloudIcon className="w-6 h-6 text-slate-300" /> };
  if (code <= 67 || (code >= 80 && code <= 82)) return { text: 'Có mưa', icon: <CloudRainIcon className="w-6 h-6 text-blue-500" /> };
  if (code <= 77 || (code >= 85 && code <= 86)) return { text: 'Có tuyết', icon: <CloudIcon className="w-6 h-6 text-white" /> };
  if (code >= 95) return { text: 'Có dông', icon: <CloudRainIcon className="w-6 h-6 text-indigo-600" /> };
  return { text: 'Không xác định', icon: <CloudIcon className="w-6 h-6 text-slate-400" /> };
};

export const WeatherOverlay: React.FC<WeatherOverlayProps> = ({ lat, lng, areaName, onClose }) => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWeather = async (retries = 3) => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max&timezone=auto`
        );
        if (!response.ok) throw new Error('Không thể tải dữ liệu thời tiết');
        const data = await response.json();
        
        if (data && data.current) {
          const current = data.current;
          const daily = data.daily;
          
          const condition = getWeatherCondition(current.weather_code);
          
          setWeather({
            temperature: Math.round(current.temperature_2m),
            condition: condition.text,
            icon: '', // Handled by component
            humidity: current.relative_humidity_2m,
            windSpeed: Math.round(current.wind_speed_10m),
            iconCode: current.weather_code,
            forecast: daily.time.slice(1, 4).map((date: string, i: number) => ({
              date: safeLocaleDateString(date, 'vi-VN', { weekday: 'short' }),
              temp: Math.round(daily.temperature_2m_max[i + 1]),
              condition: getWeatherCondition(daily.weather_code[i + 1]).text,
              iconCode: daily.weather_code[i + 1]
            }))
          } as any);
        }
      } catch (err: any) {
        console.error("Weather fetch failed:", err);
        if (retries > 0) {
          setTimeout(() => fetchWeather(retries - 1), 2000);
        } else {
          setError(err.message);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
  }, [lat, lng]);

  if (loading) return (
    <div className="bg-white/90 backdrop-blur-md p-4 rounded-3xl shadow-xl border border-white/20 w-64 flex flex-col items-center justify-center min-h-[150px]">
      <Loader message="Đang tải thời tiết..." subMessage="" className="py-2" />
    </div>
  );

  if (error || !weather) return (
    <div className="bg-white/90 backdrop-blur-md p-4 rounded-3xl shadow-xl border border-white/20 w-64">
      <p className="text-xs text-red-500 font-bold text-center">Lỗi: {error || 'Không có dữ liệu'}</p>
    </div>
  );

  const currentCondition = getWeatherCondition((weather as any).iconCode || 0); // Need to store iconCode if we want to use it here, but we already have text

  return (
    <div className="bg-white/95 backdrop-blur-md p-5 rounded-[32px] shadow-2xl border border-white/40 w-72 overflow-hidden relative group">
      {/* Decorative background */}
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-teal-50 rounded-full opacity-50 group-hover:scale-110 transition-transform duration-700"></div>
      
      <div className="relative z-10">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h4 className="text-[10px] font-black text-teal-600 uppercase tracking-widest mb-1">Thời tiết hiện tại</h4>
            <h3 className="text-lg font-black text-slate-800 truncate max-w-[180px]">{areaName || 'Khu vực đã chọn'}</h3>
          </div>
          {onClose && (
            <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-full transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          )}
        </div>

        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-slate-50 rounded-2xl shadow-inner">
              {getWeatherCondition((weather as any).iconCode || 0).icon}
            </div>
            <div>
              <div className="text-4xl font-black text-slate-800 leading-none">{weather.temperature}°</div>
              <div className="text-xs font-bold text-slate-500 mt-1">{weather.condition}</div>
            </div>
          </div>
          <div className="text-right space-y-2">
            <div className="flex items-center justify-end text-[10px] font-bold text-slate-400">
              <WindIcon className="w-3 h-3 mr-1" />
              {weather.windSpeed} km/h
            </div>
            <div className="flex items-center justify-end text-[10px] font-bold text-slate-400">
              <DropletsIcon className="w-3 h-3 mr-1" />
              {weather.humidity || '--'}%
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 pt-4 border-t border-slate-100">
          {weather.forecast.map((day, i) => (
            <div key={i} className="text-center p-2 rounded-2xl hover:bg-slate-50 transition-colors">
              <p className="text-[9px] font-black text-slate-400 uppercase mb-1">{day.date}</p>
              <div className="flex justify-center mb-1 scale-75">
                {getWeatherCondition((day as any).iconCode || 0).icon}
              </div>
              <p className="text-xs font-black text-slate-700">{day.temp}°</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
