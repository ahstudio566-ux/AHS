import React, { useEffect, useState } from 'react';
import { EnvironmentalReport } from '../types';
import { getOfflineReports, deleteOfflineReport, getCachedPublicReports, clearCachedPublicReports } from '../services/offlineService';
import { safeLocaleDateString, safeLocaleString, parseSafeDate } from '../utils/dateUtils';
import { XMarkIcon } from './icons/XMarkIcon';
import { TrashIcon } from './icons/TrashIcon';
import { CloudIcon } from './icons/CloudIcon';
import { Database, HardDrive, RefreshCw } from 'lucide-react';

interface OfflineReportsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReportsChanged: () => void;
}

const OfflineReportsModal: React.FC<OfflineReportsModalProps> = ({ isOpen, onClose, onReportsChanged }) => {
  const [activeTab, setActiveTab] = useState<'unsynced' | 'cached'>('unsynced');
  const [unsyncedReports, setUnsyncedReports] = useState<EnvironmentalReport[]>([]);
  const [cachedReports, setCachedReports] = useState<EnvironmentalReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadAllReports = async () => {
    setIsLoading(true);
    try {
      const pendingData = await getOfflineReports();
      setUnsyncedReports(pendingData.sort((a, b) => (parseSafeDate(b.timestamp)?.getTime() || 0) - (parseSafeDate(a.timestamp)?.getTime() || 0)));

      const cachedData = await getCachedPublicReports();
      setCachedReports(cachedData.sort((a, b) => (parseSafeDate(b.timestamp)?.getTime() || 0) - (parseSafeDate(a.timestamp)?.getTime() || 0)));
    } catch (error) {
      console.error("Failed to load offline modal reports", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadAllReports();
    }
  }, [isOpen]);

  const handleDeleteUnsynced = async (id: string) => {
    try {
      await deleteOfflineReport(id);
      await loadAllReports();
      onReportsChanged();
    } catch (error) {
      console.error("Failed to delete unsynced report", error);
    }
  };

  const handleClearCache = async () => {
    if (window.confirm("Bạn có chắc chắn muốn xóa toàn bộ bộ nhớ đệm báo cáo IndexedDB trên thiết bị?")) {
      try {
        await clearCachedPublicReports();
        await loadAllReports();
        onReportsChanged();
      } catch (error) {
        console.error("Failed to clear cached reports", error);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div className="flex items-center space-x-3">
             <div className="bg-emerald-100 p-2 rounded-2xl text-emerald-700">
                <Database className="w-5 h-5" />
             </div>
             <div>
                <h3 className="font-bold text-lg text-slate-800">Quản lý Dữ liệu Ngoại tuyến (IndexedDB)</h3>
                <p className="text-xs text-slate-500">Xem và lưu trữ báo cáo môi trường ngay cả khi không có mạng</p>
             </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-100 bg-slate-100/60 p-1.5 gap-1">
          <button
            onClick={() => setActiveTab('unsynced')}
            className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center space-x-1.5 ${activeTab === 'unsynced' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
          >
            <CloudIcon className="w-4 h-4 text-amber-500" />
            <span>Chờ đồng bộ ({unsyncedReports.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('cached')}
            className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center space-x-1.5 ${activeTab === 'cached' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
          >
            <HardDrive className="w-4 h-4" />
            <span>IndexedDB Cache ({cachedReports.length})</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="overflow-y-auto p-5 space-y-4 bg-slate-50/50 flex-grow">
          {isLoading ? (
            <div className="text-center py-8 text-slate-400">Đang tải dữ liệu IndexedDB...</div>
          ) : activeTab === 'unsynced' ? (
            unsyncedReports.length === 0 ? (
              <div className="text-center py-8 flex flex-col items-center">
                  <div className="bg-slate-100 p-4 rounded-full mb-3">
                      <CloudIcon className="w-8 h-8 text-slate-300" />
                  </div>
                  <p className="text-slate-500 text-sm font-medium">Không có báo cáo nào đang chờ gửi.</p>
                  <p className="text-slate-400 text-xs mt-1">Các báo cáo bạn gửi khi mất mạng sẽ xuất hiện tại đây.</p>
              </div>
            ) : (
              unsyncedReports.map((report) => (
                <div key={report.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex gap-4 group hover:shadow-md transition-all">
                  {/* Thumbnail */}
                  <div className="w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden bg-slate-100 relative">
                    {report.mediaType === 'video' ? (
                       <video src={report.mediaUrl} className="w-full h-full object-cover" />
                    ) : (
                      <img src={report.mediaUrl} alt="Thumbnail" className="w-full h-full object-cover" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-grow min-w-0">
                    <div className="flex justify-between items-start">
                      <p className="font-bold text-slate-700 text-sm truncate pr-2">
                          {report.userDescription || report.aiAnalysis?.issueType || "Báo cáo chờ đồng bộ"}
                      </p>
                      <button 
                          onClick={() => handleDeleteUnsynced(report.id)}
                          className="text-slate-300 hover:text-red-500 transition-colors p-1"
                          title="Xóa báo cáo"
                      >
                          <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <div className="mt-2 space-y-1">
                        <div className="flex items-center text-xs text-amber-600 font-semibold">
                          <span className="w-2 h-2 rounded-full bg-amber-400 mr-2 animate-pulse"></span>
                          Chờ mạng để gửi
                        </div>
                        <p className="text-[10px] text-slate-400 font-mono">
                          {safeLocaleString(report.timestamp)}
                        </p>
                    </div>
                  </div>
                </div>
              ))
            )
          ) : (
            cachedReports.length === 0 ? (
              <div className="text-center py-8 flex flex-col items-center">
                  <div className="bg-emerald-50 p-4 rounded-full mb-3 text-emerald-500">
                      <Database className="w-8 h-8" />
                  </div>
                  <p className="text-slate-600 text-sm font-medium">Chưa có báo cáo nào được cache vào IndexedDB.</p>
                  <p className="text-slate-400 text-xs mt-1">Hãy bấm nút "Tải cache IDB" trên trang chủ khi có kết nối mạng.</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs text-slate-500 pb-2 border-b border-slate-200/60">
                  <span>Tổng số: <strong className="text-slate-800">{cachedReports.length} báo cáo</strong></span>
                  <button 
                    onClick={handleClearCache}
                    className="text-red-600 hover:text-red-700 font-bold flex items-center space-x-1"
                  >
                    <TrashIcon className="w-3.5 h-3.5 mr-1" />
                    Xóa tất cả cache IDB
                  </button>
                </div>
                {cachedReports.map((report) => (
                  <div key={report.id} className="bg-white p-3.5 rounded-2xl shadow-sm border border-slate-100 flex gap-3 group hover:border-emerald-200 transition-all">
                    <div className="w-16 h-16 flex-shrink-0 rounded-xl overflow-hidden bg-slate-100 relative">
                      {report.mediaType === 'video' ? (
                        <video src={report.mediaUrl} className="w-full h-full object-cover" />
                      ) : (
                        <img src={report.mediaUrl} alt="Thumbnail" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      )}
                    </div>
                    <div className="flex-grow min-w-0">
                      <p className="font-bold text-slate-800 text-xs truncate">
                        {report.aiAnalysis?.issueType || report.userDescription || "Báo cáo môi trường"}
                      </p>
                      <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                        {report.aiAnalysis?.description || report.description}
                      </p>
                      <div className="flex items-center justify-between mt-2 text-[10px] text-slate-400">
                        <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-semibold">{report.area || "Đà Nẵng"}</span>
                        <span>{safeLocaleDateString(report.timestamp)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-white flex justify-end">
          <button 
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-sm transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

export default OfflineReportsModal;
