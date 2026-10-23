
import React from 'react';

interface LoaderProps {
  message?: string;
  subMessage?: string;
  className?: string;
}

const Loader: React.FC<LoaderProps> = ({ 
  message = "AI đang phân tích hình ảnh...", 
  subMessage = "Quá trình này có thể mất vài giây.",
  className = "py-10"
}) => {
  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div className="w-12 h-12 border-4 border-t-4 border-gray-200 border-t-teal-600 rounded-full animate-spin"></div>
      {message && <p className="mt-4 text-lg font-semibold text-gray-700">{message}</p>}
      {subMessage && <p className="text-sm text-gray-500">{subMessage}</p>}
    </div>
  );
};

export default Loader;