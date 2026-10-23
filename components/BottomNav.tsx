
import React from 'react';
import { HomeIcon } from './icons/HomeIcon';
import { MapIcon } from './icons/MapIcon';
import { GlobeIcon } from './icons/GlobeIcon';
import { SOSIcon } from './icons/SOSIcon';
import { UserIcon } from './icons/UserIcon';

interface BottomNavProps {
  activeView: string;
  onNavigate: (view: any) => void;
  isLoggedIn: boolean;
  unreadNotificationsCount?: number;
}

const BottomNav: React.FC<BottomNavProps> = ({ activeView, onNavigate, isLoggedIn, unreadNotificationsCount = 0 }) => {
  const navItems = [
    { id: 'home', label: 'Trang chủ', icon: <HomeIcon className="w-6 h-6" /> },
    { id: 'map', label: 'Sự cố', icon: <MapIcon className="w-6 h-6" /> },
    { id: 'environmentalMap', label: 'Bản đồ Xanh', icon: <GlobeIcon className="w-6 h-6" /> },
    { id: 'sos', label: 'SOS', icon: <SOSIcon className="w-6 h-6" /> },
    { 
      id: isLoggedIn ? 'dashboard' : 'login', 
      label: isLoggedIn ? 'Cá nhân' : 'Đăng nhập', 
      icon: (
        <div className="relative">
          <UserIcon className="w-6 h-6" />
          {isLoggedIn && unreadNotificationsCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center border border-white">
              {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
            </span>
          )}
        </div>
      ) 
    },
  ];

  return (
    <div className="md:hidden fixed bottom-6 left-4 right-4 bg-white/80 backdrop-blur-lg border border-white/40 px-2 py-2 z-[1000] flex justify-around items-center rounded-[2rem] shadow-2xl shadow-slate-200/50 safe-area-bottom">
      {navItems.map((item) => {
        const isActive = activeView === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all duration-300 ${
              isActive ? 'scale-110' : 'scale-100 opacity-60'
            }`}
          >
            <div className={`p-2 rounded-xl transition-colors ${isActive ? 'bg-brand-600 text-white shadow-lg shadow-brand-100' : 'text-slate-600'}`}>
              {item.icon}
            </div>
            <span className={`text-[9px] mt-1 font-black uppercase tracking-tighter ${isActive ? 'text-brand-700' : 'text-slate-500'}`}>
              {item.label}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default BottomNav;
