
import React, { useState, useMemo } from 'react';
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
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [deletingTransactionId, setDeletingTransactionId] = useState<string | null>(null);
  
  // Filter states
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

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
    expense: ['Lương giáo viên', 'Mặt bằng', 'Điện nước', 'Marketing', 'Cơ sở vật chất', 'Trà sữa', 'Đồ ăn', 'Khác']
  };

  // Logic lọc dữ liệu tổng hợp
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const matchTab = activeTab === 'all' || t.type === activeTab;
      const matchCategory = filterCategory === 'all' || t.category === filterCategory;
      const matchSearch = t.description.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          t.category.toLowerCase().includes(searchQuery.toLowerCase());
      const matchStartDate = !startDate || t.date >= startDate;
      const matchEndDate = !endDate || t.date <= endDate;

      return matchTab && matchCategory && matchSearch && matchStartDate && matchEndDate;
    }).sort((a, b) => b.date.localeCompare(a.date));
  }, [transactions, activeTab, filterCategory, searchQuery, startDate, endDate]);

  const totalIncome = transactions.filter(t => t.type === 'income').reduce((acc, curr) => acc + curr.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((acc, curr) => acc + curr.amount, 0);

  const handleOpenCreate = () => {
    setEditingTransaction(null);
    setFormData({
      type: 'expense',
      category: 'Mặt bằng',
      amount: 0,
      date: new Date().toISOString().split('T')[0],
      description: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (tx: Transaction) => {
    setEditingTransaction(tx);
    setFormData({
      type: tx.type,
      category: tx.category,
      amount: tx.amount,
      date: tx.date,
      description: tx.description,
      studentId: tx.studentId,
      enrollmentId: tx.enrollmentId
    });
    setIsModalOpen(true);
  };

  const handleSaveTransaction = () => {
    if (formData.amount <= 0) {
      alert("Vui lòng nhập số tiền hợp lệ");
      return;
    }

    if (editingTransaction) {
      setTransactions(prev => prev.map(t => t.id === editingTransaction.id ? { ...t, ...formData } : t));
    } else {
      const newTx: Transaction = {
        id: `TX-${Date.now()}`,
        ...formData
      };
      setTransactions(prev => [newTx, ...prev]);
    }
    setIsModalOpen(false);
  };

  const confirmDelete = (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
    setDeletingTransactionId(null);
  };

  const resetFilters = () => {
    setFilterCategory('all');
    setStartDate('');
    setEndDate('');
    setSearchQuery('');
  };

  return (
    <div className="space-y-6">
      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-green-100 group hover:shadow-lg transition-all">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Tổng Thu (Tích lũy)</p>
          <p className="text-3xl font-black text-green-600">{formatCurrency(totalIncome)}</p>
          <div className="mt-2 h-1 w-full bg-green-50 rounded-full overflow-hidden">
            <div className="h-full bg-green-500 w-full"></div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-red-100 group hover:shadow-lg transition-all">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Tổng Chi (Tích lũy)</p>
          <p className="text-3xl font-black text-red-600">{formatCurrency(totalExpense)}</p>
          <div className="mt-2 h-1 w-full bg-red-50 rounded-full overflow-hidden">
            <div className="h-full bg-red-500 w-full"></div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-blue-100 group hover:shadow-lg transition-all">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Lợi nhuận thực tế</p>
          <p className="text-3xl font-black text-blue-600">{formatCurrency(totalIncome - totalExpense)}</p>
          <div className="mt-2 h-1 w-full bg-blue-50 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500" style={{ width: `${totalIncome > 0 ? Math.max(0, Math.min(100, ((totalIncome - totalExpense) / totalIncome) * 100)) : 0}%` }}></div>
          </div>
        </div>
      </div>

      {/* Advanced Filters Bar */}
      <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex bg-slate-100 p-1.5 rounded-2xl w-full md:w-auto overflow-x-auto no-scrollbar">
            {(['all', 'income', 'expense'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => { setActiveTab(tab); setFilterCategory('all'); }}
                className={`flex-1 md:flex-none px-8 py-3 rounded-xl text-xs font-black uppercase tracking-tight transition-all whitespace-nowrap ${
                  activeTab === tab ? 'bg-white shadow-md text-slate-900' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {tab === 'all' ? 'Tất cả' : tab === 'income' ? 'Khoản thu' : 'Khoản chi'}
              </button>
            ))}
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <button 
              onClick={resetFilters}
              className="px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:bg-slate-50 transition-all"
            >
              Đặt lại lọc
            </button>
            <button 
              onClick={handleOpenCreate}
              className="flex-1 md:flex-none bg-slate-900 text-white px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 active:scale-95 whitespace-nowrap"
            >
              ＋ Nhập giao dịch
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t border-slate-50">
          <div className="relative">
            <label className="block text-[9px] font-black text-slate-400 uppercase mb-2 ml-1">Tìm nội dung</label>
            <input 
              type="text" 
              placeholder="Gõ từ khóa..."
              className="w-full pl-4 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-slate-900 transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-[9px] font-black text-slate-400 uppercase mb-2 ml-1">Hạng mục</label>
            <select 
              className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none cursor-pointer"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              <option value="all">Tất cả hạng mục</option>
              {activeTab === 'all' ? (
                <>
                  <optgroup label="Khoản thu">
                    {categories.income.map(c => <option key={c} value={c}>{c}</option>)}
                  </optgroup>
                  <optgroup label="Khoản chi">
                    {categories.expense.map(c => <option key={c} value={c}>{c}</option>)}
                  </optgroup>
                </>
              ) : (
                (activeTab === 'income' ? categories.income : categories.expense).map(c => (
                  <option key={c} value={c}>{c}</option>
                ))
              )}
            </select>
          </div>
          <div>
            <label className="block text-[9px] font-black text-slate-400 uppercase mb-2 ml-1">Từ ngày</label>
            <input 
              type="date" 
              className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-[9px] font-black text-slate-400 uppercase mb-2 ml-1">Đến ngày</label>
            <input 
              type="date" 
              className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Main Table Section */}
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <tr>
                <th className="px-10 py-6">Ngày</th>
                <th className="px-10 py-6">Hạng mục</th>
                <th className="px-10 py-6">Nội dung chi tiết</th>
                <th className="px-10 py-6">Số tiền</th>
                <th className="px-10 py-6 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredTransactions.map(t => {
                const isDeleting = deletingTransactionId === t.id;
                return (
                  <tr key={t.id} className="hover:bg-slate-50/50 transition-colors group relative">
                    <td className="px-10 py-6">
                      <p className="text-xs font-bold text-slate-400">{t.date.split('-').reverse().join('/')}</p>
                    </td>
                    <td className="px-10 py-6">
                      <span className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-tighter border ${
                        t.type === 'income' 
                          ? 'bg-green-50 border-green-100 text-green-700' 
                          : 'bg-red-50 border-red-100 text-red-700'
                      }`}>
                        {t.category === 'Trà sữa' ? '🧋 ' : t.category === 'Đồ ăn' ? '🍕 ' : ''}
                        {t.category}
                      </span>
                    </td>
                    <td className="px-10 py-6">
                      <p className="text-sm font-medium text-slate-600 max-w-xs md:max-w-md group-hover:text-slate-900 transition-colors truncate" title={t.description}>{t.description}</p>
                    </td>
                    <td className={`px-10 py-6 font-black text-base ${
                      t.type === 'income' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                    </td>
                    <td className="px-10 py-6 text-right relative">
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleOpenEdit(t)} className="p-2.5 hover:bg-blue-50 text-blue-600 rounded-xl" title="Xem & Sửa">✏️</button>
                        <button onClick={() => setDeletingTransactionId(t.id)} className="p-2.5 hover:bg-red-50 text-red-300 hover:text-red-600 rounded-xl" title="Xóa">🗑️</button>
                      </div>

                      {isDeleting && (
                        <div className="absolute inset-0 bg-red-600 z-10 flex items-center px-10 text-white animate-in slide-in-from-right duration-200">
                          <p className="font-black text-[10px] uppercase tracking-widest flex-1 text-left">Xóa giao dịch này?</p>
                          <div className="flex gap-2">
                            <button onClick={() => confirmDelete(t.id)} className="bg-white text-red-600 px-4 py-1.5 rounded-lg font-black text-[9px] uppercase shadow-lg">Xóa</button>
                            <button onClick={() => setDeletingTransactionId(null)} className="bg-black/20 text-white px-4 py-1.5 rounded-lg font-black text-[9px] uppercase">Hủy</button>
                          </div>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filteredTransactions.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-10 py-32 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <span className="text-5xl opacity-20">🔎</span>
                      <p className="text-slate-300 italic font-medium">Không tìm thấy giao dịch nào phù hợp với bộ lọc</p>
                      <button onClick={resetFilters} className="text-[10px] font-black uppercase text-red-600 hover:underline">Xóa tất cả bộ lọc</button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Transaction Modal (Add & Edit) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-[60] p-4">
          <div className="bg-white w-full max-w-lg rounded-[3rem] overflow-hidden shadow-2xl animate-in zoom-in duration-200 flex flex-col max-h-[90vh]">
            <div className={`p-8 ${formData.type === 'income' ? 'bg-green-600' : 'bg-red-600'} text-white flex justify-between items-center shrink-0`}>
              <div>
                <h3 className="text-2xl font-black uppercase tracking-tight">{editingTransaction ? 'Chi tiết giao dịch' : 'Ghi nhận giao dịch'}</h3>
                <p className="text-white/70 text-xs font-bold mt-1 uppercase tracking-widest">Tài chính trung tâm</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-white/60 hover:text-white text-2xl transition-colors">✕</button>
            </div>
            
            <div className="p-10 space-y-8 overflow-y-auto no-scrollbar">
              {/* Type Switcher - Disable when editing automatic tuition payments to prevent errors */}
              <div className="flex bg-slate-100 p-1.5 rounded-2xl shrink-0">
                <button 
                  disabled={!!editingTransaction?.studentId}
                  onClick={() => setFormData({...formData, type: 'income', category: categories.income[0]})}
                  className={`flex-1 py-4 rounded-xl text-xs font-black uppercase transition-all ${formData.type === 'income' ? 'bg-white text-green-600 shadow-md' : 'text-slate-400'} ${editingTransaction?.studentId ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  📥 Khoản thu
                </button>
                <button 
                  disabled={!!editingTransaction?.studentId}
                  onClick={() => setFormData({...formData, type: 'expense', category: categories.expense[0]})}
                  className={`flex-1 py-4 rounded-xl text-xs font-black uppercase transition-all ${formData.type === 'expense' ? 'bg-white text-red-600 shadow-md' : 'text-slate-400'} ${editingTransaction?.studentId ? 'opacity-50 cursor-not-allowed' : ''}`}
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
                    placeholder="Ví dụ: Tiền mua trà sữa cho lớp Giao tiếp..."
                    className="w-full p-5 bg-slate-50 border-2 border-slate-50 focus:border-slate-200 rounded-2xl font-bold text-slate-800 outline-none transition-all resize-none h-24"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                  ></textarea>
                </div>

                {editingTransaction?.studentId && (
                  <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
                    <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest mb-1">💡 Giao dịch hệ thống</p>
                    <p className="text-[11px] text-blue-800 font-medium">Đây là khoản thu học phí tự động liên kết với hồ sơ học viên. Việc sửa số tiền ở đây sẽ không tự động cập nhật số tiền đã đóng trong hồ sơ học phí của học viên.</p>
                  </div>
                )}
              </div>
            </div>

            <div className="p-10 pt-4 bg-slate-50 border-t flex gap-4 shrink-0">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="flex-1 py-5 font-black text-slate-400 uppercase tracking-widest hover:bg-slate-200 rounded-2xl transition-colors"
              >
                Hủy bỏ
              </button>
              <button 
                onClick={handleSaveTransaction}
                className={`flex-[2] py-5 font-black text-white uppercase tracking-widest rounded-2xl shadow-xl transition-all active:scale-95 ${
                  formData.type === 'income' ? 'bg-green-600 shadow-green-100' : 'bg-red-600 shadow-red-100'
                }`}
              >
                {editingTransaction ? 'Cập nhật thay đổi' : 'Lưu giao dịch'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinanceManager;
