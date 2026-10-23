
import React, { useState, useEffect } from 'react';
import { WindIcon } from './icons/WindIcon';
import { WaterDropIcon } from './icons/WaterDropIcon';
import { SunIcon } from './icons/SunIcon';
import { CloudIcon } from './icons/CloudIcon';

interface EnvironmentalData {
  aqi: {
    indexes: Array<{
      code: string;
      displayName: string;
      aqi: number;
      aqiDisplay: string;
      color: {
        red?: number;
        green?: number;
        blue?: number;
      };
      category: string;
      dominantPollutant: string;
    }>;
    healthRecommendations: {
      generalPopulation: string;
      elderly: string;
      children: string;
      athletes: string;
      pregnantWomen: string;
    };
  };
  weather: {
    temperature: {
      value: number;
      units: string;
    };
    humidity: number;
    condition: string;
    windSpeed: number;
  };
  timestamp: string;
  location: string;
}

const EnvironmentalWidget: React.FC = () => {
  const [data, setData] = useState<EnvironmentalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<{ message: string; details?: string } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/environmental/current');
        
        const contentType = response.headers.get("content-type");
        if (!response.ok || !contentType || !contentType.includes("application/json")) {
          const text = await response.text();
          console.error('Non-JSON or error response from environmental API:', text.substring(0, 100));
          setError({ 
            message: 'Dữ liệu môi trường tạm thời không khả dụng',
            details: `Status: ${response.status}`
          });
          setLoading(false);
          return;
        }

        const result = await response.json();
        setData(result);
        setError(null);
      } catch (err) {
        console.error('Error fetching environmental data:', err);
        setError({ message: 'Lỗi kết nối máy chủ' });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    // Refresh every 30 minutes
    const interval = setInterval(fetchData, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="glass-card p-6 animate-pulse">
        <div className="h-6 w-48 bg-slate-200 rounded mb-4"></div>
        <div className="grid grid-cols-2 gap-4">
          <div className="h-24 bg-slate-100 rounded-2xl"></div>
          <div className="h-24 bg-slate-100 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    // If it's a configuration error or server connection error, we hide the widget entirely
    // to keep the UI clean as requested.
    return null;
  }

  const primaryIndex = data.aqi.indexes[0];
  const aqiValue = primaryIndex.aqi;
  
  const getAQIStatus = (value: number) => {
    if (value <= 50) return { label: 'Tốt', color: 'text-emerald-600', bgColor: 'bg-emerald-50', borderColor: 'border-emerald-100' };
    if (value <= 100) return { label: 'Trung bình', color: 'text-amber-600', bgColor: 'bg-amber-50', borderColor: 'border-amber-100' };
    if (value <= 150) return { label: 'Kém', color: 'text-orange-600', bgColor: 'bg-orange-50', borderColor: 'border-orange-100' };
    return { label: 'Ô nhiễm', color: 'text-red-600', bgColor: 'bg-red-50', borderColor: 'border-red-100' };
  };

  const aqiStatus = getAQIStatus(aqiValue);

  return (
    <section className="glass-card p-6 overflow-hidden relative group">
      <div className="flex justify-between items-center mb-6 relative z-10">
        <h3 className="text-lg font-bold text-slate-900 flex items-center">
          <span className="w-1.5 h-6 bg-teal-500 rounded-full mr-3"></span>
          Môi trường Đà Nẵng
        </h3>
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-white/50 backdrop-blur-sm px-2 py-1 rounded-lg border border-slate-100">
          Trực tiếp
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 relative z-10">
        {/* Air Quality */}
        <div className={`p-5 rounded-3xl border transition-all duration-300 hover:shadow-lg ${aqiStatus.bgColor} ${aqiStatus.borderColor}`}>
          <div className="flex items-center justify-between mb-4">
            <div className={`p-2 rounded-xl bg-white shadow-sm ${aqiStatus.color}`}>
              <WindIcon className="w-6 h-6" />
            </div>
            <span className={`text-[10px] font-black uppercase tracking-widest ${aqiStatus.color}`}>Chỉ số AQI</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-4xl font-black tracking-tighter ${aqiStatus.color}`}>{aqiValue}</span>
            <span className={`text-sm font-bold ${aqiStatus.color}`}>{aqiStatus.label}</span>
          </div>
          <p className="text-[10px] text-slate-500 font-medium mt-2 line-clamp-2">
            {data.aqi.healthRecommendations.generalPopulation}
          </p>
        </div>

        {/* Weather */}
        <div className="p-5 rounded-3xl border border-blue-100 bg-blue-50/50 transition-all duration-300 hover:shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 rounded-xl bg-white shadow-sm text-blue-600">
              {data.weather.temperature.value > 25 ? <SunIcon className="w-6 h-6" /> : <CloudIcon className="w-6 h-6" />}
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-blue-600">Thời tiết</span>
          </div>
          <div className="flex items-baseline gap-2 text-blue-900">
            <span className="text-4xl font-black tracking-tighter">
              {Math.round(data.weather.temperature.value)}°
            </span>
            <span className="text-sm font-bold uppercase">{data.weather.condition || 'Nắng'}</span>
          </div>
          <div className="flex items-center gap-4 mt-3">
            <div className="flex items-center gap-1">
              <WaterDropIcon className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-[10px] font-bold text-blue-700">{data.weather.humidity}% Độ ẩm</span>
            </div>
            <div className="flex items-center gap-1">
              <WindIcon className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-[10px] font-bold text-blue-700">{Math.round(data.weather.windSpeed)} km/h</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between text-[10px] font-bold text-slate-400 border-t border-slate-100/50 pt-4 relative z-10">
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
          <span>Cập nhật: {new Date(data.timestamp).toLocaleTimeString('vi-VN')}</span>
        </div>
        <span className="uppercase tracking-tighter">Dữ liệu Môi trường</span>
      </div>

      {/* Decorative background element */}
      <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-teal-100/20 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-700"></div>
    </section>
  );
};

export default EnvironmentalWidget;
