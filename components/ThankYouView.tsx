import React from 'react';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { HomeIcon } from './icons/HomeIcon';
import { MapIcon } from './icons/MapIcon';
import { SparklesIcon } from './icons/SparklesIcon';

interface ThankYouViewProps {
  awardedPoints: number;
  onNavigateHome: () => void;
  onNavigateToMap: () => void;
}

const ThankYouView: React.FC<ThankYouViewProps> = ({ awardedPoints, onNavigateHome, onNavigateToMap }) => {
  return (
    <div className="flex items-center justify-center h-full p-4">
      <div className="text-center bg-white p-8 sm:p-12 rounded-2xl shadow-lg border border-slate-200 max-w-lg w-full">
        <CheckCircleIcon className="w-20 h-20 text-green-500 mx-auto mb-4" />
        <h2 className="text-3xl font-bold text-slate-800 mb-2">
          Cảm ơn bạn đã báo cáo!
        </h2>
        <p className="text-slate-600">
          Đóng góp của bạn rất quan trọng. Chúng tôi sẽ xem xét và xử lý vấn đề này sớm nhất có thể.
        </p>

        {awardedPoints > 0 && (
          <div className="mt-6 mb-8 bg-green-50 text-green-700 font-semibold p-3 rounded-lg flex items-center justify-center space-x-2 animate-pulse">
            <SparklesIcon className="w-5 h-5" />
            <span>+{awardedPoints} điểm đã được thêm vào tài khoản của bạn!</span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
          <button
            onClick={onNavigateHome}
            className="w-full sm:w-auto text-lg bg-slate-700 text-white font-bold py-3 px-6 rounded-lg shadow-md hover:bg-slate-800 transition-all duration-300 flex items-center justify-center space-x-2"
          >
            <HomeIcon className="w-6 h-6" />
            <span>Về trang chủ</span>
          </button>
          <button
            onClick={onNavigateToMap}
            className="w-full sm:w-auto text-lg bg-teal-600 text-white font-bold py-3 px-6 rounded-lg shadow-md hover:bg-teal-700 transition-all duration-300 flex items-center justify-center space-x-2"
          >
             <MapIcon className="w-6 h-6" />
            <span>Xem lại bản đồ</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ThankYouView;