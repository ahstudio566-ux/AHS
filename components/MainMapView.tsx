
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { EnvironmentalReport, ReportStatus, AIAnalysis } from '../types';
import { MapPinIcon } from './icons/MapPinIcon';
import AddIcon from './icons/AddIcon';
import { HomeIcon } from './icons/HomeIcon';
import MapSearch from './MapSearch';
import { LayersIcon } from './icons/LayersIcon';
import { AllIssuesIcon } from './icons/AllIssuesIcon';
import { TrashIcon } from './icons/TrashIcon';
import { LandslideIcon } from './icons/LandslideIcon';
import { FloodIcon } from './icons/FloodIcon';
import { WeatherOverlay } from './WeatherOverlay';
import { SunIcon } from './icons/SunIcon';
import { CloudIcon } from './icons/CloudIcon';

// Fix for default marker icons in Leaflet
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

interface MainMapViewProps {
  reports: EnvironmentalReport[];
  userLocation: { latitude: number; longitude: number } | null;
  onSelectReport: (report: EnvironmentalReport) => void;
  onNavigateHome: () => void;
  onStartNewReport: () => void;
  selectedReport: EnvironmentalReport | null;
  initialViewState: { center: [number, number]; zoom: number };
  onViewChange: (center: { lat: number; lng: number }, zoom: number) => void;
  mapId?: string;
}

const statusColors: Record<ReportStatus, string> = {
  'Báo cáo mới': '#ef4444', // red-500 from Tailwind
  'Đang xử lý': '#f59e0b', // amber-500 from Tailwind
  'Đã xử lý': '#22c55e', // green-500 from Tailwind
};

// Sovereignty labels
const sovereigntyLabels = [
  { lat: 16.4, lng: 112.0, name: "Quần đảo Hoàng Sa (Việt Nam)" },
  { lat: 10.0, lng: 114.0, name: "Quần đảo Trường Sa (Việt Nam)" }
];

const filterCategories: { name: string; icon: React.ReactElement; issueType: AIAnalysis['issueType'] | 'Tất cả' }[] = [
    { name: 'Tất cả', icon: <AllIssuesIcon className="w-5 h-5" />, issueType: 'Tất cả' },
    { name: 'Rác thải', icon: <TrashIcon className="w-5 h-5" />, issueType: 'Xả rác không đúng nơi quy định' },
    { name: 'Sạt lở', icon: <LandslideIcon className="w-5 h-5" />, issueType: 'Sạt lở đất' },
    { name: 'Ngập lụt', icon: <FloodIcon className="w-5 h-5" />, issueType: 'Ngập lụt' },
];

// Component to handle map center updates and events
function MapEvents({ 
  selectedReport, 
  onViewChange,
  userLocation
}: { 
  selectedReport: EnvironmentalReport | null, 
  onViewChange: (center: { lat: number; lng: number }, zoom: number) => void,
  userLocation: { latitude: number; longitude: number } | null
}) {
  const map = useMap();

  useEffect(() => {
    if (selectedReport) {
      map.setView([selectedReport.latitude, selectedReport.longitude], 16, { animate: true });
    }
  }, [selectedReport, map]);

  useEffect(() => {
    const onMoveEnd = () => {
      const center = map.getCenter();
      onViewChange({ lat: center.lat, lng: center.lng }, map.getZoom());
    };

    map.on('moveend', onMoveEnd);
    return () => {
      map.off('moveend', onMoveEnd);
    };
  }, [map, onViewChange]);

  return null;
}

const MainMapView: React.FC<MainMapViewProps> = ({ 
  reports, 
  userLocation, 
  onSelectReport, 
  onNavigateHome, 
  onStartNewReport, 
  selectedReport, 
  initialViewState, 
  onViewChange,
}) => {
  const [activeFilter, setActiveFilter] = useState<AIAnalysis['issueType'] | 'Tất cả'>('Tất cả');
  const [showWeather, setShowWeather] = useState(false);
  const [mapCenter, setMapCenter] = useState({ lat: initialViewState.center[0], lng: initialViewState.center[1] });
  const [mapZoom, setMapZoom] = useState(initialViewState.zoom);
  const [tileUrl, setTileUrl] = useState('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png');

  const filteredReports = useMemo(() => {
    if (activeFilter === 'Tất cả') {
        return reports;
    }
    return reports.filter(r => r.aiAnalysis?.issueType === activeFilter);
  }, [reports, activeFilter]);

  // Generate suggestions for autocomplete search
  const suggestionsData = useMemo(() => {
    const issueTypes = reports.map(r => r.aiAnalysis?.issueType).filter(type => type && type !== 'Không có sự cố' && type !== 'Khác');
    const commonTerms = [
      'Rác thải',
      'Ô nhiễm',
      'Cầu Rồng',
      'Bãi biển Mỹ Khê',
      'Bán đảo Sơn Trà',
      'Sông Hàn',
      'Điểm nóng ô nhiễm',
      'Ngập lụt',
      'Sạt lở đất',
      'Cây xanh',
    ];
    return [...new Set([...issueTypes, ...commonTerms])];
  }, [reports]);

  const handleSearch = (latLng: { lat: number; lng: number }) => {
    setMapCenter(latLng);
    setMapZoom(16);
  };

  const handleToggleLayer = () => {
    const tiles = [
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', // Humanitarian
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

  const createReportIcon = (status: ReportStatus) => {
    return L.divIcon({
      className: 'custom-div-icon',
      html: `<div style="background-color: ${statusColors[status]}; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
      iconSize: [12, 12],
      iconAnchor: [6, 6],
    });
  };

  const sovereigntyIcon = L.divIcon({
    className: 'sov-icon',
    html: `<div class="flex flex-col items-center justify-center pointer-events-none">
            <div class="text-[10px] sm:text-xs font-bold text-red-700 uppercase tracking-widest text-center drop-shadow-sm whitespace-nowrap bg-white/60 backdrop-blur-[1px] px-2 py-0.5 rounded border border-white/20">
                LABEL_NAME
            </div>
            <div class="w-1.5 h-1.5 bg-red-600 rounded-full mt-1 shadow-sm"></div>
          </div>`,
    iconSize: [100, 40],
    iconAnchor: [50, 35],
  });

  const userIcon = L.divIcon({
    className: 'user-location-icon',
    html: `<div class="relative flex items-center justify-center">
            <div class="absolute w-8 h-8 bg-blue-500/30 rounded-full animate-ping"></div>
            <div class="relative w-4 h-4 bg-blue-600 rounded-full border-2 border-white shadow-lg"></div>
          </div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });

  return (
    <div className="relative w-full h-full">
      <MapContainer
        center={[mapCenter.lat, mapCenter.lng]}
        zoom={mapZoom}
        zoomControl={false}
        className="w-full h-full"
        style={{ background: '#f8fafc' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url={tileUrl}
        />
        
        <ZoomControl position="bottomright" />
        
        <MapEvents 
          selectedReport={selectedReport} 
          onViewChange={(c, z) => {
            setMapCenter(c);
            setMapZoom(z);
            onViewChange(c, z);
          }}
          userLocation={userLocation}
        />

        {/* Reports Markers */}
        {filteredReports.map(report => (
          <Marker
            key={report.id}
            position={[report.latitude, report.longitude]}
            icon={createReportIcon(report.status)}
            eventHandlers={{
              click: () => onSelectReport(report),
            }}
          >
            <Popup>
               <div className="p-1">
                  <p className="font-bold text-xs uppercase mb-1">{report.aiAnalysis?.issueType || 'Sự cố môi trường'}</p>
                  <p className="text-[10px] text-slate-500 leading-tight">{report.description || report.userDescription}</p>
               </div>
            </Popup>
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
            icon={userIcon}
          />
        )}
      </MapContainer>
      
      <div className="absolute top-4 left-4 z-[1000] flex flex-col space-y-2">
         <button
            onClick={onNavigateHome}
            className="bg-white/80 backdrop-blur-sm text-gray-700 rounded-full p-3 sm:p-4 shadow-lg hover:bg-white transition-all focus:outline-none focus:ring-2 focus:ring-teal-500"
            aria-label="Về trang chủ"
          >
            <HomeIcon className="w-5 h-5 sm:w-6 h-6" />
          </button>
          <button
            onClick={handleToggleLayer}
            className="bg-white/80 backdrop-blur-sm text-gray-700 rounded-full p-3 sm:p-4 shadow-lg hover:bg-white transition-all focus:outline-none focus:ring-2 focus:ring-teal-500"
            aria-label="Thay đổi lớp bản đồ"
            title="Thay đổi lớp bản đồ"
          >
            <LayersIcon className="w-5 h-5 sm:w-6 h-6" />
          </button>

          <button
            onClick={handleCenterOnUser}
            className="bg-white/80 backdrop-blur-sm text-blue-600 rounded-full p-3 sm:p-4 shadow-lg hover:bg-white transition-all focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Định vị GPS"
            title="Định vị vị trí hiện tại (GPS Phần cứng)"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 sm:w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25s-7.5-4.108-7.5-11.25a7.5 7.5 0 1115 0z" />
            </svg>
          </button>

          <button
            onClick={() => setShowWeather(!showWeather)}
            className={`bg-white/80 backdrop-blur-sm rounded-full p-3 sm:p-4 shadow-lg hover:bg-white transition-all focus:outline-none focus:ring-2 ${showWeather ? 'bg-teal-500 text-white ring-teal-500' : 'text-teal-600 ring-teal-500'}`}
            aria-label="Xem thời tiết"
            title="Thời tiết khu vực này"
          >
            {showWeather ? <SunIcon className="w-5 h-5 sm:w-6 h-6" /> : <CloudIcon className="w-5 h-5 sm:w-6 h-6" />}
          </button>
      </div>
      
      <div className="absolute top-4 right-4 z-[1000] flex flex-col items-end space-y-2 max-w-[calc(100%-80px)]">
        <MapSearch onSearch={handleSearch} suggestionsData={suggestionsData} />
        
        <div className="bg-white/80 backdrop-blur-sm p-1.5 sm:p-2 rounded-full shadow-lg flex flex-col space-y-1">
            {filterCategories.map((cat) => (
                <button
                    key={cat.name}
                    onClick={() => setActiveFilter(cat.issueType)}
                    className={`flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full transition-all duration-200 ${activeFilter === cat.issueType ? 'bg-teal-500 text-white shadow-md scale-105' : 'text-gray-600 hover:bg-gray-200/50'}`}
                    title={cat.name}
                    aria-label={`Lọc theo ${cat.name}`}
                >
                    {cat.icon}
                </button>
            ))}
        </div>
      </div>


      <div className="absolute bottom-20 left-4 flex flex-col space-y-4 z-[1000]">
        {showWeather && (
          <WeatherOverlay 
            lat={mapCenter.lat} 
            lng={mapCenter.lng} 
            areaName="Khu vực hiện tại"
            onClose={() => setShowWeather(false)}
          />
        )}
        
        <div className="bg-white/80 backdrop-blur-sm p-3 rounded-xl shadow-md hidden md:block">
          <h4 className="font-bold text-sm mb-2 text-gray-700">Chú giải</h4>
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <MapPinIcon className="w-5 h-5" style={{color: statusColors['Báo cáo mới']}} />
            <span className="text-xs text-gray-600">Báo cáo mới</span>
          </div>
          <div className="flex items-center space-x-2">
            <MapPinIcon className="w-5 h-5" style={{color: statusColors['Đang xử lý']}} />
            <span className="text-xs text-gray-600">Đang xử lý</span>
          </div>
          <div className="flex items-center space-x-2">
            <MapPinIcon className="w-5 h-5" style={{color: statusColors['Đã xử lý']}} />
            <span className="text-xs text-gray-600">Đã xử lý</span>
          </div>
        </div>
      </div>
      </div>
      
       <div className="absolute bottom-20 right-4 z-[1000] flex flex-col items-center">
           <button
              onClick={onStartNewReport}
              className="bg-teal-600 text-white rounded-full p-4 sm:p-5 shadow-2xl hover:bg-teal-700 transition-transform transform hover:scale-110 focus:outline-none focus:ring-4 focus:ring-teal-500/50 flex items-center justify-center mb-2"
              aria-label="Báo cáo sự cố mới"
            >
              <AddIcon className="w-6 h-6 sm:w-8 h-8" />
            </button>
            <span className="bg-white/80 backdrop-blur-sm px-3 py-1 rounded-full text-[10px] font-bold text-teal-700 shadow-sm border border-teal-100 uppercase tracking-wider">Báo cáo</span>
       </div>

    </div>
  );
};

export default MainMapView;
