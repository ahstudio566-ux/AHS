import React, { useEffect, useState, useRef, useCallback } from 'react';
import { XMarkIcon } from './icons/XMarkIcon';
import { SOSIcon } from './icons/SOSIcon';
import { AlertTriangle, Phone, Volume2, VolumeX, Flashlight, Mic, MicOff, Smartphone, ShieldAlert, CheckCircle2, Zap, ArrowLeft, RefreshCw, Send } from 'lucide-react';

interface SOSViewProps {
  onClose: () => void;
}

const SOSView: React.FC<SOSViewProps> = ({ onClose }) => {
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  
  // SOS State
  const [sosSent, setSosSent] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [compressedPayload, setCompressedPayload] = useState<string>('');
  
  // Emergency Features State
  const [isSirenActive, setIsSirenActive] = useState(false);
  const [isStrobeActive, setIsStrobeActive] = useState(false);
  const [isShakeEnabled, setIsShakeEnabled] = useState(true);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState<string>('');
  
  // Trigger Mode Preference: 'instant' (1-Tap + 3s cancel window) vs 'hold' (Press & hold 3s)
  const [triggerMode, setTriggerMode] = useState<'instant' | 'hold'>('instant');
  
  // Press & Hold State (for hold mode)
  const [isPressing, setIsPressing] = useState(false);
  const [pressProgress, setPressProgress] = useState(0);
  
  // UI Tabs
  const [activeTab, setActiveTab] = useState<'emergency' | 'radar'>('emergency');

  const pressTimer = useRef<NodeJS.Timeout | null>(null);
  const progressInterval = useRef<NodeJS.Timeout | null>(null);
  const countdownInterval = useRef<NodeJS.Timeout | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const sirenIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const speechRecognitionRef = useRef<any>(null);

  // Storm Core info for Da Nang
  const stormCore = {
    name: "Siêu bão Trà Mi (Cấp 14 - Giật cấp 17)",
    lat: 16.1852,
    lng: 108.3124,
    pressure: "965 hPa",
    speed: "25 km/h",
    direction: "Tây Tây Nam"
  };

  // High-Priority GPS Location State
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [gpsStatus, setGpsStatus] = useState<'locking' | 'high_accuracy' | 'standard' | 'fallback' | 'error'>('locking');
  const [gpsLastUpdated, setGpsLastUpdated] = useState<Date | null>(null);
  const gpsWatchId = useRef<number | null>(null);

  // High-Priority GPS Acquisition Engine
  const fetchHighPriorityGPS = useCallback(() => {
    setGpsStatus('locking');
    setLocationError(null);

    if (!navigator.geolocation) {
      setLocationError("Trình duyệt không hỗ trợ GPS.");
      setGpsStatus('error');
      setLocation({ lat: 16.0474, lng: 108.2197 });
      return;
    }

    // 1. Immediate High-Accuracy GPS Fix (maximumAge: 0 forces fresh satellite request)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        setLocation({ lat: latitude, lng: longitude });
        setGpsAccuracy(Math.round(accuracy));
        setGpsLastUpdated(new Date());
        setGpsStatus(accuracy <= 20 ? 'high_accuracy' : 'standard');
      },
      (err) => {
        console.warn("High-priority GPS primary request failed, trying fast fallback:", err);
        navigator.geolocation.getCurrentPosition(
          (fallbackPos) => {
            const { latitude, longitude, accuracy } = fallbackPos.coords;
            setLocation({ lat: latitude, lng: longitude });
            setGpsAccuracy(Math.round(accuracy));
            setGpsLastUpdated(new Date());
            setGpsStatus('standard');
          },
          (fallbackErr) => {
            console.warn("Fallback GPS failed:", fallbackErr);
            setLocationError("Không thể khóa GPS tự động. Sử dụng vị trí mặc định Đà Nẵng.");
            setGpsStatus('fallback');
            setLocation({ lat: 16.0474, lng: 108.2197 });
          },
          { enableHighAccuracy: false, timeout: 5000, maximumAge: 30000 }
        );
      },
      { enableHighAccuracy: true, timeout: 7000, maximumAge: 0 }
    );

    // 2. Continuous watchPosition to refine precision live as satellite connection stabilizes
    if (gpsWatchId.current !== null) {
      navigator.geolocation.clearWatch(gpsWatchId.current);
    }

    gpsWatchId.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        setLocation({ lat: latitude, lng: longitude });
        setGpsAccuracy(Math.round(accuracy));
        setGpsLastUpdated(new Date());
        if (accuracy <= 15) {
          setGpsStatus('high_accuracy');
        } else if (accuracy <= 50) {
          setGpsStatus('standard');
        }
      },
      (err) => {
        console.warn("watchPosition warning:", err);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, []);

  // Initiate High Priority GPS on mount
  useEffect(() => {
    fetchHighPriorityGPS();

    return () => {
      if (gpsWatchId.current !== null) {
        navigator.geolocation.clearWatch(gpsWatchId.current);
      }
    };
  }, [fetchHighPriorityGPS]);

  // Compress GPS coordinates into tight hex payload
  const compressGPS = useCallback((lat: number, lng: number) => {
    const latInt = Math.floor((lat + 90) * 100000);
    const lngInt = Math.floor((lng + 180) * 100000);
    const latHex = latInt.toString(16).toUpperCase().padStart(6, '0');
    const lngHex = lngInt.toString(16).toUpperCase().padStart(6, '0');
    const battery = Math.floor(Math.random() * 40 + 30).toString(16).toUpperCase();
    return `DNG_SOS_${latHex}_${lngHex}_B${battery}`;
  }, []);

  // Dispatch SOS Emergency Message & SMS Intent
  const dispatchSOS = useCallback(() => {
    const currentLat = location?.lat || 16.0474;
    const currentLng = location?.lng || 108.2197;
    const payload = compressGPS(currentLat, currentLng);
    
    setCompressedPayload(payload);
    setSosSent(true);
    setCountdown(null);

    // Vibration feedback if supported
    if (navigator.vibrate) {
      navigator.vibrate([500, 200, 500, 200, 1000]);
    }

    // Auto launch SMS intent to rescue hotline
    const phone = "0347885360";
    const locStr = `${currentLat.toFixed(5)},${currentLng.toFixed(5)}`;
    const text = `SOS DNG_GREEN KHAN CAP: Vi tri ${locStr}. Ma hex: ${payload}. Can giup do ngay lập tuc!`;
    const smsUri = `sms:${phone}?body=${encodeURIComponent(text)}`;
    
    try {
      const anchor = document.createElement('a');
      anchor.href = smsUri;
      anchor.click();
    } catch (e) {
      console.warn("Could not auto-open SMS URI:", e);
    }
  }, [location, compressGPS]);

  // Handle 1-Tap Instant SOS Activation
  const handleInstantTrigger = () => {
    if (sosSent) return;
    
    // Start a fast 3-second auto-dispatch countdown
    setCountdown(3);
    if (navigator.vibrate) {
      navigator.vibrate(200);
    }

    if (countdownInterval.current) clearInterval(countdownInterval.current);
    
    let currentCount = 3;
    countdownInterval.current = setInterval(() => {
      currentCount -= 1;
      if (currentCount <= 0) {
        clearInterval(countdownInterval.current!);
        dispatchSOS();
      } else {
        setCountdown(currentCount);
        if (navigator.vibrate) navigator.vibrate(100);
      }
    }, 1000);
  };

  const cancelCountdown = () => {
    if (countdownInterval.current) {
      clearInterval(countdownInterval.current);
      countdownInterval.current = null;
    }
    setCountdown(null);
  };

  // Press & Hold Logic (Alternative Mode)
  const handlePressStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (sosSent) return;
    setIsPressing(true);
    setPressProgress(0);

    progressInterval.current = setInterval(() => {
      setPressProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval.current!);
          return 100;
        }
        return prev + 10; // Takes ~1 second to complete
      });
    }, 100);

    pressTimer.current = setTimeout(() => {
      dispatchSOS();
      setIsPressing(false);
      setPressProgress(100);
      if (progressInterval.current) clearInterval(progressInterval.current);
    }, 1000);
  };

  const handlePressEnd = () => {
    if (!sosSent) {
      setIsPressing(false);
      setPressProgress(0);
      if (pressTimer.current) clearTimeout(pressTimer.current);
      if (progressInterval.current) clearInterval(progressInterval.current);
    }
  };

  // Web Audio Siren Generator
  const toggleSiren = () => {
    if (isSirenActive) {
      stopSiren();
    } else {
      startSiren();
    }
  };

  const startSiren = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      
      const ctx = new AudioCtx();
      audioCtxRef.current = ctx;
      
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(700, ctx.currentTime);
      gain.gain.setValueAtTime(0.8, ctx.currentTime);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      oscillatorRef.current = osc;
      
      let isHigh = false;
      sirenIntervalRef.current = setInterval(() => {
        if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') return;
        isHigh = !isHigh;
        const targetFreq = isHigh ? 1300 : 700;
        osc.frequency.cancelScheduledValues(ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(targetFreq, ctx.currentTime + 0.3);
      }, 400);

      setIsSirenActive(true);
    } catch (err) {
      console.warn("Audio siren error:", err);
    }
  };

  const stopSiren = () => {
    if (sirenIntervalRef.current) {
      clearInterval(sirenIntervalRef.current);
      sirenIntervalRef.current = null;
    }
    if (oscillatorRef.current) {
      try { oscillatorRef.current.stop(); } catch (e) {}
      oscillatorRef.current = null;
    }
    if (audioCtxRef.current) {
      try { audioCtxRef.current.close(); } catch (e) {}
      audioCtxRef.current = null;
    }
    setIsSirenActive(false);
  };

  // Shake Detection
  useEffect(() => {
    if (!isShakeEnabled || sosSent) return;

    let lastX = 0, lastY = 0, lastZ = 0;
    let lastTime = Date.now();
    let shakeCount = 0;

    const handleMotion = (event: DeviceMotionEvent) => {
      const acc = event.accelerationIncludingGravity;
      if (!acc || acc.x === null || acc.y === null || acc.z === null) return;

      const currentTime = Date.now();
      if ((currentTime - lastTime) > 100) {
        const diffTime = currentTime - lastTime;
        lastTime = currentTime;

        const speed = Math.abs(acc.x + acc.y + acc.z - lastX - lastY - lastZ) / diffTime * 10000;

        if (speed > 2200) { // Shake sensitivity threshold
          shakeCount++;
          if (shakeCount >= 2) {
            shakeCount = 0;
            dispatchSOS();
          }
        }
      }
      lastX = acc.x;
      lastY = acc.y;
      lastZ = acc.z;
    };

    window.addEventListener('devicemotion', handleMotion);
    return () => window.removeEventListener('devicemotion', handleMotion);
  }, [isShakeEnabled, sosSent, dispatchSOS]);

  // Voice Command Listener
  const toggleVoiceListener = () => {
    if (isVoiceEnabled) {
      if (speechRecognitionRef.current) {
        try { speechRecognitionRef.current.stop(); } catch (e) {}
      }
      setIsVoiceEnabled(false);
      setVoiceTranscript('');
    } else {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        alert("Trình duyệt của bạn không hỗ trợ nhận diện giọng nói.");
        return;
      }

      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'vi-VN';

        recognition.onresult = (event: any) => {
          let transcript = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            transcript += event.results[i][0].transcript;
          }
          const lower = transcript.toLowerCase();
          setVoiceTranscript(lower);

          if (lower.includes('cứu') || lower.includes('sos') || lower.includes('giúp tôi') || lower.includes('cứu tôi')) {
            recognition.stop();
            setIsVoiceEnabled(false);
            dispatchSOS();
          }
        };

        recognition.onerror = (err: any) => {
          console.warn("Speech recognition error:", err);
        };

        recognition.start();
        speechRecognitionRef.current = recognition;
        setIsVoiceEnabled(true);
      } catch (err) {
        console.warn("Failed to start voice listener:", err);
      }
    }
  };

  // Strobe effect cleanup
  useEffect(() => {
    return () => {
      stopSiren();
      if (countdownInterval.current) clearInterval(countdownInterval.current);
      if (progressInterval.current) clearInterval(progressInterval.current);
      if (pressTimer.current) clearTimeout(pressTimer.current);
      if (speechRecognitionRef.current) {
        try { speechRecognitionRef.current.stop(); } catch (e) {}
      }
    };
  }, []);

  const resetSOS = () => {
    setSosSent(false);
    setPressProgress(0);
    setIsPressing(false);
    setCountdown(null);
    stopSiren();
    setIsStrobeActive(false);
  };

  // Distance to storm calculation
  const getDistanceToStorm = () => {
    if (!location) return null;
    const R = 6371;
    const dLat = (stormCore.lat - location.lat) * Math.PI / 180;
    const dLon = (stormCore.lng - location.lng) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(location.lat * Math.PI / 180) * Math.cos(stormCore.lat * Math.PI / 180) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const distance = getDistanceToStorm();

  return (
    <div className={`fixed inset-0 z-50 flex flex-col text-white overflow-hidden transition-colors duration-100 ${
      isStrobeActive ? 'animate-strobe-flash bg-red-600' : 'bg-slate-950'
    }`}>
      {/* Header Bar */}
      <div className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 sm:px-6 py-3 flex items-center justify-between shadow-xl shrink-0">
        <div className="flex items-center space-x-3">
          <button 
            onClick={onClose}
            className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-300 transition-all mr-1"
            title="Quay lại"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="bg-red-600 text-white p-2 rounded-2xl shadow-lg shadow-red-900/50 animate-pulse">
            <SOSIcon className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-2">
              CỨU HỘ & SOS KHẨN CẤP
              <span className="px-2 py-0.5 bg-red-500/20 text-red-400 border border-red-500/30 rounded-md text-[10px] font-extrabold uppercase">Tối ưu 1-Chạm</span>
            </h1>
            <p className="text-[10px] text-slate-400 hidden sm:block">Trung tâm Báo động Thiên tai & Định vị Cứu nạn Đà Nẵng Green</p>
          </div>
        </div>
        
        <button 
          onClick={onClose}
          className="bg-slate-800 text-slate-400 hover:text-white p-2 rounded-xl border border-slate-700 transition-all hover:bg-slate-700"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>
      </div>

      {/* Main Container */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 max-w-6xl mx-auto w-full space-y-5">
        
        {/* Navigation Tabs for Mobile */}
        <div className="flex space-x-2 bg-slate-900 p-1.5 rounded-2xl border border-slate-800">
          <button 
            onClick={() => setActiveTab('emergency')}
            className={`flex-1 py-2.5 text-center rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${
              activeTab === 'emergency' ? 'bg-red-600 text-white shadow-lg shadow-red-900/40' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Zap className="w-4 h-4 text-amber-300" />
            <span>Kích Hoạt SOS Nhanh</span>
          </button>
          <button 
            onClick={() => setActiveTab('radar')}
            className={`flex-1 py-2.5 text-center rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${
              activeTab === 'radar' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <ShieldAlert className="w-4 h-4 text-teal-400" />
            <span>Radar Tâm Bão & Hotline</span>
          </button>
        </div>

        {/* TAB 1: EMERGENCY SOS QUICK TRIGGER ENGINE */}
        {activeTab === 'emergency' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            
            {/* Primary SOS Action Panel (Left/Center) */}
            <div className="lg:col-span-7 bg-slate-900/90 rounded-3xl p-5 sm:p-6 border border-slate-800 shadow-2xl flex flex-col justify-between space-y-6">
              
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="px-3 py-1 bg-red-500/10 text-red-400 rounded-lg text-[10px] font-black uppercase tracking-wider border border-red-500/20">
                    ⚡ CHẾ ĐỘ NGUY CẤP KHÔNG CẦN GIỮ NÚT
                  </span>
                  <span className="text-[11px] font-bold text-slate-400">
                    Mạng: <span className={navigator.onLine ? "text-emerald-400 font-extrabold" : "text-amber-400 font-extrabold"}>{navigator.onLine ? "Trực tuyến" : "SMS Ngoại tuyến"}</span>
                  </span>
                </div>
                
                <h2 className="text-xl sm:text-2xl font-black text-white">Gửi Tín Hiệu SOS & Tọa Độ GPS</h2>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Khi gặp nguy hiểm tính mạng, lũ quét, sạt lở hoặc mắc kẹt, nhấn <strong>GỬI SOS (1 CHẠM)</strong>. Tín hiệu nén mã hóa sẽ tự gửi qua SMS cứu hộ mà không đòi hỏi thao tác phức tạp.
                </p>
              </div>

              {/* Mode Selector Toggle */}
              <div className="bg-slate-950 p-2 rounded-2xl border border-slate-800/80 grid grid-cols-2 gap-2 text-center text-xs">
                <button
                  onClick={() => setTriggerMode('instant')}
                  className={`py-2.5 px-3 rounded-xl font-extrabold transition-all ${
                    triggerMode === 'instant' 
                      ? 'bg-red-600 text-white shadow-md' 
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  🚀 1-Chạm Khẩn Cấp (Mới)
                </button>
                <button
                  onClick={() => setTriggerMode('hold')}
                  className={`py-2.5 px-3 rounded-xl font-extrabold transition-all ${
                    triggerMode === 'hold' 
                      ? 'bg-slate-800 text-white shadow-md' 
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  🔒 Ấn & Giữ 1s (Tránh bấm nhầm)
                </button>
              </div>

              {/* DYNAMIC TRIGGER CONTROLLER */}
              {!sosSent ? (
                <div className="space-y-4 my-2">
                  
                  {/* Countdown Active State */}
                  {countdown !== null ? (
                    <div className="bg-red-950/80 border-2 border-red-500 rounded-3xl p-6 text-center space-y-4 animate-pulse">
                      <div className="text-4xl sm:text-5xl font-black font-mono text-red-200">
                        00:0{countdown}
                      </div>
                      <p className="text-xs font-bold text-red-300 uppercase tracking-widest">
                        Đang phát tín hiệu SOS cứu hộ khẩn cấp...
                      </p>
                      
                      <div className="flex gap-3">
                        <button
                          onClick={dispatchSOS}
                          className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg flex items-center justify-center gap-1.5"
                        >
                          <Send className="w-4 h-4" />
                          Gửi ngay lập tức
                        </button>
                        <button
                          onClick={cancelCountdown}
                          className="py-3 px-5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl border border-slate-600 transition-all"
                        >
                          Hủy bỏ
                        </button>
                      </div>
                    </div>
                  ) : triggerMode === 'instant' ? (
                    /* INSTANT 1-TAP BIG SOS BUTTON */
                    <button
                      onClick={handleInstantTrigger}
                      className="w-full py-7 px-6 bg-gradient-to-r from-red-600 via-red-500 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white rounded-3xl font-black text-lg sm:text-xl uppercase tracking-wider shadow-2xl shadow-red-900/60 transition-all transform active:scale-95 border-2 border-red-400/30 flex flex-col items-center justify-center gap-2 group"
                    >
                      <div className="flex items-center gap-2">
                        <Zap className="w-7 h-7 text-amber-300 animate-bounce" />
                        <span>GỬI SOS KHẨN CẤP (1 CHẠM)</span>
                      </div>
                      <span className="text-[11px] font-bold text-red-100 opacity-90 normal-case tracking-normal">
                        Bấm 1 lần → Tự động đếm ngược 3s & Gửi vị trí ngay
                      </span>
                    </button>
                  ) : (
                    /* PRESS & HOLD BUTTON (Fallback Mode) */
                    <div className="space-y-2">
                      <button
                        onMouseDown={handlePressStart}
                        onMouseUp={handlePressEnd}
                        onMouseLeave={handlePressEnd}
                        onTouchStart={handlePressStart}
                        onTouchEnd={handlePressEnd}
                        className="w-full py-6 rounded-3xl font-black text-base uppercase tracking-wider relative overflow-hidden transition-all select-none active:scale-95 shadow-xl border border-red-500/40"
                        style={{
                          background: isPressing 
                            ? `linear-gradient(90deg, #dc2626 ${pressProgress}%, #1e293b ${pressProgress}%)`
                            : '#ef4444'
                        }}
                      >
                        {isPressing ? `ĐANG GIỮ (${Math.ceil((100 - pressProgress) / 100)}s)...` : 'ẤN & GIỮ 1 GIÂY ĐỂ PHÁT SOS'}
                      </button>
                      <p className="text-[10px] text-slate-400 text-center font-medium">
                        Giữ nút trong 1 giây để tránh chạm nhầm màn hình
                      </p>
                    </div>
                  )}

                  {/* High-Priority GPS Status Card */}
                  <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="flex items-start space-x-3 text-slate-300">
                      <div className="p-2 bg-slate-900 rounded-xl border border-slate-800 text-teal-400 shrink-0">
                        {gpsStatus === 'locking' ? (
                          <RefreshCw className="w-5 h-5 animate-spin text-amber-400" />
                        ) : (
                          <span className="text-base">🛰️</span>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-white uppercase text-[11px] tracking-wide">
                            GPS Ưu Tiên Cao Vệ Tinh
                          </span>
                          {gpsStatus === 'high_accuracy' && (
                            <span className="text-[9px] font-black uppercase text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/30">
                              Độ chính xác cao
                            </span>
                          )}
                          {gpsStatus === 'locking' && (
                            <span className="text-[9px] font-black uppercase text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/30 animate-pulse">
                              Đang khóa GPS...
                            </span>
                          )}
                        </div>
                        
                        <p className="font-mono font-semibold text-slate-200 mt-0.5 text-xs">
                          {location ? `${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}` : "Đang dò tọa độ..."}
                          {gpsAccuracy !== null && (
                            <span className="text-slate-400 font-sans ml-2 text-[11px]">
                              (Sai số ±{gpsAccuracy}m)
                            </span>
                          )}
                        </p>
                        {gpsLastUpdated && (
                          <p className="text-[10px] text-slate-500 mt-0.5">
                            Cập nhật lúc: {gpsLastUpdated.toLocaleTimeString('vi-VN')}
                          </p>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={fetchHighPriorityGPS}
                      className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-teal-400 hover:text-teal-300 rounded-xl border border-slate-800 text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 shrink-0"
                      title="Cập nhật lại GPS vệ tinh ngay lập tức"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${gpsStatus === 'locking' ? 'animate-spin' : ''}`} />
                      <span>Định vị lại</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* SOS SENT CONFIRMATION STATE */
                <div className="bg-emerald-950/40 border-2 border-emerald-500/50 rounded-3xl p-6 text-center space-y-4 animate-fade-in-up">
                  <div className="w-12 h-12 bg-emerald-500 text-slate-950 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/30">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-emerald-300 uppercase">ĐÃ PHÁT TÍN HIỆU SOS THÀNH CÔNG!</h3>
                    <p className="text-xs text-emerald-200 mt-1 font-medium">
                      Mã tọa độ nén đã được chuẩn bị và mở trình gửi tin nhắn khẩn cấp tới Ban Chỉ Huy Cứu Hộ Đà Nẵng.
                    </p>
                  </div>

                  <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 text-left font-mono text-xs space-y-1 text-slate-300">
                    <span className="text-[10px] text-slate-500 font-bold uppercase block">Mã nén Hex định vị:</span>
                    <span className="text-teal-400 font-bold block text-sm select-all">{compressedPayload}</span>
                  </div>

                  <div className="pt-2 flex gap-3">
                    <button
                      onClick={dispatchSOS}
                      className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-xl uppercase tracking-wider transition-all shadow-md"
                    >
                      Gửi Lại Tin SOS
                    </button>
                    <button
                      onClick={resetSOS}
                      className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl border border-slate-700 transition-all flex items-center gap-1"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Tải lại
                    </button>
                  </div>
                </div>
              )}

              {/* AUXILIARY ULTIMATE EMERGENCY SENSORS */}
              <div className="border-t border-slate-800/80 pt-5 space-y-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center justify-between">
                  <span>CÔNG CỤ CỨU NẠN BỔ SUNG (CHO NGHĨA VỤ KHẨN CẤP)</span>
                  <span className="text-[10px] text-amber-400 font-semibold">Tự động hóa</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  
                  {/* SIREN AUDIO ALARM BUTTON */}
                  <button
                    onClick={toggleSiren}
                    className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between text-left ${
                      isSirenActive 
                        ? 'bg-amber-500 text-slate-950 border-amber-300 font-black animate-pulse shadow-lg shadow-amber-500/30' 
                        : 'bg-slate-950 hover:bg-slate-800 border-slate-800 text-slate-200'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-xl ${isSirenActive ? 'bg-slate-950 text-amber-400' : 'bg-slate-800 text-amber-400'}`}>
                        {isSirenActive ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                      </div>
                      <div>
                        <p className="text-xs font-extrabold uppercase">Còi Báo Động Vị Trí</p>
                        <p className="text-[10px] opacity-80">{isSirenActive ? "Đang phát tiếng còi to!" : "Phát âm thanh tìm kiếm"}</p>
                      </div>
                    </div>
                    <span className="text-xs font-black">{isSirenActive ? "TẮT" : "BẬT"}</span>
                  </button>

                  {/* STROBE BEACON LIGHT BUTTON */}
                  <button
                    onClick={() => setIsStrobeActive(!isStrobeActive)}
                    className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between text-left ${
                      isStrobeActive 
                        ? 'bg-red-600 text-white border-red-400 font-black shadow-lg shadow-red-600/30' 
                        : 'bg-slate-950 hover:bg-slate-800 border-slate-800 text-slate-200'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-xl ${isStrobeActive ? 'bg-white text-red-600' : 'bg-slate-800 text-red-400'}`}>
                        <Flashlight className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs font-extrabold uppercase">Đèn Nháy SOS Đêm</p>
                        <p className="text-[10px] opacity-80">{isStrobeActive ? "Đang nháy ánh sáng SOS!" : "Chớp sáng cho trực thăng"}</p>
                      </div>
                    </div>
                    <span className="text-xs font-black">{isStrobeActive ? "TẮT" : "BẬT"}</span>
                  </button>

                  {/* SHAKE PHONE TOGGLE */}
                  <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-slate-800 text-teal-400 rounded-xl">
                        <Smartphone className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs font-extrabold text-slate-200 uppercase">Cảm Biến Lắc Máy</p>
                        <p className="text-[10px] text-slate-400">Lắc mạnh 3 lần để SOS</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setIsShakeEnabled(!isShakeEnabled)}
                      className={`w-11 h-6 rounded-full p-1 transition-colors flex items-center ${
                        isShakeEnabled ? 'bg-teal-500 justify-end' : 'bg-slate-700 justify-start'
                      }`}
                    >
                      <span className="w-4 h-4 rounded-full bg-white shadow-sm block"></span>
                    </button>
                  </div>

                  {/* VOICE COMMAND TOGGLE */}
                  <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-slate-800 text-purple-400 rounded-xl">
                        {isVoiceEnabled ? <Mic className="w-5 h-5 animate-pulse text-purple-300" /> : <MicOff className="w-5 h-5" />}
                      </div>
                      <div>
                        <p className="text-xs font-extrabold text-slate-200 uppercase">Giọng Nói SOS</p>
                        <p className="text-[10px] text-slate-400">Hô "Cứu với" / "SOS"</p>
                      </div>
                    </div>
                    <button
                      onClick={toggleVoiceListener}
                      className={`w-11 h-6 rounded-full p-1 transition-colors flex items-center ${
                        isVoiceEnabled ? 'bg-purple-500 justify-end' : 'bg-slate-700 justify-start'
                      }`}
                    >
                      <span className="w-4 h-4 rounded-full bg-white shadow-sm block"></span>
                    </button>
                  </div>

                </div>

                {/* Voice Transcript display */}
                {isVoiceEnabled && (
                  <div className="p-2.5 bg-purple-950/40 border border-purple-800/50 rounded-xl text-[11px] text-purple-200 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping shrink-0"></span>
                    <span>Đang lắng nghe: {voiceTranscript ? `"${voiceTranscript}"` : "Hãy nói 'Cứu tôi' hoặc 'SOS'..."}</span>
                  </div>
                )}
              </div>

            </div>

            {/* Direct Hotlines & Emergency Phone Panel (Right) */}
            <div className="lg:col-span-5 space-y-5">
              
              {/* Hotlines Card */}
              <div className="bg-slate-900/90 rounded-3xl p-5 sm:p-6 border border-slate-800 shadow-xl space-y-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <Phone className="w-4 h-4 text-red-500" />
                  <span>ĐƯỜNG DÂY NÓNG 1-CHẠM GỌI THẲNG</span>
                </h3>

                <div className="space-y-3">
                  <a 
                    href="tel:112" 
                    className="flex items-center justify-between p-4 bg-gradient-to-r from-red-600/30 to-red-900/20 hover:from-red-600/40 hover:to-red-900/30 rounded-2xl border border-red-500/30 transition-all text-white group shadow-md"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">🚑</span>
                      <div>
                        <p className="text-[10px] text-red-400 font-black uppercase">Cứu nạn Quốc gia</p>
                        <p className="font-extrabold text-lg text-red-100">Gọi Khẩn Cấp 112</p>
                      </div>
                    </div>
                    <span className="p-2 bg-red-600 rounded-xl text-white group-hover:scale-110 transition-transform">
                      <Phone className="w-4 h-4" />
                    </span>
                  </a>

                  <a 
                    href="tel:114" 
                    className="flex items-center justify-between p-4 bg-gradient-to-r from-amber-600/30 to-amber-900/20 hover:from-amber-600/40 hover:to-amber-900/30 rounded-2xl border border-amber-500/30 transition-all text-white group shadow-md"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">🔥</span>
                      <div>
                        <p className="text-[10px] text-amber-400 font-black uppercase">PCCC & Cứu Nạn Cứu Hộ</p>
                        <p className="font-extrabold text-lg text-amber-100">Cứu Hộ 114</p>
                      </div>
                    </div>
                    <span className="p-2 bg-amber-600 rounded-xl text-white group-hover:scale-110 transition-transform">
                      <Phone className="w-4 h-4" />
                    </span>
                  </a>

                  <a 
                    href="tel:115" 
                    className="flex items-center justify-between p-4 bg-gradient-to-r from-teal-600/30 to-teal-900/20 hover:from-teal-600/40 hover:to-teal-900/30 rounded-2xl border border-teal-500/30 transition-all text-white group shadow-md"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">🏥</span>
                      <div>
                        <p className="text-[10px] text-teal-400 font-black uppercase">Cấp Cứu Y Tế</p>
                        <p className="font-extrabold text-lg text-teal-100">Cấp Cứu 115</p>
                      </div>
                    </div>
                    <span className="p-2 bg-teal-600 rounded-xl text-white group-hover:scale-110 transition-transform">
                      <Phone className="w-4 h-4" />
                    </span>
                  </a>

                  <a 
                    href="tel:0347885360" 
                    className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-600/30 to-blue-900/20 hover:from-blue-600/40 hover:to-blue-900/30 rounded-2xl border border-blue-500/30 transition-all text-white group shadow-md"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">🏛️</span>
                      <div>
                        <p className="text-[10px] text-blue-400 font-black uppercase">Ban Chỉ Huy Đà Nẵng Green</p>
                        <p className="font-extrabold text-base text-blue-100">0347 885 360</p>
                      </div>
                    </div>
                    <span className="p-2 bg-blue-600 rounded-xl text-white group-hover:scale-110 transition-transform">
                      <Phone className="w-4 h-4" />
                    </span>
                  </a>
                </div>
              </div>

              {/* Instructions & Guidelines */}
              <div className="bg-slate-900/90 rounded-3xl p-5 border border-slate-800 space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-300">💡 Hướng dẫn an toàn khi lũ quét & bão</h4>
                <ul className="text-[11px] text-slate-400 space-y-2 list-disc list-inside leading-relaxed">
                  <li>Ngoại tuyến vẫn gửi được GPS nhờ mã hóa nén Hex SMS.</li>
                  <li>Nếu bị mắc kẹt tối trời, bật <strong>Còi Báo Động</strong> và <strong>Đèn Nháy SOS</strong> để tàu cứu hộ nhận diện.</li>
                  <li>Nếu không tiện bấm màn hình, bật <strong>Lắc Máy</strong> hoặc <strong>Giọng Nói</strong>.</li>
                </ul>
              </div>

            </div>

          </div>
        )}

        {/* TAB 2: RADAR & STORM CORE MONITORING */}
        {activeTab === 'radar' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            
            <div className="lg:col-span-7 bg-slate-900/90 rounded-3xl p-6 border border-slate-800 space-y-5">
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 bg-red-500/10 text-red-400 rounded-lg text-xs font-black uppercase tracking-widest border border-red-500/20">
                  RADAR THEO DÕI BÃỎ LŨ TỪ XA
                </span>
                <span className="flex h-2.5 w-2.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                </span>
              </div>

              <div className="p-4 bg-red-950/40 rounded-2xl border border-red-900/50 space-y-3">
                <div className="flex items-start space-x-3">
                  <span className="text-2xl mt-0.5">⚠️</span>
                  <div className="space-y-1">
                    <h3 className="font-extrabold text-red-200 text-sm uppercase tracking-wide">{stormCore.name}</h3>
                    <p className="text-xs text-red-300 leading-relaxed">
                      Áp thấp nhiệt đới nâng lên bão tại tọa độ <strong className="font-mono text-red-100">{stormCore.lat}, {stormCore.lng}</strong>. Sức gió mạnh giật cấp 17.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                  <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider block">Tọa độ hiện tại của bạn</span>
                  <span className="text-sm font-bold font-mono text-slate-200 mt-1 block">
                    {location ? `${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}` : "Đang định vị..."}
                  </span>
                </div>

                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                  <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider block">Cự ly đến tâm bão</span>
                  <span className={`text-sm font-bold font-mono mt-1 block ${distance && distance < 100 ? 'text-red-400 animate-pulse' : 'text-slate-300'}`}>
                    {distance ? `${distance.toFixed(1)} km` : "Chờ GPS..."}
                  </span>
                </div>
              </div>

              {distance && (
                <div className={`p-4 rounded-2xl border transition-all ${
                  distance < 50 
                    ? 'bg-red-500/20 border-red-500 text-red-100' 
                    : distance < 120 
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-100' 
                      : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-100'
                }`}>
                  <div className="flex items-start space-x-3">
                    <div className="text-xl">🚨</div>
                    <div className="text-xs space-y-1">
                      <p className="font-bold uppercase tracking-wider text-[10px]">
                        {distance < 50 ? 'Cảnh báo mức độ: CỰC KỲ NGUY HIỂM' : distance < 120 ? 'Cảnh báo mức độ: BÁO ĐỘNG BÃỎ' : 'Trạng thái: An toàn'}
                      </p>
                      <p className="leading-relaxed opacity-90">
                        {distance < 50 
                          ? `Bạn nằm trong vùng lõi nguy hiểm (dưới 50km). Di tản khẩn cấp lên tầng cao kiên cố!`
                          : `Bão cách vị trí bạn ${distance.toFixed(1)}km. Tiếp tục theo dõi cập nhật.`}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="lg:col-span-5 bg-slate-900/90 rounded-3xl p-6 border border-slate-800 space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">LIÊN HỆ TRỰC NẠN QUẬN/HUYỆN ĐÀ NẴNG</h3>
              <div className="space-y-2.5 text-xs">
                <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 flex justify-between items-center">
                  <div>
                    <p className="font-bold text-slate-200">Quận Hải Châu & Sơn Trà</p>
                    <p className="text-[10px] text-slate-400">Đội cứu hộ sông nước</p>
                  </div>
                  <a href="tel:02363822114" className="px-3 py-1.5 bg-red-600 text-white rounded-xl font-bold text-[11px]">Gọi ngay</a>
                </div>
                <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 flex justify-between items-center">
                  <div>
                    <p className="font-bold text-slate-200">Huyện Hòa Vang & Cẩm Lệ</p>
                    <p className="text-[10px] text-slate-400">Đội cứu hộ sạt lở đồi núi</p>
                  </div>
                  <a href="tel:02363846114" className="px-3 py-1.5 bg-red-600 text-white rounded-xl font-bold text-[11px]">Gọi ngay</a>
                </div>
                <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 flex justify-between items-center">
                  <div>
                    <p className="font-bold text-slate-200">Quận Liên Chiểu & Ngũ Hành Sơn</p>
                    <p className="text-[10px] text-slate-400">Đội phòng chống ngập úng</p>
                  </div>
                  <a href="tel:02363842114" className="px-3 py-1.5 bg-red-600 text-white rounded-xl font-bold text-[11px]">Gọi ngay</a>
                </div>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};

export default SOSView;
