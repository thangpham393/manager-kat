
import React, { useState } from 'react';
import { Teacher, Attendance, Class, MakeupLesson, TeacherSalaryTier, Enrollment } from '../types';
import { formatCurrency } from '../utils/financeUtils';

interface TeacherManagerProps {
  teachers: Teacher[];
  setTeachers: React.Dispatch<React.SetStateAction<Teacher[]>>;
  attendanceRecords: Attendance[];
  setAttendanceRecords: React.Dispatch<React.SetStateAction<Attendance[]>>;
  classes: Class[];
  makeupLessons: MakeupLesson[];
  enrollments: Enrollment[];
}

const TeacherManager: React.FC<TeacherManagerProps> = ({ 
  teachers, setTeachers, attendanceRecords, setAttendanceRecords, classes, makeupLessons, enrollments 
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [deletingTeacherId, setDeletingTeacherId] = useState<string | null>(null);
  
  const [selectedTeacherForPayroll, setSelectedTeacherForPayroll] = useState<Teacher | null>(null);
  const [isPayrollModalOpen, setIsPayrollModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    hourlyRate: 250000,
    expertise: '',
    salaryTiers: [] as TeacherSalaryTier[]
  });

  const handleOpenPayroll = (teacher: Teacher) => {
    setSelectedTeacherForPayroll(teacher);
    setIsPayrollModalOpen(true);
  };

  const getRateForStudentCount = (teacher: Teacher, count: number) => {
    const tier = teacher.salaryTiers.find(t => count >= t.minStudents && count <= t.maxStudents);
    return tier ? tier.rate : teacher.hourlyRate;
  };

  const getTeacherWorkLog = (teacher: Teacher) => {
    // Lương lớp chính khóa: Dựa trên tổng danh sách lớp (enrollments)
    const regularClasses = attendanceRecords
      .filter(r => r.teacherId === teacher.id && r.teacherPresent)
      .map(r => {
        // Đếm tổng số học viên TRONG DANH SÁCH LỚP đó (không quan tâm vắng hay có mặt)
        const totalStudentsInClass = enrollments.filter(e => e.classId === r.classId).length;
        const rate = getRateForStudentCount(teacher, totalStudentsInClass);
        return { ...r, studentCount: totalStudentsInClass, calculatedRate: rate };
      });

    const makeupSessions = makeupLessons.filter(m => m.teacherId === teacher.id && m.status === 'completed');
    return { regularClasses, makeupSessions };
  };

  const calculateSalary = (teacher: Teacher) => {
    const { regularClasses, makeupSessions } = getTeacherWorkLog(teacher);
    const regularPay = regularClasses.reduce((acc, curr) => acc + curr.calculatedRate, 0);
    const makeupPay = makeupSessions.reduce((acc, curr) => acc + curr.teacherPay, 0);
    return regularPay + makeupPay;
  };

  const confirmDeleteTeacher = (id: string) => {
    setTeachers(prev => prev.filter(t => t.id !== id));
    setDeletingTeacherId(null);
  };

  const handleOpenModal = (teacher?: Teacher) => {
    if (teacher) {
      setEditingTeacher(teacher);
      setFormData({ 
        name: teacher.name, 
        phone: teacher.phone, 
        hourlyRate: teacher.hourlyRate, 
        expertise: teacher.expertise.join(', '),
        salaryTiers: teacher.salaryTiers || []
      });
    } else {
      setEditingTeacher(null);
      setFormData({ 
        name: '', 
        phone: '', 
        hourlyRate: 250000, 
        expertise: '',
        salaryTiers: [
          { minStudents: 1, maxStudents: 2, rate: 150000 },
          { minStudents: 3, maxStudents: 4, rate: 200000 },
          { minStudents: 5, maxStudents: 6, rate: 250000 }
        ]
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = () => {
    const teacherData = { 
      ...formData, 
      expertise: formData.expertise.split(',').map(s => s.trim()).filter(s => s !== ''),
      salaryTiers: formData.salaryTiers.sort((a,b) => a.minStudents - b.minStudents)
    };
    if (editingTeacher) {
      setTeachers(teachers.map(t => t.id === editingTeacher.id ? { ...t, ...teacherData } : t));
    } else {
      const newTeacher: Teacher = { id: `T${Date.now()}`, ...teacherData };
      setTeachers([...teachers, newTeacher]);
    }
    setIsModalOpen(false);
  };

  const addSalaryTier = () => {
    setFormData({
      ...formData,
      salaryTiers: [...formData.salaryTiers, { minStudents: 1, maxStudents: 10, rate: 200000 }]
    });
  };

  const removeSalaryTier = (index: number) => {
    setFormData({
      ...formData,
      salaryTiers: formData.salaryTiers.filter((_, i) => i !== index)
    });
  };

  const updateSalaryTier = (index: number, field: keyof TeacherSalaryTier, value: number) => {
    const newTiers = [...formData.salaryTiers];
    newTiers[index] = { ...newTiers[index], [field]: value };
    setFormData({ ...formData, salaryTiers: newTiers });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold text-slate-800">Đội ngũ Giáo viên</h3>
        <button onClick={() => handleOpenModal()} className="bg-red-600 text-white px-6 py-2 rounded-xl font-bold transition-transform hover:scale-105 hover:bg-red-700 shadow-lg shadow-red-100">＋ Thêm giáo viên</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teachers.map((teacher) => {
          const isDeleting = deletingTeacherId === teacher.id;
          return (
            <div key={teacher.id} className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden hover:shadow-xl transition-all group relative">
              {isDeleting && (
                <div className="absolute inset-0 bg-red-600/95 backdrop-blur-sm z-20 flex flex-col items-center justify-center p-6 text-white animate-in zoom-in duration-200">
                  <p className="font-black text-sm uppercase mb-4 tracking-widest text-center">Xóa hồ sơ Giáo viên {teacher.name}?</p>
                  <div className="flex gap-3 w-full">
                    <button onClick={(e) => { e.stopPropagation(); confirmDeleteTeacher(teacher.id); }} className="flex-1 bg-white text-red-600 py-3 rounded-xl font-black text-xs uppercase shadow-xl">Xác nhận xóa</button>
                    <button onClick={(e) => { e.stopPropagation(); setDeletingTeacherId(null); }} className="flex-1 bg-black/20 text-white py-3 rounded-xl font-black text-xs uppercase hover:bg-black/30">Hủy</button>
                  </div>
                </div>
              )}

              <div className="h-2 bg-red-600"></div>
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-14 h-14 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center text-2xl font-bold group-hover:bg-red-600 group-hover:text-white transition-colors">
                    {teacher.name.charAt(0)}
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => handleOpenPayroll(teacher)} className="p-2.5 hover:bg-green-50 rounded-xl text-green-600" title="Bảng công">💰</button>
                    <button onClick={() => handleOpenModal(teacher)} className="p-2.5 hover:bg-blue-50 rounded-xl text-blue-600" title="Sửa">✏️</button>
                    <button onClick={(e) => { e.stopPropagation(); setDeletingTeacherId(teacher.id); }} className="p-2.5 hover:bg-red-50 rounded-xl text-red-300 hover:text-red-600" title="Xóa">🗑️</button>
                  </div>
                </div>
                <h4 className="text-xl font-black text-slate-800">{teacher.name}</h4>
                <p className="text-sm text-slate-500 mb-4">📞 {teacher.phone}</p>
                <div className="space-y-1 mb-4">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Lương theo danh sách lớp:</p>
                  <div className="flex flex-wrap gap-1">
                    {teacher.salaryTiers?.map((tier, i) => (
                      <span key={i} className="text-[9px] font-bold bg-slate-50 px-2 py-1 rounded-md text-slate-600 border border-slate-100">
                        {tier.minStudents}-{tier.maxStudents}hv: {formatCurrency(tier.rate)}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t flex justify-between items-center">
                  <div><p className="text-[10px] font-bold text-slate-400 uppercase">Thù lao gốc</p><p className="text-sm font-bold text-red-600">{formatCurrency(teacher.hourlyRate)}</p></div>
                  <button onClick={() => handleOpenPayroll(teacher)} className="bg-slate-900 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 shadow-sm transition-all">BẢNG CÔNG</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* PAYROLL MODAL */}
      {isPayrollModalOpen && selectedTeacherForPayroll && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-3xl rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-8 bg-slate-900 text-white">
              <div className="flex justify-between items-start mb-6">
                <div><h3 className="text-3xl font-black uppercase tracking-tight">{selectedTeacherForPayroll.name}</h3><p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Báo cáo thù lao chi tiết theo danh sách lớp</p></div>
                <button onClick={() => setIsPayrollModalOpen(false)} className="text-white/60 hover:text-white text-2xl">✕</button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/10 p-5 rounded-[2rem] border border-white/20">
                  <p className="text-[10px] font-black uppercase opacity-60 mb-1">Số buổi đã dạy</p>
                  <p className="text-3xl font-black">
                    {getTeacherWorkLog(selectedTeacherForPayroll).regularClasses.length + getTeacherWorkLog(selectedTeacherForPayroll).makeupSessions.length} buổi
                  </p>
                </div>
                <div className="bg-white/10 p-5 rounded-[2rem] border border-white/20">
                  <p className="text-[10px] font-black uppercase opacity-60 mb-1">Tổng lương nhận</p>
                  <p className="text-3xl font-black text-green-400">{formatCurrency(calculateSalary(selectedTeacherForPayroll))}</p>
                </div>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-10 space-y-4">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Lớp chính khóa (Tính theo sĩ số danh sách lớp)</p>
              {getTeacherWorkLog(selectedTeacherForPayroll).regularClasses.map(record => (
                <div key={record.id} className="p-5 bg-white border-2 border-slate-50 rounded-2xl flex justify-between items-center group hover:border-slate-200 transition-all">
                  <div>
                    <p className="font-black text-slate-800">{classes.find(c => c.id === record.classId)?.name}</p>
                    <div className="flex gap-3 mt-1">
                      <p className="text-[10px] text-slate-400 font-bold uppercase">{record.date}</p>
                      <p className="text-[10px] text-red-600 font-black uppercase">Sĩ số lớp: {record.studentCount} hv</p>
                    </div>
                  </div>
                  <div className="text-right"><p className="font-black text-slate-800">+{formatCurrency(record.calculatedRate)}</p></div>
                </div>
              ))}
              
              {getTeacherWorkLog(selectedTeacherForPayroll).makeupSessions.length > 0 && (
                <>
                  <p className="text-[10px] font-black text-purple-600 uppercase tracking-widest mt-8">Lớp dạy bù (Thù lao cố định)</p>
                  {getTeacherWorkLog(selectedTeacherForPayroll).makeupSessions.map(m => (
                    <div key={m.id} className="p-5 bg-purple-50 border-2 border-purple-100 rounded-2xl flex justify-between items-center group hover:border-purple-200 transition-all">
                      <div><p className="font-black text-purple-900">Dạy bù: {m.date}</p><p className="text-[10px] text-purple-400 font-bold uppercase mt-1">{m.startTime} - {m.endTime}</p></div>
                      <div className="text-right"><p className="font-black text-purple-900">+{formatCurrency(m.teacherPay)}</p></div>
                    </div>
                  ))}
                </>
              )}
            </div>
            <div className="p-8 bg-slate-50 border-t flex justify-end"><button onClick={() => setIsPayrollModalOpen(false)} className="px-10 py-4 bg-slate-900 text-white font-black uppercase tracking-widest rounded-2xl hover:bg-black transition-all">Đóng báo cáo</button></div>
          </div>
        </div>
      )}

      {/* MODAL THÊM/SỬA GIÁO VIÊN */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-2xl max-h-[95vh] rounded-[2.5rem] shadow-2xl animate-in zoom-in duration-200 flex flex-col">
            <div className="p-8 bg-red-600 text-white flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-black uppercase tracking-tight">Hồ sơ giáo viên</h3>
                <p className="text-red-100 text-[10px] font-black uppercase tracking-widest mt-1">Quản lý thù lao & thông tin</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-white/60 hover:text-white text-2xl">✕</button>
            </div>
            <div className="p-8 overflow-y-auto space-y-8 no-scrollbar">
              <div className="grid grid-cols-2 gap-6">
                <div><label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Họ và tên</label><input type="text" className="w-full p-4 bg-slate-50 border-0 rounded-2xl font-bold" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} /></div>
                <div><label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Số điện thoại</label><input type="text" className="w-full p-4 bg-slate-50 border-0 rounded-2xl font-bold" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} /></div>
              </div>
              
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Chuyên môn / Kỹ năng (cách nhau bởi dấu phẩy)</label>
                <input type="text" className="w-full p-4 bg-slate-50 border-0 rounded-2xl font-bold" placeholder="HSK 1, Giao tiếp, Tiếng Trung Trẻ em..." value={formData.expertise} onChange={(e) => setFormData({...formData, expertise: e.target.value})} />
              </div>

              <div className="bg-slate-900 p-8 rounded-[2.5rem] shadow-xl">
                 <div className="flex justify-between items-center mb-6">
                    <div>
                      <h4 className="text-white text-sm font-black uppercase tracking-widest">Cấu hình lương theo sĩ số lớp</h4>
                      <p className="text-white/40 text-[10px] uppercase font-bold mt-1">Hệ thống tính dựa trên tổng danh sách học viên của lớp</p>
                    </div>
                    <button onClick={addSalaryTier} className="bg-white/10 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase hover:bg-white/20 transition-all">＋ Thêm mức</button>
                 </div>
                 
                 <div className="space-y-3">
                   {formData.salaryTiers.map((tier, idx) => (
                     <div key={idx} className="flex gap-3 items-center bg-white/5 p-4 rounded-2xl border border-white/10 group">
                        <div className="flex-1 flex items-center gap-2">
                           <span className="text-[10px] font-black text-white/40 uppercase">Từ</span>
                           <input type="number" className="w-12 bg-transparent text-white font-black outline-none border-b border-white/20 focus:border-white" value={tier.minStudents} onChange={(e) => updateSalaryTier(idx, 'minStudents', parseInt(e.target.value) || 0)} />
                           <span className="text-[10px] font-black text-white/40 uppercase">đến</span>
                           <input type="number" className="w-12 bg-transparent text-white font-black outline-none border-b border-white/20 focus:border-white" value={tier.maxStudents} onChange={(e) => updateSalaryTier(idx, 'maxStudents', parseInt(e.target.value) || 0)} />
                           <span className="text-[10px] font-black text-white/40 uppercase ml-1">học viên</span>
                        </div>
                        <div className="flex-1 flex items-center gap-2">
                           <span className="text-[10px] font-black text-white/40 uppercase">Thù lao</span>
                           <input type="number" className="flex-1 bg-transparent text-green-400 font-black outline-none border-b border-white/20 focus:border-green-400" value={tier.rate} onChange={(e) => updateSalaryTier(idx, 'rate', parseInt(e.target.value) || 0)} />
                        </div>
                        <button onClick={() => removeSalaryTier(idx)} className="text-white/20 hover:text-red-400 transition-colors">✕</button>
                     </div>
                   ))}
                 </div>
                 
                 <div className="mt-6 pt-6 border-t border-white/10">
                    <label className="block text-[10px] font-black text-white/40 uppercase mb-2">Thù lao gốc / fallback (VNĐ)</label>
                    <input type="number" className="bg-transparent text-white text-2xl font-black w-full outline-none" value={formData.hourlyRate} onChange={(e) => setFormData({...formData, hourlyRate: parseInt(e.target.value) || 0})} />
                 </div>
              </div>
            </div>
            <div className="p-8 bg-slate-50 border-t flex gap-4"><button onClick={() => setIsModalOpen(false)} className="flex-1 py-4 font-black text-slate-400 uppercase tracking-widest hover:bg-slate-50 rounded-2xl">Hủy</button><button onClick={handleSave} className="flex-[2] py-4 bg-red-600 text-white font-black rounded-2xl hover:bg-red-700 shadow-xl shadow-red-100 uppercase tracking-widest transition-all">Lưu giáo viên</button></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherManager;
