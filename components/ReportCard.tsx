
import React from 'react';
import { AIAnalysis } from '../types';
import { SeverityIcon } from './icons/SeverityIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { LifebuoyIcon } from './icons/LifebuoyIcon';

interface ReportCardProps {
  analysis: AIAnalysis;
}

const getPriorityDetails = (priority: 'Cao' | 'Trung bình' | 'Thấp') => {
  switch (priority) {
    case 'Cao':
      return {
        label: 'Cao',
        bg: 'bg-red-500',
        text: 'text-red-700',
        lightBg: 'bg-red-50',
        border: 'border-red-200',
        width: 'w-full',
      };
    case 'Trung bình':
      return {
        label: 'Trung bình',
        bg: 'bg-amber-500',
        text: 'text-amber-700',
        lightBg: 'bg-amber-50',
        border: 'border-amber-200',
        width: 'w-2/3',
      };
    case 'Thấp':
      return {
        label: 'Thấp',
        bg: 'bg-teal-500',
        text: 'text-teal-700',
        lightBg: 'bg-teal-50',
        border: 'border-teal-200',
        width: 'w-1/3',
      };
    default:
      return {
        label: 'Không rõ',
        bg: 'bg-gray-400',
        text: 'text-gray-700',
        lightBg: 'bg-gray-50',
        border: 'border-gray-200',
        width: 'w-0',
      };
  }
};


const ReportCard: React.FC<ReportCardProps> = ({ analysis }) => {
  if (!analysis) {
    return (
      <div className="w-full bg-slate-50 rounded-2xl p-5 border border-slate-200 text-center">
        <p className="text-sm text-slate-500 font-medium italic">Không có dữ liệu phân tích AI cho báo cáo này.</p>
      </div>
    );
  }

  const priorityDetails = getPriorityDetails(analysis.priority);

  return (
    <div className="w-full bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-200/60 ring-1 ring-slate-100">
      
      {/* Header with Priority and Type */}
      <div className="p-5 border-b border-slate-100 flex items-start justify-between bg-gradient-to-r from-slate-50/50 to-white">
        <div>
           <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Loại sự cố</p>
           <h3 className="text-lg font-bold text-slate-800">{analysis.issueType}</h3>
        </div>
        
        <div className={`px-4 py-2 rounded-xl flex flex-col items-end ${priorityDetails.lightBg} border ${priorityDetails.border}`}>
           <div className="flex items-center space-x-1.5 mb-1">
              <span className={`text-xs font-bold uppercase ${priorityDetails.text}`}>{priorityDetails.label}</span>
              <SeverityIcon priority={analysis.priority} className={`w-4 h-4 ${priorityDetails.text}`} />
           </div>
           {/* Modern Progress Bar */}
           <div className="w-20 h-1.5 bg-white/60 rounded-full overflow-hidden">
             <div className={`h-full rounded-full ${priorityDetails.bg} transition-all duration-500 ease-out`} style={{width: priorityDetails.width}}></div>
           </div>
        </div>
      </div>
      
      <div className="p-5 space-y-6">
        {/* Description Section */}
        <div>
          <h4 className="text-sm font-semibold text-slate-500 mb-2">Thông tin chi tiết</h4>
          <p className="text-slate-700 text-sm leading-relaxed bg-slate-50/50 p-3 rounded-xl border border-slate-100">
            {analysis.description}
          </p>
        </div>

        {/* AI Solution Section */}
         {analysis.solution && (
          <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-indigo-50 to-white border border-indigo-100 shadow-sm">
             <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
             <div className="p-4">
                <div className="flex items-center mb-2">
                   <div className="bg-indigo-100 p-1.5 rounded-lg mr-3">
                      <SparklesIcon className="h-4 w-4 text-indigo-600" />
                   </div>
                   <h4 className="text-sm font-bold text-indigo-900">Giải pháp đề xuất</h4>
                </div>
                <p className="text-sm text-indigo-800 pl-11">{analysis.solution}</p>
             </div>
          </div>
        )}

        {/* Emergency Supplies Section */}
        {analysis.recommendedSupplies && analysis.recommendedSupplies.length > 0 && (
           <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-orange-50 to-white border border-orange-100 shadow-sm">
            <div className="absolute top-0 left-0 w-1 h-full bg-orange-500"></div>
            <div className="p-4">
                <div className="flex items-center mb-2">
                   <div className="bg-orange-100 p-1.5 rounded-lg mr-3">
                      <LifebuoyIcon className="h-4 w-4 text-orange-600" />
                   </div>
                   <h4 className="text-sm font-bold text-orange-900">Nhu yếu phẩm cần thiết</h4>
                </div>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-11">
                  {analysis.recommendedSupplies.map((item, index) => (
                    <li key={index} className="flex items-center text-sm text-orange-800">
                      <span className="w-1.5 h-1.5 bg-orange-400 rounded-full mr-2"></span>
                      {item}
                    </li>
                  ))}
                </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportCard;
