
import React, { useState, useMemo } from 'react';
import { Assistant, TAWorkLog, Class } from '../types';
import { formatCurrency } from '../utils/financeUtils';

interface AssistantManagerProps {
  assistants: Assistant[];
  setAssistants: React.Dispatch<React.SetStateAction<Assistant[]>>;
  taWorkLogs: TAWorkLog[];
  setTaWorkLogs: React.Dispatch<React.SetStateAction<TAWorkLog[]>>;
  classes: Class[];
}

const AssistantManager: React.FC<AssistantManagerProps> = ({ 
  assistants, setAssistants, taWorkLogs, setTaWorkLogs, classes 
}) => {
  const [activeTab, setActiveTab] = useState<'list' | 'payroll'>('list');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAssistant, setEditingAssistant] = useState<Assistant | null>(null);
  const [isTimeModalOpen, setIsTimeModalOpen] = useState(false);
  const [selectedAssistantForHistory, setSelectedAssistantForHistory] = useState<Assistant | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    hourlyRate: 50000,
  });

  const [workLogForm, setWorkLogForm] = useState({
    assistantId: '',
    date: new Date().toISOString().split('T')[0],
    startTime: '18:00',
    endTime: '20:00',
    classId: '',
    description: ''
  });

  const calculateHours = (start: string, end: string) => {
    const [h1, m1] = start.split(':').map(Number);
    const [h2, m2] = end.split(':').map(Number);
    const totalMinutes = (h2 * 60 + m2) - (h1 * 60 + m1);
    return Math.max(0, totalMinutes / 60);
  };

  const handleSaveAssistant = () => {
    if (editingAssistant) {
      setAssistants(prev => prev.map(a => a.id === editingAssistant.id ? { ...a, ...formData } : a));
    } else {
      const newAssistant: Assistant = {
        id: `TA-${Date.now()}`,
        ...formData,
        status: 'active'
      };
      setAssistants(prev => [...prev, newAssistant]);
    }
    setIsModalOpen(false);
  };

  const handleAddWorkLog = () => {
    const hours = calculateHours(workLogForm.startTime, workLogForm.endTime);
    const assistant = assistants.find(a => a.id === workLogForm.assistantId);
    if (!assistant) return;

    const newLog: TAWorkLog = {
      id: `LOG-${Date.now()}`,
      ...workLogForm,
      totalHours: hours,
      payAmount: hours * assistant.hourlyRate,
      description: workLogForm.description || (workLogForm.classId ? `Hỗ trợ lớp ${classes.find(c => c.id === workLogForm.classId)?.name}` : 'Làm việc part-time')
    };

    setTaWorkLogs(prev => [newLog, ...prev]);
    setIsTimeModalOpen(false);
  };

  const assistantPayrolls = useMemo(() => {
    return assistants.map(assistant => {
      const logs = taWorkLogs.filter(log => log.assistantId === assistant.id);
      const totalHours = logs.reduce((acc, curr) => acc + curr.totalHours, 0);
      const totalPay = logs.reduce((acc, curr) => acc + curr.payAmount, 0);
      return { ...assistant, totalHours, totalPay, logs };
    });
  }, [assistants, taWorkLogs]);

  const handleDeleteWorkLog = (logId: string) => {
    if (confirm("Xác nhận xoá bản ghi công này?")) {
      setTaWorkLogs(prev => prev.filter(l => l.id !== logId));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex bg-white p-1.5 rounded-2xl border shadow-sm w-fit">
          <button onClick={() => setActiveTab('list')} className={`px-8 py-3 rounded-xl text-xs font-black uppercase transition-all ${activeTab === 'list' ? 'bg-red-600 text-white shadow-lg' : 'text-slate-400'}`}>Danh sách trợ giảng</button>
          <button onClick={() => setActiveTab('payroll')} className={`px-8 py-3 rounded-xl text-xs font-black uppercase transition-all ${activeTab === 'payroll' ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-400'}`}>Chấm công & Lương</button>
        </div>
        
        <div className="flex gap-2">
          <button onClick={() => { setWorkLogForm(prev => ({ ...prev, assistantId: assistants[0]?.id || '' })); setIsTimeModalOpen(true); }} className="bg-slate-900 text-white px-6 py-3 rounded-xl font-black text-xs uppercase hover:bg-slate-800 transition-all flex items-center gap-2 shadow-xl shadow-slate-100">🕒 Chấm công giờ</button>
          <button onClick={() => { setEditingAssistant(null); setFormData({name: '', phone: '', hourlyRate: 50000}); setIsModalOpen(true); }} className="bg-red-600 text-white px-6 py-3 rounded-xl font-black text-xs uppercase hover:bg-red-700 transition-all flex items-center gap-2 shadow-xl shadow-red-100">＋ Thêm trợ giảng</button>
        </div>
      </div>

      {activeTab === 'list' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {assistants.map(assistant => (
            <div key={assistant.id} className="bg-white rounded-[2rem] shadow-sm border border-slate-100 p-8 hover:shadow-xl transition-all group">
              <div className="flex justify-between items-start mb-6">
                <div className="w-16 h-16 bg-slate-50 text-slate-400 rounded-[1.5rem] flex items-center justify-center text-3xl font-black group-hover:bg-red-600 group-hover:text-white transition-all">
                  {assistant.name.charAt(0)}
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => { setEditingAssistant(assistant); setFormData({ name: assistant.name, phone: assistant.phone, hourlyRate: assistant.hourlyRate }); setIsModalOpen(true); }} className="p-3 bg-blue-50 text-blue-600 rounded-xl">✏️</button>
                  <button onClick={() => setAssistants(prev => prev.filter(a => a.id !== assistant.id))} className="p-3 bg-red-50 text-red-600 rounded-xl">🗑️</button>
                </div>
              </div>
              <h4 className="text-xl font-black text-slate-800 mb-1">{assistant.name}</h4>
              <p className="text-sm font-bold text-slate-400 mb-6 tracking-tight">{assistant.phone}</p>
              <div className="pt-6 border-t flex justify-between items-center">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Mức lương / giờ</p>
                  <p className="text-lg font-black text-red-600">{formatCurrency(assistant.hourlyRate)}</p>
                </div>
                <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase ${assistant.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-400'}`}>
                  {assistant.status}
                </div>
              </div>
            </div>
          ))}
          {assistants.length === 0 && (
             <div className="col-span-full py-32 text-center bg-white border-2 border-dashed border-slate-100 rounded-[3rem]">
               <span className="text-5xl opacity-10">🤝</span>
               <p className="text-slate-300 font-black uppercase text-xs mt-4">Chưa có trợ giảng nào</p>
             </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-sm">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">
              <tr>
                <th className="px-10 py-6">Trợ giảng</th>
                <th className="px-10 py-6">Thời gian làm</th>
                <th className="px-10 py-6">Tổng lương dự kiến</th>
                <th className="px-10 py-6 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {assistantPayrolls.map(pay => (
                <tr key={pay.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-10 py-6">
                    <p className="font-black text-slate-800">{pay.name}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">{pay.phone}</p>
                  </td>
                  <td className="px-10 py-6 font-black text-slate-600">
                    {pay.totalHours.toFixed(1)} <span className="text-[10px] uppercase text-slate-400">Giờ</span>
                  </td>
                  <td className="px-10 py-6 font-black text-green-600 text-lg">
                    {formatCurrency(pay.totalPay)}
                  </td>
                  <td className="px-10 py-6 text-right">
                    <button 
                      onClick={() => setSelectedAssistantForHistory(pay)}
                      className="text-red-600 text-[10px] font-black uppercase tracking-widest hover:underline hover:scale-105 transition-all"
                    >
                      Xem lịch sử →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Lịch sử Chấm công Chi tiết */}
      {selectedAssistantForHistory && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-[60] p-4">
          <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-[3rem] overflow-hidden shadow-2xl flex flex-col animate-in zoom-in duration-200">
            <div className="p-8 bg-slate-900 text-white flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-black uppercase tracking-tight">{selectedAssistantForHistory.name}</h3>
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1">Lịch sử làm việc & thù lao chi tiết</p>
              </div>
              <button onClick={() => setSelectedAssistantForHistory(null)} className="text-white/60 hover:text-white text-2xl">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto p-8 no-scrollbar">
              <div className="space-y-4">
                {taWorkLogs.filter(l => l.assistantId === selectedAssistantForHistory.id).length === 0 ? (
                   <div className="py-20 text-center text-slate-300 font-black uppercase text-xs italic">Chưa có dữ liệu làm việc</div>
                ) : (
                  taWorkLogs.filter(l => l.assistantId === selectedAssistantForHistory.id).sort((a,b) => b.date.localeCompare(a.date)).map(log => (
                    <div key={log.id} className="p-6 bg-slate-50 border border-slate-100 rounded-3xl flex items-center justify-between hover:border-slate-300 transition-all group">
                      <div className="flex items-center gap-6">
                        <div className="bg-white p-4 rounded-2xl shadow-sm">
                           <p className="text-[10px] font-black text-slate-400 uppercase leading-none mb-1">Ngày</p>
                           <p className="text-sm font-black text-slate-800">{log.date.split('-').reverse().join('/')}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-red-600 uppercase tracking-widest mb-1">{log.startTime} - {log.endTime} ({log.totalHours.toFixed(1)}h)</p>
                          <p className="text-sm font-bold text-slate-600">{log.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-8">
                        <div className="text-right">
                          <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Thành tiền</p>
                          <p className="text-lg font-black text-slate-900">{formatCurrency(log.payAmount)}</p>
                        </div>
                        <button 
                          onClick={() => handleDeleteWorkLog(log.id)}
                          className="p-3 bg-red-50 text-red-600 rounded-xl opacity-0 group-hover:opacity-100 transition-all hover:bg-red-600 hover:text-white"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
            <div className="p-8 bg-slate-50 border-t flex justify-end">
              <button onClick={() => setSelectedAssistantForHistory(null)} className="px-10 py-4 bg-slate-900 text-white font-black uppercase tracking-widest rounded-2xl hover:bg-black transition-all">Đóng</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Thêm/Sửa Trợ Giảng */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-[60] p-4">
          <div className="bg-white w-full max-w-md rounded-[3rem] overflow-hidden shadow-2xl animate-in zoom-in duration-200">
            <div className="p-10 bg-red-600 text-white">
              <h3 className="text-2xl font-black uppercase tracking-tight">{editingAssistant ? 'Sửa hồ sơ TA' : 'Thêm trợ giảng mới'}</h3>
              <p className="text-white/60 text-[10px] font-black uppercase tracking-widest mt-1">Hỗ trợ giảng dạy part-time</p>
            </div>
            <div className="p-10 space-y-6">
              <div><label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Họ và tên</label><input type="text" className="w-full p-4 bg-slate-50 border-0 rounded-2xl font-black outline-none" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} /></div>
              <div><label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Số điện thoại</label><input type="text" className="w-full p-4 bg-slate-50 border-0 rounded-2xl font-black outline-none" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} /></div>
              <div className="bg-slate-900 p-8 rounded-[2rem] shadow-xl">
                 <label className="block text-[10px] font-black text-white/40 mb-2 uppercase tracking-widest">Lương thỏa thuận / Giờ (VNĐ)</label>
                 <input type="number" className="bg-transparent text-white text-3xl font-black w-full outline-none" value={formData.hourlyRate} onChange={(e) => setFormData({...formData, hourlyRate: parseInt(e.target.value) || 0})} />
              </div>
              <div className="pt-4 flex gap-4">
                <button onClick={() => setIsModalOpen(false)} className="flex-1 py-5 font-black text-slate-400 uppercase tracking-widest hover:bg-slate-50 rounded-2xl">Hủy</button>
                <button onClick={handleSaveAssistant} className="flex-[2] py-5 bg-red-600 text-white font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-red-100 hover:bg-red-700 transition-all">Lưu hồ sơ</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Chấm Công */}
      {isTimeModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-[60] p-4">
          <div className="bg-white w-full max-w-lg rounded-[3rem] overflow-hidden shadow-2xl animate-in zoom-in duration-200">
            <div className="p-8 bg-slate-900 text-white">
              <h3 className="text-2xl font-black uppercase tracking-tight text-center">Chấm công theo giờ</h3>
            </div>
            <div className="p-10 space-y-6">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Chọn trợ giảng</label>
                <select className="w-full p-4 bg-slate-50 border-0 rounded-2xl font-black outline-none appearance-none" value={workLogForm.assistantId} onChange={(e) => setWorkLogForm({...workLogForm, assistantId: e.target.value})}>
                  {assistants.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Giờ bắt đầu</label><input type="time" className="w-full p-4 bg-slate-50 border-0 rounded-2xl font-black" value={workLogForm.startTime} onChange={(e) => setWorkLogForm({...workLogForm, startTime: e.target.value})} /></div>
                <div><label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Giờ kết thúc</label><input type="time" className="w-full p-4 bg-slate-50 border-0 rounded-2xl font-black" value={workLogForm.endTime} onChange={(e) => setWorkLogForm({...workLogForm, endTime: e.target.value})} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Ngày làm việc</label><input type="date" className="w-full p-4 bg-slate-50 border-0 rounded-2xl font-black" value={workLogForm.date} onChange={(e) => setWorkLogForm({...workLogForm, date: e.target.value})} /></div>
                <div><label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Lớp hỗ trợ (Tùy chọn)</label>
                  <select className="w-full p-4 bg-slate-50 border-0 rounded-2xl font-black outline-none appearance-none" value={workLogForm.classId} onChange={(e) => setWorkLogForm({...workLogForm, classId: e.target.value})}>
                    <option value="">Làm việc văn phòng</option>
                    {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="bg-red-50 p-6 rounded-[2rem] border border-red-100 flex justify-between items-center">
                 <span className="text-[10px] font-black text-red-600 uppercase tracking-widest">Tổng thời gian:</span>
                 <span className="text-2xl font-black text-red-600">{calculateHours(workLogForm.startTime, workLogForm.endTime).toFixed(1)} Giờ</span>
              </div>
              <div className="pt-4 flex gap-4">
                <button onClick={() => setIsTimeModalOpen(false)} className="flex-1 py-5 font-black text-slate-400 uppercase tracking-widest hover:bg-slate-50 rounded-2xl">Hủy</button>
                <button onClick={handleAddWorkLog} className="flex-[2] py-5 bg-slate-900 text-white font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-slate-100 hover:bg-black transition-all">Ghi nhận công</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssistantManager;
