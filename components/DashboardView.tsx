/// <reference types="vite/client" />
import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { EnvironmentalReport, EnvironmentalNotification } from '../types';
import BulkImportModal from './BulkImportModal';
import ContributorLeaderboard from './ContributorLeaderboard';
import { ExportPdfModal } from './ExportPdfModal';
import { BellIcon } from './icons/BellIcon';
import { TrophyIcon } from './icons/TrophyIcon';
import { UsersIcon } from './icons/UsersIcon';
import { FileUpIcon } from './icons/FileUpIcon';
import { ShoppingCartIcon } from './icons/ShoppingCartIcon';
import { XCircleIcon as AlertCircleIcon } from './icons/XCircleIcon';
import { safeFormatDistanceToNow, safeLocaleDateString, safeLocaleTimeString, safeLocaleString, parseSafeDate } from '../utils/dateUtils';

interface DashboardStats {
  total: number;
  byPriority: { priority: string; count: number }[];
  byStatus: { status: string; count: number }[];
  byArea: { area: string; count: number }[];
  recentActivity: any[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

interface DashboardViewProps {
  user?: any;
  reports: EnvironmentalReport[];
  notifications?: EnvironmentalNotification[];
  onMarkNotificationAsRead?: (id: number) => void;
  onSelectReport?: (reportId: string) => void;
  onLinkNFCTag?: () => void;
  isNFCLinking?: boolean;
  activeUsersCount?: number;
}

const DashboardView: React.FC<DashboardViewProps> = ({ 
  user, 
  reports, 
  notifications = [], 
  onMarkNotificationAsRead,
  onSelectReport,
  onLinkNFCTag,
  isNFCLinking,
  activeUsersCount = 1
}) => {
  const [realUsers, setRealUsers] = useState<any[]>([]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch('/api/users');
        if (res.ok) {
          const data = await res.json();
          setRealUsers(data);
        }
      } catch (err) {
        console.error('Failed to fetch real users:', err);
      }
    };
    fetchUsers();
  }, []);

  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isExportPdfModalOpen, setIsExportPdfModalOpen] = useState(false);
  const [healthStatus, setHealthStatus] = useState<any>(null);
  const [pendingUnits, setPendingUnits] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'units' | 'myReports' | 'looker' | 'emails'>(
    user && (user.role === 'admin' || user.role === 'environment_department') ? 'overview' : 'myReports'
  );

  const fetchPendingUnits = async () => {
    try {
      const res = await fetch('/api/admin/pending-units');
      if (res.ok) {
        const data = await res.json();
        setPendingUnits(data);
      }
    } catch (err) {
      console.error('Failed to fetch pending units:', err);
    }
  };

  useEffect(() => {
    if (user && (user.role === 'admin' || user.role === 'environment_department')) {
      fetchPendingUnits();
    }
  }, [user, activeTab]);

  const handleApproveUnit = async (unitId: number) => {
    try {
      const res = await fetch(`/api/admin/units/${unitId}/approve`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        alert(data.message || 'Đã phê duyệt đơn vị!');
        fetchPendingUnits();
        // refresh real users list
        const usersRes = await fetch('/api/users');
        if (usersRes.ok) setRealUsers(await usersRes.json());
      }
    } catch (err) {
      alert('Lỗi khi phê duyệt đơn vị');
    }
  };

  const handleRejectUnit = async (unitId: number) => {
    if (!confirm('Bạn có chắc chắn muốn từ chối đăng ký đơn vị này không?')) return;
    try {
      const res = await fetch(`/api/admin/units/${unitId}/reject`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        alert(data.message || 'Đã từ chối đơn vị.');
        fetchPendingUnits();
      }
    } catch (err) {
      alert('Lỗi khi từ chối đơn vị');
    }
  };

  const [simulatedEmails, setSimulatedEmails] = useState<any[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<any>(null);

  useEffect(() => {
    if (activeTab === 'emails') {
      const fetchEmails = async () => {
        try {
          const res = await fetch('/api/public/emails');
          if (res.ok) {
            const data = await res.json();
            setSimulatedEmails(data);
            if (data.length > 0 && !selectedEmail) {
              setSelectedEmail(data[0]);
            }
          }
        } catch (err) {
          console.error("Failed to fetch simulated public service emails:", err);
        }
      };
      fetchEmails();
      const interval = setInterval(fetchEmails, 5000);
      return () => clearInterval(interval);
    }
  }, [activeTab, selectedEmail]);

  const lookerUrl = import.meta.env.VITE_LOOKER_DASHBOARD_URL;
  const isAdmin = user && (user.role === 'admin' || user.role === 'environment_department');
  const isAuthority = user && (user.role === 'admin' || user.role === 'environment_department' || user.role === 'ward_manager');

  const filteredReports = React.useMemo(() => {
    if (user && !isAdmin) {
      if (user.role === 'ward_manager' && user.ward) {
        return reports.filter((r: any) => r.ward === user.ward);
      }
      if (user.area && user.area !== 'All') {
        return reports.filter((r: any) => r.area === user.area);
      }
    }
    return reports;
  }, [reports, user, isAdmin]);

  const handleExportCSV = React.useCallback(() => {
    if (!filteredReports || filteredReports.length === 0) {
      alert('Không có dữ liệu báo cáo để xuất.');
      return;
    }

    const headers = [
      'Mã báo cáo',
      'Loại sự cố',
      'Mô tả chi tiết',
      'Khu vực/Quận',
      'Phường/Xã',
      'Mức độ ưu tiên',
      'Trạng thái',
      'Vĩ độ (Lat)',
      'Kinh độ (Lng)',
      'Người báo cáo',
      'Thời gian báo cáo'
    ];

    const rows = filteredReports.map((r: any) => [
      `"${(r.id || '').toString().replace(/"/g, '""')}"`,
      `"${(r.aiAnalysis?.issueType || r.issueType || 'Sự cố môi trường').toString().replace(/"/g, '""')}"`,
      `"${(r.description || r.userDescription || '').toString().replace(/"/g, '""')}"`,
      `"${(r.area || '').toString().replace(/"/g, '""')}"`,
      `"${(r.ward || '').toString().replace(/"/g, '""')}"`,
      `"${(r.aiAnalysis?.priority || r.priority || 'Trung bình').toString().replace(/"/g, '""')}"`,
      `"${(r.status || 'Báo cáo mới').toString().replace(/"/g, '""')}"`,
      r.latitude ?? '',
      r.longitude ?? '',
      `"${(r.reporter || '').toString().replace(/"/g, '""')}"`,
      `"${safeLocaleString(r.timestamp).replace(/"/g, '""')}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(row => row.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    const today = new Date().toISOString().slice(0, 10);
    link.setAttribute('download', `bao_cao_moi_truong_da_nang_${today}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [filteredReports]);

  const mountTime = React.useRef(new Date());
  const [forceUpdate, setForceUpdate] = useState(0);

  const newReportsBadgeCount = React.useMemo(() => {
    return reports.filter((r: any) => {
      const reportTime = parseSafeDate(r.timestamp);
      if (!reportTime || reportTime <= mountTime.current) return false;
      
      if (user) {
        if (user.role === 'ward_manager' && user.ward) {
          return r.ward === user.ward;
        }
        if (user.area && user.area !== 'All') {
          return r.area === user.area;
        }
      }
      return true;
    }).length;
  }, [reports, user, forceUpdate]);

  // Real Leaderboard Data calculated dynamically from real accounts
  const leaderboard = React.useMemo(() => {
    if (realUsers.length === 0) return [];

    return realUsers.map(u => {
      const userReportsCount = reports.filter((r: any) => r.reporter === u.username).length;
      const points = userReportsCount * 100 + 50; // 50 sign up points + 100 points per report
      
      let rank = 'Thành viên mới';
      if (points >= 300) rank = 'Chiến binh Xanh';
      else if (points >= 200) rank = 'Người bảo vệ';
      else if (points >= 100) rank = 'Tình nguyện viên';

      return {
        name: u.organizationName || u.username,
        username: u.username,
        points,
        rank,
        avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(u.username)}`
      };
    })
    .sort((a, b) => b.points - a.points);
  }, [realUsers, reports]);

  const myReports = React.useMemo(() => {
    if (!user) return [];
    return reports.filter((r: any) => r.reporter === user.username);
  }, [reports, user]);

  const stats = React.useMemo(() => {
    const daNangDistricts = ['Hải Châu', 'Thanh Khê', 'Sơn Trà', 'Ngũ Hành Sơn', 'Liên Chiểu', 'Cẩm Lệ', 'Hòa Vang', 'Hoàng Sa'];
    
    const regionCounts = filteredReports.reduce((acc: any, curr: any) => {
      const region = daNangDistricts.includes(curr.area) ? 'Đà Nẵng' : 'Quảng Nam';
      acc[region] = (acc[region] || 0) + 1;
      return acc;
    }, {});
    
    const byRegion = Object.keys(regionCounts).map(region => ({ region, count: regionCounts[region] }));

    const total = filteredReports.length;
    
    const statusCounts = filteredReports.reduce((acc: any, curr: any) => {
        acc[curr.status] = (acc[curr.status] || 0) + 1;
        return acc;
    }, {});
    const byStatus = Object.keys(statusCounts).map(status => ({ status, count: statusCounts[status] }));

    const priorityCounts = filteredReports.reduce((acc: any, curr: any) => {
        const priority = curr.aiAnalysis?.priority || curr.priority || 'Trung bình';
        acc[priority] = (acc[priority] || 0) + 1;
        return acc;
    }, {});
    const byPriority = Object.keys(priorityCounts).map(priority => ({ priority, count: priorityCounts[priority] }));

    return {
        total,
        byStatus,
        byPriority,
        byRegion
    };
  }, [filteredReports]);

  useEffect(() => {
    const fetchHealth = async (retries = 3) => {
      try {
        const res = await fetch('/api/health');
        if (res.ok) {
          const data = await res.json();
          setHealthStatus(data);
        } else if (retries > 0) {
          setTimeout(() => fetchHealth(retries - 1), 2000);
        }
      } catch (err) {
        console.error("Health fetch failed:", err);
        if (retries > 0) {
          setTimeout(() => fetchHealth(retries - 1), 2000);
        }
      }
    };

    fetchHealth();
  }, []);

  if (!stats) return <div className="p-8 text-center">Không có dữ liệu.</div>;

  return (
    <div className="p-4 sm:p-6 space-y-6 bg-slate-50 min-h-screen pb-24 md:pb-6">
      {/* Profile Header Card */}
      <div className="glass-card p-6 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-48 h-48 bg-brand-50 rounded-full -mr-24 -mt-24 opacity-60 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-50 rounded-full -ml-16 -mb-16 opacity-60 blur-3xl"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center space-x-5">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white shadow-xl shadow-brand-100 transform hover:rotate-3 transition-transform">
              <span className="text-3xl font-black uppercase">{(user?.organizationName || user?.username || 'U').charAt(0)}</span>
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">{user?.organizationName || user?.username || 'Người dùng'}</h2>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span className="px-3 py-1 bg-brand-50 text-brand-700 text-[10px] font-black rounded-full border border-brand-100 uppercase tracking-wider">
                  {user?.role === 'admin' ? 'Quản trị viên' : user?.role === 'environment_department' ? 'Cán bộ Môi trường' : user?.role === 'ward_manager' ? 'Cán bộ Xã/Phường' : 'Công dân Xanh'}
                </span>
                <span className="px-3 py-1 bg-slate-100 text-slate-600 text-[10px] font-black rounded-full border border-slate-200 uppercase tracking-wider">
                  Khu vực: {user?.area || 'Toàn thành phố'}{user?.ward ? ` - P. ${user.ward}` : ''}
                </span>
                <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-black rounded-full border border-emerald-200 uppercase tracking-wider flex items-center space-x-1.5 shadow-sm">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                  </span>
                  <span>Đang online: {activeUsersCount}</span>
                </span>
                {newReportsBadgeCount > 0 && (
                  <span className="flex items-center space-x-1.5 animate-pulse bg-red-500 text-white px-3 py-1 text-[10px] font-black rounded-full border border-red-400 shadow-md">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white"></span>
                    </span>
                    <span>
                      {newReportsBadgeCount} BÁO CÁO MỚI!
                    </span>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        mountTime.current = new Date();
                        setForceUpdate(prev => prev + 1);
                      }}
                      className="ml-1 bg-red-600 hover:bg-red-700 text-white rounded-full p-0.5 transition-all outline-none"
                      title="Đánh dấu đã xem"
                    >
                      <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </button>
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-brand-500 rounded-2xl flex items-center justify-center text-white font-black text-lg sm:text-xl shadow-lg shadow-brand-200/50 shrink-0">
                {user?.organizationName ? user.organizationName.charAt(0) : 'Đ'}
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-base sm:text-2xl font-black text-slate-900 tracking-tight truncate">
                  {user?.organizationName || user?.username || 'Bảng điều khiển Giám sát'}
                </h2>
                <div className="flex items-center space-x-2 mt-0.5">
                  <span className="inline-flex items-center px-2 sm:px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200/60 shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse"></span>
                    {user?.role === 'admin' ? 'Quản trị hệ thống' : user?.role === 'environment_department' ? 'Sở TN&MT' : user?.role === 'ward_manager' ? `Phường ${user?.ward}` : 'Cán bộ'}
                  </span>
                  <span className="text-[10px] text-slate-500 font-bold truncate">
                    {user?.area || 'Đà Nẵng'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-3 flex-wrap pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
              <div className="text-left sm:text-right">
                <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest">Điểm đóng góp</p>
                <p className="text-xl sm:text-3xl font-black text-brand-600 tabular-nums">1,250</p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {/* NFC Linking Button */}
                <button 
                  onClick={onLinkNFCTag}
                  disabled={isNFCLinking}
                  className={`flex items-center space-x-1.5 px-3 sm:px-4 py-2.5 rounded-2xl font-black text-xs transition-all shadow-sm active:scale-95 min-h-[42px] ${
                    isNFCLinking 
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                      : 'bg-emerald-600 text-white hover:bg-emerald-700'
                  }`}
                  title="Liên kết thẻ NFC SOS"
                >
                  <svg className={`w-4 h-4 ${isNFCLinking ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                  </svg>
                  <span className="text-xs">{isNFCLinking ? 'Đang ghi...' : 'NFC SOS'}</span>
                </button>

                {/* CSV & PDF Export Buttons for Authorities & Admins */}
                {isAuthority && (
                  <>
                    <button 
                      onClick={() => setIsExportPdfModalOpen(true)}
                      className="flex items-center space-x-1.5 px-3 sm:px-4 py-2.5 bg-gradient-to-r from-red-600 to-rose-700 text-white hover:from-red-700 hover:to-rose-800 rounded-2xl font-black text-xs transition-all shadow-md active:scale-95 min-h-[42px]"
                      title="Xuất Báo cáo Tóm tắt PDF cho Cơ quan Chức năng"
                    >
                      <FileUpIcon className="w-4 h-4 text-white" />
                      <span className="text-xs">Xuất báo cáo (PDF)</span>
                    </button>

                    <button 
                      onClick={handleExportCSV}
                      className="flex items-center space-x-1.5 px-3 sm:px-4 py-2.5 bg-brand-600 text-white hover:bg-brand-700 rounded-2xl font-black text-xs transition-all shadow-sm active:scale-95 min-h-[42px]"
                      title="Xuất CSV"
                    >
                      <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span className="text-xs">CSV</span>
                    </button>
                  </>
                )}

                {isAdmin && (
                  <button 
                    onClick={() => setIsImportModalOpen(true)}
                    className="p-2.5 bg-white border border-slate-200 text-slate-600 rounded-2xl hover:bg-slate-50 transition-all shadow-sm min-h-[42px] min-w-[42px] flex items-center justify-center active:scale-95"
                    title="Nhập dữ liệu Excel"
                  >
                    <FileUpIcon className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Navigation Tabs Bar - Touch & Mobile Scroll Optimized */}
          <div className="mt-4 pt-3 border-t border-slate-100">
            <div className="flex bg-slate-100/80 p-1 rounded-2xl overflow-x-auto no-scrollbar gap-1 snap-x max-w-full">
              <button 
                onClick={() => setActiveTab('myReports')}
                className={`px-3.5 sm:px-5 py-2.5 text-xs font-black rounded-xl transition-all whitespace-nowrap snap-start shrink-0 min-h-[40px] flex items-center gap-1.5 ${activeTab === 'myReports' ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
              >
                📝 <span>Báo cáo của tôi</span>
              </button>
              <button 
                onClick={() => setActiveTab('overview')}
                className={`px-3.5 sm:px-5 py-2.5 text-xs font-black rounded-xl transition-all whitespace-nowrap snap-start shrink-0 min-h-[40px] flex items-center gap-1.5 ${activeTab === 'overview' ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
              >
                📊 <span>Tổng quan</span>
              </button>
              {isAdmin && (
                <button 
                  onClick={() => setActiveTab('units')}
                  className={`px-3.5 sm:px-5 py-2.5 text-xs font-black rounded-xl transition-all whitespace-nowrap snap-start shrink-0 min-h-[40px] flex items-center gap-1.5 relative ${activeTab === 'units' ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  🏛️ <span>Duyệt Đơn vị</span>
                  {pendingUnits.filter(u => u.approvalStatus === 'pending').length > 0 && (
                    <span className="ml-1 w-4 h-4 bg-amber-500 text-white text-[9px] font-black rounded-full flex items-center justify-center animate-pulse">
                      {pendingUnits.filter(u => u.approvalStatus === 'pending').length}
                    </span>
                  )}
                </button>
              )}
              {isAdmin && (
                <>
                  <button 
                    onClick={() => setActiveTab('looker')}
                    className={`px-3.5 sm:px-5 py-2.5 text-xs font-black rounded-xl transition-all whitespace-nowrap snap-start shrink-0 min-h-[40px] flex items-center gap-1.5 ${activeTab === 'looker' ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                  >
                    📈 <span>Phân tích</span>
                  </button>
                  <button 
                    onClick={() => setActiveTab('emails')}
                    className={`px-3.5 sm:px-5 py-2.5 text-xs font-black rounded-xl transition-all whitespace-nowrap snap-start shrink-0 min-h-[40px] flex items-center gap-1.5 relative ${activeTab === 'emails' ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                  >
                    📬 <span>Hộp thư công vụ</span>
                    {simulatedEmails.length > 0 && (
                      <span className="ml-1 w-4 h-4 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center animate-pulse">
                        {simulatedEmails.length}
                      </span>
                    )}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Notifications Section for Authorities */}
      {user && user.role !== 'citizen' && notifications.length > 0 && (
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-black text-slate-900 flex items-center text-xs uppercase tracking-widest">
              <BellIcon className="w-5 h-5 text-emerald-500 mr-3" />
              Thông báo khẩn cấp & Sự cố mới
            </h3>
            <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
              {notifications.filter(n => !n.isRead).length} MỚI
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {notifications.slice(0, 6).map((notification) => (
              <div 
                key={notification.id}
                onClick={() => onSelectReport?.(notification.reportId)}
                className={`p-5 rounded-3xl border transition-all cursor-pointer hover:shadow-xl hover:shadow-emerald-50/50 ${
                  !notification.isRead 
                    ? 'bg-emerald-50/30 border-emerald-200' 
                    : 'bg-white border-slate-100'
                }`}
              >
                <div className="flex justify-between items-start mb-3">
                  <span className={`text-[9px] px-2.5 py-1 rounded-lg font-black uppercase tracking-wider shadow-sm ${
                    notification.priority === 'Cao' ? 'bg-red-500 text-white' : 'bg-blue-500 text-white'
                  }`}>
                    {notification.priority || 'MỚI'}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400">
                    {safeFormatDistanceToNow(notification.created_at)}
                  </span>
                </div>
                <p className={`text-xs leading-relaxed line-clamp-2 mb-4 ${!notification.isRead ? 'font-bold text-slate-900' : 'text-slate-600'}`}>
                  {notification.message}
                </p>
                <div className="flex justify-between items-center pt-3 border-t border-slate-100">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">{notification.area}</span>
                  {!notification.isRead && onMarkNotificationAsRead && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        onMarkNotificationAsRead(notification.id);
                      }}
                      className="text-[10px] text-emerald-600 font-black hover:text-emerald-700 transition-colors"
                    >
                      ĐÁNH DẤU ĐÃ ĐỌC
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {(healthStatus?.supabase === 'error' || healthStatus?.supabase === 'backing_off') && isAdmin && (
        <div className="bg-red-50 border border-red-100 p-4 rounded-2xl flex items-start space-x-3 text-red-700">
          <div className="p-2 bg-red-100 rounded-lg">
             <AlertCircleIcon className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-sm">Lỗi kết nối Supabase</h4>
            <p className="text-xs mt-1 opacity-80">{healthStatus.supabaseError}</p>
            {healthStatus.supabaseAdvice && (
              <div className="mt-4 p-4 bg-white rounded-2xl border border-red-100 shadow-sm">
                <p className="text-xs font-black text-red-800 uppercase tracking-widest mb-2 flex items-center">
                  <span className="w-2 h-2 bg-red-500 rounded-full mr-2 animate-pulse"></span>
                  Hướng dẫn khắc phục:
                </p>
                <ul className="text-[11px] space-y-2 text-slate-600 list-disc pl-4">
                  <li>Truy cập <b>Supabase Dashboard</b> &gt; <b>Project Settings</b> &gt; <b>API</b>.</li>
                  <li>Sao chép <b>Project URL</b> (ví dụ: <code className="bg-slate-100 px-1 rounded">https://xyz.supabase.co</code>).</li>
                  <li>Vào menu <b>Settings</b> (biểu tượng bánh răng) của ứng dụng này.</li>
                  <li>Dán URL vào ô <b>VITE_SUPABASE_URL</b> và nhấn <b>Save</b>.</li>
                  <li>Nhấn nút <b>"Thử lại"</b> bên dưới.</li>
                </ul>
                <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400">URL hiện tại: <code className="bg-slate-50 px-1 rounded">{import.meta.env.VITE_SUPABASE_URL?.substring(0, 15)}...</code></span>
                </div>
              </div>
            )}
            <div className="mt-3 flex space-x-2">
              <button 
                onClick={async () => {
                  try {
                    await fetch('/api/supabase/reset-backoff', { method: 'POST' });
                    window.location.reload();
                  } catch (err) {
                    window.location.reload();
                  }
                }}
                className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700 transition-colors"
              >
                Thử lại
              </button>
              <button 
                onClick={() => {
                  const sql = `-- 1. Xóa bảng cũ\nDROP TABLE IF EXISTS orders;\nDROP TABLE IF EXISTS notifications;\nDROP TABLE IF EXISTS reports;\nDROP TABLE IF EXISTS users;\n\n-- 2. Tạo bảng users\nCREATE TABLE users (\n  id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,\n  username TEXT UNIQUE NOT NULL,\n  password TEXT NOT NULL,\n  role TEXT NOT NULL,\n  area TEXT,\n  "organizationName" TEXT,\n  email TEXT,\n  phone TEXT,\n  status TEXT DEFAULT 'active',\n  created_at TIMESTAMPTZ DEFAULT NOW()\n);\n\n-- 3. Tạo bảng reports\nCREATE TABLE reports (\n  id TEXT PRIMARY KEY,\n  "mediaUrl" TEXT,\n  "mediaType" TEXT,\n  latitude DOUBLE PRECISION,\n  longitude DOUBLE PRECISION,\n  "userDescription" TEXT,\n  "issueType" TEXT,\n  description TEXT,\n  priority TEXT,\n  "solution" TEXT,\n  "isIssuePresent" INTEGER,\n  status TEXT,\n  timestamp TEXT,\n  area TEXT,\n  created_at TIMESTAMPTZ DEFAULT NOW()\n);\n\n-- 4. Tạo bảng notifications\nCREATE TABLE notifications (\n  id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,\n  "userId" BIGINT REFERENCES users(id),\n  "reportId" TEXT REFERENCES reports(id),\n  message TEXT,\n  type TEXT,\n  "isRead" INTEGER DEFAULT 0,\n  created_at TIMESTAMPTZ DEFAULT NOW()\n);\n\n-- 5. Tạo bảng orders\nCREATE TABLE orders (\n  id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,\n  "userId" BIGINT REFERENCES users(id),\n  "productName" TEXT NOT NULL,\n  quantity INTEGER NOT NULL,\n  address TEXT NOT NULL,\n  phone TEXT NOT NULL,\n  status TEXT DEFAULT 'pending',\n  created_at TIMESTAMPTZ DEFAULT NOW()\n);\n\n-- 6. Tắt bảo mật (Để demo, hãy bật lại trong sản xuất)\nALTER TABLE users DISABLE ROW LEVEL SECURITY;\nALTER TABLE reports DISABLE ROW LEVEL SECURITY;\nALTER TABLE notifications DISABLE ROW LEVEL SECURITY;\nALTER TABLE orders DISABLE ROW LEVEL SECURITY;`;
                  navigator.clipboard.writeText(sql);
                  console.log('SQL code copied to clipboard');
                }}
                className="text-[10px] bg-red-600 text-white px-3 py-1.5 rounded-lg font-bold hover:bg-red-700 transition-colors shadow-sm"
              >
                Sao chép mã SQL tạo bảng
              </button>
            </div>
          </div>
        </div>
      )}

      <BulkImportModal 
        isOpen={isImportModalOpen} 
        onClose={() => setIsImportModalOpen(false)} 
        onImportSuccess={() => {
          window.location.reload();
        }} 
      />

      {activeTab === 'overview' ? (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            <div className="glass-card p-3.5 sm:p-5 flex flex-col items-center text-center group hover:bg-brand-50/10 transition-colors">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-2 sm:mb-4 group-hover:scale-110 transition-transform shadow-sm">
                <FileUpIcon className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <p className="text-slate-500 text-[9px] sm:text-[10px] font-black uppercase tracking-wider">Tổng báo cáo</p>
              <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-0.5 tabular-nums">{stats.total}</p>
            </div>
            <div className="glass-card p-3.5 sm:p-5 flex flex-col items-center text-center group hover:bg-amber-50/10 transition-colors">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mb-2 sm:mb-4 group-hover:scale-110 transition-transform shadow-sm">
                <div className="w-3 h-3 bg-amber-500 rounded-full animate-pulse"></div>
              </div>
              <p className="text-slate-500 text-[9px] sm:text-[10px] font-black uppercase tracking-wider">Đang xử lý</p>
              <p className="text-2xl sm:text-3xl font-black text-amber-500 mt-0.5 tabular-nums">
                {stats.byStatus.find(s => s.status === 'Đang xử lý')?.count || 0}
              </p>
            </div>
            <div className="glass-card p-3.5 sm:p-5 flex flex-col items-center text-center group hover:bg-red-50/10 transition-colors">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mb-2 sm:mb-4 group-hover:scale-110 transition-transform shadow-sm">
                <AlertCircleIcon className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <p className="text-slate-500 text-[9px] sm:text-[10px] font-black uppercase tracking-wider">Ưu tiên Cao</p>
              <p className="text-2xl sm:text-3xl font-black text-red-500 mt-0.5 tabular-nums">
                {stats.byPriority.find(p => p.priority === 'Cao')?.count || 0}
              </p>
            </div>
            <div className="glass-card p-3.5 sm:p-5 flex flex-col items-center text-center group hover:bg-emerald-50/10 transition-colors">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-2 sm:mb-4 group-hover:scale-110 transition-transform shadow-sm">
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-slate-500 text-[9px] sm:text-[10px] font-black uppercase tracking-wider">Đã hoàn thành</p>
              <p className="text-2xl sm:text-3xl font-black text-emerald-500 mt-0.5 tabular-nums">
                {stats.byStatus.find(s => s.status === 'Đã xử lý')?.count || 0}
              </p>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <div className="glass-card p-4 sm:p-6 h-80 sm:h-96">
              <h3 className="font-black text-slate-900 mb-4 sm:mb-8 flex items-center text-xs uppercase tracking-widest">
                <span className="w-1.5 h-5 bg-brand-500 rounded-full mr-3"></span>
                Phân bố theo Khu vực
              </h3>
              <div className="h-[calc(100%-2.5rem)] sm:h-[calc(100%-3rem)]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={(stats as any).byRegion}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="region" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 9, fontWeight: 700}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 9, fontWeight: 700}} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontSize: '11px', fontWeight: 700 }}
                      cursor={{ fill: '#f8fafc' }}
                    />
                    <Bar dataKey="count" fill="#0d9488" radius={[8, 8, 0, 0]} barSize={28} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="glass-card p-4 sm:p-6 h-80 sm:h-96">
              <h3 className="font-black text-slate-900 mb-4 sm:mb-8 flex items-center text-xs uppercase tracking-widest">
                <span className="w-1.5 h-5 bg-blue-500 rounded-full mr-3"></span>
                Trạng thái Xử lý
              </h3>
              <div className="h-[calc(100%-2.5rem)] sm:h-[calc(100%-3rem)]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.byStatus}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={8}
                      dataKey="count"
                      stroke="none"
                    >
                      {stats.byStatus.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontSize: '11px', fontWeight: 700 }} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 800, paddingTop: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Leaderboard & Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Leaderboard */}
              <div className="lg:col-span-1">
                <ContributorLeaderboard />
              </div>

              {/* Recent Activity */}
              <div className="glass-card p-6 lg:col-span-2">
                   <div className="flex items-center justify-between mb-8">
                       <h3 className="font-black text-slate-900 flex items-center text-xs uppercase tracking-widest">
                          <UsersIcon className="w-5 h-5 text-blue-500 mr-3" />
                          Hoạt động Gần đây
                       </h3>
                       {isAuthority && (
                         <button
                           onClick={handleExportCSV}
                           className="flex items-center space-x-1.5 px-3 py-1.5 bg-brand-50 hover:bg-brand-100 text-brand-700 text-[10px] font-black rounded-xl border border-brand-200 transition-all shadow-sm active:scale-95"
                           title="Xuất file CSV báo cáo sự cố"
                         >
                           <svg className="w-3.5 h-3.5 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                           </svg>
                           <span>Xuất CSV ({filteredReports.length})</span>
                         </button>
                       )}
                   </div>
                   <div className="space-y-3">
                      {filteredReports.slice(0, 4).map((report) => (
                          <div key={report.id} className="flex items-center space-x-5 p-4 rounded-3xl hover:bg-slate-50/50 transition-all border border-transparent hover:border-slate-100 group cursor-pointer">
                              <div className="relative flex-shrink-0">
                                  <img 
                                    src={report.mediaUrl} 
                                    alt="Report" 
                                    className="w-16 h-16 rounded-2xl object-cover border border-slate-100 shadow-sm group-hover:scale-105 transition-transform"
                                    onError={(e) => {(e.target as HTMLImageElement).src = 'https://via.placeholder.com/150?text=No+Image'}}
                                  />
                                  <div className={`absolute -top-2 -right-2 w-6 h-6 rounded-xl border-2 border-white flex items-center justify-center text-[10px] text-white font-black shadow-md ${
                                      report.status === 'Báo cáo mới' ? 'bg-red-500' : 
                                      report.status === 'Đang xử lý' ? 'bg-amber-500' : 'bg-emerald-500'
                                  }`}>
                                      {report.status === 'Báo cáo mới' ? '!' : report.status === 'Đang xử lý' ? '...' : '✓'}
                                  </div>
                              </div>
                              <div className="flex-grow min-w-0">
                                  <div className="flex justify-between items-start mb-1">
                                      <h4 className="font-black text-slate-900 text-xs truncate pr-4 uppercase tracking-tight">{report.aiAnalysis?.issueType || 'Sự cố môi trường'}</h4>
                                      <span className="text-[10px] font-bold text-slate-400 tabular-nums">{safeLocaleDateString(report.timestamp)}</span>
                                  </div>
                                  <p className="text-[11px] text-slate-500 line-clamp-1 leading-relaxed">{report.description || report.userDescription}</p>
                                  <div className="flex items-center mt-3 space-x-3">
                                      <span className="text-[9px] px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg font-black uppercase tracking-wider">
                                          {report.area || 'Chưa xác định'}
                                      </span>
                                      <span className={`text-[9px] px-2.5 py-1 rounded-lg font-black uppercase tracking-wider ${
                                          (report.aiAnalysis?.priority) === 'Cao' ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'
                                      }`}>
                                          {report.aiAnalysis?.priority || 'Trung bình'}
                                      </span>
                                  </div>
                              </div>
                          </div>
                      ))}
                      {filteredReports.length === 0 && (
                          <div className="text-center py-12 text-slate-400 text-sm font-medium">Chưa có hoạt động nào.</div>
                      )}
                   </div>
                   <button className="w-full mt-6 py-3 text-[10px] font-black text-slate-400 hover:text-brand-600 transition-colors uppercase tracking-widest">
                      Xem tất cả báo cáo của tôi
                   </button>
              </div>
          </div>

          {/* Heatmap - Temporarily disabled during Google Maps migration */}
          <div className="glass-card p-6 h-[500px] flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 bg-teal-50 rounded-full flex items-center justify-center mb-6 text-teal-600">
              <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
            </div>
            <h3 className="font-black text-slate-900 mb-2 uppercase tracking-widest text-sm">Bản đồ Rủi ro Môi trường</h3>
            <p className="text-xs text-slate-500 max-w-xs">Bản đồ nhiệt đang được nâng cấp lên hệ thống OpenStreetMap để cung cấp dữ liệu chính xác hơn.</p>
          </div>
        </>
      ) : activeTab === 'myReports' ? (
        <div className="glass-card p-6 min-h-[500px]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <h3 className="font-black text-slate-900 flex items-center text-xs uppercase tracking-widest text-brand-600">
                <span className="w-1.5 h-5 bg-brand-500 rounded-full mr-3 inline-block align-middle"></span>
                Lịch sử Báo cáo Sự cố
              </h3>
              <p className="text-xs text-slate-400 mt-1">Theo dõi trạng thái và lịch sử gửi tin báo sự cố môi trường của bạn</p>
            </div>
            
            <div className="flex gap-4">
              <div className="px-4 py-2 bg-slate-100/50 rounded-2xl border border-slate-200">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Đã gửi</p>
                <p className="text-lg font-black text-slate-900 tabular-nums">{myReports.length}</p>
              </div>
              <div className="px-4 py-2 bg-amber-50/50 rounded-2xl border border-amber-100">
                <p className="text-[9px] font-black text-amber-500 uppercase tracking-wider">Đang xử lý</p>
                <p className="text-lg font-black text-amber-600 tabular-nums">{myReports.filter(r => r.status === 'Đang xử lý').length}</p>
              </div>
              <div className="px-4 py-2 bg-emerald-50/50 rounded-2xl border border-emerald-100">
                <p className="text-[9px] font-black text-emerald-500 uppercase tracking-wider">Xong</p>
                <p className="text-lg font-black text-emerald-600 tabular-nums">{myReports.filter(r => r.status === 'Đã xử lý').length}</p>
              </div>
            </div>
          </div>

          {myReports.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myReports.map((report) => (
                <div 
                  key={report.id} 
                  onClick={() => onSelectReport?.(report.id)}
                  className="p-5 bg-white border border-slate-100 rounded-3xl transition-all hover:shadow-xl hover:shadow-slate-100/30 cursor-pointer flex gap-4 group"
                >
                  <div className="relative flex-shrink-0 w-20 h-20 rounded-2xl overflow-hidden border border-slate-100 shadow-sm bg-slate-50">
                    <img 
                      src={report.mediaUrl} 
                      alt="Sự cố" 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {(e.target as HTMLImageElement).src = 'https://via.placeholder.com/150?text=S%E1%BB%B1+c%E1%BB%91'}}
                    />
                    <div className={`absolute top-1 left-1 w-5 h-5 rounded-lg flex items-center justify-center text-[10px] text-white font-black shadow-md ${
                      report.status === 'Báo cáo mới' ? 'bg-red-500' : 
                      report.status === 'Đang xử lý' ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}>
                      {report.status === 'Báo cáo mới' ? '!' : report.status === 'Đang xử lý' ? '...' : '✓'}
                    </div>
                  </div>

                  <div className="flex-grow min-w-0 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start gap-2 mb-1">
                        <h4 className="font-black text-slate-900 text-xs truncate uppercase tracking-tight">
                          {report.aiAnalysis?.issueType || 'Sự cố môi trường'}
                        </h4>
                        <span className={`text-[9px] px-2 py-0.5 rounded-md font-black uppercase tracking-wider shrink-0 ${
                          report.status === 'Đã xử lý' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                          report.status === 'Đang xử lý' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                          'bg-red-50 text-red-600 border border-red-100'
                        }`}>
                          {report.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                        {report.userDescription || report.description}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-50 mt-1">
                      <span className="text-[9px] font-bold text-slate-400">
                        {safeLocaleDateString(report.timestamp)}
                      </span>
                      <span className="text-[9px] px-2 py-0.5 bg-slate-50 text-slate-500 rounded-md font-bold uppercase tracking-wider">
                        {report.area}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-slate-400">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
              <h4 className="text-base font-bold text-slate-900 mb-1">Chưa có báo cáo nào</h4>
              <p className="text-xs text-slate-400 max-w-xs">Bạn chưa gửi báo cáo sự cố nào dưới tài khoản này.</p>
            </div>
          )}
        </div>
      ) : activeTab === 'units' ? (
        <div className="glass-card p-6 min-h-[500px]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <h3 className="font-black text-slate-900 flex items-center text-xs uppercase tracking-widest text-brand-600">
                <span className="w-1.5 h-5 bg-amber-500 rounded-full mr-3 inline-block align-middle"></span>
                Duyệt & Quản lý Đơn vị Địa phương (Xã/Phường/Quận)
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Phê duyệt đăng ký đơn vị Xã/Phường để phân quyền tiếp nhận và xử lý báo cáo sự cố theo ranh giới tọa độ GPS.
              </p>
            </div>
            
            <button 
              onClick={fetchPendingUnits}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black rounded-xl transition-all uppercase tracking-wider"
            >
              🔄 Tải lại danh sách
            </button>
          </div>

          {/* Pending Approval Section */}
          <div className="mb-10">
            <h4 className="text-xs font-black uppercase tracking-wider text-amber-600 mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
              Đơn vị chờ phê duyệt ({pendingUnits.filter(u => u.approvalStatus === 'pending').length})
            </h4>

            {pendingUnits.filter(u => u.approvalStatus === 'pending').length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pendingUnits.filter(u => u.approvalStatus === 'pending').map((unit) => (
                  <div key={unit.id} className="p-5 bg-amber-50/40 border border-amber-200/60 rounded-3xl space-y-3 relative overflow-hidden">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[9px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 px-2.5 py-1 rounded-full border border-amber-200">
                          {unit.role === 'ward_manager' ? 'Xã / Phường' : unit.role === 'district_manager' ? 'Quận / Huyện' : 'Cơ quan / Trường học'}
                        </span>
                        <h5 className="font-black text-slate-900 text-sm mt-2">{unit.organizationName || `Đơn vị ${unit.ward || unit.area}`}</h5>
                        <p className="text-xs text-slate-500 font-bold mt-0.5">Địa bàn: {unit.area} {unit.ward ? `- Phường ${unit.ward}` : ''}</p>
                      </div>
                      <span className="text-[10px] text-slate-400 font-bold">
                        {unit.created_at ? safeLocaleDateString(unit.created_at) : 'Gần đây'}
                      </span>
                    </div>

                    <div className="pt-2 border-t border-amber-200/40 text-xs text-slate-600 space-y-1">
                      <p><strong>Email/Tài khoản:</strong> {unit.username || unit.email}</p>
                      {unit.phone && <p><strong>Điện thoại:</strong> {unit.phone}</p>}
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                      <button
                        onClick={() => handleApproveUnit(unit.id)}
                        className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-2xl shadow-md transition-all uppercase tracking-wider"
                      >
                        ✓ Phê duyệt Đơn vị
                      </button>
                      <button
                        onClick={() => handleRejectUnit(unit.id)}
                        className="px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 font-black text-xs rounded-2xl border border-red-200 transition-all uppercase tracking-wider"
                      >
                        ✕ Từ chối
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 text-center text-slate-400 text-xs font-bold">
                Không có đơn vị địa phương nào đang chờ duyệt.
              </div>
            )}
          </div>

          {/* Approved Units List */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 mb-4">
              Danh sách Đơn vị Địa phương đã kích hoạt ({realUsers.filter(u => u.role === 'ward_manager' || u.role === 'district_manager').length})
            </h4>
            
            {/* Mobile Card List for small screens */}
            <div className="block sm:hidden space-y-3">
              {realUsers.filter(u => u.role === 'ward_manager' || u.role === 'district_manager').length > 0 ? (
                realUsers.filter(u => u.role === 'ward_manager' || u.role === 'district_manager').map((u) => (
                  <div key={u.id} className="p-4 bg-white border border-slate-100 rounded-2xl shadow-sm space-y-2">
                    <div className="flex justify-between items-start">
                      <h5 className="font-black text-slate-900 text-xs">{u.organizationName || u.username}</h5>
                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 border border-emerald-100 text-[9px] font-black rounded-full uppercase shrink-0">
                        Đã hoạt động
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 font-bold flex justify-between pt-1 border-t border-slate-50">
                      <span>Phường: {u.ward || 'Toàn quận'}</span>
                      <span>Địa bàn: {u.area || 'Đà Nẵng'}</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 font-bold p-4 bg-slate-50 rounded-xl text-center">Chưa có đơn vị địa phương nào kích hoạt.</p>
              )}
            </div>

            {/* Desktop Table View */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <th className="pb-3">Tên Đơn vị</th>
                    <th className="pb-3">Phường / Xã</th>
                    <th className="pb-3">Quận / Huyện</th>
                    <th className="pb-3">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-xs font-bold">
                  {realUsers.filter(u => u.role === 'ward_manager' || u.role === 'district_manager').map((u) => (
                    <tr key={u.id}>
                      <td className="py-3 text-slate-900">{u.organizationName || u.username}</td>
                      <td className="py-3 text-slate-600">{u.ward || 'Toàn quận'}</td>
                      <td className="py-3 text-slate-600">{u.area || 'Đà Nẵng'}</td>
                      <td className="py-3">
                        <span className="px-2.5 py-1 bg-emerald-50 text-emerald-600 border border-emerald-100 text-[9px] font-black rounded-full uppercase">
                          Đã hoạt động
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : activeTab === 'emails' ? (
        <div className="glass-card p-4 sm:p-6 min-h-[550px] flex flex-col lg:flex-row gap-4 sm:gap-6">
          {/* Email sidebar */}
          <div className="w-full lg:w-1/3 flex flex-col border-b lg:border-b-0 lg:border-r border-slate-100 pb-4 lg:pb-0 lg:pr-6 gap-3">
            <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-black text-slate-900 text-xs sm:text-sm uppercase tracking-wider">Hộp Thư Công Vụ</h3>
                <p className="text-[10px] text-slate-500 font-bold truncate">hainguyenbtm.070589@gmail.com</p>
              </div>
              <span className="px-2 py-0.5 bg-red-100 text-red-600 rounded-md font-black text-[9px] animate-pulse">LIVE</span>
            </div>
            
            <div className="flex-grow overflow-y-auto space-y-2.5 max-h-[250px] sm:max-h-[500px]">
              {simulatedEmails.length === 0 ? (
                <div className="text-center py-8 text-slate-400 space-y-2">
                  <div className="w-10 h-10 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto text-lg">📬</div>
                  <p className="text-xs font-bold text-slate-700">Chưa có công văn nào được gửi đi.</p>
                  <p className="text-[10px] leading-relaxed max-w-[200px] mx-auto text-slate-400">Gửi báo cáo sự cố khẩn cấp mới từ màn hình chính để kích hoạt luồng chuyển tiếp tự động!</p>
                </div>
              ) : (
                simulatedEmails.map((email) => (
                  <div
                    key={email.id}
                    onClick={() => setSelectedEmail(email)}
                    className={`p-3.5 rounded-2xl border text-left cursor-pointer transition-all ${
                      selectedEmail?.id === email.id
                        ? 'bg-teal-50/70 border-teal-300 shadow-sm'
                        : 'bg-white border-slate-100 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1.5">
                      <span className={`text-[9px] px-2 py-0.5 rounded-md font-black uppercase tracking-wide ${
                        email.isEmergency ? 'bg-red-500 text-white' : 'bg-teal-600 text-white'
                      }`}>
                        {email.isEmergency ? 'KHẨN CẤP' : 'MÔI TRƯỜNG'}
                      </span>
                      <span className="text-[9px] font-bold text-slate-400">
                        {safeLocaleTimeString(email.timestamp)}
                      </span>
                    </div>
                    <h4 className="font-bold text-slate-900 text-xs line-clamp-2 leading-snug mb-1">
                      {email.subject}
                    </h4>
                    <p className="text-[9px] text-slate-400 font-bold truncate uppercase tracking-tight">
                      Mã báo cáo: #{email.reportId ? email.reportId.slice(0, 8) : ''}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Email Preview area */}
          <div className="flex-grow bg-slate-50/70 rounded-3xl p-3 sm:p-4 border border-slate-100 flex flex-col min-h-[400px]">
            {selectedEmail ? (
              <div className="flex-grow flex flex-col h-full">
                <div className="bg-white p-3.5 rounded-2xl border border-slate-100 mb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
                  <div>
                    <h4 className="font-black text-slate-900 text-xs sm:text-sm">{selectedEmail.subject}</h4>
                    <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                      Đến: <strong className="text-slate-700">hainguyenbtm.070589@gmail.com</strong>
                      <span className="mx-1.5 text-slate-300">|</span>
                      {safeLocaleString(selectedEmail.timestamp)}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      const newTab = window.open();
                      if (newTab) {
                        newTab.document.write(selectedEmail.html);
                        newTab.document.close();
                      }
                    }}
                    className="shrink-0 px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white font-black text-[10px] uppercase tracking-wider rounded-xl transition-all shadow-sm flex items-center justify-center gap-1 min-h-[38px]"
                  >
                    Mở tab mới ↗
                  </button>
                </div>

                <div className="flex-grow bg-white rounded-2xl overflow-hidden border border-slate-100 min-h-[350px]">
                  <iframe
                    srcDoc={selectedEmail.html}
                    title="Email Preview"
                    className="w-full h-full min-h-[350px] border-0"
                  />
                </div>
              </div>
            ) : (
              <div className="flex-grow flex flex-col items-center justify-center text-center text-slate-400 py-8">
                <div className="text-3xl mb-2">📬</div>
                <h4 className="font-black text-slate-700 text-xs sm:text-sm uppercase tracking-wide">Trình Xem Công Văn Điện Tử</h4>
                <p className="text-xs text-slate-500 max-w-sm mt-1">Chọn một văn bản/email báo cáo từ danh sách để xem giao diện chuyển tiếp và nút xử lý nhanh.</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 h-[700px] flex flex-col overflow-hidden">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-slate-800 flex items-center text-sm uppercase tracking-wider">
              <svg className="w-5 h-5 text-teal-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Phân tích Looker
            </h3>
            <a 
              href={lookerUrl} 
              target="_blank" 
              rel="noreferrer"
              className="text-xs text-teal-600 font-bold hover:underline flex items-center"
            >
              Mở trong tab mới
              <svg className="w-3 h-3 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
          
          {lookerUrl ? (
            <iframe
              src={lookerUrl}
              className="w-full flex-grow border-0 rounded-2xl"
              title="Looker Dashboard"
              allowFullScreen
            />
          ) : (
            <div className="flex-grow flex flex-col items-center justify-center bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 p-12 text-center">
              <div className="bg-teal-100 p-4 rounded-full mb-4">
                <svg className="w-12 h-12 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              </div>
              <h4 className="text-xl font-bold text-slate-800 mb-2">Chưa cấu hình Looker</h4>
              <p className="text-slate-500 max-w-md mb-6">
                Bạn cần cung cấp URL Dashboard Looker Studio hoặc Looker Embed trong biến môi trường <code>VITE_LOOKER_DASHBOARD_URL</code>.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Export PDF Modal */}
      <ExportPdfModal 
        isOpen={isExportPdfModalOpen}
        onClose={() => setIsExportPdfModalOpen(false)}
        reports={reports}
        currentUser={user}
      />
    </div>
  );
};

export default DashboardView;
