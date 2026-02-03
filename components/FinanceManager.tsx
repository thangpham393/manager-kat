
import React, { useState } from 'react';
import { formatCurrency } from '../utils/financeUtils';
import { Transaction, Teacher, Class, Enrollment } from '../types';

interface FinanceManagerProps {
  enrollments: Enrollment[];
  teachers: Teacher[];
  classes: Class[];
  transactions: Transaction[];
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
}

const FinanceManager: React.FC<FinanceManagerProps> = ({ enrollments, teachers, classes, transactions, setTransactions }) => {
  const [activeTab, setActiveTab] = useState<'all' | 'income' | 'expense'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState<Omit<Transaction, 'id'>>({
    type: 'expense',
    category: 'Mặt bằng',
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    description: ''
  });

  const categories = {
    income: ['Học phí', 'Bán giáo trình', 'Tổ chức sự kiện', 'Khác'],
    expense: ['Lương giáo viên', 'Mặt bằng', 'Điện nước', 'Marketing', 'Cơ sở vật chất', 'Khác']
  };

  const filtered = transactions.filter(t => activeTab === 'all' || t.type === activeTab);
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((acc, curr) => acc + curr.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((acc, curr) => acc + curr.amount, 0);

  const handleAddTransaction = () => {
    if (formData.amount <= 0) {
      alert("Vui lòng nhập số tiền hợp lệ");
      return;
    }
    const newTx: Transaction = {
      id: `TX-${Date.now()}`,
      ...formData
    };
    setTransactions(prev => [newTx, ...prev]);
    setIsModalOpen(false);
    // Reset form
    setFormData({
      type: 'expense',
      category: 'Mặt bằng',
      amount: 0,
      date: new Date().toISOString().split('T')[0],
      description: ''
    });
  };

  return (
    <div className="space-y-6">
      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-green-100 group hover:shadow-lg transition-all">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Tổng Thu</p>
          <p className="text-3xl font-black text-green-600">{formatCurrency(totalIncome)}</p>
          <div className="mt-2 h-1 w-full bg-green-50 rounded-full overflow-hidden">
            <div className="h-full bg-green-500 w-full"></div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-red-100 group hover:shadow-lg transition-all">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Tổng Chi (Chi phí)</p>
          <p className="text-3xl font-black text-red-600">{formatCurrency(totalExpense)}</p>
          <div className="mt-2 h-1 w-full bg-red-50 rounded-full overflow-hidden">
            <div className="h-full bg-red-500 w-full"></div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-blue-100 group hover:shadow-lg transition-all">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Lợi nhuận thực tế</p>
          <p className="text-3xl font-black text-blue-600">{formatCurrency(totalIncome - totalExpense)}</p>
          <div className="mt-2 h-1 w-full bg-blue-50 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500" style={{ width: `${Math.max(0, Math.min(100, ((totalIncome - totalExpense) / totalIncome) * 100))}%` }}></div>
          </div>
        </div>
      </div>

      {/* Main Table Section */}
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-8 border-b flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex bg-slate-100 p-1.5 rounded-2xl w-full md:w-auto">
            {(['all', 'income', 'expense'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 md:flex-none px-8 py-3 rounded-xl text-xs font-black uppercase tracking-tight transition-all ${
                  activeTab === tab ? 'bg-white shadow-md text-slate-900' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {tab === 'all' ? 'Tất cả' : tab === 'income' ? 'Khoản thu' : 'Khoản chi'}
              </button>
            ))}
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="w-full md:w-auto bg-slate-900 text-white px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 active:scale-95"
          >
            ＋ Nhập giao dịch mới
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <tr>
                <th className="px-10 py-6">Ngày</th>
                <th className="px-10 py-6">Hạng mục</th>
                <th className="px-10 py-6">Nội dung chi tiết</th>
                <th className="px-10 py-6 text-right">Số tiền</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.sort((a,b) => b.date.localeCompare(a.date)).map(t => (
                <tr key={t.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-10 py-6">
                    <p className="text-xs font-bold text-slate-400">{t.date}</p>
                  </td>
                  <td className="px-10 py-6">
                    <span className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-tighter border ${
                      t.type === 'income' 
                        ? 'bg-green-50 border-green-100 text-green-700' 
                        : 'bg-red-50 border-red-100 text-red-700'
                    }`}>
                      {t.category}
                    </span>
                  </td>
                  <td className="px-10 py-6">
                    <p className="text-sm font-medium text-slate-600 max-w-md group-hover:text-slate-900 transition-colors">{t.description}</p>
                  </td>
                  <td className={`px-10 py-6 text-right font-black text-base ${
                    t.type === 'income' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-10 py-32 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <span className="text-5xl opacity-20">💸</span>
                      <p className="text-slate-300 italic font-medium">Chưa có giao dịch nào được ghi nhận</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Transaction Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-[60] p-4">
          <div className="bg-white w-full max-w-lg rounded-[3rem] overflow-hidden shadow-2xl animate-in zoom-in duration-200">
            <div className={`p-8 ${formData.type === 'income' ? 'bg-green-600' : 'bg-red-600'} text-white flex justify-between items-center`}>
              <div>
                <h3 className="text-2xl font-black uppercase tracking-tight">Ghi nhận giao dịch</h3>
                <p className="text-white/70 text-xs font-bold mt-1 uppercase tracking-widest">Tài chính trung tâm</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-white/60 hover:text-white text-2xl transition-colors">✕</button>
            </div>
            
            <div className="p-10 space-y-8">
              {/* Type Switcher */}
              <div className="flex bg-slate-100 p-1.5 rounded-2xl">
                <button 
                  onClick={() => setFormData({...formData, type: 'income', category: categories.income[0]})}
                  className={`flex-1 py-4 rounded-xl text-xs font-black uppercase transition-all ${formData.type === 'income' ? 'bg-white text-green-600 shadow-md' : 'text-slate-400'}`}
                >
                  📥 Khoản thu
                </button>
                <button 
                  onClick={() => setFormData({...formData, type: 'expense', category: categories.expense[0]})}
                  className={`flex-1 py-4 rounded-xl text-xs font-black uppercase transition-all ${formData.type === 'expense' ? 'bg-white text-red-600 shadow-md' : 'text-slate-400'}`}
                >
                  📤 Khoản chi
                </button>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Hạng mục</label>
                    <select 
                      className="w-full p-4 bg-slate-50 border-2 border-slate-50 focus:border-slate-200 rounded-2xl font-bold text-slate-800 outline-none transition-all"
                      value={formData.category}
                      onChange={(e) => setFormData({...formData, category: e.target.value})}
                    >
                      {(formData.type === 'income' ? categories.income : categories.expense).map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Ngày thực hiện</label>
                    <input 
                      type="date"
                      className="w-full p-4 bg-slate-50 border-2 border-slate-50 focus:border-slate-200 rounded-2xl font-bold text-slate-800 outline-none transition-all"
                      value={formData.date}
                      onChange={(e) => setFormData({...formData, date: e.target.value})}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Số tiền giao dịch (VNĐ)</label>
                  <input 
                    type="number"
                    placeholder="0"
                    className="w-full p-6 bg-slate-100 border-2 border-slate-100 focus:border-slate-900 rounded-2xl outline-none text-3xl font-black transition-all"
                    value={formData.amount === 0 ? '' : formData.amount}
                    onChange={(e) => setFormData({...formData, amount: parseInt(e.target.value) || 0})}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Mô tả chi tiết</label>
                  <textarea 
                    placeholder="Ví dụ: Tiền điện tháng 03/2024..."
                    className="w-full p-5 bg-slate-50 border-2 border-slate-50 focus:border-slate-200 rounded-2xl font-bold text-slate-800 outline-none transition-all resize-none h-24"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                  ></textarea>
                </div>
              </div>

              <div className="pt-4 flex gap-4">
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-5 font-black text-slate-400 uppercase tracking-widest hover:bg-slate-50 rounded-2xl transition-colors"
                >
                  Hủy bỏ
                </button>
                <button 
                  onClick={handleAddTransaction}
                  className={`flex-[2] py-5 font-black text-white uppercase tracking-widest rounded-2xl shadow-xl transition-all active:scale-95 ${
                    formData.type === 'income' ? 'bg-green-600 shadow-green-100' : 'bg-red-600 shadow-red-100'
                  }`}
                >
                  Lưu giao dịch
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinanceManager;
