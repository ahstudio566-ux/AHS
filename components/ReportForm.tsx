
import React, { useState, useEffect, useRef } from 'react';
import ImageUploader from './ImageUploader';
import Loader from './Loader';
import { RefreshIcon } from './icons/RefreshIcon';
import { AIAnalysis } from '../types';
import { analyzeEnvironmentalImage } from '../services/geminiService';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { XCircleIcon } from './icons/XCircleIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import ReportCard from './ReportCard';

interface ReportFormProps {
  onSubmit: (mediaFile: File, userDescription: string, coords: { latitude: number; longitude: number }, aiAnalysis: AIAnalysis) => void;
  onCancel: () => void;
  isLoading: boolean;
  error: string | null;
  isOnline: boolean;
  initialCoords?: { latitude: number; longitude: number } | null;
}

import { resolveWardAndAreaFromGPS } from '../utils/daNangWards';

const resolveWardAndArea = (latitude: number, longitude: number) => {
  const result = resolveWardAndAreaFromGPS(latitude, longitude);
  return { ward: result.ward, area: result.area };
};

const ReportForm: React.FC<ReportFormProps> = ({ onSubmit, onCancel, isLoading, error, isOnline, initialCoords }) => {
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);
  const [description, setDescription] = useState('');
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(initialCoords || null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);
  const [analysisMessage, setAnalysisMessage] = useState<string | null>(null);

  const locationJustFetched = useRef(false);
  const highlightTimeoutRef = useRef<number | null>(null);

  const fetchLocation = (retryWithLowAccuracy = true) => {
    if (!navigator.geolocation) {
      setLocationError('Trình duyệt của bạn không hỗ trợ định vị.');
      return;
    }
    
    if (highlightTimeoutRef.current) {
      clearTimeout(highlightTimeoutRef.current);
    }
    locationJustFetched.current = false;

    setIsGettingLocation(true);
    setLocationError(null);

    const options = { 
      enableHighAccuracy: retryWithLowAccuracy, 
      timeout: retryWithLowAccuracy ? 10000 : 30000, 
      maximumAge: retryWithLowAccuracy ? 0 : 300000 
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        setCoords({ latitude, longitude });
        setAccuracy(accuracy);
        setIsGettingLocation(false);
        locationJustFetched.current = true;
        highlightTimeoutRef.current = window.setTimeout(() => {
          locationJustFetched.current = false;
        }, 2000); // Highlight trong 2 giây
      },
      (err) => {
        if (retryWithLowAccuracy && (err.code === err.TIMEOUT || err.code === err.POSITION_UNAVAILABLE)) {
          console.warn("High accuracy GPS failed, retrying with low accuracy...");
          fetchLocation(false);
        } else {
          let msg = err.message;
          if (err.code === err.TIMEOUT) msg = "Hết thời gian chờ (Timeout). Hãy đảm bảo bạn đang ở nơi thoáng đãng và đã bật GPS.";
          if (err.code === err.PERMISSION_DENIED) msg = "Bạn đã từ chối quyền truy cập vị trí. Hãy kiểm tra cài đặt trình duyệt.";
          
          setLocationError(`Lỗi: ${msg}`);
          setIsGettingLocation(false);
        }
      },
      options
    );
  };
  
  useEffect(() => {
    if (!initialCoords) {
      fetchLocation();
    }
    return () => {
      if (highlightTimeoutRef.current) {
        clearTimeout(highlightTimeoutRef.current);
      }
    };
  }, []);

  const analyzeFile = async (file: File) => {
    setIsAnalyzing(true);
    setAiAnalysis(null);
    setAnalysisMessage(null);
    
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
          const result = reader.result as string;
          // Remove data URL prefix
          const base64Data = result.split(',')[1];
          resolve(base64Data);
        };
        reader.onerror = error => reject(error);
      });

      const result = await analyzeEnvironmentalImage(base64, file.type);
      setAiAnalysis(result);
      if (result.description) {
        setDescription(result.description);
      }
    } catch (error) {
      console.error("Analysis failed:", error);
      setAnalysisMessage("Không thể phân tích tệp tin bằng AI. Vui lòng thử lại hoặc chọn tệp tin khác.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleMediaChange = (file: File) => {
    setMediaFile(file);
    setAiAnalysis(null);
    setAnalysisMessage(null);
    if (mediaUrl) {
      URL.revokeObjectURL(mediaUrl);
    }
    setMediaUrl(URL.createObjectURL(file));
    setMediaType(file.type.startsWith('video') ? 'video' : 'image');

    if (isOnline) {
      analyzeFile(file);
    }
  };

  const handleManualAnalysis = async () => {
    if (!mediaFile) return;
    await analyzeFile(mediaFile);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mediaFile && coords && !isLoading) {
      // Block sending if online and analysis says it's not a valid issue
      if (isOnline && aiAnalysis && !aiAnalysis.isIssuePresent) {
        return;
      }
      
      const finalAnalysis: AIAnalysis = aiAnalysis || {
        issueType: 'Đang chờ phân tích',
        description: description || 'Người dùng đã gửi báo cáo trực tiếp.',
        priority: 'Trung bình',
        solution: 'Đang chờ hệ thống kiểm tra và đề xuất giải pháp.',
        isIssuePresent: true
      };
      
      onSubmit(mediaFile, description, coords, finalAnalysis);
    }
  };

  const isSubmitDisabled = 
    !mediaFile || 
    !coords || 
    isLoading || 
    isAnalyzing || 
    (isOnline && (!aiAnalysis || !aiAnalysis.isIssuePresent));

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 max-w-4xl">
      <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="bg-slate-50 border-b border-slate-100 p-6 sm:p-8">
          <div className="flex justify-between items-start">
            <div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight">Gửi báo cáo sự cố</h2>
                <p className="text-slate-500 mt-2">Đóng góp của bạn giúp thành phố xanh và sạch hơn.</p>
            </div>
            {!isOnline && (
                <div className="bg-amber-100 text-amber-800 px-3 py-1 rounded-lg text-xs font-bold border border-amber-200">
                    Chế độ Offline
                </div>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-8">
          {/* Step 1 */}
          <div className="space-y-4">
             <div className="flex items-center space-x-3 mb-2">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-teal-100 text-teal-700 font-bold text-sm">1</span>
                <label className="text-lg font-bold text-slate-700">Hình ảnh / Video sự cố <span className="text-red-500">*</span></label>
             </div>
            <ImageUploader onImageChange={handleMediaChange} imageUrl={mediaUrl} mediaType={mediaType} />
            
            {/* AI Analyzing Spinner */}
            {isAnalyzing && (
                <div className="flex flex-col items-center justify-center p-6 bg-indigo-50 border border-indigo-100 rounded-2xl space-y-3 animate-pulse">
                    <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-sm font-bold text-indigo-800">Hệ thống AI đang tự động phân tích hình ảnh/video...</p>
                    <p className="text-xs text-indigo-500">Vui lòng chờ giây lát để xác thực sự cố môi trường.</p>
                </div>
            )}

            {/* Retry Button if Analysis failed or was offline but now online */}
            {mediaFile && isOnline && !isAnalyzing && !aiAnalysis && (
                <div className="flex justify-center">
                    <button
                        type="button"
                        onClick={handleManualAnalysis}
                        className="flex items-center space-x-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-full hover:bg-indigo-100 transition-colors"
                    >
                        <SparklesIcon className="w-4 h-4" />
                        <span>Phân tích lại bằng AI</span>
                    </button>
                </div>
            )}
          </div>
          
           {/* Analysis Result Area */}
           <div className="min-h-[20px] transition-all duration-500">
                {aiAnalysis && (
                    <div className="space-y-4 animate-fade-in-up">
                         {aiAnalysis.isIssuePresent ? (
                             <div className="flex items-center gap-3 p-4 rounded-xl border text-green-800 bg-green-50 border-green-100">
                                <CheckCircleIcon className="w-6 h-6 flex-shrink-0 text-green-600" />
                                <div>
                                    <p className="font-bold text-green-950">Hình ảnh hợp lệ! Sự cố môi trường đã được AI xác thực.</p>
                                    <p className="text-xs text-green-700">Bạn có thể gửi báo cáo này lên hệ thống ngay bây giờ.</p>
                                </div>
                             </div>
                         ) : (
                             <div className="flex items-center gap-3 p-4 rounded-xl border text-red-800 bg-red-50 border-red-100">
                                <XCircleIcon className="w-6 h-6 flex-shrink-0 text-red-600" />
                                <div>
                                    <p className="font-bold text-red-950">Hình ảnh KHÔNG hợp lệ!</p>
                                    <p className="text-xs text-red-700 mt-1">
                                        AI xác định hình ảnh/video này không chứa rác thải hoặc sự cố môi trường thực tế. 
                                        <strong> Bạn không được phép gửi báo cáo này.</strong> Vui lòng chụp hoặc tải lên hình ảnh/video hợp lệ khác.
                                    </p>
                                </div>
                             </div>
                         )}
                        
                        {/* AI Result Card */}
                        <div className="bg-white p-5 rounded-2xl border border-indigo-100 shadow-sm space-y-3 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-2 bg-indigo-50 rounded-bl-2xl">
                                <SparklesIcon className="w-5 h-5 text-indigo-500" />
                            </div>
                            <div>
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Sự cố phát hiện</span>
                                <p className="text-lg font-bold text-slate-800">{aiAnalysis.issueType}</p>
                            </div>
                            <div>
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Mô tả</span>
                                <p className="text-sm text-slate-600">{aiAnalysis.description}</p>
                            </div>
                            {aiAnalysis.isIssuePresent && (
                             <>
                                 <div>
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Giải pháp đề xuất</span>
                                    <p className="text-sm text-slate-600">{aiAnalysis.solution}</p>
                                </div>
                                <div className="pt-2">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                        aiAnalysis.priority === 'Cao' ? 'bg-red-100 text-red-800' :
                                        aiAnalysis.priority === 'Trung bình' ? 'bg-yellow-100 text-yellow-800' :
                                        'bg-green-100 text-green-800'
                                    }`}>
                                        Mức độ: {aiAnalysis.priority}
                                    </span>
                                </div>
                             </>
                            )}
                        </div>
                    </div>
                )}
                
                {analysisMessage && !aiAnalysis && (
                    <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm text-center">
                        {analysisMessage}
                    </div>
                )}

                {mediaFile && !isOnline && (
                    <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl text-amber-800 text-sm flex items-center space-x-2">
                        <span className="font-bold">⚠️ Ngoại tuyến:</span>
                        <span>Không thể phân tích AI ngay bây giờ. Báo cáo của bạn sẽ được lưu offline và tự động phân tích/gửi khi có kết nối mạng trở lại.</span>
                    </div>
                )}
            </div>


          {/* Step 2 */}
          <div className="space-y-4">
             <div className="flex items-center space-x-3 mb-2">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-teal-100 text-teal-700 font-bold text-sm">2</span>
                <label htmlFor="description" className="text-lg font-bold text-slate-700">Mô tả bổ sung</label>
             </div>
            <textarea
              id="description"
              rows={3}
              className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all resize-none placeholder-slate-400"
              placeholder="Ví dụ: Đống rác này đã ở đây 3 ngày..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Step 3 */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3 mb-2">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-teal-100 text-teal-700 font-bold text-sm">3</span>
                <label className="text-lg font-bold text-slate-700">Vị trí sự cố <span className="text-red-500">*</span></label>
             </div>
            
            <div className={`p-4 rounded-2xl flex items-center justify-between transition-all duration-500 border ${locationJustFetched.current ? 'bg-green-50 border-green-200' : 'bg-slate-50 border-slate-100'}`}>
                {isGettingLocation ? (
                    <div className="flex items-center text-slate-600 text-sm">
                        <div className="w-5 h-5 border-2 border-t-teal-500 border-gray-300 rounded-full animate-spin mr-3"></div>
                        Đang lấy tọa độ GPS...
                    </div>
                ) : coords ? (
                    <div className="flex items-center text-sm text-slate-800">
                        <div className="bg-green-100 p-2 rounded-full mr-3">
                             <CheckCircleIcon className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                            <span className="font-bold text-green-800 block">Đã xác định vị trí</span>
                            <p className="font-mono text-xs text-slate-500 mt-0.5">
                              {`${coords.latitude.toFixed(6)}, ${coords.longitude.toFixed(6)}`}
                              {accuracy && ` (±${accuracy.toFixed(0)}m)`}
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center text-sm text-red-600">
                        <XCircleIcon className="w-6 h-6 mr-2 flex-shrink-0" />
                        <span>{locationError || 'Vui lòng cấp quyền truy cập vị trí.'}</span>
                    </div>
                )}
                <button 
                    type="button" 
                    onClick={() => fetchLocation()} 
                    className="text-slate-500 hover:text-teal-600 p-2 rounded-full hover:bg-white transition-colors disabled:opacity-50"
                    disabled={isGettingLocation}
                    title="Lấy lại vị trí"
                >
                    <RefreshIcon className={`w-5 h-5 ${isGettingLocation ? 'animate-spin' : ''}`} />
                </button>
            </div>


          </div>
          
          {error && <p className="text-sm text-red-600 bg-red-50 p-4 rounded-xl border border-red-100">{error}</p>}
          
          <div className="pt-6 border-t border-slate-100 flex items-center justify-end space-x-4">
              <button
                type="button"
                onClick={onCancel}
                className="px-6 py-3 rounded-xl text-slate-600 font-bold hover:bg-slate-100 transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                disabled={isSubmitDisabled}
                className={`px-8 py-3 font-bold rounded-xl shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl active:scale-95 disabled:bg-none disabled:bg-slate-300 disabled:shadow-none disabled:cursor-not-allowed disabled:transform-none ${
                  isOnline 
                    ? (aiAnalysis && !aiAnalysis.isIssuePresent 
                        ? 'bg-red-300 text-white cursor-not-allowed' 
                        : 'bg-gradient-to-r from-teal-500 to-teal-600 text-white shadow-teal-200 hover:shadow-teal-300')
                    : 'bg-amber-500 text-white shadow-amber-200 hover:shadow-amber-300'
                }`}
              >
                {isLoading ? 'Đang xử lý...' : (
                  isOnline 
                    ? (isAnalyzing 
                        ? 'Đang phân tích...' 
                        : (aiAnalysis && !aiAnalysis.isIssuePresent ? 'Rác không hợp lệ' : 'Gửi Báo Cáo'))
                    : 'Lưu Offline'
                )}
              </button>
            </div>
        </form>
      </div>
    </div>
  );
};

export default ReportForm;
