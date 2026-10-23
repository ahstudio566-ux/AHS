
import React, { useRef, useState, useEffect } from 'react';
import { UploadIcon } from './icons/UploadIcon';
import { CameraIcon } from './icons/CameraIcon';
import { XMarkIcon } from './icons/XMarkIcon';

interface ImageUploaderProps {
  onImageChange: (file: File) => void;
  imageUrl: string | null;
  mediaType: 'image' | 'video' | null;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageChange, imageUrl, mediaType }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  useEffect(() => {
    // Cleanup stream on unmount
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      onImageChange(event.target.files[0]);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (event.dataTransfer.files && event.dataTransfer.files[0]) {
      onImageChange(event.dataTransfer.files[0]);
    }
    event.currentTarget.classList.remove('border-teal-500', 'bg-teal-50', 'scale-[1.01]');
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.classList.add('border-teal-500', 'bg-teal-50', 'scale-[1.01]');
  };
  
  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.classList.remove('border-teal-500', 'bg-teal-50', 'scale-[1.01]');
  };

  const startCamera = async () => {
    try {
      setCameraError(null);
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } // Prefer back camera on mobile
      });
      setStream(mediaStream);
      setIsCameraOpen(true);
      // Delay setting srcObject slightly to ensure video element is mounted
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      }, 100);
    } catch (err) {
      console.error("Lỗi truy cập camera:", err);
      setCameraError("Không thể truy cập camera. Vui lòng kiểm tra quyền truy cập.");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsCameraOpen(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], "camera_capture.jpg", { type: "image/jpeg" });
            onImageChange(file);
            stopCamera();
          }
        }, 'image/jpeg', 0.95);
      }
    }
  };

  if (isCameraOpen) {
    return (
      <div className="w-full h-96 bg-black rounded-2xl relative overflow-hidden flex flex-col items-center justify-center shadow-lg">
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          muted 
          className="absolute inset-0 w-full h-full object-cover"
        />
        <canvas ref={canvasRef} className="hidden" />
        
        <div className="absolute bottom-6 z-10 flex space-x-8 items-center">
           <button 
            onClick={stopCamera}
            className="bg-white/20 backdrop-blur-md text-white p-3 rounded-full hover:bg-white/30 transition-colors"
            aria-label="Đóng camera"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
          <button 
            onClick={capturePhoto}
            className="p-1 rounded-full border-4 border-white/50 hover:border-white transition-all hover:scale-105"
            aria-label="Chụp ảnh"
          >
            <div className="w-16 h-16 bg-white rounded-full shadow-inner"></div>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div
        className={`w-full h-72 border-2 border-dashed border-slate-300 rounded-3xl flex flex-col items-center justify-center text-center p-6 relative overflow-hidden bg-slate-50 transition-all duration-300 cursor-pointer hover:border-teal-500 hover:bg-teal-50 group`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !imageUrl && fileInputRef.current?.click()}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept="image/png, image/jpeg, image/webp, video/mp4, video/webm, video/quicktime"
        />
        
        {imageUrl ? (
            <div className="w-full h-full relative group/image">
                {mediaType === 'image' && (
                    <img src={imageUrl} alt="Xem trước" className="absolute inset-0 w-full h-full object-contain rounded-2xl" />
                )}
                {mediaType === 'video' && (
                    <video src={imageUrl} controls className="absolute inset-0 w-full h-full object-contain rounded-2xl" />
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/image:opacity-100 transition-opacity flex items-center justify-center rounded-2xl">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        fileInputRef.current?.click();
                      }}
                      className="bg-white text-slate-800 px-4 py-2 rounded-full font-medium shadow-lg hover:scale-105 transition-transform"
                    >
                      Thay đổi tệp
                    </button>
                </div>
            </div>
        ) : (
          <div className="text-slate-500 z-10 flex flex-col items-center pointer-events-none">
            <div className="bg-white p-4 rounded-full shadow-sm mb-4 group-hover:scale-110 transition-transform duration-300">
                 <UploadIcon className="h-10 w-10 text-teal-500" />
            </div>
            <p className="font-bold text-slate-700 text-lg">Kéo thả ảnh/video hoặc nhấn để chọn</p>
            <p className="text-sm text-slate-400 mt-1">Hỗ trợ JPG, PNG, MP4</p>
            
            <div className="flex items-center gap-3 mt-6 pointer-events-auto">
               {/* Separate buttons to ensure clicks work without bubbling issues */}
              <button 
                type="button"
                onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                className="px-5 py-2.5 bg-white border border-slate-200 rounded-xl shadow-sm text-sm font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all"
              >
                Chọn từ thư viện
              </button>
              
              <span className="text-slate-300 text-sm">hoặc</span>
              
              <button 
                type="button"
                onClick={(e) => { e.stopPropagation(); startCamera(); }}
                className="flex items-center px-5 py-2.5 bg-teal-600 border border-transparent rounded-xl shadow-md shadow-teal-100 text-sm font-bold text-white hover:bg-teal-700 hover:shadow-teal-200 transition-all"
              >
                <CameraIcon className="w-4 h-4 mr-2" />
                Chụp ảnh
              </button>
            </div>
            
            {cameraError && (
              <p className="text-xs text-red-500 mt-3 max-w-xs">{cameraError}</p>
            )}
          </div>
        )}
      </div>
      {imageUrl && (
        <div className="flex justify-center">
           <button 
              type="button"
              onClick={startCamera}
              className="text-sm text-teal-600 hover:text-teal-800 flex items-center font-bold px-4 py-2 hover:bg-teal-50 rounded-lg transition-colors"
            >
              <CameraIcon className="w-4 h-4 mr-2" />
              Chụp lại ảnh mới
            </button>
        </div>
      )}
    </div>
  );
};

export default ImageUploader;
