
import React, { useState, useEffect } from 'react';
import { parseSafeDate } from '../utils/dateUtils';
import { EnvironmentalReport, ReportStatus, EducationalTopic } from '../types';
import { ClipboardListIcon } from './icons/ClipboardListIcon';
import { CheckBadgeIcon } from './icons/CheckBadgeIcon';
import { MapIcon } from './icons/MapIcon';
import { DocumentPlusIcon } from './icons/DocumentPlusIcon';
import HeroBanner from './HeroBanner';
import EducationCard from './EducationCard';
import { RecycleIcon } from './icons/RecycleIcon';
import { PlasticBottleIcon } from './icons/PlasticBottleIcon';
import { WaterDropIcon } from './icons/WaterDropIcon';
import { GlobeIcon } from './icons/GlobeIcon';
import { SOSIcon } from './icons/SOSIcon';
import { ShoppingCartIcon } from './icons/ShoppingCartIcon';
import { getCachedPublicReports, cachePublicReports } from '../services/offlineService';
import EnvironmentalWidget from './EnvironmentalWidget';

interface HomeViewProps {
  reports: EnvironmentalReport[];
  isOnline?: boolean;
  pendingReportsCount?: number;
  onNavigateToMap: () => void;
  onStartNewReport: () => void;
  onSelectReportAndNavigateToMap: (report: EnvironmentalReport) => void;
  onSelectEducationTopic: (topic: EducationalTopic) => void;
  onNavigateToEnvironmentalMap: () => void;
  onNavigateToSOS: () => void;
  onOpenOrderForm: () => void;
  onOpenOfflineModal?: () => void;
}

const educationalContent: EducationalTopic[] = [
  {
    id: 'waste-sorting',
    icon: <RecycleIcon className="w-8 h-8 text-green-600" />,
    title: "Phân loại rác tại nguồn",
    description: "Tách riêng rác hữu cơ, tái chế và rác khác.",
    details: {
      importance: "Phân loại rác đúng cách giúp tối đa hóa tỷ lệ tái chế, giảm thiểu ô nhiễm đất và nước, và tiết kiệm tài nguyên thiên nhiên.",
      solutions: [
        { title: "Rác hữu cơ (Thùng xanh lá)", description: "Bao gồm thức ăn thừa, vỏ rau củ. Có thể ủ thành phân compost để bón cho cây." },
        { title: "Rác tái chế (Thùng vàng/trắng)", description: "Giấy, nhựa, kim loại, thủy tinh. Hãy làm sạch chúng trước khi bỏ đi để nâng cao hiệu quả tái chế." },
        { title: "Rác còn lại (Thùng xám)", description: "Tã lót, túi ni lông bẩn, các vật dụng không thể tái chế. Loại rác này sẽ được đưa đến bãi chôn lấp." },
      ],
      tip: "Đặt ba thùng rác nhỏ trong bếp để xây dựng thói quen phân loại rác ngay từ đầu."
    }
  },
  {
    id: 'plastic-reduction',
    icon: <PlasticBottleIcon className="w-8 h-8 text-blue-600" />,
    title: "Giảm thiểu nhựa",
    description: "Hạn chế rác thải nhựa gây hại cho đại dương.",
    details: {
      importance: "Rác thải nhựa mất hàng trăm năm để phân hủy, vỡ ra thành các hạt vi nhựa độc hại, gây ô nhiễm nghiêm trọng hệ sinh thái biển và ảnh hưởng đến sức khỏe con người.",
      solutions: [
        { title: "Mang theo đồ dùng cá nhân", description: "Luôn có túi vải khi đi mua sắm, chai và ly cá nhân khi mua đồ uống mang đi." },
        { title: "Từ chối ống hút nhựa", description: "Yêu cầu không dùng ống hút nhựa hoặc sử dụng các giải pháp thay thế tái sử dụng như inox, tre, thủy tinh." },
        { title: "Chọn sản phẩm không có bao bì nhựa", description: "Ưu tiên mua các sản phẩm được đóng gói bằng vật liệu thân thiện với môi trường như giấy, thủy tinh." },
      ],
      tip: "Bắt đầu với thử thách nhỏ: 'Một ngày không dùng đồ nhựa một lần' để thấy sự khác biệt bạn có thể tạo ra."
    }
  },
  {
    id: 'water-saving',
    icon: <WaterDropIcon className="w-8 h-8 text-cyan-600" />,
    title: "Tiết kiệm nước sạch",
    description: "Tắt vòi nước và kiểm tra rò rỉ thường xuyên.",
    details: {
      importance: "Nước sạch là tài nguyên hữu hạn và thiết yếu cho sự sống. Tiết kiệm nước giúp bảo tồn hệ sinh thái, giảm chi phí năng lượng và đảm bảo an ninh nguồn nước cho tương lai.",
      solutions: [
        { title: "Tắt vòi nước", description: "Tắt nước khi đánh răng, cạo râu hoặc xoa xà phòng. Hành động nhỏ này có thể tiết kiệm hàng chục lít nước mỗi ngày." },
        { title: "Kiểm tra và sửa chữa rò rỉ", description: "Một vòi nước nhỏ giọt có thể lãng phí hàng ngàn lít nước mỗi năm. Thường xuyên kiểm tra bồn cầu và đường ống để phát hiện rò rỉ." },
        { title: "Tái sử dụng nước", description: "Dùng nước vo gạo, rửa rau để tưới cây. Đây là cách tuyệt vời để tiết kiệm nước và cung cấp dinh dưỡng cho cây." },
      ],
      tip: "Lắp đặt các thiết bị tiết kiệm nước như vòi hoa sen hoặc vòi nước lưu lượng thấp có thể giảm tới 30% lượng nước tiêu thụ."
    }
  }
];

const formatTimeAgo = (date: Date | string): string => {
  const now = new Date();
  const pastDate = parseSafeDate(date);
  if (!pastDate) return "Vừa xong";
  const seconds = Math.floor((now.getTime() - pastDate.getTime()) / 1000);
  if (isNaN(seconds) || seconds < 0) return "Vừa xong";

  let interval = seconds / 31536000; // năm
  if (interval > 1) {
    return `${Math.floor(interval)} năm`;
  }
  interval = seconds / 2592000; // tháng
  if (interval > 1) {
    return `${Math.floor(interval)} tháng`;
  }
  interval = seconds / 86400; // ngày
  if (interval > 1) {
    return `${Math.floor(interval)} ngày`;
  }
  interval = seconds / 3600; // giờ
  if (interval > 1) {
    return `${Math.floor(interval)} giờ`;
  }
  interval = seconds / 60; // phút
  if (interval > 1) {
    return `${Math.floor(interval)} phút`;
  }
  return "Vừa xong";
};

const getStatusDetails = (status: ReportStatus) => {
  switch (status) {
    case 'Báo cáo mới':
      return { label: 'Mới', bgColor: 'bg-red-50', textColor: 'text-red-700', borderColor: 'border-red-100' };
    case 'Đang xử lý':
      return { label: 'Đang xử lý', bgColor: 'bg-amber-50', textColor: 'text-amber-700', borderColor: 'border-amber-100' };
    case 'Đã xử lý':
      return { label: 'Đã xử lý', bgColor: 'bg-green-50', textColor: 'text-green-700', borderColor: 'border-green-100' };
    default:
      return { label: 'Không rõ', bgColor: 'bg-gray-50', textColor: 'text-gray-700', borderColor: 'border-gray-100' };
  }
};

const HomeView: React.FC<HomeViewProps> = ({ 
  reports, 
  isOnline = true,
  pendingReportsCount = 0,
  onNavigateToMap, 
  onStartNewReport, 
  onSelectReportAndNavigateToMap, 
  onSelectEducationTopic, 
  onNavigateToEnvironmentalMap, 
  onNavigateToSOS,
  onOpenOrderForm
}) => {
  const [cachedReports, setCachedReports] = useState<EnvironmentalReport[]>([]);

  // Silent background load of cached reports from IndexedDB
  const loadIndexedDBReports = async () => {
    try {
      const cached = await getCachedPublicReports();
      setCachedReports(cached);
    } catch (error) {
      console.warn("Lỗi khi đọc báo cáo từ IndexedDB:", error);
    }
  };

  useEffect(() => {
    loadIndexedDBReports();
  }, []);

  // When new online reports arrive, silently cache them to IndexedDB in the background
  useEffect(() => {
    if (reports && reports.length > 0 && isOnline) {
      cachePublicReports(reports).then(() => {
        loadIndexedDBReports();
      }).catch(err => console.warn("Tự động lưu IndexedDB thất bại:", err));
    }
  }, [reports, isOnline]);

  const totalReports = reports.length;
  const resolvedReports = reports.filter(r => r.status === 'Đã xử lý').length;

  // Seamless fallback: Use live reports if available, or cached IndexedDB reports if offline
  const displayedReports = (reports && reports.length > 0)
    ? reports
    : (cachedReports.length > 0 ? cachedReports : []);

  return (
    <div className="w-full">
      {/* Phần Hero */}
      <div className="relative mb-8 overflow-hidden rounded-b-[2.5rem] bg-white shadow-sm border-b border-gray-100">
        <HeroBanner />
      </div>
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {/* Lưới chính */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Cột trái: Nội dung chính */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* Hành động chính (Bento Grid) */}
            <section aria-label="Các hành động chính">
               <h3 className="text-lg font-bold text-slate-900 mb-5 px-1 flex items-center">
                 <span className="w-1.5 h-6 bg-brand-600 rounded-full mr-3"></span>
                 Truy cập nhanh
               </h3>
               <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                 <button onClick={onStartNewReport} className="bento-button group flex flex-col items-center justify-center p-6 bg-brand-600 rounded-[2rem] shadow-xl shadow-brand-100">
                   <div className="p-3 bg-white/20 rounded-2xl mb-3 text-white group-hover:scale-110 transition-transform">
                     <DocumentPlusIcon className="w-8 h-8" />
                   </div>
                   <span className="font-bold text-white text-sm">Báo cáo mới</span>
                 </button>

                 <button onClick={onNavigateToMap} className="bento-button group flex flex-col items-center justify-center p-6 bg-white border border-slate-100 rounded-[2rem] shadow-sm hover:shadow-md">
                   <div className="p-3 bg-slate-50 rounded-2xl mb-3 text-slate-600 group-hover:bg-slate-100 transition-colors">
                      <MapIcon className="w-8 h-8" />
                   </div>
                   <span className="font-bold text-slate-800 text-sm">Bản đồ Sự cố</span>
                 </button>

                 <button onClick={onNavigateToEnvironmentalMap} className="bento-button group flex flex-col items-center justify-center p-6 bg-white border border-slate-100 rounded-[2rem] shadow-sm hover:shadow-md">
                   <div className="p-3 bg-indigo-50 rounded-2xl mb-3 text-indigo-600 group-hover:bg-indigo-100 transition-colors">
                      <GlobeIcon className="w-8 h-8" />
                   </div>
                   <span className="font-bold text-slate-800 text-sm">Bản đồ Xanh</span>
                 </button>

                 <button onClick={onNavigateToSOS} className="bento-button group flex flex-col items-center justify-center p-6 bg-red-50 border border-red-100 rounded-[2rem] shadow-sm hover:shadow-red-100">
                   <div className="p-3 bg-red-100 rounded-2xl mb-3 text-red-600 group-hover:bg-red-200 transition-colors animate-pulse">
                      <SOSIcon className="w-8 h-8" />
                   </div>
                   <span className="font-bold text-red-700 text-sm">SOS Khẩn cấp</span>
                 </button>
               </div>
            </section>

             <EnvironmentalWidget />

            {/* Thống kê cộng đồng */}
            <section className="glass-card p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-5 flex items-center">
                 <span className="w-1.5 h-6 bg-blue-500 rounded-full mr-3"></span>
                 Tác động cộng đồng
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-500 to-blue-600 p-6 text-white shadow-lg shadow-blue-100">
                  <div className="relative z-10">
                    <p className="text-xs font-bold text-blue-100 uppercase tracking-wider mb-1">Tổng báo cáo</p>
                    <p className="text-4xl font-black tracking-tight">{totalReports}</p>
                  </div>
                  <ClipboardListIcon className="absolute -right-6 -bottom-6 w-28 h-28 text-white/10 rotate-12" />
                </div>
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-500 to-emerald-600 p-6 text-white shadow-lg shadow-emerald-100">
                  <div className="relative z-10">
                    <p className="text-xs font-bold text-emerald-100 uppercase tracking-wider mb-1">Đã xử lý</p>
                    <p className="text-4xl font-black tracking-tight">{resolvedReports}</p>
                  </div>
                  <CheckBadgeIcon className="absolute -right-6 -bottom-6 w-28 h-28 text-white/10 rotate-12"/>
                </div>
              </div>
            </section>

            {/* Báo cáo gần đây */}
            <section className="glass-card p-6">
              <div className="flex justify-between items-center mb-6">
                 <h3 className="text-lg font-bold text-slate-900 flex items-center">
                   <span className="w-1.5 h-6 bg-amber-500 rounded-full mr-3"></span>
                   Sự cố mới nhất
                 </h3>
                 <button onClick={onNavigateToMap} className="text-xs font-bold text-brand-600 hover:text-brand-700 bg-brand-50 px-3 py-1.5 rounded-full transition-colors">Xem tất cả</button>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {displayedReports.slice(0, 4).map((report) => {
                  const statusDetails = getStatusDetails(report.status);
                  return (
                    <button
                      key={report.id}
                      onClick={() => onSelectReportAndNavigateToMap(report)}
                      className="w-full text-left p-4 rounded-3xl bg-white border border-slate-100 hover:border-brand-200 hover:shadow-xl hover:shadow-brand-50 transition-all duration-300 flex flex-col gap-4 group"
                    >
                      {/* Media Thumbnail */}
                      <div className="w-full aspect-video rounded-2xl overflow-hidden bg-slate-100 border border-slate-100 relative">
                         {report.mediaType === 'image' ? (
                            <img src={report.mediaUrl} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" referrerPolicy="no-referrer" />
                         ) : (
                            <video src={report.mediaUrl} className="w-full h-full object-cover" />
                         )}
                         <div className="absolute top-3 left-3">
                            <span className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded-lg shadow-sm border ${statusDetails.bgColor} ${statusDetails.textColor} ${statusDetails.borderColor}`}>
                                {statusDetails.label}
                            </span>
                         </div>
                         {report.mediaType === 'video' && (
                             <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                                 <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                                     <div className="w-0 h-0 border-t-6 border-t-transparent border-l-8 border-l-slate-900 border-b-6 border-b-transparent ml-1"></div>
                                 </div>
                             </div>
                         )}
                      </div>

                      <div className="px-1">
                        <div className="flex justify-between items-start mb-1">
                             <h4 className="font-bold text-slate-900 text-sm truncate group-hover:text-brand-600 transition-colors">
                                {report.aiAnalysis?.issueType || "Báo cáo Môi trường"}
                            </h4>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{formatTimeAgo(report.timestamp)}</span>
                        </div>
                        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-3">{report.aiAnalysis?.description || report.description || report.userDescription}</p>
                        
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                                <div className={`w-2 h-2 rounded-full ${report.aiAnalysis?.priority === 'Cao' ? 'bg-red-500' : report.aiAnalysis?.priority === 'Trung bình' ? 'bg-amber-500' : 'bg-blue-500'}`}></div>
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                    Ưu tiên: {report.aiAnalysis?.priority || "Thường"}
                                </span>
                            </div>
                            <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
                                {report.area || "Đà Nẵng"}
                            </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
              {displayedReports.length === 0 && (
                <div className="text-center py-10">
                  <p className="text-slate-400 text-sm font-medium">Chưa có báo cáo nào.</p>
                </div>
              )}
            </section>
          </div>

          {/* Cột phải: Giáo dục */}
          <div className="lg:col-span-4 space-y-8">
             <section className="bg-gradient-to-b from-white to-slate-50 p-6 rounded-3xl shadow-sm border border-slate-100 h-full">
                <h3 className="text-lg font-bold mb-6 text-slate-800 flex items-center">
                    <span className="w-1.5 h-6 bg-indigo-500 rounded-full mr-3"></span>
                    Kiến thức xanh
                </h3>
                <div className="space-y-4">
                    {educationalContent.map((item, index) => (
                      <EducationCard 
                        key={index}
                        icon={item.icon}
                        title={item.title}
                        description={item.description}
                        onSelect={() => onSelectEducationTopic(item)}
                      />
                    ))}
                </div>
                
                <div className="mt-8 p-4 bg-teal-50 rounded-2xl border border-teal-100">
                    <p className="text-sm text-teal-800 font-medium text-center">
                        "Hành động nhỏ, ý nghĩa lớn. Hãy cùng nhau bảo vệ Đà Nẵng!"
                    </p>
                </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeView;
