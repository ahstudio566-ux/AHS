import React, { useEffect, useState } from 'react';
import { TrophyIcon } from './icons/TrophyIcon';

interface Contributor {
  id: string;
  name: string;
  points: number;
  avatar: string;
  rank: string;
}

const ContributorLeaderboard: React.FC = () => {
  const [contributors, setContributors] = useState<Contributor[]>([]);

  useEffect(() => {
    const fetchLeaderboard = () => {
      try {
        const stored = localStorage.getItem('contributorLeaderboard');
        if (stored) {
          setContributors(JSON.parse(stored));
        } else {
          // Initial mock data as requested to be fetched from local storage
          const initial: Contributor[] = [
            { id: '1', name: 'Nguyễn Văn A', points: 1250, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=A', rank: 'Chiến binh Xanh' },
            { id: '2', name: 'Trần Thị B', points: 980, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=B', rank: 'Người bảo vệ' },
            { id: '3', name: 'Lê Văn C', points: 750, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=C', rank: 'Người bảo vệ' },
            { id: '4', name: 'Phạm Thị D', points: 520, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=D', rank: 'Tình nguyện viên' },
            { id: '5', name: 'Hoàng Văn E', points: 300, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=E', rank: 'Thành viên mới' },
          ];
          localStorage.setItem('contributorLeaderboard', JSON.stringify(initial));
          setContributors(initial);
        }
      } catch (error) {
        console.error("Error fetching leaderboard from localStorage:", error);
      }
    };

    fetchLeaderboard();
  }, []);

  // Sort and take top 5
  const topContributors = [...contributors].sort((a, b) => b.points - a.points).slice(0, 5);

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-8">
        <h3 className="font-black text-slate-900 flex items-center text-xs uppercase tracking-widest">
          <TrophyIcon className="w-5 h-5 text-yellow-500 mr-3" />
          Bảng Xếp Hạng Đóng Góp
        </h3>
        <span className="text-[10px] font-black text-brand-600 bg-brand-50 px-3 py-1 rounded-full border border-brand-100">TẤT CẢ</span>
      </div>
      <div className="space-y-4">
        {topContributors.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs font-black uppercase tracking-wider animate-pulse">
            Đang tải dữ liệu...
          </div>
        ) : (
          topContributors.map((user, index) => (
            <div key={user.id} className="flex items-center justify-between p-3.5 hover:bg-slate-50/50 rounded-2xl transition-all group border border-transparent hover:border-slate-100">
              <div className="flex items-center space-x-4">
                <div className={`w-7 h-7 flex items-center justify-center rounded-xl font-black text-xs ${index === 0 ? 'bg-yellow-400 text-white shadow-lg shadow-yellow-100' : index === 1 ? 'bg-slate-300 text-white shadow-lg shadow-slate-100' : index === 2 ? 'bg-orange-400 text-white shadow-lg shadow-orange-100' : 'bg-slate-100 text-slate-400'}`}>
                  {index + 1}
                </div>
                <div className="relative">
                  <img src={user.avatar} alt={user.name} className="w-11 h-11 rounded-2xl border-2 border-white shadow-sm group-hover:scale-110 transition-transform object-cover" />
                  {index < 3 && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center shadow-sm">
                      <span className="text-[8px]">👑</span>
                    </div>
                  )}
                </div>
                <div>
                  <p className="font-black text-slate-900 text-xs">{user.name}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{user.rank}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-black text-brand-600 text-sm tabular-nums">{user.points}</p>
                <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">điểm</p>
              </div>
            </div>
          ))
        )}
      </div>
      <button className="w-full mt-8 py-3 text-[10px] font-black text-brand-600 bg-brand-50/50 hover:bg-brand-50 rounded-2xl transition-all uppercase tracking-widest border border-brand-100/50">
        Xem tất cả cộng đồng
      </button>
    </div>
  );
};

export default ContributorLeaderboard;
