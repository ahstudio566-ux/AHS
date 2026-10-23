
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { EnvironmentalReport, ReportStatus, EnvironmentalPOI, POIType, AIAnalysis } from '../types';
import { HomeIcon } from './icons/HomeIcon';
import { LayersIcon } from './icons/LayersIcon';
import { MapPinIcon } from './icons/MapPinIcon';
import { AllIssuesIcon } from './icons/AllIssuesIcon';
import { TrashIcon } from './icons/TrashIcon';
import { LandslideIcon } from './icons/LandslideIcon';
import { FloodIcon } from './icons/FloodIcon';
import { LifebuoyIcon } from './icons/LifebuoyIcon';
import { LocationIcon } from './icons/LocationIcon';
import { WeatherOverlay } from './WeatherOverlay';
import { SunIcon } from './icons/SunIcon';
import { CloudIcon } from './icons/CloudIcon';

interface EnvironmentalMapViewProps {
  reports: EnvironmentalReport[];
  pois: EnvironmentalPOI[];
  userLocation: { latitude: number; longitude: number } | null;
  onNavigateHome: () => void;
  onSelectReport: (report: EnvironmentalReport) => void;
  onStartReport: () => void;
  selectedReport?: EnvironmentalReport | null;
  initialViewState?: {
    center: [number, number];
    zoom: number;
  };
  mapId?: string;
}

const statusColors: Record<ReportStatus, string> = {
  'Báo cáo mới': '#ef4444',
  'Đang xử lý': '#f59e0b',
  'Đã xử lý': '#22c55e',
};

const poiDetails: Record<POIType, { name: string; color: string }> = {
  NatureReserve: { name: 'Khu bảo tồn', color: '#16a34a' },
  RecyclingCenter: { name: 'Điểm tái chế', color: '#2563eb' },
  CommunityCleanup: { name: 'Điểm dọn dẹp', color: '#ea580c' },
  WaterStation: { name: 'Trạm nước', color: '#0891b2' },
  RiskPoint: { name: 'Điểm rủi ro', color: '#dc2626' },
};

const sovereigntyLabels = [
  { lat: 16.4, lng: 112.0, name: "Quần đảo Hoàng Sa (Việt Nam)" },
  { lat: 10.0, lng: 114.0, name: "Quần đảo Trường Sa (Việt Nam)" }
];

function MapEvents({ selectedReport }: { selectedReport?: EnvironmentalReport | null }) {
  const map = useMap();
  useEffect(() => {
    if (selectedReport) {
      map.setView([selectedReport.latitude, selectedReport.longitude], 16, { animate: true });
    }
  }, [selectedReport, map]);
  return null;
}

const EnvironmentalMapView: React.FC<EnvironmentalMapViewProps> = ({ 
  reports, 
  pois, 
  userLocation, 
  onNavigateHome, 
  onSelectReport, 
  onStartReport, 
  selectedReport, 
  initialViewState,
}) => {
  const [activeFilter, setActiveFilter] = useState<string>('Tất cả');
  const [selectedArea, setSelectedArea] = useState<string>('Tất cả khu vực');
  const [isAreaDropdownOpen, setIsAreaDropdownOpen] = useState(false);
  const [showWeather, setShowWeather] = useState(false);
  const [mapCenter, setMapCenter] = useState({ lat: initialViewState?.center[0] || 16.047, lng: initialViewState?.center[1] || 108.206 });
  const [mapZoom, setMapZoom] = useState(initialViewState?.zoom || 12);
  const [tileUrl, setTileUrl] = useState('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png');

  // Get coordinates for weather
  const weatherCoords = useMemo(() => {
    if (selectedArea !== 'Tất cả khu vực') {
      const reportInArea = reports.find(r => r.area === selectedArea);
      if (reportInArea) return { lat: reportInArea.latitude, lng: reportInArea.longitude };
    }
    if (userLocation) return { lat: userLocation.latitude, lng: userLocation.longitude };
    return { lat: 16.0678, lng: 108.2208 }; // Default to Da Nang
  }, [selectedArea, reports, userLocation]);

  const availableAreas = useMemo(() => {
    const areas = reports
      .map(r => r.area)
      .filter((area): area is string => !!area);
    return ['Tất cả khu vực', ...Array.from(new Set(areas)).sort()];
  }, [reports]);

  const filteredReports = useMemo(() => {
    let result = reports;
    if (selectedArea !== 'Tất cả khu vực') {
      result = result.filter(r => r.area === selectedArea);
    }
    if (activeFilter === 'Tất cả') return result;
    if (activeFilter === 'Nhu yếu phẩm') {
        return result.filter(r => (r.aiAnalysis?.recommendedSupplies?.length ?? 0) > 0);
    }
    if (activeFilter === 'Rủi ro') return [];
    return result.filter(r => r.aiAnalysis?.issueType === activeFilter);
  }, [reports, activeFilter, selectedArea]);

  const filteredPOIs = useMemo(() => {
    if (selectedArea !== 'Tất cả khu vực') return [];
    if (activeFilter === 'Tất cả') return pois;
    if (activeFilter === 'Rủi ro') return pois.filter(p => p.type === 'RiskPoint');
    if (activeFilter === 'Sạt lở') return pois.filter(p => p.type === 'RiskPoint' && p.name.toLowerCase().includes('sạt lở'));
    if (activeFilter === 'Ngập lụt') return pois.filter(p => p.type === 'RiskPoint' && p.name.toLowerCase().includes('ngập lụt'));
    return [];
  }, [pois, activeFilter, selectedArea]);

  const handleToggleLayer = () => {
    const tiles = [
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
      'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    ];
    const nextIndex = (tiles.indexOf(tileUrl) + 1) % tiles.length;
    setTileUrl(tiles[nextIndex]);
  };

  const handleCenterOnUser = () => {
    if (userLocation) {
      setMapCenter({ lat: userLocation.latitude, lng: userLocation.longitude });
      setMapZoom(16);
    }
  };

  const createReportIcon = (report: EnvironmentalReport) => {
    const hasSupplies = (report.aiAnalysis?.recommendedSupplies?.length ?? 0) > 0;
    const isHighPriority = report.aiAnalysis?.priority === 'Cao';
    
    if (hasSupplies) {
      return L.divIcon({
        className: 'supplies-icon',
        html: `<div class="animate-pulse bg-white rounded-full p-1 border-2 border-orange-500 shadow-lg" style="width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-6 h-6 text-orange-500"><path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm3-3h3m-9 0H6m3-3-2.12-2.12M17.12 17.12 15 15m0-6 2.12-2.12M6.88 17.12 9 15"></path></svg>
              </div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });
    }

    const size = isHighPriority ? 14 : 10;
    return L.divIcon({
      className: 'report-icon',
      html: `<div style="background-color: ${statusColors[report.status]}; width: ${size}px; height: ${size}px; border-radius: 50%; border: 2px solid ${isHighPriority ? 'red' : 'white'}; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
      iconSize: [size, size],
      iconAnchor: [size/2, size/2],
    });
  };

  return (
    <div className="absolute inset-0 w-full h-full">
      <MapContainer
        center={[mapCenter.lat, mapCenter.lng]}
        zoom={mapZoom}
        zoomControl={false}
        className="w-full h-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url={tileUrl}
        />
        <ZoomControl position="bottomright" />
        <MapEvents selectedReport={selectedReport} />

        {/* Reports Markers */}
        {filteredReports.map(report => (
          <Marker
            key={report.id}
            position={[report.latitude, report.longitude]}
            icon={createReportIcon(report)}
            eventHandlers={{ click: () => onSelectReport(report) }}
          >
            <Popup>
               <div className="p-1">
                  <p className="font-bold text-xs uppercase mb-1">{report.aiAnalysis?.issueType || 'Sự cố môi trường'}</p>
                  <p className="text-[10px] text-slate-500 leading-tight">{report.description || report.userDescription}</p>
               </div>
            </Popup>
          </Marker>
        ))}

        {/* POI Markers */}
        {filteredPOIs.map(poi => (
          <Marker
            key={poi.id}
            position={[poi.latitude, poi.longitude]}
            icon={L.divIcon({
              className: 'poi-icon',
              html: `<div style="background-color: ${poiDetails[poi.type].color}; width: 10px; height: 10px; border-radius: 50%; border: 2px solid white;"></div>`,
              iconSize: [10, 10],
              iconAnchor: [5, 5],
            })}
          >
            <Popup><p className="text-xs font-bold">{poi.name}</p></Popup>
          </Marker>
        ))}

        {/* Sovereignty Labels */}
        {sovereigntyLabels.map((label, idx) => (
          <Marker
            key={`sov-${idx}`}
            position={[label.lat, label.lng]}
            icon={L.divIcon({
              className: 'sov-icon',
              html: `<div class="flex flex-col items-center justify-center pointer-events-none">
                      <div class="text-[10px] sm:text-xs font-bold text-red-700 uppercase tracking-widest text-center drop-shadow-sm whitespace-nowrap bg-white/60 backdrop-blur-[1px] px-2 py-0.5 rounded border border-white/20">
                          ${label.name}
                      </div>
                      <div class="w-1.5 h-1.5 bg-red-600 rounded-full mt-1 shadow-sm"></div>
                    </div>`,
              iconSize: [150, 40],
              iconAnchor: [75, 35],
            })}
          />
        ))}

        {/* User Location */}
        {userLocation && (
          <Marker 
            position={[userLocation.latitude, userLocation.longitude]} 
            icon={L.divIcon({
              className: 'user-icon',
              html: `<div class="relative flex items-center justify-center">
                      <div class="absolute w-8 h-8 bg-blue-500/30 rounded-full animate-ping"></div>
                      <div class="relative w-4 h-4 bg-blue-600 rounded-full border-2 border-white shadow-lg"></div>
                    </div>`,
              iconSize: [32, 32],
              iconAnchor: [16, 16],
            })}
          />
        )}
      </MapContainer>
      
      {/* Top Left - Controls */}
      <div className="absolute top-4 left-4 z-[1000] flex flex-col space-y-2">
         <button
            onClick={onNavigateHome}
            className="bg-white/90 backdrop-blur-sm text-gray-700 rounded-full p-3 shadow-lg hover:bg-white transition-all focus:outline-none focus:ring-2 focus:ring-teal-500"
            aria-label="Về trang chủ"
          >
            <HomeIcon className="w-5 h-5 sm:w-6 h-6" />
          </button>
          
          <button
            onClick={handleToggleLayer}
            className="bg-white/90 backdrop-blur-sm text-gray-700 rounded-full p-3 shadow-lg hover:bg-white transition-all focus:outline-none focus:ring-2 focus:ring-teal-500"
            aria-label="Thay đổi lớp bản đồ"
            title="Thay đổi lớp bản đồ"
          >
            <LayersIcon className="w-5 h-5 sm:w-6 h-6" />
          </button>

          <button
            onClick={handleCenterOnUser}
            className="bg-white/90 backdrop-blur-sm text-blue-600 rounded-full p-3 shadow-lg hover:bg-white transition-all focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Định vị GPS"
            title="Định vị vị trí hiện tại (GPS Phần cứng)"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 sm:w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25s-7.5-4.108-7.5-11.25a7.5 7.5 0 1115 0z" />
            </svg>
          </button>
          
          <button
            onClick={onStartReport}
            className="bg-teal-600 text-white rounded-full p-3 shadow-lg hover:bg-teal-700 transition-all focus:outline-none focus:ring-2 focus:ring-teal-500 animate-bounce flex items-center space-x-2 pr-4"
            title="Báo cáo nhanh tại đây"
            aria-label="Báo cáo nhanh tại đây"
          >
            <MapPinIcon className="w-5 h-5 sm:w-6 h-6" />
            <span className="text-[10px] sm:text-xs font-bold">Báo cáo nhanh</span>
          </button>
      </div>

       {/* Top Center - Title Badge */}
       <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-[1000] w-auto flex flex-col items-center">
        <div className="bg-white/90 backdrop-blur-sm px-3 sm:px-4 py-1.5 sm:py-2 rounded-full shadow-lg border border-gray-100 flex flex-col items-center">
          <h3 className="text-[10px] sm:text-sm font-bold text-red-700 whitespace-nowrap uppercase tracking-wider">Bản đồ Rủi ro</h3>
        </div>
        
        <div className="mt-2 relative">
          <button 
            onClick={() => setIsAreaDropdownOpen(!isAreaDropdownOpen)}
            className="bg-white/90 backdrop-blur-sm px-3 sm:px-4 py-1.5 rounded-full shadow-md border border-gray-100 flex items-center space-x-1 sm:space-x-2 hover:bg-white transition-all text-[10px] sm:text-xs font-semibold text-gray-700"
          >
            <LocationIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-teal-600" />
            <span className="hidden xs:inline text-gray-400 font-normal">Khu vực:</span>
            <span className="max-w-[80px] sm:max-w-none truncate">{selectedArea}</span>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={`w-3 h-3 sm:w-4 sm:h-4 transition-transform ${isAreaDropdownOpen ? 'rotate-180' : ''}`}>
              <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
            </svg>
          </button>

          <button
            onClick={() => setShowWeather(!showWeather)}
            className={`absolute left-full ml-2 top-0 bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-md border border-gray-100 transition-all ${showWeather ? 'bg-teal-500 text-white' : 'text-teal-600 hover:bg-white'}`}
            title="Xem thời tiết"
          >
            {showWeather ? <SunIcon className="w-4 h-4" /> : <CloudIcon className="w-4 h-4" />}
          </button>
          
          {isAreaDropdownOpen && (
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 w-40 sm:w-48 bg-white/95 backdrop-blur-md rounded-xl shadow-xl border border-gray-100 overflow-hidden z-20 py-1 max-h-60 overflow-y-auto">
              {availableAreas.map(area => (
                <button
                  key={area}
                  onClick={() => {
                    setSelectedArea(area);
                    setIsAreaDropdownOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2 text-[10px] sm:text-xs transition-colors ${selectedArea === area ? 'bg-teal-50 text-teal-700 font-bold' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                  {area}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

       {/* Top Right - Filter Controls */}
       <div className="absolute top-4 right-4 z-[1000] flex flex-col items-end space-y-2">
        <div className="bg-white/90 backdrop-blur-sm p-1 sm:p-1.5 rounded-2xl shadow-lg flex flex-col space-y-0.5 sm:space-y-1">
            {[
              { name: 'Tất cả', icon: <AllIssuesIcon className="w-5 h-5" />, filterType: 'Tất cả' },
              { name: 'Rủi ro', icon: (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-red-600">
                      <path fillRule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.752a3 3 0 01-2.598 4.5H4.644a3 3 0 01-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
                  </svg>
              ), filterType: 'Rủi ro' },
              { name: 'Mới/Chờ', icon: <MapPinIcon className="w-5 h-5" />, filterType: 'Đang chờ phân tích' },
              { name: 'Cứu trợ', icon: <LifebuoyIcon className="w-5 h-5" />, filterType: 'Nhu yếu phẩm' },
              { name: 'Rác thải', icon: <TrashIcon className="w-5 h-5" />, filterType: 'Xả rác không đúng nơi quy định' },
              { name: 'Sạt lở', icon: <LandslideIcon className="w-5 h-5" />, filterType: 'Sạt lở đất' },
              { name: 'Ngập lụt', icon: <FloodIcon className="w-5 h-5" />, filterType: 'Ngập lụt' },
            ].map((cat) => (
                <button
                    key={cat.name}
                    onClick={() => setActiveFilter(cat.filterType)}
                    className={`flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-xl transition-all duration-200 ${activeFilter === cat.filterType ? 'bg-teal-500 text-white shadow-md scale-105' : 'text-gray-600 hover:bg-gray-100'}`}
                    title={cat.name}
                    aria-label={`Lọc theo ${cat.name}`}
                >
                    <div className="w-5 sm:w-6 flex justify-center">{cat.icon}</div>
                </button>
            ))}
        </div>
      </div>

      {/* Bottom Left - Legend */}
      <div className="absolute bottom-20 left-4 flex flex-col space-y-4 z-[1000]">
        {showWeather && (
          <WeatherOverlay 
            lat={weatherCoords.lat} 
            lng={weatherCoords.lng} 
            areaName={selectedArea === 'Tất cả khu vực' ? 'Toàn khu vực' : selectedArea}
            onClose={() => setShowWeather(false)}
          />
        )}

        <div className="bg-white/90 backdrop-blur-sm p-3 rounded-xl shadow-lg max-w-[200px] border border-gray-100 hidden md:block">
          <h4 className="font-bold text-xs mb-2 text-gray-500 uppercase tracking-wider">Chú giải</h4>
        <div className="space-y-2">
          <div>
             <div className="flex items-center space-x-2 bg-orange-50 p-1 rounded-lg">
                 <div className="w-5 h-5 flex items-center justify-center">
                    <LifebuoyIcon className="w-4 h-4 text-orange-600" />
                 </div>
                 <span className="text-xs font-bold text-orange-700">Cứu trợ / Nhu yếu phẩm</span>
             </div>
          </div>
          <div className="grid grid-cols-1 gap-1">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded-full bg-red-600 animate-pulse border border-white shadow-sm flex items-center justify-center">
                   <div className="w-1 h-1 bg-white rounded-full"></div>
                </div>
                <span className="text-xs text-gray-600">Điểm rủi ro cao</span>
              </div>
              {Object.entries(statusColors).map(([status, color]) => (
                 <div key={status} className="flex items-center space-x-2">
                   <MapPinIcon className="w-4 h-4 flex-shrink-0" style={{color: color}} />
                   <span className="text-xs text-gray-600 truncate">{status}</span>
                 </div>
              ))}
          </div>
        </div>
      </div>
      </div>
    </div>
  );
};

export default EnvironmentalMapView;
