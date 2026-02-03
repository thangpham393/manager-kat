
import React, { useState, useEffect, useMemo } from 'react';
import { Student, Attendance, Class, Enrollment, Transaction, MakeupLesson } from '../types';
import { formatCurrency, calculateSessionsBetweenDates, calculateEndDateFromSessions, numberToVietnameseWords } from '../utils/financeUtils';
import html2canvas from 'html2canvas';

interface StudentManagerProps {
  students: Student[];
  setStudents: React.Dispatch<React.SetStateAction<Student[]>>;
  attendanceRecords: Attendance[];
  setAttendanceRecords: React.Dispatch<React.SetStateAction<Attendance[]>>;
  classes: Class[];
  enrollments: Enrollment[];
  setEnrollments: React.Dispatch<React.SetStateAction<Enrollment[]>>;
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
  makeupLessons: MakeupLesson[];
}

const StudentManager: React.FC<StudentManagerProps> = ({ 
  students, setStudents, attendanceRecords, setAttendanceRecords, classes, enrollments, setEnrollments, setTransactions, makeupLessons 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'list' | 'pending' | 'expiring'>('list');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [deletingStudentId, setDeletingStudentId] = useState<string | null>(null);
  
  const [selectedStudentForTuition, setSelectedStudentForTuition] = useState<Student | null>(null);
  const [isTuitionModalOpen, setIsTuitionModalOpen] = useState(false);
  
  const [selectedEnrollmentForDetail, setSelectedEnrollmentForDetail] = useState<Enrollment | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [debtPaymentAmount, setDebtPaymentAmount] = useState<number>(0);

  // Print state
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printEnrollment, setPrintEnrollment] = useState<Enrollment | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const activeClasses = useMemo(() => classes.filter(c => c.status === 'active'), [classes]);

  const [tuitionForm, setTuitionForm] = useState({
    classId: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    sessions: 12,
    tuitionPerSession: 300000, 
    materialFee: 0,
    paidAmount: 0,
    totalTuition: 3600000
  });

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    status: 'active' as 'active' | 'inactive'
  });

  useEffect(() => {
    if (selectedEnrollmentForDetail) {
      setDebtPaymentAmount(selectedEnrollmentForDetail.totalTuition - selectedEnrollmentForDetail.paidAmount);
    }
  }, [selectedEnrollmentForDetail]);

  useEffect(() => {
    const selectedClass = activeClasses.find(c => c.id === tuitionForm.classId);
    if (!selectedClass || !tuitionForm.startDate || !tuitionForm.endDate) return;

    const sessions = calculateSessionsBetweenDates(tuitionForm.startDate, tuitionForm.endDate, selectedClass.schedule);
    const total = (sessions * tuitionForm.tuitionPerSession) + tuitionForm.materialFee;
    
    setTuitionForm(prev => ({ 
      ...prev, 
      sessions, 
      totalTuition: total,
      paidAmount: prev.paidAmount > 0 ? prev.paidAmount : total
    }));
  }, [tuitionForm.startDate, tuitionForm.endDate, tuitionForm.classId, tuitionForm.tuitionPerSession, tuitionForm.materialFee, activeClasses]);

  const handleSessionsChange = (val: number) => {
    const selectedClass = activeClasses.find(c => c.id === tuitionForm.classId);
    if (!selectedClass) return;

    const endDate = calculateEndDateFromSessions(tuitionForm.startDate, val, selectedClass.schedule);
    const total = (val * tuitionForm.tuitionPerSession) + tuitionForm.materialFee;
    setTuitionForm(prev => ({ 
      ...prev, 
      sessions: val, 
      endDate,
      totalTuition: total,
      paidAmount: total
    }));
  };

  const handleOpenTuition = (student: Student) => {
    setSelectedStudentForTuition(student);
    const defaultClass = activeClasses[0];
    const initialStartDate = new Date().toISOString().split('T')[0];
    const initialSessions = 12;
    const initialRate = 300000;
    const initialMaterial = 0;
    
    let initialEndDate = '';
    if (defaultClass) {
      initialEndDate = calculateEndDateFromSessions(initialStartDate, initialSessions, defaultClass.schedule);
    }

    const total = (initialSessions * initialRate) + initialMaterial;

    setTuitionForm({
      classId: defaultClass?.id || '',
      startDate: initialStartDate,
      endDate: initialEndDate,
      sessions: initialSessions,
      tuitionPerSession: initialRate,
      materialFee: initialMaterial,
      paidAmount: total,
      totalTuition: total
    });
    
    setIsTuitionModalOpen(true);
  };

  const handleSaveTuition = () => {
    if (!selectedStudentForTuition || !tuitionForm.classId) return;

    const status = tuitionForm.paidAmount >= tuitionForm.totalTuition ? 'paid' : 
                   tuitionForm.paidAmount > 0 ? 'partial' : 'unpaid';

    const newEnrollment: Enrollment = {
      id: `E-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      studentId: selectedStudentForTuition.id,
      classId: tuitionForm.classId,
      startDate: tuitionForm.startDate,
      endDate: tuitionForm.endDate,
      calculatedSessions: tuitionForm.sessions,
      tuitionPerSession: tuitionForm.tuitionPerSession,
      materialFee: tuitionForm.materialFee,
      totalTuition: tuitionForm.totalTuition,
      paidAmount: tuitionForm.paidAmount,
      status: status
    };

    setEnrollments(prev => [...prev, newEnrollment]);

    if (tuitionForm.paidAmount > 0) {
      const className = activeClasses.find(c => c.id === tuitionForm.classId)?.name || 'N/A';
      setTransactions(prev => [...prev, {
        id: `TX-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: 'income',
        category: 'Học phí',
        amount: tuitionForm.paidAmount,
        date: new Date().toISOString().split('T')[0],
        description: `Thu phí học viên ${selectedStudentForTuition.name} - Lớp ${className}`
      }]);
    }

    setIsTuitionModalOpen(false);
  };

  const handleUpdatePayment = () => {
    if (!selectedEnrollmentForDetail || debtPaymentAmount <= 0) return;

    // 1. Tạo giao dịch tài chính trước (đảm bảo id duy nhất)
    const student = students.find(s => s.id === selectedEnrollmentForDetail.studentId);
    const className = classes.find(c => c.id === selectedEnrollmentForDetail.classId)?.name || 'N/A';
    
    setTransactions(prev => [...prev, {
      id: `TX-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'income',
      category: 'Học phí',
      amount: debtPaymentAmount,
      date: new Date().toISOString().split('T')[0],
      description: `Thu nợ học phí học viên ${student?.name} - Lớp ${className}`
    }]);

    // 2. Cập nhật trạng thái đóng học phí của học viên (không lồng setTransactions vào đây)
    setEnrollments(prev => prev.map(e => {
      if (e.id === selectedEnrollmentForDetail.id) {
        const newPaid = e.paidAmount + debtPaymentAmount;
        const newStatus = newPaid >= e.totalTuition ? 'paid' : 'partial';
        return { ...e, paidAmount: newPaid, status: newStatus };
      }
      return e;
    }));
    
    setIsDetailModalOpen(false);
  };

  const confirmDeleteStudent = (id: string) => {
    setStudents(prev => prev.filter(s => s.id !== id));
    setEnrollments(prev => prev.filter(e => e.studentId !== id));
    setDeletingStudentId(null);
  };

  const enrollmentDetails = useMemo(() => {
    return enrollments.map(en => {
      const mainSessionsConsumed = attendanceRecords.filter(r => 
        r.classId === en.classId && 
        r.studentStatuses?.some(ss => ss.studentId === en.studentId && ss.status !== 'absent-makeup')
      ).length;

      const makeupSessionsConsumed = makeupLessons.filter(m => 
        m.studentId === en.studentId && 
        m.originalClassId === en.classId && 
        m.status === 'completed'
      ).length;

      const attendedCount = mainSessionsConsumed + makeupSessionsConsumed;
      const remaining = Math.max(0, en.calculatedSessions - attendedCount);
      return { ...en, attendedCount, remaining };
    });
  }, [enrollments, attendanceRecords, makeupLessons]);

  const handleOpenPrintPreview = (en: Enrollment) => {
    setPrintEnrollment(en);
    setIsPrintModalOpen(true);
  };

  const handleDownloadImage = async () => {
    const element = document.querySelector('.print-area') as HTMLElement;
    if (!element) return;
    
    setIsExporting(true);
    try {
      const canvas = await html2canvas(element, {
        scale: 2, 
        useCORS: true,
        backgroundColor: '#ffffff'
      });
      
      const image = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      const studentName = students.find(s => s.id === printEnrollment?.studentId)?.name || 'hoc-vien';
      link.download = `Phieu-Bao-Hoc-Phi-${studentName}.png`;
      link.href = image;
      link.click();
    } catch (err) {
      console.error("Lỗi xuất ảnh:", err);
      alert("Không thể tải ảnh. Vui lòng thử lại.");
    } finally {
      setIsExporting(false);
    }
  };

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.phone.includes(searchTerm)
  );

  const pendingEnrollments = enrollmentDetails.filter(e => e.status !== 'paid');
  const expiringEnrollments = enrollmentDetails.filter(e => e.remaining <= 2);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex bg-white p-1 rounded-2xl border shadow-sm w-full md:w-auto overflow-x-auto no-scrollbar">
          <button onClick={() => setActiveTab('list')} className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${activeTab === 'list' ? 'bg-red-600 text-white shadow-lg' : 'text-slate-500'}`}>Học viên</button>
          <button onClick={() => setActiveTab('pending')} className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === 'pending' ? 'bg-amber-500 text-white shadow-lg' : 'text-slate-500'}`}>
            Nợ phí {pendingEnrollments.length > 0 && <span className="bg-white text-amber-600 w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-black">{pendingEnrollments.length}</span>}
          </button>
          <button onClick={() => setActiveTab('expiring')} className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === 'expiring' ? 'bg-red-900 text-white shadow-lg' : 'text-slate-500'}`}>
            Sắp hết hạn {expiringEnrollments.length > 0 && <span className="bg-white text-red-900 w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-black animate-pulse">{expiringEnrollments.length}</span>}
          </button>
        </div>

        <div className="flex gap-2 flex-1 w-full max-w-md">
          <div className="relative flex-1">
            <input type="text" placeholder="Tìm tên hoặc số điện thoại..." className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-red-500 shadow-sm transition-all font-medium" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            <span className="absolute left-4 top-1/2 -translate-y-1/2 opacity-50">🔍</span>
          </div>
          <button onClick={() => { setEditingStudent(null); setFormData({name: '', phone: '', email: '', status: 'active'}); setIsModalOpen(true); }} className="bg-red-600 text-white px-5 rounded-2xl font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-100">＋ Thêm mới</button>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-100 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">
              <tr>
                <th className="px-8 py-5">Học viên</th>
                <th className="px-8 py-5">Lớp đang theo học</th>
                <th className="px-8 py-5">Trạng thái phí</th>
                <th className="px-8 py-5 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {activeTab === 'list' && filteredStudents.map((student) => {
                const studentEnrolls = enrollmentDetails.filter(e => e.studentId === student.id);
                const isDeleting = deletingStudentId === student.id;
                
                return (
                  <tr key={student.id} className="hover:bg-slate-50/50 transition-colors group relative">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-slate-100 text-slate-400 rounded-xl flex items-center justify-center font-bold text-sm uppercase">
                          {student.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">{student.name}</p>
                          <p className="text-xs text-slate-400 font-medium">{student.phone}</p>
                        </div>
                      </div>
                      {isDeleting && (
                        <div className="absolute inset-0 bg-red-600/95 backdrop-blur-sm z-20 flex items-center px-8 text-white animate-in slide-in-from-left-2">
                          <p className="font-bold text-xs uppercase tracking-widest flex-1">Xóa học viên {student.name}?</p>
                          <div className="flex gap-2">
                            <button onClick={() => confirmDeleteStudent(student.id)} className="bg-white text-red-600 px-4 py-1.5 rounded-lg font-black text-[10px] uppercase">Xóa</button>
                            <button onClick={() => setDeletingStudentId(null)} className="bg-black/20 text-white px-4 py-1.5 rounded-lg font-black text-[10px] uppercase">Hủy</button>
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex flex-wrap gap-2">
                        {studentEnrolls.length > 0 ? studentEnrolls.map((en, i) => (
                          <div key={i} className="flex flex-col group/en relative">
                            <span className={`px-2 py-1 rounded-lg text-[10px] font-bold border ${en.remaining <= 1 ? 'bg-red-50 border-red-100 text-red-600' : 'bg-blue-50 border-blue-100 text-blue-600'}`}>
                              🏮 {classes.find(c => c.id === en.classId)?.name}
                            </span>
                            <span className="text-[9px] font-black text-slate-400 mt-0.5 ml-1 uppercase">CÒN {en.remaining} BUỔI</span>
                            <button onClick={() => handleOpenPrintPreview(en)} className="absolute -right-1 -top-1 bg-slate-900 text-white w-5 h-5 rounded-full flex items-center justify-center text-[8px] opacity-0 group-hover/en:opacity-100 transition-all shadow-lg" title="Xem phiếu báo">📑</button>
                          </div>
                        )) : <span className="text-[10px] text-slate-300 italic">Chưa đăng ký lớp</span>}
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex flex-col gap-1">
                        {studentEnrolls.map((en, i) => (
                          <span key={i} className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md self-start ${en.status === 'paid' ? 'bg-green-100 text-green-700' : en.status === 'partial' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                            {en.status === 'paid' ? 'Đã đóng đủ' : en.status === 'partial' ? 'Nợ học phí' : 'Chưa đóng'}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleOpenTuition(student)} className="p-2 hover:bg-green-50 text-green-600 rounded-lg" title="Đăng ký & Thu phí">💰</button>
                        <button onClick={() => { setEditingStudent(student); setFormData({ name: student.name, phone: student.phone, email: student.email, status: student.status }); setIsModalOpen(true); }} className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg">✏️</button>
                        <button onClick={() => setDeletingStudentId(student.id)} className="p-2 hover:bg-red-50 text-red-400">🗑️</button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {activeTab === 'pending' && pendingEnrollments.map((en) => {
                const student = students.find(s => s.id === en.studentId);
                const cls = classes.find(c => c.id === en.classId);
                const balance = en.totalTuition - en.paidAmount;
                return (
                  <tr key={en.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-8 py-5">
                      <p className="font-bold text-slate-800">{student?.name}</p>
                      <p className="text-xs text-slate-400">🏮 {cls?.name}</p>
                    </td>
                    <td className="px-8 py-5">
                      <p className="text-xs font-bold text-slate-600">{en.startDate} → {en.endDate}</p>
                      <p className="text-[10px] font-medium text-slate-400">Số buổi: {en.calculatedSessions}</p>
                    </td>
                    <td className="px-8 py-5">
                      <p className="text-sm font-black text-red-600">{formatCurrency(balance)}</p>
                      <p className="text-[9px] text-slate-400 uppercase font-bold">Còn {en.remaining} buổi học</p>
                    </td>
                    <td className="px-8 py-5 text-right flex justify-end gap-2">
                      <button onClick={() => handleOpenPrintPreview(en)} className="p-2 hover:bg-slate-100 text-slate-600 rounded-xl" title="Xem phiếu báo">📑</button>
                      <button onClick={() => { setSelectedEnrollmentForDetail(en); setIsDetailModalOpen(true); }} className="bg-slate-900 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase hover:bg-slate-800 transition-all">Thu nợ ngay</button>
                    </td>
                  </tr>
                );
              })}

              {activeTab === 'expiring' && expiringEnrollments.map((en) => {
                const student = students.find(s => s.id === en.studentId);
                const cls = classes.find(c => c.id === en.classId);
                const progress = (en.attendedCount / en.calculatedSessions) * 100;
                return (
                  <tr key={en.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-8 py-5">
                      <p className="font-bold text-slate-800">{student?.name}</p>
                      <p className="text-xs text-slate-400">🏮 {cls?.name}</p>
                    </td>
                    <td className="px-8 py-5">
                      <p className="text-xs font-bold text-slate-600">Học {en.attendedCount}/{en.calculatedSessions}b</p>
                      <p className="text-[10px] text-red-600 font-black uppercase">Còn {en.remaining} buổi</p>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex flex-col gap-1">
                         <div className="w-32 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-red-600 transition-all" style={{ width: `${progress}%` }}></div>
                        </div>
                        <span className={`text-[8px] font-black uppercase ${en.status === 'paid' ? 'text-green-600' : 'text-amber-600'}`}>
                          {en.status === 'paid' ? 'Phí: OK' : 'CÒN NỢ PHÍ'}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-right flex justify-end gap-2">
                      <button onClick={() => handleOpenPrintPreview(en)} className="p-2 hover:bg-slate-100 text-slate-600 rounded-xl" title="Xem phiếu báo">📑</button>
                      <button onClick={() => student && handleOpenTuition(student)} className="bg-red-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase hover:bg-red-700 transition-all shadow-md">Gia hạn học phí</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* PREVIEW MODAL (TUITION RECEIPT - REDESIGNED PER KAT EDUCATION MOCKUP) */}
      {isPrintModalOpen && printEnrollment && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-[70] p-4">
          <div className="bg-white w-full max-w-2xl rounded-[1.5rem] overflow-hidden shadow-2xl flex flex-col">
            <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
              <h3 className="text-lg font-black uppercase tracking-tight">Thông báo học phí học viên</h3>
              <button onClick={() => setIsPrintModalOpen(false)} className="text-white/60 hover:text-white text-2xl">✕</button>
            </div>
            
            <div className="p-6 bg-slate-100 overflow-y-auto max-h-[70vh] no-scrollbar">
              <div className="print-area bg-white text-slate-900 shadow-sm p-12 min-h-[842px] w-full max-w-[595px] mx-auto flex flex-col">
                {/* Header with Logo and Info */}
                <div className="flex justify-between items-start mb-8">
                  <div className="flex gap-4 items-center">
                    {/* Simplified Logo to match Mockup */}
                    <div className="w-20 h-20 relative shrink-0">
                      <div className="absolute inset-0 border-2 border-red-600 rounded-full"></div>
                      <div className="absolute inset-1 border border-blue-800 rounded-full flex flex-col items-center justify-center text-center p-1 bg-white">
                        <span className="text-[12px] font-black text-red-600 leading-none">KAT</span>
                        <span className="text-[6px] font-bold text-blue-800 leading-none mt-0.5">EDUCATION</span>
                      </div>
                    </div>
                    <div className="max-w-[300px]">
                      <h2 className="text-xl font-bold text-slate-800">KAT EDUCATION</h2>
                      <div className="text-[9px] text-slate-700 leading-tight mt-1 space-y-0.5">
                        <p>Trụ sở Chính Thủ Đức: 47 Đường D2, KP1, Linh Tây, TP. Thủ Đức, TP.HCM</p>
                        <p>Chi Nhánh Vinhome Central Park: Vinhomes Central Park, Tòa C2</p>
                      </div>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="w-24 h-24 bg-white border border-slate-200 p-1 mb-1 mx-auto overflow-hidden">
                      <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=KAT_EDUCATION_PAYMENT" alt="QR" className="w-full h-full object-contain" />
                    </div>
                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">QR thanh toán</p>
                  </div>
                </div>

                {/* Title */}
                <h1 className="text-2xl font-bold text-center mb-10 uppercase tracking-[0.2em] border-b-0">THÔNG BÁO HỌC PHÍ</h1>

                {/* Body Details */}
                <div className="space-y-5 text-sm mb-12 flex-1">
                  <div className="flex">
                    <span className="w-36 shrink-0 text-slate-600">Họ và tên:</span>
                    <span className="font-bold text-slate-800">{students.find(s => s.id === printEnrollment.studentId)?.name}</span>
                  </div>
                  <div className="flex">
                    <span className="w-36 shrink-0 text-slate-600">Về khoản:</span>
                    <span className="font-bold text-slate-800 leading-relaxed">
                      Gói học phí: {printEnrollment.calculatedSessions} buổi. ({printEnrollment.startDate.split('-').reverse().join('/')} - {printEnrollment.endDate.split('-').reverse().join('/')}). Lớp: {classes.find(c => c.id === printEnrollment.classId)?.name}
                    </span>
                  </div>
                  <div className="flex">
                    <span className="w-36 shrink-0 text-slate-600">Học phí:</span>
                    <span className="font-bold text-slate-800">{formatCurrency(printEnrollment.totalTuition - printEnrollment.materialFee)} đồng</span>
                  </div>
                  <div className="flex">
                    <span className="w-36 shrink-0 text-slate-600">Giáo trình:</span>
                    <span className="font-bold text-slate-800">{formatCurrency(printEnrollment.materialFee)} đồng</span>
                  </div>
                  <div className="flex border-t border-slate-100 pt-4">
                    <span className="w-36 shrink-0 text-slate-800 font-bold uppercase text-xs">Tổng tiền thanh toán:</span>
                    <span className="font-black text-slate-900">{formatCurrency(printEnrollment.totalTuition)} đồng</span>
                  </div>
                  <div className="flex pt-1 italic">
                    <span className="w-36 shrink-0 text-slate-600 text-xs">Bằng chữ:</span>
                    <span className="font-bold text-slate-700 text-xs underline decoration-dotted underline-offset-4">{numberToVietnameseWords(printEnrollment.totalTuition)}</span>
                  </div>
                </div>

                {/* Footer Notes */}
                <div className="mb-12">
                  <p className="font-bold text-xs mb-2">Lưu ý:</p>
                  <div className="italic text-[10px] text-slate-500 space-y-1.5 pl-2 border-l-2 border-slate-100">
                    <p>• Nội dung chuyển khoản: Họ và Tên học viên</p>
                    <p>• Phụ huynh vui lòng gửi lại biên lai chuyển khoản cho KAT nhé!</p>
                    <p>• Cảm ơn phụ huynh và học viên đã tin tưởng và đồng hành cùng KAT!</p>
                  </div>
                </div>

                {/* Signature Sections */}
                <div className="grid grid-cols-2 text-center text-xs font-bold uppercase tracking-widest mt-auto">
                  <div>
                    <p className="mb-24">Người lập phiếu</p>
                  </div>
                  <div>
                    <p className="mb-24">Người nộp tiền</p>
                  </div>
                </div>

                <div className="mt-8 pt-4 border-t border-slate-50 text-center">
                  <p className="text-[7px] text-slate-300 italic">KAT EDUCATION - Empowering your Mandarin journey</p>
                </div>
              </div>
            </div>

            <div className="p-8 bg-slate-50 border-t flex gap-4">
              <button onClick={() => setIsPrintModalOpen(false)} className="flex-1 py-4 font-black text-slate-400 uppercase tracking-widest hover:bg-slate-200 rounded-2xl transition-all">Quay lại</button>
              <button 
                onClick={handleDownloadImage} 
                disabled={isExporting}
                className={`flex-[2] py-4 bg-slate-900 text-white font-black uppercase tracking-widest rounded-2xl shadow-xl hover:bg-black transition-all flex items-center justify-center gap-2 ${isExporting ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isExporting ? (
                  <>
                    <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    ĐANG XUẤT ẢNH...
                  </>
                ) : (
                  <>🖼️ TẢI ẢNH PHIẾU BÁO</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TUITION MODAL (FOR REGISTRATION) */}
      {isTuitionModalOpen && selectedStudentForTuition && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-2xl rounded-[2.5rem] overflow-hidden shadow-2xl animate-in zoom-in duration-300 flex flex-col max-h-[95vh]">
            <div className="p-8 bg-red-600 text-white flex justify-between items-center">
              <div><h3 className="text-2xl font-black uppercase tracking-tight">Đăng ký & Thu phí</h3><p className="text-red-100 text-sm font-medium mt-1">Học viên: {selectedStudentForTuition.name}</p></div>
              <button onClick={() => setIsTuitionModalOpen(false)} className="text-white/60 hover:text-white text-2xl">✕</button>
            </div>
            <div className="p-8 overflow-y-auto space-y-6 no-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="col-span-2"><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Chọn lớp học đang mở</label><select className="w-full p-4 bg-slate-50 border-0 rounded-2xl outline-none focus:ring-2 focus:ring-red-500 font-bold text-slate-800 shadow-inner" value={tuitionForm.classId} onChange={(e) => setTuitionForm({...tuitionForm, classId: e.target.value})}>{activeClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
                <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Ngày bắt đầu</label><input type="date" className="w-full p-4 bg-slate-50 border-0 rounded-2xl font-bold text-slate-800 shadow-inner" value={tuitionForm.startDate} onChange={(e) => setTuitionForm({...tuitionForm, startDate: e.target.value})} /></div>
                <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Ngày kết thúc</label><input type="date" className="w-full p-4 bg-slate-50 border-0 rounded-2xl font-bold text-slate-800 shadow-inner" value={tuitionForm.endDate} onChange={(e) => setTuitionForm({...tuitionForm, endDate: e.target.value})} /></div>
                <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 flex flex-col gap-5 col-span-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex-1"><label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Học phí / Buổi</label><input type="number" className="bg-white p-3 rounded-xl text-lg font-black text-slate-800 w-full border border-slate-200" value={tuitionForm.tuitionPerSession} onChange={(e) => setTuitionForm({...tuitionForm, tuitionPerSession: parseInt(e.target.value) || 0})} /></div>
                    <div className="w-full"><label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Phí tài liệu/sách</label><input type="number" className="bg-white p-3 rounded-xl text-lg font-black text-blue-600 w-full border border-slate-200" value={tuitionForm.materialFee} onChange={(e) => setTuitionForm({...tuitionForm, materialFee: parseInt(e.target.value) || 0})} /></div>
                  </div>
                  <div className="flex justify-between items-center border-t border-slate-200 pt-4">
                    <div className="flex items-center gap-4"><label className="block text-[10px] font-black text-slate-400 uppercase">Số buổi học:</label><input type="number" className="bg-white p-2 w-16 rounded-lg text-sm font-black text-red-600 border" value={tuitionForm.sessions} onChange={(e) => handleSessionsChange(parseInt(e.target.value) || 0)} /></div>
                    <div className="text-right"><span className="text-[10px] font-black text-slate-400 uppercase">Tổng cộng:</span><p className="text-2xl font-black text-red-700 leading-none">{formatCurrency(tuitionForm.totalTuition)}</p></div>
                  </div>
                </div>
                <div className="bg-slate-900 p-6 rounded-[2rem] col-span-2">
                    <label className="block text-[10px] font-black text-white/40 uppercase mb-2">Số tiền thực đóng</label>
                    <input type="number" className="bg-transparent text-3xl font-black text-white w-full outline-none" value={tuitionForm.paidAmount} onChange={(e) => setTuitionForm({...tuitionForm, paidAmount: parseInt(e.target.value) || 0})} />
                    <div className="flex gap-4 mt-3"><button onClick={() => setTuitionForm({...tuitionForm, paidAmount: tuitionForm.totalTuition})} className="text-[10px] font-bold text-white/40 hover:text-white uppercase transition-colors">Đóng đủ 100%</button></div>
                </div>
              </div>
            </div>
            <div className="p-8 bg-slate-50 border-t flex gap-4"><button onClick={() => setIsTuitionModalOpen(false)} className="flex-1 py-4 font-black text-slate-400 uppercase tracking-widest hover:bg-slate-100 rounded-2xl transition-all">Bỏ qua</button><button onClick={handleSaveTuition} className="flex-[2] py-4 bg-red-600 text-white font-black uppercase tracking-widest rounded-2xl hover:bg-red-700 shadow-xl shadow-red-100 transition-all">Xác nhận thu phí</button></div>
          </div>
        </div>
      )}

      {/* DEBT COLLECTION MODAL */}
      {isDetailModalOpen && selectedEnrollmentForDetail && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-lg rounded-[2.5rem] overflow-hidden shadow-2xl animate-in zoom-in duration-200">
            <div className="p-8 bg-slate-900 text-white flex justify-between items-center">
              <div>
                <h3 className="text-xl font-black uppercase tracking-tight">Thu hồi nợ học phí</h3>
                <p className="text-slate-400 text-xs font-medium mt-1">Học viên: {students.find(s => s.id === selectedEnrollmentForDetail.studentId)?.name}</p>
              </div>
              <button onClick={() => setIsDetailModalOpen(false)} className="text-white/60 hover:text-white text-2xl">✕</button>
            </div>
            <div className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-2xl border">
                  <span className="text-[10px] font-black text-slate-400 uppercase">Dư nợ hiện tại</span>
                  <p className="text-lg font-black text-red-600">{formatCurrency(selectedEnrollmentForDetail.totalTuition - selectedEnrollmentForDetail.paidAmount)}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border">
                  <span className="text-[10px] font-black text-slate-400 uppercase">Dư nợ sau thu</span>
                  <p className="text-lg font-black text-slate-800">{formatCurrency(Math.max(0, (selectedEnrollmentForDetail.totalTuition - selectedEnrollmentForDetail.paidAmount) - debtPaymentAmount))}</p>
                </div>
              </div>
              
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-3">Số tiền học viên đóng lần này</label>
                <div className="relative">
                  <input 
                    type="number" 
                    className="w-full p-6 bg-slate-100 border-2 border-slate-100 focus:border-red-600 rounded-2xl outline-none text-2xl font-black transition-all"
                    value={debtPaymentAmount}
                    onChange={(e) => setDebtPaymentAmount(parseInt(e.target.value) || 0)}
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 flex gap-2">
                    <button 
                      onClick={() => setDebtPaymentAmount(selectedEnrollmentForDetail.totalTuition - selectedEnrollmentForDetail.paidAmount)}
                      className="text-[10px] font-black text-red-600 bg-red-50 px-3 py-2 rounded-lg hover:bg-red-600 hover:text-white transition-all uppercase"
                    >
                      Thu đủ 100%
                    </button>
                  </div>
                </div>
              </div>

              <div className="pt-4 space-y-3">
                <button 
                  onClick={handleUpdatePayment} 
                  className="w-full bg-green-600 text-white py-5 rounded-2xl font-black text-sm uppercase hover:bg-green-700 shadow-xl shadow-green-100 transition-all flex items-center justify-center gap-2"
                >
                  <span>XÁC NHẬN THU {formatCurrency(debtPaymentAmount)}</span>
                </button>
                <button onClick={() => setIsDetailModalOpen(false)} className="w-full py-2 text-slate-400 font-bold text-[10px] uppercase hover:text-slate-600 transition-colors">Để sau</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STUDENT FORM MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-md:max-w-md rounded-[2.5rem] p-10 shadow-2xl animate-in zoom-in duration-200">
            <h3 className="text-2xl font-black text-slate-900 mb-8 uppercase tracking-tight">{editingStudent ? 'Sửa hồ sơ' : 'Học viên mới'}</h3>
            <div className="space-y-5">
              <div><label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Họ và tên</label><input type="text" className="w-full p-4 bg-slate-50 border-0 rounded-2xl font-bold text-slate-800" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} /></div>
              <div><label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Số điện thoại</label><input type="text" className="w-full p-4 bg-slate-50 border-0 rounded-2xl font-bold text-slate-800" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} /></div>
              <div><label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Trạng thái</label><select className="w-full p-4 bg-slate-50 border-0 rounded-2xl font-bold text-slate-800" value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value as 'active' | 'inactive'})}><option value="active">Đang học</option><option value="inactive">Đã nghỉ</option></select></div>
            </div>
            <div className="mt-10 flex gap-4"><button onClick={() => setIsModalOpen(false)} className="flex-1 py-4 font-black text-slate-400 uppercase tracking-widest hover:bg-slate-50 rounded-2xl">Hủy</button><button onClick={() => { if (editingStudent) { setStudents(students.map(s => s.id === editingStudent.id ? { ...s, ...formData } : s)); } else { setStudents([...students, { id: `S-${Date.now()}`, ...formData }]); } setIsModalOpen(false); }} className="flex-[2] py-4 font-black bg-red-600 text-white rounded-2xl hover:bg-red-700 shadow-xl shadow-red-100 uppercase tracking-widest transition-all">Lưu hồ sơ</button></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentManager;
