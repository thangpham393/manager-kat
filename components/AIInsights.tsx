
import React, { useState, useEffect } from 'react';
import { getAIInsights } from '../services/geminiService';

const AIInsights: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [insight, setInsight] = useState<string | null>(null);

  const mockDataForAI = {
    monthlyRevenue: 61000000,
    monthlyExpense: 38000000,
    studentCount: 124,
    activeClasses: 12,
    topCourse: 'Hán Ngữ Sơ Cấp 1',
    teacherCosts: 25000000,
    marketingCosts: 5000000,
    otherCosts: 8000000
  };

  const generateReport = async () => {
    setLoading(true);
    const result = await getAIInsights(mockDataForAI);
    setInsight(result ?? null);
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-red-600 to-red-800 p-8 rounded-3xl text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <h3 className="text-2xl font-bold mb-2">Trợ lý Phân tích Thông minh</h3>
          <p className="text-red-100 mb-6">Sử dụng sức mạnh của AI để phân tích dữ liệu kinh doanh của trung tâm và đưa ra các đề xuất tăng trưởng tối ưu.</p>
          <button 
            onClick={generateReport}
            disabled={loading}
            className="bg-white text-red-700 px-6 py-3 rounded-xl font-bold hover:shadow-lg transition-all disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Đang phân tích...
              </span>
            ) : 'Bắt đầu Phân tích ngay'}
          </button>
        </div>
        <div className="absolute top-0 right-0 p-8 text-9xl opacity-10 select-none">🤖</div>
      </div>

      {insight && (
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="prose prose-slate max-w-none">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-2xl">📝</span>
              <h4 className="text-xl font-bold text-slate-800 m-0">Báo cáo Chiến lược AI</h4>
            </div>
            <div className="whitespace-pre-line text-slate-600 leading-relaxed">
              {insight}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIInsights;
