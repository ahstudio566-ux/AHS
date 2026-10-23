import React from 'react';
import { EnvironmentalReport, ReportStatus } from '../types';
import ReportCard from './ReportCard';
import { LocationIcon } from './icons/LocationIcon';
import { XMarkIcon } from './icons/XMarkIcon';

interface ReportDetailModalProps {
  report: EnvironmentalReport;
  onClose: () => void;
  onUpdateStatus: (reportId: string) => void;
  onExternalAnalysis?: (reportId: string, mediaUrl: string) => Promise<any>;
}

const getStatusDetails = (status: ReportStatus) => {
  switch (status) {
    case 'Báo cáo mới':
      return { label: 'Báo cáo mới', bgColor: 'bg-red-100', textColor: 'text-red-800' };
    case 'Đang xử lý':
      return { label: 'Đang xử lý', bgColor: 'bg-yellow-100', textColor: 'text-yellow-800' };
    case 'Đã xử lý':
      return { label: 'Đã xử lý', bgColor: 'bg-green-100', textColor: 'text-green-800' };
    default:
      return { label: 'Không xác định', bgColor: 'bg-gray-100', textColor: 'text-gray-800' };
  }
};

const ReportDetailModal: React.FC<ReportDetailModalProps> = ({ report, onClose, onUpdateStatus, onExternalAnalysis }) => {
  const statusDetails = getStatusDetails(report.status);
  const [isAnalyzing, setIsAnalyzing] = React.useState(false);
  const [externalResult, setExternalResult] = React.useState<any>(null);

  const handleExternalAnalysis = async () => {
    if (!onExternalAnalysis) return;
    setIsAnalyzing(true);
    try {
      const result = await onExternalAnalysis(report.id, report.mediaUrl);
      setExternalResult(result);
    } catch (error) {
      console.error(error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 z-[1100] flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="report-details-title"
    >
      <div
        className="bg-gray-50 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="p-4 flex items-center justify-between border-b border-gray-200 sticky top-0 bg-gray-50/80 backdrop-blur-sm z-10">
           <div className={`px-3 py-1 text-sm font-bold rounded-full ${statusDetails.bgColor} ${statusDetails.textColor}`}>
              {statusDetails.label}
            </div>
          <h2 id="report-details-title" className="text-xl font-bold text-gray-800">
            Chi tiết báo cáo
          </h2>
          <button
            onClick={onClose}
            className="p-3 text-gray-400 rounded-full hover:bg-gray-200 hover:text-gray-700 transition-colors"
            aria-label="Đóng"
          >
            <XMarkIcon className="w-7 h-7" />
          </button>
        </header>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
            {/* Cột media */}
            <div className="w-full max-h-[70vh] flex items-center justify-center bg-gray-200 rounded-lg overflow-hidden">
                {report.mediaType === 'image' ? (
                    <img
                        src={report.mediaUrl}
                        alt="Hình ảnh báo cáo"
                        className="w-full h-full object-contain"
                    />
                ) : (
                    <video
                        src={report.mediaUrl}
                        controls
                        className="w-full h-full object-contain"
                    />
                )}
            </div>

            {/* Cột chi tiết */}
            <div className="flex flex-col space-y-6">
              {/* Thông tin người dùng */}
              <div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">
                  Thông tin đã gửi
                </h3>
                <div className="bg-white p-4 rounded-lg border border-gray-200 space-y-4">
                  {report.userDescription && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">
                        Mô tả của người dùng
                      </p>
                      <p className="text-gray-700 mt-1">{report.userDescription}</p>
                    </div>
                  )}
                   <div className="flex items-start pt-4 border-t border-gray-100 first:pt-0 first:border-t-0">
                      <LocationIcon className="w-5 h-5 mt-0.5 text-gray-400 flex-shrink-0" />
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-500">Vị trí</p>
                        <a 
                           href={`https://www.google.com/maps?q=${report.latitude},${report.longitude}`}
                           target="_blank"
                           rel="noopener noreferrer"
                           className="text-sm text-blue-600 hover:underline font-mono"
                        >
                            {`${report.latitude.toFixed(5)}, ${report.longitude.toFixed(5)}`}
                        </a>
                      </div>
                  </div>
                </div>
              </div>
              
              <ReportCard analysis={report.aiAnalysis} />

              {/* External Analysis Result Display */}
              {externalResult && (
                <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-lg">
                  <h4 className="text-sm font-bold text-indigo-800 mb-2 uppercase tracking-wider">Kết quả từ Mô hình Chuyên gia</h4>
                  <div className="text-sm text-indigo-900 whitespace-pre-wrap">
                    {typeof externalResult.analysis === 'string' 
                      ? externalResult.analysis 
                      : JSON.stringify(externalResult.analysis, null, 2)}
                  </div>
                </div>
              )}
              
              <div className="pt-2 space-y-3">
                 <h3 className="text-lg font-bold text-gray-800 mb-2">Hành động</h3>
                 <button
                  onClick={() => onUpdateStatus(report.id)}
                  className="w-full bg-teal-600 text-white font-bold py-3 px-6 rounded-lg shadow-md hover:bg-teal-700 transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
                >
                  Chuyển trạng thái tiếp theo
                </button>

                {onExternalAnalysis && (
                  <button
                    onClick={handleExternalAnalysis}
                    disabled={isAnalyzing}
                    className={`w-full flex items-center justify-center space-x-2 font-bold py-3 px-6 rounded-lg border-2 transition-all ${isAnalyzing ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed' : 'bg-white text-indigo-600 border-indigo-600 hover:bg-indigo-50'}`}
                  >
                    {isAnalyzing ? (
                      <>
                        <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                        <span>Đang phân tích...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        <span>Phân tích chuyên sâu (Mô hình ngoài)</span>
                      </>
                    )}
                  </button>
                )}
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// FIX: Add default export for the component to be imported in App.tsx.
export default ReportDetailModal;
