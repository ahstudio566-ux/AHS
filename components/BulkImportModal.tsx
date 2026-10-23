import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { XMarkIcon as XIcon } from './icons/XMarkIcon';
import { CheckCircleIcon as CheckIcon } from './icons/CheckCircleIcon';
import { XCircleIcon as AlertCircleIcon } from './icons/XCircleIcon';
import { FileUpIcon } from './icons/FileUpIcon';

interface BulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: () => void;
}

const BulkImportModal: React.FC<BulkImportModalProps> = ({ isOpen, onClose, onImportSuccess }) => {
  const [pastedData, setPastedData] = useState('');
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState<'paste' | 'preview'>('paste');
  const [importType, setImportType] = useState<'reports' | 'users'>('reports');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
        
        if (data.length < 2) {
          setError('File Excel phải có ít nhất một hàng tiêu đề và một hàng dữ liệu.');
          return;
        }

        const rawHeaders = (data[0] as any[]).map(h => String(h).trim());
        const rows = data.slice(1).map((row: any) => {
          const obj: any = {};
          rawHeaders.forEach((header, index) => {
            obj[header] = row[index] !== undefined ? String(row[index]).trim() : '';
          });
          return obj;
        });

        setHeaders(rawHeaders);
        setParsedData(rows);
        setStep('preview');
        setError(null);
      } catch (err) {
        setError('Không thể đọc file Excel. Vui lòng kiểm tra định dạng.');
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleParse = () => {
    setError(null);
    if (!pastedData.trim()) {
      setError('Vui lòng dán dữ liệu hoặc tải lên file Excel.');
      return;
    }

    const rows = pastedData.trim().split('\n').map(row => row.split('\t'));
    if (rows.length < 2) {
      setError('Dữ liệu phải bao gồm ít nhất một hàng tiêu đề và một hàng dữ liệu.');
      return;
    }

    const rawHeaders = rows[0].map(h => h.trim());
    const data = rows.slice(1).map(row => {
      const obj: any = {};
      rawHeaders.forEach((header, index) => {
        obj[header] = row[index]?.trim() || '';
      });
      return obj;
    });

    setHeaders(rawHeaders);
    setParsedData(data);
    setStep('preview');
  };

  const handleImport = async () => {
    setIsProcessing(true);
    setError(null);

    try {
      if (importType === 'reports') {
        const reportsToImport = parsedData.map(item => ({
          id: `bulk-${Math.random().toString(36).substr(2, 9)}`,
          mediaUrl: item.mediaUrl || 'https://picsum.photos/seed/env/800/600',
          mediaType: item.mediaType || 'image',
          latitude: parseFloat(item.latitude),
          longitude: parseFloat(item.longitude),
          userDescription: item.description || item.userDescription || '',
          status: item.status || 'Báo cáo mới',
          aiAnalysis: {
            issueType: item.issueType || 'Sự cố môi trường',
            description: item.description || item.userDescription || '',
            priority: item.priority || 'Trung bình',
            solution: item.solution || 'Đang chờ xử lý',
            isIssuePresent: true
          }
        }));

        const invalidCoords = reportsToImport.filter(r => isNaN(r.latitude) || isNaN(r.longitude));
        if (invalidCoords.length > 0) {
          throw new Error('Một số hàng có tọa độ (latitude/longitude) không hợp lệ.');
        }

        const response = await fetch('/api/reports/bulk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reports: reportsToImport }),
        });

        if (response.ok) {
          onImportSuccess();
          onClose();
        } else {
          const data = await response.json();
          throw new Error(data.message || 'Lỗi khi nhập dữ liệu báo cáo.');
        }
      } else {
        // Import Users
        const usersToImport = parsedData.map(item => ({
          username: item.username || item.email,
          password: item.password || '123456',
          role: item.role || 'citizen',
          area: item.area || 'All',
          organizationName: item.organizationName || item.organization || ''
        }));

        const response = await fetch('/api/auth/bulk-register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ users: usersToImport }),
        });

        if (response.ok) {
          onImportSuccess();
          onClose();
        } else {
          const data = await response.json();
          throw new Error(data.message || 'Lỗi khi nhập dữ liệu người dùng.');
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-300">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Nhập dữ liệu Excel / Sheets</h2>
            <p className="text-sm text-slate-500">Tải lên file hoặc dán dữ liệu từ bảng tính</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <XIcon className="w-6 h-6 text-slate-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-grow overflow-y-auto p-6">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start space-x-3 text-red-700">
              <AlertCircleIcon className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          {step === 'paste' && (
            <div className="flex mb-6 bg-slate-100 p-1 rounded-xl w-fit">
              <button 
                onClick={() => setImportType('reports')}
                className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${importType === 'reports' ? 'bg-white text-teal-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Nhập Báo cáo
              </button>
              <button 
                onClick={() => setImportType('users')}
                className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${importType === 'users' ? 'bg-white text-teal-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Nhập Người dùng
              </button>
            </div>
          )}

          {step === 'paste' ? (
            <div className="space-y-6">
              {/* File Upload Area */}
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center hover:border-teal-500 hover:bg-teal-50/30 transition-all cursor-pointer group"
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileUpload} 
                  accept=".xlsx, .xls, .csv" 
                  className="hidden" 
                />
                <div className="bg-teal-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-teal-600 group-hover:scale-110 transition-transform">
                  <FileUpIcon className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-slate-700">Tải lên file Excel (.xlsx, .xls)</h4>
                <p className="text-xs text-slate-400 mt-1">Hoặc kéo và thả file vào đây</p>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-100"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-slate-400">Hoặc dán dữ liệu</span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
                  <h4 className="text-sm font-bold text-blue-800 mb-2">Định dạng yêu cầu:</h4>
                  <ul className="text-[10px] text-blue-700 space-y-1 list-disc list-inside">
                    {importType === 'reports' ? (
                      <>
                        <li>Tiêu đề: <code className="bg-blue-100 px-1 rounded">latitude</code>, <code className="bg-blue-100 px-1 rounded">longitude</code>, <code className="bg-blue-100 px-1 rounded">issueType</code>, <code className="bg-blue-100 px-1 rounded">description</code>, <code className="bg-blue-100 px-1 rounded">priority</code></li>
                        <li>Tọa độ: Đà Nẵng (16.0), Quảng Nam (15.8).</li>
                      </>
                    ) : (
                      <>
                        <li>Tiêu đề: <code className="bg-blue-100 px-1 rounded">username</code> (hoặc email), <code className="bg-blue-100 px-1 rounded">password</code>, <code className="bg-blue-100 px-1 rounded">role</code>, <code className="bg-blue-100 px-1 rounded">area</code>, <code className="bg-blue-100 px-1 rounded">organizationName</code></li>
                        <li>Roles: admin, environment_department, department_manager, citizen.</li>
                      </>
                    )}
                  </ul>
                </div>
                <textarea
                  value={pastedData}
                  onChange={(e) => setPastedData(e.target.value)}
                  placeholder="Sao chép từ Excel và dán vào đây..."
                  className="w-full h-48 p-4 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none font-mono text-xs resize-none bg-slate-50"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-bold text-slate-700">Xem trước dữ liệu ({parsedData.length} hàng)</h4>
                <button onClick={() => setStep('paste')} className="text-sm text-teal-600 font-bold hover:underline">
                  Quay lại dán dữ liệu
                </button>
              </div>
              <div className="overflow-x-auto border border-slate-100 rounded-2xl">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-600 font-bold">
                    <tr>
                      {headers.map(h => (
                        <th key={h} className="px-4 py-3 border-b border-slate-100">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {parsedData.slice(0, 10).map((row, i) => (
                      <tr key={i} className="hover:bg-slate-50/50">
                        {headers.map(h => (
                          <td key={h} className="px-4 py-3 text-slate-600 truncate max-w-[200px]">{row[h]}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {parsedData.length > 10 && (
                  <div className="p-3 text-center text-xs text-slate-400 bg-slate-50/30">
                    Và {parsedData.length - 10} hàng khác...
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-200 transition-colors"
          >
            Hủy bỏ
          </button>
          {step === 'paste' ? (
            <button
              onClick={handleParse}
              className="px-8 py-2.5 bg-teal-600 text-white rounded-xl font-bold shadow-lg shadow-teal-200 hover:bg-teal-700 transition-all"
            >
              Tiếp tục
            </button>
          ) : (
            <button
              onClick={handleImport}
              disabled={isProcessing}
              className="px-8 py-2.5 bg-teal-600 text-white rounded-xl font-bold shadow-lg shadow-teal-200 hover:bg-teal-700 transition-all disabled:opacity-50 flex items-center space-x-2"
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Đang xử lý...</span>
                </>
              ) : (
                <>
                  <CheckIcon className="w-5 h-5" />
                  <span>Xác nhận nhập {importType === 'reports' ? 'Báo cáo' : 'Người dùng'}</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default BulkImportModal;
