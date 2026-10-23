import React, { useState, useRef } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { EnvironmentalReport, ReportStatus } from '../types';
import { safeLocaleDateString, safeLocaleString } from '../utils/dateUtils';
import { XMarkIcon } from './icons/XMarkIcon';
import { FileUpIcon } from './icons/FileUpIcon';

interface ExportPdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  reports: EnvironmentalReport[];
  currentUser: any;
}

export const ExportPdfModal: React.FC<ExportPdfModalProps> = ({
  isOpen,
  onClose,
  reports,
  currentUser
}) => {
  const [statusFilter, setStatusFilter] = useState<string>('Đã xử lý');
  const [timeFilter, setTimeFilter] = useState<string>('all');
  const [targetAgency, setTargetAgency] = useState<string>('Sở Tài nguyên và Môi trường TP. Đà Nẵng');
  const [officerName, setOfficerName] = useState<string>(
    currentUser?.organizationName || currentUser?.username || 'Cán bộ quản lý môi trường'
  );
  const [reportTitle, setReportTitle] = useState<string>(
    'BÁO CÁO TÓM TẮT XỬ LÝ SỰ CỐ MÔI TRƯỜNG ĐÔ THỊ'
  );
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  const reportDocRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  // Filter reports
  const filteredReports = reports.filter((r) => {
    // Status filter
    if (statusFilter !== 'all' && r.status !== statusFilter) {
      return false;
    }
    // Time filter
    if (timeFilter !== 'all') {
      const reportDate = new Date(r.timestamp);
      const now = new Date();
      const diffDays = (now.getTime() - reportDate.getTime()) / (1000 * 3600 * 24);
      if (timeFilter === '7days' && diffDays > 7) return false;
      if (timeFilter === '30days' && diffDays > 30) return false;
    }
    return true;
  });

  // Calculate statistics
  const totalCount = filteredReports.length;
  const highPriorityCount = filteredReports.filter(
    (r) => (r.aiAnalysis?.priority || 'Trung bình') === 'Cao'
  ).length;
  const garbageCount = filteredReports.filter(
    (r) => (r.aiAnalysis?.issueType || '') === 'Xả rác không đúng nơi quy định'
  ).length;
  const floodCount = filteredReports.filter(
    (r) => (r.aiAnalysis?.issueType || '') === 'Ngập lụt'
  ).length;
  const landslideCount = filteredReports.filter(
    (r) => (r.aiAnalysis?.issueType || '') === 'Sạt lở đất'
  ).length;

  const handleDownloadPdf = async () => {
    if (!reportDocRef.current) return;
    setIsGenerating(true);
    try {
      const element = reportDocRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
      }

      const today = new Date().toISOString().slice(0, 10);
      pdf.save(`Bao_cao_moi_truong_DaNang_${today}.pdf`);
    } catch (err) {
      console.error('PDF Generation error:', err);
      alert('Không thể tạo file PDF. Vui lòng thử dùng chức năng "In / Lưu PDF" trực tiếp.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col my-auto overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="p-5 sm:p-6 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <span className="p-2 bg-red-500/20 text-red-400 rounded-2xl border border-red-500/30">
              <FileUpIcon className="w-6 h-6" />
            </span>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg text-white">
                Xuất Báo Cáo Tóm Tắt Môi Trường (PDF)
              </h3>
              <p className="text-xs text-slate-300">
                Tạo văn bản tóm tắt các sự cố môi trường đã xử lý gửi Cơ quan chức năng
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Modal Controls Bar */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs shrink-0">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Trạng thái báo cáo</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-xl p-2 font-medium focus:ring-2 focus:ring-emerald-500"
            >
              <option value="Đã xử lý">✅ Báo cáo đã xử lý (Khuyến nghị)</option>
              <option value="Đang xử lý">⏳ Báo cáo đang xử lý</option>
              <option value="Báo cáo mới">🆕 Báo cáo mới tiếp nhận</option>
              <option value="all">🌐 Tất cả trạng thái ({reports.length})</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Thời gian thống kê</label>
            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-xl p-2 font-medium focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">Tất cả thời gian</option>
              <option value="30days">30 ngày gần đây</option>
              <option value="7days">7 ngày gần đây</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Cơ quan nhận báo cáo</label>
            <input
              type="text"
              value={targetAgency}
              onChange={(e) => setTargetAgency(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-xl p-2 font-medium focus:ring-2 focus:ring-emerald-500"
              placeholder="VD: Sở TN&MT TP Đà Nẵng"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Cán bộ / Đơn vị báo cáo</label>
            <input
              type="text"
              value={officerName}
              onChange={(e) => setOfficerName(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-xl p-2 font-medium focus:ring-2 focus:ring-emerald-500"
              placeholder="Họ tên cán bộ"
            />
          </div>
        </div>

        {/* PDF Document Preview Scrollable Container */}
        <div className="p-4 sm:p-8 overflow-y-auto bg-slate-200/60 flex-1 flex justify-center">
          
          {/* Printable Official A4 Document Card */}
          <div
            ref={reportDocRef}
            id="printable-official-report"
            className="bg-white text-slate-900 p-8 sm:p-12 rounded-lg shadow-xl border border-slate-300 w-full max-w-[210mm] min-h-[297mm] text-xs leading-relaxed space-y-6 font-serif"
            style={{ fontFamily: `'Times New Roman', Times, serif` }}
          >
            {/* Official Header */}
            <div className="flex justify-between items-start border-b border-slate-300 pb-4">
              <div className="text-center font-bold">
                <p className="uppercase text-[11px] tracking-tight">ỦY BÂN NHÂN DÂN TP. ĐÀ NẴNG</p>
                <p className="uppercase text-[11px] text-emerald-800 font-extrabold">{currentUser?.organizationName || 'BAN QUẢN LÝ MÔI TRƯỜNG ĐÔ THỊ'}</p>
                <p className="text-[10px] font-normal italic mt-1">Số: .../BC-UBND-MT</p>
              </div>

              <div className="text-center font-bold">
                <p className="uppercase text-[11px] tracking-tight">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
                <p className="text-[11px] text-slate-800">Độc lập - Tự do - Hạnh phúc</p>
                <div className="w-24 h-0.5 bg-slate-800 mx-auto mt-1"></div>
                <p className="text-[10px] font-normal italic mt-2">
                  Đà Nẵng, ngày {new Date().getDate()} tháng {new Date().getMonth() + 1} năm {new Date().getFullYear()}
                </p>
              </div>
            </div>

            {/* Title */}
            <div className="text-center my-6 space-y-2">
              <h1 className="text-base sm:text-lg font-black uppercase text-slate-900 tracking-wide">
                {reportTitle}
              </h1>
              <p className="text-[11px] font-medium text-slate-700 italic">
                (Kính gửi: <span className="font-bold">{targetAgency}</span>)
              </p>
            </div>

            {/* Summary Context */}
            <div className="space-y-2 text-justify text-[11px]">
              <p>
                Căn cứ theo dữ liệu giám sát môi trường thông minh từ hệ thống <strong>Đà Nẵng Green AI</strong> và báo cáo trực tiếp từ nhân dân địa bàn <strong>{currentUser?.area || 'Toàn thành phố Đà Nẵng'}</strong>{currentUser?.ward ? ` (Phường ${currentUser.ward})` : ''}.
              </p>
              <p>
                Chúng tôi xin gửi tổng hợp tình hình và kết quả xử lý các sự cố môi trường trong đợt báo cáo ({statusFilter === 'all' ? 'Tất cả trạng thái' : `Trạng thái: ${statusFilter}`}) như sau:
              </p>
            </div>

            {/* Summary Statistics Table */}
            <div>
              <h2 className="font-bold text-xs uppercase mb-2 text-slate-800 border-b border-slate-300 pb-1">
                I. TỔNG HỢP CHỈ SỐ BÁO CÁO MÔI TRƯỜNG
              </h2>
              <div className="grid grid-cols-4 gap-2 text-center my-3">
                <div className="p-3 bg-slate-50 border border-slate-300 rounded">
                  <div className="text-lg font-bold text-slate-900">{totalCount}</div>
                  <div className="text-[9px] uppercase font-sans text-slate-600 font-semibold">Tổng hồ sơ</div>
                </div>
                <div className="p-3 bg-red-50 border border-red-200 rounded">
                  <div className="text-lg font-bold text-red-700">{highPriorityCount}</div>
                  <div className="text-[9px] uppercase font-sans text-red-600 font-semibold">Ưu tiên cao</div>
                </div>
                <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                  <div className="text-lg font-bold text-blue-700">{garbageCount + floodCount}</div>
                  <div className="text-[9px] uppercase font-sans text-blue-600 font-semibold">Rác thải & Ngập lụt</div>
                </div>
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded">
                  <div className="text-lg font-bold text-emerald-700">
                    {filteredReports.filter(r => r.status === 'Đã xử lý').length}
                  </div>
                  <div className="text-[9px] uppercase font-sans text-emerald-600 font-semibold">Đã hoàn thành</div>
                </div>
              </div>
            </div>

            {/* Detailed Table */}
            <div>
              <h2 className="font-bold text-xs uppercase mb-2 text-slate-800 border-b border-slate-300 pb-1">
                II. DANH SÁCH CHI TIẾT SỰ CỐ MÔI TRƯỜNG ({totalCount} HỒ SƠ)
              </h2>

              {filteredReports.length === 0 ? (
                <div className="p-4 text-center italic text-slate-500 border border-slate-200 rounded">
                  Không tìm thấy sự cố nào phù hợp với bộ lọc hiện tại.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-slate-400 text-[10px]">
                    <thead>
                      <tr className="bg-slate-100 text-slate-800 font-bold text-center">
                        <th className="border border-slate-400 p-1.5 w-8">STT</th>
                        <th className="border border-slate-400 p-1.5 w-24">Loại sự cố</th>
                        <th className="border border-slate-400 p-1.5">Nội dung / Mô tả</th>
                        <th className="border border-slate-400 p-1.5 w-24">Khu vực / Ward</th>
                        <th className="border border-slate-400 p-1.5 w-16">Ưu tiên</th>
                        <th className="border border-slate-400 p-1.5 w-20">Trạng thái</th>
                        <th className="border border-slate-400 p-1.5 w-24">Thời gian</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredReports.slice(0, 25).map((rep, idx) => (
                        <tr key={rep.id} className="hover:bg-slate-50">
                          <td className="border border-slate-400 p-1.5 text-center font-bold">{idx + 1}</td>
                          <td className="border border-slate-400 p-1.5 font-bold text-slate-900">
                            {rep.aiAnalysis?.issueType || 'Môi trường'}
                          </td>
                          <td className="border border-slate-400 p-1.5 text-slate-800 leading-snug">
                            {rep.userDescription || rep.description || 'Chưa có mô tả'}
                          </td>
                          <td className="border border-slate-400 p-1.5 text-center">
                            {rep.area || 'Đà Nẵng'}
                          </td>
                          <td className={`border border-slate-400 p-1.5 text-center font-bold ${
                            rep.aiAnalysis?.priority === 'Cao' ? 'text-red-600' : 'text-slate-700'
                          }`}>
                            {rep.aiAnalysis?.priority || 'Trung bình'}
                          </td>
                          <td className={`border border-slate-400 p-1.5 text-center font-bold ${
                            rep.status === 'Đã xử lý' ? 'text-emerald-700' : 'text-amber-600'
                          }`}>
                            {rep.status}
                          </td>
                          <td className="border border-slate-400 p-1.5 text-center text-slate-600">
                            {safeLocaleDateString(rep.timestamp)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filteredReports.length > 25 && (
                    <p className="text-[9px] italic text-slate-500 mt-1">
                      * Bảng hiển thị 25 hồ sơ tiêu biểu. Tổng số hồ sơ ghi nhận: {totalCount}.
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Official Signatures Section */}
            <div className="pt-8 grid grid-cols-2 text-center text-[11px] gap-4 page-break-inside-avoid">
              <div>
                <p className="font-bold uppercase text-slate-800">ĐƠN VỊ PHỤ TRÁCH ĐỊA BÀN</p>
                <p className="text-[10px] italic text-slate-500">(Ký và ghi rõ họ tên)</p>
                <div className="h-16"></div>
                <p className="font-bold text-slate-900">{officerName}</p>
              </div>

              <div>
                <p className="font-bold uppercase text-slate-800">XÁC NHẬN LÃNH ĐẠO CƠ QUAN</p>
                <p className="text-[10px] italic text-slate-500">(Ký, đóng dấu xác nhận)</p>
                <div className="h-16"></div>
                <p className="font-bold text-slate-900">................................................</p>
              </div>
            </div>

            {/* Footer timestamp watermark */}
            <div className="border-t border-slate-200 pt-3 text-[9px] text-slate-400 text-center font-sans">
              Hệ thống Giám sát Môi trường Thông minh TP. Đà Nẵng (Đà Nẵng Green AI) • Trích xuất lúc {safeLocaleString(new Date())}
            </div>

          </div>
        </div>

        {/* Modal Action Buttons Footer */}
        <div className="p-4 bg-white border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-600 font-medium">
            Sẵn sàng xuất <strong>{filteredReports.length}</strong> báo cáo cho cơ quan chức năng.
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors"
            >
              Đóng
            </button>

            <button
              onClick={handlePrint}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl text-xs transition-colors flex items-center space-x-1.5"
            >
              <span>🖨️ In / Lưu PDF</span>
            </button>

            <button
              onClick={handleDownloadPdf}
              disabled={isGenerating}
              className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-extrabold rounded-xl text-xs shadow-md transition-all active:scale-95 flex items-center space-x-2 disabled:opacity-50"
            >
              <FileUpIcon className={`w-4 h-4 ${isGenerating ? 'animate-bounce' : ''}`} />
              <span>{isGenerating ? 'Đang tạo PDF...' : 'Tải tệp PDF chính thức'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ExportPdfModal;
