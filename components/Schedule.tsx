
import React, { useState, useMemo } from 'react';
import { Class, Teacher, Assistant, TAWorkLog, DayOfWeek, Enrollment, Student, Attendance, AttendanceStatus, MakeupLesson, StudentAttendance } from '../types';
import { formatCurrency } from '../utils/financeUtils';

interface ScheduleProps {
  classes: Class[];
  teachers: Teacher[];
  assistants: Assistant[];
  taWorkLogs: TAWorkLog[];
  setTaWorkLogs: React.Dispatch<React.SetStateAction<TAWorkLog[]>>;
  enrollments: Enrollment[];
  students: Student[];
  attendanceRecords: Attendance[];
  setAttendanceRecords: React.Dispatch<React.SetStateAction<Attendance[]>>;
  makeupLessons: MakeupLesson[];
  setMakeupLessons: React.Dispatch<React.SetStateAction<MakeupLesson[]>>;
}

const Schedule: React.FC<ScheduleProps> = ({ 
  classes, teachers, assistants, taWorkLogs, setTaWorkLogs, enrollments, students, attendanceRecords, setAttendanceRecords, makeupLessons, setMakeupLessons 
}) => {
  const activeClasses = useMemo(() => classes.filter(c => c.status === 'active'), [classes]);

  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  });

  const [selectedClassForAttendance, setSelectedClassForAttendance] = useState<Class | null>(null);
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  
  const [selectedMakeupForAttendance, setSelectedMakeupForAttendance] = useState<MakeupLesson | null>(null);
  const [isMakeupAttendanceModalOpen, setIsMakeupAttendanceModalOpen] = useState(false);

  const [activeViewTab, setActiveViewTab] = useState<'calendar' | 'waitlist'>('calendar');
  const [attendanceDate, setAttendanceDate] = useState('');

  const [isMakeupModalOpen, setIsMakeupModalOpen] = useState(false);
  const [selectedWaitlistItem, setSelectedWaitlistItem] = useState<any>(null);
  const [makeupType, setMakeupType] = useState<'teacher' | 'assistant'>('teacher');
  const [makeupForm, setMakeupForm] = useState({
    teacherId: '',
    assistantId: '',
    date: new Date().toISOString().split('T')[0],
    startTime: '18:00',
    endTime: '19:30',
    teacherPay: 200000
  });

  const [tempStudentStatuses, setTempStudentStatuses] = useState<StudentAttendance[]>([]);
  const [tempTeacherPresent, setTempTeacherPresent] = useState(true);
  const [tempTeacherId, setTempTeacherId] = useState<string>('');
  const [tempAssistantId, setTempAssistantId] = useState<string>('');
  const [tempTaIn, setTempTaIn] = useState('18:00');
  const [tempTaOut, setTempTaOut] = useState('20:00');

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(currentWeekStart);
      d.setDate(d.getDate() + i);
      return {
        date: d,
        dateStr: d.toISOString().split('T')[0],
        label: i === 6 ? 'Chủ Nhật' : `Thứ ${i + 2}`,
        dayVal: d.getDay()
      };
    });
  }, [currentWeekStart]);

  const navigateWeek = (direction: number) => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() + direction * 7);
    setCurrentWeekStart(newDate);
  };

  const goToToday = () => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    setCurrentWeekStart(new Date(d.setDate(diff)));
  };

  const waitlist = useMemo(() => {
    const list: { studentId: string; classId: string; date: string; attendanceId: string }[] = [];
    attendanceRecords.forEach(record => {
      record.studentStatuses?.forEach(ss => {
        if (ss.status === 'absent-makeup') {
          const alreadyScheduled = makeupLessons.some(m => 
            m.originalAttendanceId === record.id && 
            m.studentId === ss.studentId &&
            m.status !== 'cancelled'
          );
          if (!alreadyScheduled) {
            list.push({ studentId: ss.studentId, classId: record.classId, date: record.date, attendanceId: record.id });
          }
        }
      });
    });
    return list;
  }, [attendanceRecords, makeupLessons]);

  const getSessionsForDay = (dayObj: { date: Date; dateStr: string; dayVal: number }) => {
    const items: { type: 'class' | 'makeup'; data: any; startTime: string; endTime: string; isAttended: boolean; assistantId?: string; isSubstitute?: boolean; displayTeacherId?: string; displayAssistantId?: string }[] = [];
    
    activeClasses.forEach(cls => {
      cls.schedule.forEach(session => {
        if (session.dayOfWeek === (dayObj.dayVal as DayOfWeek)) {
          const attendance = attendanceRecords.find(r => r.classId === cls.id && r.date === dayObj.dateStr);
          const isSub = attendance ? attendance.teacherId !== cls.teacherId : false;
          items.push({ 
            type: 'class', 
            data: cls, 
            startTime: session.startTime, 
            endTime: session.endTime,
            isAttended: !!attendance,
            assistantId: attendance?.assistantId || cls.assistantId,
            isSubstitute: isSub,
            displayTeacherId: attendance?.teacherId || cls.teacherId
          });
        }
      });
    });

    makeupLessons.forEach(m => {
      if (m.date === dayObj.dateStr && m.status !== 'cancelled') {
         items.push({ 
           type: 'makeup', 
           data: m, 
           startTime: m.startTime, 
           endTime: m.endTime,
           isAttended: m.status === 'completed',
           displayTeacherId: m.teacherId,
           displayAssistantId: m.assistantId
         });
      }
    });

    return items.sort((a, b) => a.startTime.localeCompare(b.startTime));
  };

  const handleOpenAttendance = (cls: Class, date: string) => {
    setSelectedClassForAttendance(cls);
    setAttendanceDate(date);
    
    // Lọc ra các học viên có đăng ký hợp lệ trong ngày này
    const validStudentIdsAtDate = enrollments
      .filter(e => e.classId === cls.id && date >= e.startDate && date <= e.endDate)
      .map(e => e.studentId);

    const existing = attendanceRecords.find(r => r.classId === cls.id && r.date === date);
    
    if (existing) {
      // Nếu đã có bản ghi điểm danh, ta lọc lại danh sách học viên trong bản ghi đó
      // để chỉ giữ lại những người có đăng ký hợp lệ (phòng trường hợp học viên mới được thêm vào lớp sau này)
      const filteredStatuses = (existing.studentStatuses || []).filter(ss => 
        validStudentIdsAtDate.includes(ss.studentId)
      );
      setTempStudentStatuses(filteredStatuses);
      setTempTeacherPresent(existing.teacherPresent);
      setTempTeacherId(existing.teacherId);
      setTempAssistantId(existing.assistantId || '');
      setTempTaIn(existing.taStartTime || '18:00');
      setTempTaOut(existing.taEndTime || '20:00');
    } else {
      // Nếu chưa có bản ghi, tạo mới dựa trên danh sách học viên có hiệu lực đăng ký
      setTempStudentStatuses(validStudentIdsAtDate.map(sid => ({ studentId: sid, status: 'present' as AttendanceStatus })));
      setTempTeacherPresent(true);
      setTempTeacherId(cls.teacherId);
      setTempAssistantId(cls.assistantId || '');
      setTempTaIn('18:00');
      setTempTaOut('20:00');
    }
    setIsAttendanceModalOpen(true);
  };

  const handleOpenMakeupAttendance = (makeup: MakeupLesson) => {
    setSelectedMakeupForAttendance(makeup);
    setIsMakeupAttendanceModalOpen(true);
  };

  const handleConfirmMakeupStatus = (status: 'completed' | 'cancelled') => {
    if (selectedMakeupForAttendance) {
      setMakeupLessons(prev => prev.map(m => m.id === selectedMakeupForAttendance.id ? { ...m, status } : m));
    }
    setIsMakeupAttendanceModalOpen(false);
  };

  const handleOpenMakeupModal = (item: any) => {
    setSelectedWaitlistItem(item);
    const cls = classes.find(c => c.id === item.classId);
    setMakeupType('teacher');
    setMakeupForm({
      teacherId: cls?.teacherId || teachers[0]?.id || '',
      assistantId: cls?.assistantId || assistants[0]?.id || '',
      date: new Date().toISOString().split('T')[0],
      startTime: '18:00',
      endTime: '19:30',
      teacherPay: 200000
    });
    setIsMakeupModalOpen(true);
  };

  const handleSaveMakeup = () => {
    if (!selectedWaitlistItem) return;
    const newMakeup: MakeupLesson = {
      id: `MAKEUP-${Date.now()}`,
      studentId: selectedWaitlistItem.studentId,
      originalClassId: selectedWaitlistItem.classId,
      originalAttendanceId: selectedWaitlistItem.attendanceId,
      date: makeupForm.date,
      startTime: makeupForm.startTime,
      endTime: makeupForm.endTime,
      teacherId: makeupType === 'teacher' ? makeupForm.teacherId : undefined,
      assistantId: makeupType === 'assistant' ? makeupForm.assistantId : undefined,
      teacherPay: makeupType === 'teacher' ? makeupForm.teacherPay : 0,
      status: 'scheduled'
    };
    setMakeupLessons(prev => [...prev, newMakeup]);
    setIsMakeupModalOpen(false);
    setActiveViewTab('calendar');
  };

  const handleSaveAttendance = () => {
    if (selectedClassForAttendance) {
      const newRecord: Attendance = {
        id: `ATT-${Date.now()}`,
        classId: selectedClassForAttendance.id,
        date: attendanceDate,
        studentStatuses: tempStudentStatuses,
        teacherId: tempTeacherId,
        teacherPresent: tempTeacherPresent,
        assistantId: tempAssistantId,
        taStartTime: tempTaIn,
        taEndTime: tempTaOut
      };

      setAttendanceRecords(prev => {
        const filtered = prev.filter(r => !(r.classId === selectedClassForAttendance.id && r.date === attendanceDate));
        return [...filtered, newRecord];
      });

      if (tempAssistantId) {
        const assistant = assistants.find(a => a.id === tempAssistantId);
        if (assistant) {
          const [h1, m1] = tempTaIn.split(':').map(Number);
          const [h2, m2] = tempTaOut.split(':').map(Number);
          const hours = ((h2 * 60 + m2) - (h1 * 60 + m1)) / 60;
          
          const newWorkLog: TAWorkLog = {
            id: `LOG-ATT-${Date.now()}`,
            assistantId: tempAssistantId,
            date: attendanceDate,
            startTime: tempTaIn,
            endTime: tempTaOut,
            totalHours: hours,
            payAmount: hours * assistant.hourlyRate,
            classId: selectedClassForAttendance.id,
            description: `Hỗ trợ lớp ${selectedClassForAttendance.name}`
          };

          setTaWorkLogs(prev => {
             const filtered = prev.filter(l => !(l.classId === selectedClassForAttendance.id && l.date === attendanceDate));
             return [newWorkLog, ...filtered];
          });
        }
      }
    }
    setIsAttendanceModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex bg-white p-1.5 rounded-2xl border shadow-sm w-fit">
          <button onClick={() => setActiveViewTab('calendar')} className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase transition-all ${activeViewTab === 'calendar' ? 'bg-red-600 text-white shadow-lg' : 'text-slate-400'}`}>Lịch học theo tuần</button>
          <button onClick={() => setActiveViewTab('waitlist')} className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase transition-all flex items-center gap-2 ${activeViewTab === 'waitlist' ? 'bg-amber-500 text-white shadow-lg' : 'text-slate-500'}`}>
            Chờ xếp học bù {waitlist.length > 0 && <span className="bg-white text-amber-600 w-4 h-4 rounded-full flex items-center justify-center text-[8px]">{waitlist.length}</span>}
          </button>
        </div>

        {activeViewTab === 'calendar' && (
          <div className="flex items-center gap-3 bg-white p-1.5 rounded-2xl border shadow-sm">
            <button onClick={() => navigateWeek(-1)} className="p-2.5 hover:bg-slate-50 rounded-xl text-slate-400 transition-colors">◀</button>
            <div className="px-4 text-center min-w-[180px]">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Tuần đang xem</p>
              <p className="text-xs font-black text-slate-800 uppercase">
                {weekDays[0].date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })} - {weekDays[6].date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
              </p>
            </div>
            <button onClick={() => navigateWeek(1)} className="p-2.5 hover:bg-slate-50 rounded-xl text-slate-400 transition-colors">▶</button>
            <div className="w-px h-6 bg-slate-100 mx-1"></div>
            <button onClick={goToToday} className="px-4 py-2.5 text-[10px] font-black text-red-600 uppercase hover:bg-red-50 rounded-xl transition-colors">Hiện tại</button>
          </div>
        )}
      </div>

      {activeViewTab === 'calendar' ? (
        <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 overflow-x-auto no-scrollbar">
          <div className="grid grid-cols-7 gap-4 min-w-[1000px]">
            {weekDays.map((day) => {
              const sessions = getSessionsForDay(day);
              const isToday = day.dateStr === new Date().toISOString().split('T')[0];
              
              return (
                <div key={day.dateStr} className="flex flex-col gap-3">
                  <div className={`p-4 rounded-[1.5rem] text-center transition-all ${
                    isToday ? 'bg-red-600 text-white shadow-xl shadow-red-100' : 'bg-slate-50 text-slate-400 border border-slate-100'
                  }`}>
                    <p className="font-black text-[10px] uppercase tracking-widest mb-1">{day.label}</p>
                    <p className={`text-sm font-black ${isToday ? 'text-white' : 'text-slate-800'}`}>{day.dateStr.split('-')[2]}/{day.dateStr.split('-')[1]}</p>
                  </div>
                  
                  <div className="space-y-3">
                    {sessions.map((session, idx) => (
                      <button 
                        key={idx}
                        onClick={() => {
                          if (session.type === 'class') handleOpenAttendance(session.data, day.dateStr);
                          else handleOpenMakeupAttendance(session.data);
                        }}
                        className={`w-full text-left p-5 border rounded-[1.8rem] shadow-sm hover:shadow-md transition-all relative overflow-hidden group ${
                          session.isAttended ? 'bg-green-50 border-green-100' : session.type === 'makeup' ? 'bg-purple-50 border-purple-100' : 'bg-white border-slate-100'
                        }`}
                      >
                        {session.isAttended && <div className="absolute top-2 right-2 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center text-[8px] text-white">✓</div>}
                        <div className="flex justify-between items-start mb-1">
                          <p className={`text-[9px] font-black uppercase ${session.type === 'makeup' ? 'text-purple-600' : 'text-red-600'}`}>
                            {session.startTime} - {session.endTime}
                          </p>
                          {session.isSubstitute && (
                            <span className="bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded text-[7px] font-black uppercase tracking-tighter animate-pulse">Dạy thay</span>
                          )}
                        </div>
                        <h4 className="text-[11px] font-black text-slate-800 leading-tight mb-2">{session.type === 'class' ? session.data.name : `Dạy bù: ${students.find(s => s.id === session.data.studentId)?.name}`}</h4>
                        <div className="space-y-1">
                           <div className="flex items-center gap-1.5 opacity-60">
                            <span className="text-[10px]">{session.displayAssistantId ? '🤝' : '👨‍🏫'}</span>
                            <p className="text-[9px] font-bold text-slate-500 uppercase truncate">
                              {session.displayAssistantId 
                                ? assistants.find(a => a.id === session.displayAssistantId)?.name 
                                : teachers.find(t => t.id === session.displayTeacherId)?.name}
                            </p>
                          </div>
                          {session.assistantId && !session.displayAssistantId && (
                            <div className="flex items-center gap-1.5 bg-slate-100/50 px-2 py-1 rounded-lg">
                              <span className="text-[10px]">🤝</span>
                              <p className="text-[8px] font-black text-slate-400 uppercase truncate">
                                {assistants.find(a => a.id === session.assistantId)?.name}
                              </p>
                            </div>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-sm animate-in fade-in duration-300">
          <div className="mb-6 border-b pb-6">
            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Học viên chờ xếp học bù</h3>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Học viên vắng có phép hoặc được chỉ định dạy bù</p>
          </div>
          <div className="space-y-4">
            {waitlist.length === 0 ? (
               <div className="py-20 text-center flex flex-col items-center">
                  <span className="text-4xl opacity-10 mb-4">💤</span>
                  <p className="text-slate-300 font-black uppercase text-[10px] tracking-widest italic">Danh sách đang trống</p>
               </div>
            ) : (
              waitlist.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-6 bg-slate-50 rounded-[2rem] border border-transparent hover:border-amber-200 transition-all group">
                  <div className="flex items-center gap-6">
                    <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center font-black text-amber-600 shadow-sm text-lg">
                      {students.find(s => s.id === item.studentId)?.name.charAt(0)}
                    </div>
                    <div>
                      <h5 className="text-lg font-black text-slate-800">{students.find(s => s.id === item.studentId)?.name}</h5>
                      <div className="flex gap-4 mt-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Lớp: <span className="text-slate-600">{classes.find(c => c.id === item.classId)?.name}</span></p>
                        <p className="text-[10px] font-black text-red-400 uppercase tracking-widest">Ngày vắng: <span className="text-red-600">{item.date}</span></p>
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleOpenMakeupModal(item)}
                    className="bg-amber-500 text-white px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-amber-100 hover:bg-amber-600 transition-all hover:scale-105"
                  >
                    Xếp lịch ngay
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* MODAL ĐIỂM DANH LỚP CHÍNH */}
      {isAttendanceModalOpen && selectedClassForAttendance && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-[60] p-4">
          <div className="bg-white w-full max-w-2xl max-h-[90vh] rounded-[3rem] overflow-hidden shadow-2xl flex flex-col animate-in zoom-in duration-200">
            <div className="p-8 bg-slate-900 text-white">
              <h3 className="text-2xl font-black uppercase tracking-tight">{selectedClassForAttendance.name}</h3>
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1">Điểm danh & Chấm công - Ngày {attendanceDate}</p>
            </div>
            
            <div className="flex-1 overflow-y-auto p-10 space-y-8 no-scrollbar">
              <div className="bg-slate-50 p-6 rounded-[2.5rem] border border-slate-100">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">👨‍🏫</span>
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Xác nhận Giáo viên dạy buổi này</h4>
                  </div>
                </div>
                <div className="flex flex-col md:flex-row gap-4 items-center">
                  <select 
                    className="flex-1 w-full p-4 bg-white border-0 rounded-2xl font-black text-slate-800 shadow-sm outline-none" 
                    value={tempTeacherId} 
                    onChange={(e) => setTempTeacherId(e.target.value)}
                  >
                    {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                  <button 
                    onClick={() => setTempTeacherPresent(!tempTeacherPresent)} 
                    className={`whitespace-nowrap px-8 py-4 rounded-2xl text-[10px] font-black uppercase transition-all shadow-md ${
                      tempTeacherPresent ? 'bg-green-600 text-white shadow-green-100' : 'bg-red-50 text-red-600 shadow-red-50 border border-red-100'
                    }`}
                  >
                    {tempTeacherPresent ? 'ĐÃ ĐẾN DẠY' : 'VẮNG MẶT'}
                  </button>
                </div>
              </div>

              <div className="bg-red-50/50 p-6 rounded-[2.5rem] border border-red-100/50">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-xl">🤝</span>
                  <h4 className="text-[10px] font-black text-red-400 uppercase tracking-widest">Chấm công Trợ giảng (TA)</h4>
                </div>
                <div className="space-y-4">
                  <select 
                    className="w-full p-4 bg-white border-0 rounded-2xl font-black text-slate-800 shadow-sm outline-none" 
                    value={tempAssistantId} 
                    onChange={(e) => setTempAssistantId(e.target.value)}
                  >
                    <option value="">-- Không có trợ giảng buổi này --</option>
                    {assistants.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                  
                  {tempAssistantId && (
                    <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
                      <div>
                        <label className="block text-[9px] font-black text-red-400 uppercase mb-1 ml-2">Giờ vào</label>
                        <input type="time" className="w-full p-3 bg-white border-0 rounded-xl font-black outline-none shadow-sm" value={tempTaIn} onChange={(e) => setTempTaIn(e.target.value)} />
                      </div>
                      <div>
                        <label className="block text-[9px] font-black text-red-400 uppercase mb-1 ml-2">Giờ ra</label>
                        <input type="time" className="w-full p-3 bg-white border-0 rounded-xl font-black outline-none shadow-sm" value={tempTaOut} onChange={(e) => setTempTaOut(e.target.value)} />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3 mb-2 ml-4">
                  <span className="text-xl">🎓</span>
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Học viên ({tempStudentStatuses.length})</h4>
                </div>
                {tempStudentStatuses.map(ss => (
                  <div key={ss.studentId} className="flex items-center justify-between p-5 bg-white border border-slate-100 rounded-[2rem] hover:shadow-md transition-all group">
                    <span className="font-black text-slate-700">{students.find(s => s.id === ss.studentId)?.name}</span>
                    <div className="flex gap-1">
                      {(['present', 'absent', 'absent-makeup'] as const).map(status => (
                        <button 
                          key={status} 
                          onClick={() => setTempStudentStatuses(prev => prev.map(s => s.studentId === ss.studentId ? { ...s, status } : s))} 
                          className={`px-3 py-2 rounded-xl text-[8px] font-black uppercase transition-all ${
                            ss.status === status 
                              ? status === 'present' ? 'bg-green-600 text-white shadow-lg' : status === 'absent' ? 'bg-slate-900 text-white shadow-lg' : 'bg-amber-500 text-white shadow-lg'
                              : 'bg-slate-50 text-slate-400'
                          }`}
                        >
                          {status === 'present' ? 'CÓ MẶT' : status === 'absent' ? 'VẮNG' : 'BÙ'}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
                {tempStudentStatuses.length === 0 && (
                  <div className="p-10 text-center border-2 border-dashed rounded-[2rem] text-slate-300 font-bold text-xs uppercase italic">
                    Không có học viên nào đăng ký học trong ngày này
                  </div>
                )}
              </div>
            </div>

            <div className="p-8 bg-slate-50 border-t flex gap-4">
              <button onClick={() => setIsAttendanceModalOpen(false)} className="flex-1 py-5 font-black text-slate-400 uppercase tracking-widest hover:bg-slate-100 rounded-2xl transition-all">Hủy</button>
              <button onClick={handleSaveAttendance} className="flex-[2] py-5 bg-red-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-red-100 hover:bg-red-700 transition-all">Lưu & Hoàn tất buổi học</button>
            </div>
          </div>
        </div>
      )}

      {/* Makeup Modals (giữ nguyên logic gốc) */}
      {isMakeupAttendanceModalOpen && selectedMakeupForAttendance && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-[70] p-4">
          <div className="bg-white w-full max-w-md rounded-[3rem] overflow-hidden shadow-2xl animate-in zoom-in duration-200">
            <div className="p-8 bg-purple-600 text-white text-center">
              <h3 className="text-2xl font-black uppercase tracking-tight">Xác nhận buổi dạy bù</h3>
              <p className="text-purple-100 text-[10px] font-black uppercase tracking-widest mt-1">Học viên: {students.find(s => s.id === selectedMakeupForAttendance.studentId)?.name}</p>
            </div>
            <div className="p-10 space-y-6">
              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 text-center">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Thời gian</p>
                <p className="text-lg font-black text-slate-800">{selectedMakeupForAttendance.date} | {selectedMakeupForAttendance.startTime} - {selectedMakeupForAttendance.endTime}</p>
              </div>
              <div className="space-y-3">
                <button onClick={() => handleConfirmMakeupStatus('completed')} className="w-full bg-green-600 text-white py-5 rounded-2xl font-black text-xs uppercase shadow-xl hover:bg-green-700 transition-all">✓ XÁC NHẬN HOÀN THÀNH</button>
                <button onClick={() => handleConfirmMakeupStatus('cancelled')} className="w-full bg-slate-100 text-slate-400 py-4 rounded-2xl font-black text-[10px] uppercase hover:bg-red-50 hover:text-red-600 transition-all">✕ HỦY / DỜI LỊCH</button>
              </div>
              <button onClick={() => setIsMakeupAttendanceModalOpen(false)} className="w-full py-2 text-slate-300 font-black text-[9px] uppercase hover:text-slate-500 transition-colors">Quay lại</button>
            </div>
          </div>
        </div>
      )}

      {/* Makeup Scheduling Modal (giữ nguyên logic gốc) */}
      {isMakeupModalOpen && selectedWaitlistItem && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-[70] p-4">
          <div className="bg-white w-full max-w-lg rounded-[3rem] overflow-hidden shadow-2xl animate-in zoom-in duration-200">
            <div className="p-8 bg-amber-500 text-white">
              <h3 className="text-2xl font-black uppercase tracking-tight">Xếp lịch dạy bù</h3>
              <p className="text-amber-100 text-[10px] font-black uppercase tracking-widest mt-1">Học viên: {students.find(s => s.id === selectedWaitlistItem.studentId)?.name}</p>
            </div>
            <div className="p-10 space-y-6">
              <div className="flex bg-slate-100 p-1 rounded-2xl">
                <button onClick={() => setMakeupType('teacher')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${makeupType === 'teacher' ? 'bg-white text-slate-900 shadow-md' : 'text-slate-400'}`}>Giáo viên dạy</button>
                <button onClick={() => setMakeupType('assistant')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${makeupType === 'assistant' ? 'bg-white text-slate-900 shadow-md' : 'text-slate-400'}`}>Trợ giảng dạy</button>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Ngày dạy bù</label>
                <input type="date" className="w-full p-4 bg-slate-50 border-0 rounded-2xl font-black" value={makeupForm.date} onChange={(e) => setMakeupForm({...makeupForm, date: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Giờ bắt đầu</label><input type="time" className="w-full p-4 bg-slate-50 border-0 rounded-2xl font-black" value={makeupForm.startTime} onChange={(e) => setMakeupForm({...makeupForm, startTime: e.target.value})} /></div>
                <div><label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Giờ kết thúc</label><input type="time" className="w-full p-4 bg-slate-50 border-0 rounded-2xl font-black" value={makeupForm.endTime} onChange={(e) => setMakeupForm({...makeupForm, endTime: e.target.value})} /></div>
              </div>
              <div className="pt-4 flex gap-4">
                <button onClick={() => setIsMakeupModalOpen(false)} className="flex-1 py-5 font-black text-slate-400 uppercase hover:bg-slate-50 rounded-2xl transition-all">Hủy</button>
                <button onClick={handleSaveMakeup} className="flex-[2] py-5 bg-slate-900 text-white font-black uppercase rounded-2xl shadow-xl hover:bg-black transition-all">Xác nhận lịch học</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Schedule;
