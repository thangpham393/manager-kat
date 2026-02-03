
import React from 'react';
import { ViewType } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  currentView: ViewType;
  setView: (view: ViewType) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, currentView, setView }) => {
  const navItems = [
    { id: 'dashboard', label: 'Tổng quan', icon: '📊' },
    { id: 'schedule', label: 'Thời khóa biểu', icon: '📅' },
    { id: 'classes', label: 'Lớp học', icon: '🏫' },
    { id: 'students', label: 'Học viên', icon: '🎓' },
    { id: 'teachers', label: 'Giáo viên', icon: '👨‍🏫' },
    { id: 'assistants', label: 'Trợ giảng', icon: '🤝' },
    { id: 'finance', label: 'Tài chính', icon: '💰' },
    { id: 'ai-insights', label: 'AI Phân tích', icon: '🤖' },
  ];

  const handleExportData = () => {
    const data = localStorage.getItem('KAT_EDU_ALL_DATA');
    if (!data) return;
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `KAT_EDU_BACKUP_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col fixed h-full shadow-xl z-50">
        <div className="p-6 text-xl font-bold border-b border-slate-700 flex items-center gap-2">
          <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center text-xl shadow-lg shadow-red-900/50">🏮</div>
          <div className="flex flex-col">
            <span className="text-sm font-black leading-none tracking-tight">KAT</span>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">EDUCATION</span>
          </div>
        </div>
        <nav className="flex-1 mt-6 px-4 overflow-y-auto no-scrollbar">
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => setView(item.id as ViewType)}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-300 ${
                    currentView === item.id
                      ? 'bg-red-600 text-white shadow-xl shadow-red-900/40'
                      : 'hover:bg-white/5 text-slate-400 hover:text-white'
                  }`}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span className="text-xs font-black uppercase tracking-widest">{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>
        <div className="p-6 border-t border-slate-700 space-y-4">
          <button 
            onClick={handleExportData}
            className="w-full py-2 bg-white/5 hover:bg-white/10 rounded-lg text-[9px] font-black uppercase tracking-widest text-slate-400 transition-all"
          >
            📥 Xuất File dự phòng (.json)
          </button>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Dữ liệu an toàn</p>
          </div>
          <p className="text-[8px] text-slate-600 font-bold uppercase tracking-tighter">Powered by Supabase Cloud ☁️</p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 p-8">
        <header className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight">
              {navItems.find(n => n.id === currentView)?.label}
            </h1>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">Hệ thống quản lý KAT EDUCATION</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="bg-white px-6 py-3 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-3">
              <div className="text-right">
                <p className="text-[9px] font-black text-slate-400 uppercase leading-none">Admin</p>
                <p className="text-[11px] font-black text-slate-900 uppercase tracking-widest">Quản trị viên</p>
              </div>
              <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-lg">🛡️</div>
            </div>
          </div>
        </header>
        <div className="pb-20">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
