import React from 'react';
import { EducationalTopic } from '../types';
import { XMarkIcon } from './icons/XMarkIcon';
import { LightBulbIcon } from './icons/LightBulbIcon';

interface EducationDetailModalProps {
  topic: EducationalTopic;
  onClose: () => void;
}

const EducationDetailModal: React.FC<EducationDetailModalProps> = ({ topic, onClose }) => {
  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 z-[1100] flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="education-details-title"
    >
      <div
        className="bg-gray-50 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="p-4 flex items-center justify-between border-b border-gray-200 sticky top-0 bg-gray-50/80 backdrop-blur-sm z-10">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0 bg-white rounded-full p-2 border border-slate-200">
              {topic.icon}
            </div>
            <h2 id="education-details-title" className="text-xl font-bold text-gray-800">
              {topic.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-3 text-gray-400 rounded-full hover:bg-gray-200 hover:text-gray-700 transition-colors"
            aria-label="Đóng"
          >
            <XMarkIcon className="w-7 h-7" />
          </button>
        </header>

        <div className="p-6 space-y-6">
          {/* Phần Tầm quan trọng */}
          <div>
            <h3 className="text-lg font-semibold text-slate-700 mb-2">Tại sao điều này quan trọng?</h3>
            <p className="text-slate-600 leading-relaxed bg-white p-4 rounded-lg border border-slate-200">{topic.details.importance}</p>
          </div>

          {/* Phần Giải pháp */}
          <div>
            <h3 className="text-lg font-semibold text-slate-700 mb-2">Giải pháp và cách thực hiện</h3>
            <div className="space-y-3">
              {topic.details.solutions.map((solution, index) => (
                <div key={index} className="bg-white p-4 rounded-lg border border-slate-200">
                  <h4 className="font-bold text-teal-700">{solution.title}</h4>
                  <p className="text-slate-600 mt-1 text-sm">{solution.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Phần Mẹo */}
          <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-r-lg">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <LightBulbIcon className="h-6 w-6 text-amber-500" />
              </div>
              <div className="ml-3">
                <h4 className="text-md font-bold text-amber-800">Mẹo hữu ích</h4>
                <p className="text-sm text-amber-700 mt-1">{topic.details.tip}</p>
              </div>
            </div>
          </div>
        </div>
        
         <footer className="p-4 mt-auto border-t border-gray-200 sticky bottom-0 bg-gray-50/80 backdrop-blur-sm">
            <button
                onClick={onClose}
                className="w-full bg-teal-600 text-white font-bold py-3 px-6 rounded-lg shadow-md hover:bg-teal-700 transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
            >
                Tôi đã hiểu
            </button>
        </footer>
      </div>
    </div>
  );
};

export default EducationDetailModal;