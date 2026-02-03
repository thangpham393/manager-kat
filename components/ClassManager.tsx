
import React, { useState, useMemo } from 'react';
import { calculateSessionsBetweenDates, formatCurrency, calculateEndDateFromSessions } from '../utils/financeUtils';
import { Class, Student, Teacher, Enrollment, DayOfWeek, ClassSession } from '../types';

interface ClassManagerProps {
  classes: Class[];
  setClasses: React.Dispatch<React.SetStateAction<Class[]>>;
  teachers: Teacher[];
  students: Student[];
  enrollments: Enrollment[];
  setEnrollments: React.Dispatch<React.SetStateAction<Enrollment[]>>;
}

const ClassManager: React.FC<ClassManagerProps> = ({ 
  classes, setClasses, teachers, students, enrollments, setEnrollments 
}) => {
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [deletingClassId, setDeletingClassId] = useState<string | null>(null);
  const [closingClassId, setClosingClassId] = useState<string | null>(null);
  
  const [activeTab, setActiveTab] = useState<'active' | 'closed'>('active');
  
  const [classFormData, setClassFormData] = useState<Partial<Class>>({});

  // Add student to class state
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [studentSearch, setStudentSearch] = useState('');

  const generateClassCode = () => `MS-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

  const handleOpenDetails = (cls: Class) => {
    setSelectedClass(cls);
    setIsDetailModalOpen(true);
    setIsAddStudentOpen(false);
  };

  const handleOpenEdit = (cls: Class) => {
    setSelectedClass(cls);
    setClassFormData({ ...cls });
    setIsEditModalOpen(true);
  };

  const handleOpenCreate = () => {
    const newCode = generateClassCode();
    setClassFormData({
      id: newCode,
      name: '',
      teacherId: teachers[0]?.id || '',
      maxStudents: 15,
      tuitionPerSession: 300000,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      schedule: [{ dayOfWeek: DayOfWeek.Monday, startTime: '18:00', endTime: '19:30' }],
      status: 'active'
    });
    setIsCreateModalOpen(true);
  };

  const confirmDeleteClass = (id: string) => {
    setClasses(prev => prev.filter(c => c.id !== id));
    setEnrollments(prev => prev.filter(e => e.classId !== id));
    setDeletingClassId(null);
  };

  const handleToggleClassStatus = (id: string, newStatus: 'active' | 'closed') => {
    setClasses(prev => prev.map(c => c.id === id ? { ...c, status: newStatus } : c));
    setClosingClassId(null);
  };

  const handleSaveClass = (mode: 'create' | 'edit') => {
    if (!classFormData.name || !classFormData.schedule?.length) {
      alert('Vui lòng điền tên lớp và lịch học');
      return;
    }
    if (mode === 'edit') {
      setClasses(classes.map(c => c.id === selectedClass?.id ? (classFormData as Class) : c));
      setIsEditModalOpen(false);
    } else {
      setClasses([...classes, classFormData as Class]);
      setIsCreateModalOpen(false);
    }
    setSelectedClass(null);
  };

  const handleAddStudentToClass = (student: Student) => {
    if (!selectedClass) return;
    
    // Kiểm tra sĩ số
    const currentEnrollments = enrollments.filter(e => e.classId === selectedClass.id);
    if (currentEnrollments.length >= selectedClass.maxStudents) {
      alert('Lớp đã đầy sĩ số!');
      return;
    }

    const newEnrollment: Enrollment = {
      id: `E-${Date.now()}`,
      studentId: student.id,
      classId: selectedClass.id,
      startDate: selectedClass.startDate,
      endDate: selectedClass.endDate,
      calculatedSessions: calculateSessionsBetweenDates(selectedClass.startDate, selectedClass.endDate, selectedClass.schedule),
      tuitionPerSession: selectedClass.tuitionPerSession,
      materialFee: 0,
      totalTuition: 0, // Sẽ được tính lại ở StudentManager nếu cần đóng phí
      paidAmount: 0,
      status: 'unpaid'
    };

    setEnrollments(prev => [...prev, newEnrollment]);
    setStudentSearch('');
    // Giữ nguyên modal để thêm tiếp nếu muốn
  };

  const availableStudents = useMemo(() => {
    if (!selectedClass) return [];
    const currentStudentIdsInClass = enrollments
      .filter(e => e.classId === selectedClass.id)
      .map(e => e.studentId);
    
    return students.filter(s => 
      !currentStudentIdsInClass.includes(s.id) &&
      (s.name.toLowerCase().includes(studentSearch.toLowerCase()) || s.phone.includes(studentSearch))
    );
  }, [students, enrollments, selectedClass, studentSearch]);

  const days = [
    { label: 'Chủ Nhật', value: DayOfWeek.Sunday },
    { label: 'Thứ 2', value: DayOfWeek.Monday },
    { label: 'Thứ 3', value: DayOfWeek.Tuesday },
    { label: 'Thứ 4', value: DayOfWeek.Wednesday },
    { label: 'Thứ 5', value: DayOfWeek.Thursday },
    { label: 'Thứ 6', value: DayOfWeek.Friday },
    { label: 'Thứ 7', value: DayOfWeek.Saturday },
  ];

  const filteredClasses = classes.filter(c => c.status === activeTab);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex bg-white p-1.5 rounded-2xl border shadow-sm w-fit overflow-hidden">
          <button 
            onClick={() => setActiveTab('active')} 
            className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase transition-all ${activeTab === 'active' ? 'bg-red-600 text-white shadow-lg' : 'text-slate-400'}`}
          >
            Đang hoạt động ({classes.filter(c => c.status === 'active').length})
          </button>
          <button 
            onClick={() => setActiveTab('closed')} 
            className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase transition-all ${activeTab === 'closed' ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-400'}`}
          >
            Đã kết thúc ({classes.filter(c => c.status === 'closed').length})
          </button>
        </div>
        
        {activeTab === 'active' && (
          <button onClick={handleOpenCreate} className="bg-red-600 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase hover:bg-red-700 transition-all flex items-center gap-2 shadow-xl shadow-red-100">＋ Mở lớp mới</button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredClasses.map((cls) => {
          const isDeleting = deletingClassId === cls.id;
          const isClosing = closingClassId === cls.id;
          
          return (
            <div key={cls.id} className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 hover:border-slate-200 transition-all group relative overflow-hidden">
              {/* Confirm Delete Overlay */}
              {isDeleting && (
                <div className="absolute inset-0 bg-red-600/95 backdrop-blur-sm z-20 flex flex-col items-center justify-center p-6 text-white animate-in zoom-in duration-200">
                  <p className="font-black text-sm uppercase mb-4 tracking-widest text-center">Xóa vĩnh viễn lớp {cls.name}?</p>
                  <div className="flex gap-3 w-full">
                    <button onClick={() => confirmDeleteClass(cls.id)} className="flex-1 bg-white text-red-600 py-3 rounded-xl font-black text-xs uppercase shadow-xl">Xóa</button>
                    <button onClick={() => setDeletingClassId(null)} className="flex-1 bg-black/20 text-white py-3 rounded-xl font-black text-xs uppercase">Hủy</button>
                  </div>
                </div>
              )}

              {/* Confirm Close Overlay */}
              {isClosing && (
                <div className="absolute inset-0 bg-slate-900/95 backdrop-blur-sm z-20 flex flex-col items-center justify-center p-6 text-white animate-in zoom-in duration-200">
                  <p className="font-black text-sm uppercase mb-4 tracking-widest text-center">Xác nhận kết thúc lớp học này?</p>
                  <p className="text-[10px] text-slate-400 mb-6 uppercase font-bold text-center">Lớp sẽ không còn hiện trên thời khóa biểu</p>
                  <div className="flex gap-3 w-full">
                    <button onClick={() => handleToggleClassStatus(cls.id, 'closed')} className="flex-1 bg-red-600 text-white py-3 rounded-xl font-black text-xs uppercase shadow-xl">Đồng ý kết thúc</button>
                    <button onClick={() => setClosingClassId(null)} className="flex-1 bg-white/10 text-white py-3 rounded-xl font-black text-xs uppercase">Quay lại</button>
                  </div>
                </div>
              )}

              <div className="absolute top-0 right-0 p-3 flex gap-2">
                <span className={`text-[10px] font-black px-2 py-1 rounded-lg uppercase tracking-wider ${cls.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                  {cls.status === 'active' ? 'ACTIVE' : 'CLOSED'}
                </span>
              </div>
              
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="text-lg font-bold text-slate-800">{cls.name}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs font-bold text-slate-400 uppercase">Giáo viên:</span>
                    <span className="text-sm font-bold text-red-600">{teachers.find(t => t.id === cls.teacherId)?.name}</span>
                  </div>
                </div>
                {cls.status === 'active' ? (
                  <div className="flex gap-1">
                    <button onClick={() => handleOpenEdit(cls)} className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg" title="Sửa">✏️</button>
                    <button onClick={() => setClosingClassId(cls.id)} className="p-2 hover:bg-amber-50 text-amber-600 rounded-lg" title="Kết thúc lớp">🏁</button>
                    <button onClick={() => setDeletingClassId(cls.id)} className="p-2 hover:bg-red-50 text-red-300 hover:text-red-600 rounded-lg" title="Xóa">🗑️</button>
                  </div>
                ) : (
                  <div className="flex gap-1">
                    <button onClick={() => handleToggleClassStatus(cls.id, 'active')} className="bg-slate-100 hover:bg-green-600 hover:text-white text-slate-600 px-3 py-1 rounded-lg text-[9px] font-black uppercase transition-all shadow-sm">Mở lại lớp</button>
                    <button onClick={() => setDeletingClassId(cls.id)} className="p-2 hover:bg-red-50 text-red-300 rounded-lg">🗑️</button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Sĩ số danh sách</p>
                  <p className="text-sm font-bold text-slate-700">{enrollments.filter(e => e.classId === cls.id).length}/{cls.maxStudents}</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Thời gian</p>
                  <p className="text-[11px] font-bold text-slate-700">{cls.startDate} → {cls.endDate}</p>
                </div>
              </div>

              <div className="space-y-2 mb-6">
                <div className="flex flex-wrap gap-x-2 gap-y-1">
                  {cls.schedule.map((s, i) => (
                    <span key={i} className="bg-slate-100 px-2.5 py-1 rounded-lg text-[10px] font-bold text-slate-600 border border-slate-200">
                      {days.find(d => d.value === s.dayOfWeek)?.label}: {s.startTime}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-50 flex justify-between items-center">
                 <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{cls.id}</p>
                 <button onClick={() => handleOpenDetails(cls)} className="text-red-600 text-xs font-black uppercase tracking-widest hover:underline transition-all">Quản lý học viên →</button>
              </div>
            </div>
          );
        })}

        {filteredClasses.length === 0 && (
          <div className="col-span-2 py-32 flex flex-col items-center justify-center bg-white border-2 border-dashed border-slate-100 rounded-[3rem]">
            <span className="text-4xl opacity-20 mb-4">🏫</span>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Không có lớp học nào trong danh sách này</p>
          </div>
        )}
      </div>

      {/* MODAL TẠO MỚI / SỬA LỚP */}
      {(isCreateModalOpen || isEditModalOpen) && classFormData && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-2xl max-h-[95vh] rounded-[2.5rem] overflow-hidden shadow-2xl animate-in zoom-in duration-200 flex flex-col">
            <div className={`p-8 ${isCreateModalOpen ? 'bg-red-600' : 'bg-blue-600'} text-white flex justify-between items-center`}>
              <div><h3 className="text-2xl font-black uppercase tracking-tight">{isCreateModalOpen ? 'Mở lớp mới' : 'Sửa lớp học'}</h3><p className="text-white/70 text-xs font-bold mt-1">Hệ thống quản lý đào tạo</p></div>
              <button onClick={() => {setIsCreateModalOpen(false); setIsEditModalOpen(false);}} className="text-white/60 hover:text-white text-2xl">✕</button>
            </div>
            <div className="p-8 overflow-y-auto space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="col-span-2"><label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Tên lớp học</label><input type="text" className="w-full p-4 border-2 border-slate-100 focus:border-red-600 outline-none rounded-2xl font-bold transition-all" placeholder="Ví dụ: Hán Ngữ Sơ Cấp 1 - Tối 2/4" value={classFormData.name} onChange={(e) => setClassFormData({...classFormData, name: e.target.value})} /></div>
                <div><label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Giáo viên phụ trách</label><select className="w-full p-4 border-2 border-slate-100 rounded-2xl font-bold outline-none" value={classFormData.teacherId} onChange={(e) => setClassFormData({...classFormData, teacherId: e.target.value})}>{teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select></div>
                <div><label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Sĩ số tối đa</label><input type="number" className="w-full p-4 border-2 border-slate-100 rounded-2xl font-bold outline-none" value={classFormData.maxStudents} onChange={(e) => setClassFormData({...classFormData, maxStudents: parseInt(e.target.value)})} /></div>
                <div><label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Học phí / Buổi</label><input type="number" className="w-full p-4 border-2 border-slate-100 rounded-2xl font-bold text-red-600 outline-none" value={classFormData.tuitionPerSession} onChange={(e) => setClassFormData({...classFormData, tuitionPerSession: parseInt(e.target.value)})} /></div>
                <div><label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Ngày khai giảng</label><input type="date" className="w-full p-4 border-2 border-slate-100 rounded-2xl font-bold outline-none" value={classFormData.startDate} onChange={(e) => setClassFormData({...classFormData, startDate: e.target.value})} /></div>
              </div>
              
              <div className="space-y-4">
                 <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Thiết lập lịch học cố định</label>
                 <div className="grid grid-cols-1 gap-3">
                   {classFormData.schedule?.map((s, idx) => (
                     <div key={idx} className="flex gap-3 bg-slate-50 p-4 rounded-2xl items-center">
                       <select className="bg-transparent font-bold outline-none text-slate-700" value={s.dayOfWeek} onChange={(e) => {
                         const newSchedule = [...(classFormData.schedule || [])];
                         newSchedule[idx].dayOfWeek = parseInt(e.target.value) as DayOfWeek;
                         setClassFormData({...classFormData, schedule: newSchedule});
                       }}>
                         {days.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                       </select>
                       <input type="time" className="bg-transparent font-bold outline-none text-red-600" value={s.startTime} onChange={(e) => {
                         const newSchedule = [...(classFormData.schedule || [])];
                         newSchedule[idx].startTime = e.target.value;
                         setClassFormData({...classFormData, schedule: newSchedule});
                       }} />
                       <span className="text-slate-300">→</span>
                       <input type="time" className="bg-transparent font-bold outline-none text-red-600" value={s.endTime} onChange={(e) => {
                         const newSchedule = [...(classFormData.schedule || [])];
                         newSchedule[idx].endTime = e.target.value;
                         setClassFormData({...classFormData, schedule: newSchedule});
                       }} />
                       <button onClick={() => setClassFormData({...classFormData, schedule: classFormData.schedule?.filter((_, i) => i !== idx)})} className="ml-auto text-slate-300 hover:text-red-600 transition-colors">✕</button>
                     </div>
                   ))}
                   <button onClick={() => setClassFormData({...classFormData, schedule: [...(classFormData.schedule || []), { dayOfWeek: DayOfWeek.Monday, startTime: '18:00', endTime: '19:30' }]})} className="w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl text-[10px] font-black uppercase text-slate-400 hover:border-red-200 hover:text-red-600 transition-all">＋ Thêm buổi học trong tuần</button>
                 </div>
              </div>
            </div>
            <div className="p-8 bg-slate-50 border-t flex gap-4"><button onClick={() => {setIsCreateModalOpen(false); setIsEditModalOpen(false);}} className="flex-1 py-4 font-black text-slate-400 uppercase tracking-widest hover:bg-slate-100 rounded-2xl transition-all">Hủy</button><button onClick={() => handleSaveClass(isCreateModalOpen ? 'create' : 'edit')} className={`flex-[2] py-4 font-black text-white uppercase tracking-widest rounded-2xl shadow-xl transition-all ${isCreateModalOpen ? 'bg-red-600 shadow-red-100 hover:bg-red-700' : 'bg-blue-600 shadow-blue-100 hover:bg-blue-700'}`}>{isCreateModalOpen ? 'Xác nhận mở lớp' : 'Cập nhật lớp'}</button></div>
          </div>
        </div>
      )}

      {/* MODAL QUẢN LÝ HỌC VIÊN TRONG LỚP */}
      {isDetailModalOpen && selectedClass && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col animate-in zoom-in duration-200">
            <div className="p-8 bg-slate-900 text-white flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-black uppercase tracking-tight">{selectedClass.name}</h3>
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1">Danh sách học viên đăng ký ({enrollments.filter(e => e.classId === selectedClass.id).length}/{selectedClass.maxStudents})</p>
              </div>
              <button onClick={() => setIsDetailModalOpen(false)} className="text-white/60 hover:text-white text-2xl">✕</button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-10 flex flex-col md:flex-row gap-8">
              {/* Danh sách hiện tại */}
              <div className="flex-1 space-y-4">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Học viên chính thức</h4>
                <div className="grid grid-cols-1 gap-3">
                  {enrollments.filter(e => e.classId === selectedClass.id).map(en => (
                    <div key={en.id} className="flex items-center justify-between p-5 bg-slate-50 rounded-2xl border-2 border-transparent hover:border-red-600 transition-all group">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center font-black text-red-600 shadow-sm">{students.find(s => s.id === en.studentId)?.name.charAt(0)}</div>
                        <div>
                          <p className="font-black text-slate-800">{students.find(s => s.id === en.studentId)?.name}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase">{students.find(s => s.id === en.studentId)?.phone}</p>
                        </div>
                      </div>
                      <button onClick={() => setEnrollments(prev => prev.filter(e => e.id !== en.id))} className="p-2 text-slate-300 hover:text-red-600 transition-all">🗑️</button>
                    </div>
                  ))}
                  {enrollments.filter(e => e.classId === selectedClass.id).length === 0 && (
                    <div className="py-20 text-center text-slate-300 font-bold uppercase tracking-widest text-[10px] italic border-2 border-dashed border-slate-100 rounded-3xl">Chưa có học viên nào</div>
                  )}
                </div>
              </div>

              {/* Form thêm học viên */}
              <div className="w-full md:w-80 space-y-4">
                <div className="bg-slate-900 p-6 rounded-[2rem] text-white">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-white/50 mb-4">Thêm học viên vào lớp</h4>
                  <div className="relative mb-4">
                    <input 
                      type="text" 
                      placeholder="Tìm tên/SĐT..." 
                      className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:bg-white/20 transition-all"
                      value={studentSearch}
                      onChange={(e) => setStudentSearch(e.target.value)}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 opacity-50 text-xs">🔍</span>
                  </div>
                  
                  <div className="max-h-60 overflow-y-auto space-y-2 no-scrollbar pr-1">
                    {availableStudents.length > 0 ? availableStudents.map(student => (
                      <button 
                        key={student.id} 
                        onClick={() => handleAddStudentToClass(student)}
                        className="w-full text-left p-3 rounded-xl bg-white/5 hover:bg-red-600 transition-all flex items-center justify-between group"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-bold truncate">{student.name}</p>
                          <p className="text-[9px] text-white/40 group-hover:text-white/60 font-bold uppercase">{student.phone}</p>
                        </div>
                        <span className="text-lg opacity-0 group-hover:opacity-100 transition-opacity">＋</span>
                      </button>
                    )) : (
                      <p className="text-[10px] text-white/20 text-center py-4 italic uppercase font-bold tracking-widest">Không tìm thấy học viên</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-8 bg-slate-50 border-t flex justify-end">
              <button onClick={() => setIsDetailModalOpen(false)} className="px-12 py-4 bg-slate-900 text-white font-black uppercase tracking-widest rounded-2xl hover:bg-slate-800 shadow-lg shadow-slate-200 transition-all">Hoàn tất</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassManager;
