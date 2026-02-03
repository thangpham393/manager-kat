
import React, { useState, useEffect, useCallback } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import ClassManager from './components/ClassManager';
import FinanceManager from './components/FinanceManager';
import AIInsights from './components/AIInsights';
import StudentManager from './components/StudentManager';
import TeacherManager from './components/TeacherManager';
import AssistantManager from './components/AssistantManager';
import Schedule from './components/Schedule';
import { ViewType, Student, Teacher, Assistant, TAWorkLog, Class, Enrollment, Attendance, Transaction, MakeupLesson } from './types';
import { MOCK_STUDENTS, MOCK_TEACHERS, MOCK_CLASSES, MOCK_ENROLLMENTS } from './constants';
import { loadFromCloud, saveToCloud, supabase } from './services/supabase';

const App: React.FC = () => {
  const [currentView, setView] = useState<ViewType>('dashboard');
  const [isLoaded, setIsLoaded] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'error' | 'offline'>(supabase ? 'synced' : 'offline');

  // Master State
  const [students, setStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [assistants, setAssistants] = useState<Assistant[]>([]);
  const [taWorkLogs, setTaWorkLogs] = useState<TAWorkLog[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<Attendance[]>([]);
  const [makeupLessons, setMakeupLessons] = useState<MakeupLesson[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // 1. Khởi tạo dữ liệu
  useEffect(() => {
    const initData = async () => {
      // Thử load từ Cloud trước
      const cloudData = await loadFromCloud();
      
      if (cloudData && Object.keys(cloudData).length > 0) {
        setStudents(cloudData.students || []);
        setTeachers(cloudData.teachers || []);
        setAssistants(cloudData.assistants || []);
        setTaWorkLogs(cloudData.taWorkLogs || []);
        setClasses(cloudData.classes || []);
        setEnrollments(cloudData.enrollments || []);
        setAttendanceRecords(cloudData.attendanceRecords || []);
        setMakeupLessons(cloudData.makeupLessons || []);
        setTransactions(cloudData.transactions || []);
        setSyncStatus('synced');
      } else {
        // Fallback về localStorage hoặc Mock data
        const saved = localStorage.getItem('KAT_EDU_ALL_DATA');
        if (saved) {
          const local = JSON.parse(saved);
          setStudents(local.students || []);
          setTeachers(local.teachers || []);
          setAssistants(local.assistants || []);
          setTaWorkLogs(local.taWorkLogs || []);
          setClasses(local.classes || []);
          setEnrollments(local.enrollments || []);
          setAttendanceRecords(local.attendanceRecords || []);
          setMakeupLessons(local.makeupLessons || []);
          setTransactions(local.transactions || []);
        } else {
          // Mock data cho lần đầu tiên
          setStudents(MOCK_STUDENTS);
          setTeachers(MOCK_TEACHERS);
          setAssistants([
            { id: 'TA1', name: 'Lê Thu Trang', phone: '0912344556', hourlyRate: 45000, status: 'active' },
            { id: 'TA2', name: 'Ngô Minh Đức', phone: '0988777666', hourlyRate: 40000, status: 'active' },
          ]);
          setClasses(MOCK_CLASSES);
          setEnrollments(MOCK_ENROLLMENTS);
          setTransactions([
            { id: '1', type: 'income', category: 'Học phí', amount: 4500000, date: '2024-03-20', description: 'Học phí Hán Ngữ Sơ Cấp 1 - Học viên Nguyễn Văn A', studentId: 'S1' },
          ]);
        }
      }
      setIsLoaded(true);
    };

    initData();
  }, []);

  // 2. Cơ chế Auto-Sync (Debounced Sync to Cloud)
  useEffect(() => {
    if (!isLoaded) return;

    const allData = {
      students, teachers, assistants, taWorkLogs, classes, 
      enrollments, attendanceRecords, makeupLessons, transactions
    };

    // Luôn lưu vào localStorage làm backup
    localStorage.setItem('KAT_EDU_ALL_DATA', JSON.stringify(allData));

    // Đồng bộ lên Cloud
    const sync = async () => {
      setSyncStatus('syncing');
      const success = await saveToCloud(allData);
      setSyncStatus(success ? 'synced' : 'error');
    };

    const timer = setTimeout(sync, 2000); // Đợi 2s sau khi ngừng thao tác mới đẩy lên cloud
    return () => clearTimeout(timer);
  }, [students, teachers, assistants, taWorkLogs, classes, enrollments, attendanceRecords, makeupLessons, transactions, isLoaded]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center">
        <div className="relative w-24 h-24 mb-6">
          <div className="absolute inset-0 border-4 border-red-600 rounded-full animate-ping opacity-25"></div>
          <div className="absolute inset-0 border-4 border-red-600 rounded-full animate-spin border-t-transparent"></div>
          <div className="absolute inset-0 flex items-center justify-center font-black text-red-600 text-2xl">KAT</div>
        </div>
        <p className="text-white/40 font-black uppercase tracking-[0.3em] text-[10px] animate-pulse">Đang đồng bộ dữ liệu đám mây...</p>
      </div>
    );
  }

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard students={students} classes={classes} enrollments={enrollments} />;
      case 'schedule':
        return <Schedule classes={classes} teachers={teachers} assistants={assistants} taWorkLogs={taWorkLogs} setTaWorkLogs={setTaWorkLogs} enrollments={enrollments} students={students} attendanceRecords={attendanceRecords} setAttendanceRecords={setAttendanceRecords} makeupLessons={makeupLessons} setMakeupLessons={setMakeupLessons} />;
      case 'classes':
        return <ClassManager classes={classes} setClasses={setClasses} teachers={teachers} students={students} enrollments={enrollments} setEnrollments={setEnrollments} />;
      case 'assistants':
        return <AssistantManager assistants={assistants} setAssistants={setAssistants} taWorkLogs={taWorkLogs} setTaWorkLogs={setTaWorkLogs} classes={classes} />;
      case 'finance':
        return <FinanceManager enrollments={enrollments} teachers={teachers} classes={classes} transactions={transactions} setTransactions={setTransactions} />;
      case 'ai-insights':
        return <AIInsights />;
      case 'students':
        return <StudentManager students={students} setStudents={setStudents} attendanceRecords={attendanceRecords} setAttendanceRecords={setAttendanceRecords} classes={classes} enrollments={enrollments} setEnrollments={setEnrollments} transactions={transactions} setTransactions={setTransactions} makeupLessons={makeupLessons} />;
      case 'teachers':
        return <TeacherManager teachers={teachers} setTeachers={setTeachers} attendanceRecords={attendanceRecords} setAttendanceRecords={setAttendanceRecords} classes={classes} makeupLessons={makeupLessons} enrollments={enrollments} />;
      default:
        return <Dashboard students={students} classes={classes} enrollments={enrollments} />;
    }
  };

  return (
    <Layout currentView={currentView} setView={setView}>
      {/* Cloud Sync Status Indicator */}
      <div className="fixed bottom-6 right-6 z-[100]">
        <div className={`flex items-center gap-3 px-4 py-2 rounded-full shadow-2xl border backdrop-blur-md transition-all duration-500 ${
          syncStatus === 'synced' ? 'bg-green-500/10 border-green-500/20 text-green-600' :
          syncStatus === 'syncing' ? 'bg-amber-500/10 border-amber-500/20 text-amber-600' :
          'bg-red-500/10 border-red-500/20 text-red-600'
        }`}>
          <div className={`w-2 h-2 rounded-full ${
            syncStatus === 'synced' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' :
            syncStatus === 'syncing' ? 'bg-amber-500 animate-pulse' :
            'bg-red-500 animate-ping'
          }`}></div>
          <span className="text-[10px] font-black uppercase tracking-widest">
            {syncStatus === 'synced' ? 'Cloud Synced' :
             syncStatus === 'syncing' ? 'Syncing...' :
             syncStatus === 'offline' ? 'Local Only' : 'Sync Error'}
          </span>
        </div>
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
        {renderContent()}
      </div>
    </Layout>
  );
};

export default App;
