import React from 'react';

interface EducationCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  onSelect: () => void;
}

const EducationCard: React.FC<EducationCardProps> = ({ icon, title, description, onSelect }) => {
  return (
    <button
      onClick={onSelect}
      className="w-full text-left bg-slate-50 border border-slate-200 rounded-xl p-4 transition-all duration-300 hover:shadow-md hover:border-teal-200 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:ring-offset-2 group"
      aria-label={`Tìm hiểu thêm về ${title}`}
    >
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0 bg-white rounded-full p-2 border border-slate-200">
            {icon}
        </div>
        <div className="flex-grow">
          <h4 className="font-bold text-slate-800 text-md">{title}</h4>
          <p className="text-sm text-slate-600 mt-1">{description}</p>
          <div className="text-sm font-semibold text-teal-600 group-hover:text-teal-800 mt-3 flex items-center">
            <span>Tìm hiểu thêm</span>
            <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none ml-1">&rarr;</span>
          </div>
        </div>
      </div>
    </button>
  );
};

export default EducationCard;